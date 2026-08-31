#!/usr/bin/env node
/**
 * agentperf run --url <url> [--lane both|tools|dom] [--runs 3] [--model m]
 *               [--base-url u] [--task booking|path.json] [--max-turns 20]
 *               [--out results]
 *
 * Needs OPENAI_API_KEY (or AGENTPERF_API_KEY) — any OpenAI-compatible
 * /chat/completions endpoint works via --base-url.
 */
import { readFileSync } from "node:fs";
import { runDomLane, runToolsLane } from "./lanes";
import { aggregate, toMarkdown, writeReport } from "./report";
import type { BenchmarkReport, Lane, RunMetrics, TaskSpec } from "./types";

const BUILTIN_TASKS: Record<string, TaskSpec> = {
  booking: {
    id: "booking",
    prompt:
      "You are on the booking page of the Fringe & Co. salon. Book the 'Beard trim' service " +
      "for Dana Smith (dana@example.com): pick any open slot on the earliest available day, " +
      "complete the booking, and report the confirmation code the page shows.",
    successPattern: "FR-[A-Z0-9]{5}",
    maxTurns: 20
  }
};

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

async function main(): Promise<void> {
  if (process.argv[2] !== "run") {
    console.log("Usage: agentperf run --url <url> [--lane both|tools|dom] [--runs 3] [--model <model>]");
    process.exit(process.argv[2] ? 1 : 0);
  }

  const url = arg("url");
  if (!url) throw new Error("--url is required");

  const apiKey = process.env.AGENTPERF_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY (or AGENTPERF_API_KEY)");

  const llm = {
    apiKey,
    baseUrl: arg("base-url", process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1")!,
    model: arg("model", process.env.AGENTPERF_MODEL ?? "gpt-5.6-luna")!
  };

  const taskArg = arg("task", "booking")!;
  const task: TaskSpec = BUILTIN_TASKS[taskArg] ?? (JSON.parse(readFileSync(taskArg, "utf8")) as TaskSpec);
  task.maxTurns = Number(arg("max-turns", String(task.maxTurns)));

  const laneArg = arg("lane", "both")!;
  const lanes: Lane[] = laneArg === "both" ? ["dom", "tools"] : [laneArg as Lane];
  const runs = Number(arg("runs", "3"));
  const outDir = arg("out", "results")!;

  console.log(`AgentPerf — ${task.id} @ ${url}`);
  console.log(`model ${llm.model}, ${runs} run(s) per lane: ${lanes.join(", ")}\n`);

  const report: BenchmarkReport = {
    url,
    model: llm.model,
    task,
    startedAt: new Date().toISOString(),
    lanes: []
  };

  for (const lane of lanes) {
    const results: RunMetrics[] = [];
    for (let i = 1; i <= runs; i++) {
      process.stdout.write(`[${lane}] run ${i}/${runs}… `);
      const result = lane === "tools" ? await runToolsLane(url, task, llm) : await runDomLane(url, task, llm);
      results.push(result);
      console.log(
        result.success
          ? `✓ ${(result.wallClockMs / 1000).toFixed(1)}s, ${result.totalTokens} tokens, ${result.turns} turns`
          : `✗ ${result.failure}`
      );
    }
    report.lanes.push(aggregate(lane, results));
  }

  const files = writeReport(report, outDir);
  console.log("\n" + toMarkdown(report));
  console.log(`Report: ${files.md}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
