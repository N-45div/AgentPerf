/**
 * The two lanes. Same browser, same model, same loop, same task, same
 * verification — the only variable is how the agent touches the page:
 *   tools lane — calls the page's own WebMCP tools (host shim injected).
 *   dom lane   — reads the accessibility tree and clicks/types.
 *
 * The DOM lane returns the post-action accessibility snapshot ATTACHED to
 * every click/fill result, the way real a11y drivers (Playwright MCP, Chrome
 * DevTools MCP, browser-use) do. An earlier version returned only "Clicked X"
 * and told the agent to re-read, which forced a second round-trip per action
 * and roughly doubled this lane's turns — a handicap, not a baseline. Both
 * lanes now get the same settle time and structurally parallel prompts, so
 * neither is charged for something the other gets free.
 */
import { chromium, type Page } from "playwright";
import { newLoopOutcome, runAgentLoop, type LoopOutcome } from "./agent-loop";
import type { LlmConfig, LlmToolDef } from "./llm";
import { HOST_SHIM } from "./shim";
import type { Lane, LaneOptions, RunMetrics, TaskSpec } from "./types";

declare global {
  interface Window {
    __agentperf: {
      listTools: () => Array<{
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
      }>;
      call: (
        name: string,
        args: Record<string, unknown>
      ) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>;
    };
  }
}

async function matchesSuccess(page: Page, task: TaskSpec): Promise<boolean> {
  const text = await page.evaluate(() => document.body.innerText);
  return new RegExp(task.successPattern).test(text);
}

/**
 * A success pattern that already matches before the agent acts would score
 * every run a pass. Treat that as a broken task, not a result.
 */
async function assertNotAlreadySatisfied(page: Page, task: TaskSpec): Promise<void> {
  if (await matchesSuccess(page, task)) {
    throw new Error(
      `successPattern /${task.successPattern}/ already matches the page before the agent acted — ` +
        `the task cannot be verified against this URL`
    );
  }
}

function metrics(lane: Lane, task: TaskSpec): RunMetrics {
  return {
    lane,
    taskId: task.id,
    success: false,
    wallClockMs: 0,
    turns: 0,
    actions: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  };
}

function finish(
  run: RunMetrics,
  startedMs: number,
  loop: LoopOutcome,
  verified: boolean,
  claimedDone: boolean,
  override: { failure?: string } = {}
): RunMetrics {
  run.wallClockMs = Math.round(performance.now() - startedMs);
  run.turns = loop.turns;
  run.actions = loop.actions;
  run.promptTokens = loop.promptTokens;
  run.completionTokens = loop.completionTokens;
  run.totalTokens = loop.promptTokens + loop.completionTokens;
  run.success = verified;
  run.claimSummary = loop.claimSummary || undefined;
  if (!verified) {
    run.failure =
      override.failure ??
      loop.failure ??
      (claimedDone
        ? "model claimed completion but the page does not show the expected outcome"
        : "run ended without completion");
  }
  return run;
}

export async function runToolsLane(
  url: string,
  task: TaskSpec,
  llm: LlmConfig
): Promise<RunMetrics> {
  const browser = await chromium.launch();
  const run = metrics("tools", task);
  const outcome = newLoopOutcome();
  const startedMs = performance.now();
  try {
    const context = await browser.newContext();
    await context.addInitScript(HOST_SHIM);
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "load" });
    await assertNotAlreadySatisfied(page, task);
    await page.waitForFunction(() => window.__agentperf?.listTools().length > 0, undefined, {
      timeout: 15000
    });

    const pageTools = await page.evaluate(() => window.__agentperf.listTools());
    const tools: LlmToolDef[] = pageTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }));

    const loop = await runAgentLoop({
      llm,
      systemPrompt:
        "You complete tasks on a web page through the page's own tools (WebMCP). " +
        "Call get_page_state first to orient when it exists. Use only the tools. " +
        "Every action returns the updated result. When the task is fully done, call task_complete.",
      taskPrompt: task.prompt,
      tools,
      maxTurns: task.maxTurns,
      invoke: async (name, args) => {
        const result = await page.evaluate(
          ([toolName, toolArgs]) =>
            window.__agentperf.call(
              toolName as string,
              toolArgs as Record<string, unknown>
            ),
          [name, args] as const
        );
        await page.waitForTimeout(SETTLE_MS);
        const text = result.content.map((c) => c.text).join("\n");
        return result.isError ? `TOOL ERROR:\n${text}` : text;
      }
    }, outcome);

    const verified = loop.claimedDone && (await matchesSuccess(page, task));
    return finish(run, startedMs, loop, verified, loop.claimedDone);
  } catch (error) {
    // Report what the run actually spent before it broke, never a silent zero.
    return finish(run, startedMs, outcome, false, outcome.claimedDone, {
      failure: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await browser.close();
  }
}

const DOM_TOOLS: LlmToolDef[] = [
  {
    name: "read_page",
    description: "Read the page's current accessibility tree (roles and names).",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "click",
    description:
      "Click the element with this ARIA role and accessible name. Returns the updated page.",
    parameters: {
      type: "object",
      properties: {
        role: { type: "string", description: "ARIA role, e.g. button, link, textbox" },
        name: { type: "string", description: "Accessible name, may be partial" }
      },
      required: ["role", "name"]
    }
  },
  {
    name: "fill",
    description:
      "Type a value into the input with this ARIA role and accessible name (replaces content). " +
      "Returns the updated page.",
    parameters: {
      type: "object",
      properties: {
        role: { type: "string" },
        name: { type: "string" },
        value: { type: "string" }
      },
      required: ["role", "name", "value"]
    }
  },
  {
    name: "select_option",
    description:
      "Choose an option in a dropdown (select) by its accessible name and the option's visible " +
      "label. Returns the updated page.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Accessible name of the dropdown" },
        option: { type: "string", description: "Visible label of the option to choose" }
      },
      required: ["name", "option"]
    }
  }
];

/**
 * Deliberately generous: a heavy page must reach the DOM lane whole, so it
 * pays for the page in tokens rather than being handicapped by truncation.
 * Runs that still hit the cap are flagged — their cost is a floor, not a
 * measurement.
 */
export const DEFAULT_MAX_SNAPSHOT_CHARS = 120000;

/** Post-action settle, applied identically in both lanes so neither pays for it alone. */
const SETTLE_MS = 150;

export async function runDomLane(
  url: string,
  task: TaskSpec,
  llm: LlmConfig,
  options: LaneOptions = {}
): Promise<RunMetrics> {
  const maxSnapshotChars = options.maxSnapshotChars ?? DEFAULT_MAX_SNAPSHOT_CHARS;
  const browser = await chromium.launch();
  const run = metrics("dom", task);
  const outcome = newLoopOutcome();
  const startedMs = performance.now();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "load" });
    await assertNotAlreadySatisfied(page, task);

    const target = (role: unknown, name: unknown) =>
      page
        .getByRole(String(role) as Parameters<Page["getByRole"]>[0], {
          name: String(name),
          exact: false
        })
        .first();

    const loop = await runAgentLoop({
      llm,
      systemPrompt:
        "You complete tasks on a web page the way a browser-driving agent does: read the " +
        "accessibility tree with read_page, then click, fill and select_option by role and name. " +
        "Every action returns the updated page. When the task is fully done, call task_complete.",
      taskPrompt: task.prompt,
      tools: DOM_TOOLS,
      maxTurns: task.maxTurns,
      invoke: async (name, args) => {
        const snapshot = async () => {
          const text = await page.locator("body").ariaSnapshot();
          if (text.length <= maxSnapshotChars) return text;
          run.snapshotTruncated = true;
          return text.slice(0, maxSnapshotChars) + "\n… (truncated)";
        };
        switch (name) {
          case "read_page":
            return snapshot();
          case "click": {
            await target(args.role, args.name).click({ timeout: 5000 });
            await page.waitForTimeout(SETTLE_MS);
            return `Clicked ${String(args.role)} "${String(args.name)}".\n\n${await snapshot()}`;
          }
          case "fill": {
            await target(args.role, args.name).fill(String(args.value ?? ""), { timeout: 5000 });
            await page.waitForTimeout(SETTLE_MS);
            return `Filled ${String(args.role)} "${String(args.name)}".\n\n${await snapshot()}`;
          }
          case "select_option": {
            await target("combobox", args.name).selectOption(
              { label: String(args.option) },
              { timeout: 5000 }
            );
            await page.waitForTimeout(SETTLE_MS);
            return `Selected "${String(args.option)}" in "${String(args.name)}".\n\n${await snapshot()}`;
          }
          default:
            return `ACTION FAILED: unknown action "${name}"`;
        }
      }
    }, outcome);

    const verified = loop.claimedDone && (await matchesSuccess(page, task));
    return finish(run, startedMs, loop, verified, loop.claimedDone);
  } catch (error) {
    // Report what the run actually spent before it broke, never a silent zero.
    return finish(run, startedMs, outcome, false, outcome.claimedDone, {
      failure: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await browser.close();
  }
}
