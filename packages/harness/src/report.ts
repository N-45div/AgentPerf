import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BenchmarkReport, Lane, LaneAggregate, RunMetrics } from "./types";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function range(values: number[]): [number, number] {
  if (values.length === 0) return [0, 0];
  return [Math.min(...values), Math.max(...values)];
}

/**
 * Central tendencies are computed over successful runs only. A crashed run
 * records near-zero cost, and averaging that in would drag a lane's reported
 * cost toward zero — understating exactly the lane that failed.
 */
export function aggregate(lane: Lane, runs: RunMetrics[]): LaneAggregate {
  const ok = runs.filter((r) => r.success);
  const wall = ok.map((r) => r.wallClockMs);
  const tokens = ok.map((r) => r.totalTokens);
  return {
    lane,
    runs,
    successRate: runs.length === 0 ? 0 : ok.length / runs.length,
    medianWallClockMs: median(wall),
    medianTotalTokens: median(tokens),
    medianTurns: median(ok.map((r) => r.turns)),
    meanWallClockMs: mean(wall),
    meanTotalTokens: mean(tokens),
    wallClockRangeMs: range(wall),
    totalTokensRange: range(tokens)
  };
}

function seconds(ms: number): string {
  return (ms / 1000).toFixed(1) + "s";
}

function ratio(dom: number, tools: number): string {
  return tools > 0 ? (dom / tools).toFixed(2) + "x" : "n/a";
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
    "| lane | success | median wall-clock | mean wall-clock | median tokens | mean tokens | round-trips |",
    "|------|---------|-------------------|-----------------|---------------|-------------|-------------|"
  ];
  for (const lane of report.lanes) {
    const passed = lane.runs.filter((r) => r.success).length;
    lines.push(
      `| ${lane.lane} | ${Math.round(lane.successRate * 100)}% (${passed}/${lane.runs.length}) | ` +
        `${seconds(lane.medianWallClockMs)} | ${seconds(lane.meanWallClockMs)} | ` +
        `${lane.medianTotalTokens.toLocaleString()} | ${lane.meanTotalTokens.toLocaleString()} | ${lane.medianTurns} |`
    );
  }

  const tools = report.lanes.find((l) => l.lane === "tools");
  const dom = report.lanes.find((l) => l.lane === "dom");
  if (tools && dom && tools.medianTotalTokens > 0) {
    lines.push(
      "",
      `**DOM vs tools — tokens ${ratio(dom.medianTotalTokens, tools.medianTotalTokens)} (median) / ` +
        `${ratio(dom.meanTotalTokens, tools.meanTotalTokens)} (mean); ` +
        `wall-clock ${ratio(dom.medianWallClockMs, tools.medianWallClockMs)} (median) / ` +
        `${ratio(dom.meanWallClockMs, tools.meanWallClockMs)} (mean); ` +
        `round-trips ${dom.medianTurns} vs ${tools.medianTurns}.**`,
      "",
      `Spread — DOM ${seconds(dom.wallClockRangeMs[0])}–${seconds(dom.wallClockRangeMs[1])}, ` +
        `${dom.totalTokensRange[0].toLocaleString()}–${dom.totalTokensRange[1].toLocaleString()} tokens; ` +
        `tools ${seconds(tools.wallClockRangeMs[0])}–${seconds(tools.wallClockRangeMs[1])}, ` +
        `${tools.totalTokensRange[0].toLocaleString()}–${tools.totalTokensRange[1].toLocaleString()} tokens.`,
      "",
      "Central tendencies are over successful runs only; failures are counted in the success rate. " +
        "Token counts are uncached prompt+completion totals as the API reports them — provider " +
        "prompt caching may reduce billed cost, and does so unequally across lanes."
    );
  }

  lines.push("", "## Runs", "");
  lines.push("| lane | # | success | wall-clock | tokens | round-trips | actions | notes |");
  lines.push("|------|---|---------|------------|--------|-------------|---------|-------|");
  for (const lane of report.lanes) {
    lane.runs.forEach((r, i) => {
      const notes = [
        r.failure,
        r.snapshotTruncated ? "snapshot truncated — cost is a floor" : "",
        r.claimSummary ? `claim: ${r.claimSummary.slice(0, 90)}` : ""
      ]
        .filter(Boolean)
        .join("; ");
      lines.push(
        `| ${r.lane} | ${i + 1} | ${r.success ? "✓" : "✗"} | ${seconds(r.wallClockMs)} | ` +
          `${r.totalTokens.toLocaleString()} | ${r.turns} | ${r.actions} | ${notes} |`
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
