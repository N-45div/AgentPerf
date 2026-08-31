import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BenchmarkReport, Lane, LaneAggregate, RunMetrics } from "./types";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function aggregate(lane: Lane, runs: RunMetrics[]): LaneAggregate {
  return {
    lane,
    runs,
    successRate: runs.length === 0 ? 0 : runs.filter((r) => r.success).length / runs.length,
    medianWallClockMs: median(runs.map((r) => r.wallClockMs)),
    medianTotalTokens: median(runs.map((r) => r.totalTokens)),
    medianTurns: median(runs.map((r) => r.turns))
  };
}

function seconds(ms: number): string {
  return (ms / 1000).toFixed(1) + "s";
}

export function toMarkdown(report: BenchmarkReport): string {
  const lines: string[] = [
    `# AgentPerf report — ${report.task.id}`,
    "",
    `- **URL:** ${report.url}`,
    `- **Model:** ${report.model}`,
    `- **Task:** ${report.task.prompt}`,
    `- **Started:** ${report.startedAt}`,
    "",
    "| lane | success | median wall-clock | median tokens | median round-trips |",
    "|------|---------|-------------------|---------------|--------------------|"
  ];
  for (const lane of report.lanes) {
    const success = `${Math.round(lane.successRate * 100)}% (${lane.runs.filter((r) => r.success).length}/${lane.runs.length})`;
    lines.push(
      `| ${lane.lane} | ${success} | ${seconds(lane.medianWallClockMs)} | ${lane.medianTotalTokens.toLocaleString()} | ${lane.medianTurns} |`
    );
  }
  const tools = report.lanes.find((l) => l.lane === "tools");
  const dom = report.lanes.find((l) => l.lane === "dom");
  if (tools && dom && tools.medianTotalTokens > 0 && tools.medianWallClockMs > 0) {
    lines.push(
      "",
      `**DOM lane pays ${(dom.medianTotalTokens / tools.medianTotalTokens).toFixed(1)}x the tokens ` +
        `and ${(dom.medianWallClockMs / tools.medianWallClockMs).toFixed(1)}x the wall-clock of the tools lane** ` +
        `(medians; failed runs included in success rate, excluded from nothing).`
    );
  }
  lines.push("", "## Runs", "");
  lines.push("| lane | # | success | wall-clock | tokens | round-trips | actions | failure |");
  lines.push("|------|---|---------|------------|--------|-------------|---------|---------|");
  for (const lane of report.lanes) {
    lane.runs.forEach((r, i) => {
      lines.push(
        `| ${r.lane} | ${i + 1} | ${r.success ? "✓" : "✗"} | ${seconds(r.wallClockMs)} | ${r.totalTokens.toLocaleString()} | ${r.turns} | ${r.actions} | ${r.failure ?? ""} |`
      );
    });
  }
  lines.push("");
  return lines.join("\n");
}

export function writeReport(report: BenchmarkReport, outDir: string): { json: string; md: string } {
  const stamp = report.startedAt.replace(/[:.]/g, "-");
  const dir = join(outDir, stamp);
  mkdirSync(dir, { recursive: true });
  const json = join(dir, "report.json");
  const md = join(dir, "report.md");
  writeFileSync(json, JSON.stringify(report, null, 2));
  writeFileSync(md, toMarkdown(report));
  return { json, md };
}
