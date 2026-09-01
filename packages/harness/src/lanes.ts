/**
 * The two lanes. Same browser, same model, same loop, same task, same
 * verification — the only variable is how the agent touches the page:
 *   tools lane — calls the page's own WebMCP tools (host shim injected).
 *   dom lane   — reads the accessibility tree and clicks/types, the way
 *                browser-driving agents work today. Text-based a11y driving
 *                is CHEAPER than screenshot driving, so the baseline is
 *                conservative: real DOM agents pay more than we report.
 */
import { chromium, type Page } from "playwright";
import { runAgentLoop } from "./agent-loop";
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

async function verify(page: Page, task: TaskSpec): Promise<boolean> {
  const text = await page.evaluate(() => document.body.innerText);
  return new RegExp(task.successPattern).test(text);
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
  loop: { turns: number; actions: number; promptTokens: number; completionTokens: number; failure?: string },
  verified: boolean,
  claimedDone: boolean
): RunMetrics {
  run.wallClockMs = Math.round(performance.now() - startedMs);
  run.turns = loop.turns;
  run.actions = loop.actions;
  run.promptTokens = loop.promptTokens;
  run.completionTokens = loop.completionTokens;
  run.totalTokens = loop.promptTokens + loop.completionTokens;
  run.success = verified;
  if (!verified) {
    run.failure =
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
  const startedMs = performance.now();
  try {
    const context = await browser.newContext();
    await context.addInitScript(HOST_SHIM);
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "load" });
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
        "When the task is fully done, call task_complete.",
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
        const text = result.content.map((c) => c.text).join("\n");
        return result.isError ? `TOOL ERROR:\n${text}` : text;
      }
    });

    const verified = loop.claimedDone && (await verify(page, task));
    return finish(run, startedMs, loop, verified, loop.claimedDone);
  } catch (error) {
    run.wallClockMs = Math.round(performance.now() - startedMs);
    run.failure = error instanceof Error ? error.message : String(error);
    return run;
  } finally {
    await browser.close();
  }
}

const DOM_TOOLS: LlmToolDef[] = [
  {
    name: "read_page",
    description:
      "Read the page's current accessibility tree (roles and names). Call after every action that changes the page.",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "click",
    description: "Click the element with this ARIA role and accessible name.",
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
    description: "Type a value into the input with this ARIA role and accessible name (replaces content).",
    parameters: {
      type: "object",
      properties: {
        role: { type: "string" },
        name: { type: "string" },
        value: { type: "string" }
      },
      required: ["role", "name", "value"]
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

export async function runDomLane(
  url: string,
  task: TaskSpec,
  llm: LlmConfig,
  options: LaneOptions = {}
): Promise<RunMetrics> {
  const maxSnapshotChars = options.maxSnapshotChars ?? DEFAULT_MAX_SNAPSHOT_CHARS;
  const browser = await chromium.launch();
  const run = metrics("dom", task);
  const startedMs = performance.now();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "load" });

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
        "accessibility tree with read_page, then click and fill elements by role and name. " +
        "Re-read the page after actions that change it. When the task is fully done, call task_complete.",
      taskPrompt: task.prompt,
      tools: DOM_TOOLS,
      maxTurns: task.maxTurns,
      invoke: async (name, args) => {
        switch (name) {
          case "read_page": {
            const snapshot = await page.locator("body").ariaSnapshot();
            if (snapshot.length <= maxSnapshotChars) return snapshot;
            run.snapshotTruncated = true;
            return snapshot.slice(0, maxSnapshotChars) + "\n… (truncated)";
          }
          case "click": {
            await target(args.role, args.name).click({ timeout: 5000 });
            await page.waitForTimeout(250);
            return `Clicked ${String(args.role)} "${String(args.name)}".`;
          }
          case "fill": {
            await target(args.role, args.name).fill(String(args.value ?? ""), { timeout: 5000 });
            return `Filled ${String(args.role)} "${String(args.name)}".`;
          }
          default:
            return `ACTION FAILED: unknown action "${name}"`;
        }
      }
    });

    const verified = loop.claimedDone && (await verify(page, task));
    return finish(run, startedMs, loop, verified, loop.claimedDone);
  } catch (error) {
    run.wallClockMs = Math.round(performance.now() - startedMs);
    run.failure = error instanceof Error ? error.message : String(error);
    return run;
  } finally {
    await browser.close();
  }
}
