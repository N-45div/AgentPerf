export type Lane = "tools" | "dom";

export interface TaskSpec {
  id: string;
  /** The instruction handed to the agent, identical across lanes. */
  prompt: string;
  /**
   * Regex (source string) that must match the page's visible text when the
   * task is genuinely done — checked by the harness, never by the model.
   */
  successPattern: string;
  /** Hard cap on model round-trips before the run is failed. */
  maxTurns: number;
}

export interface LaneOptions {
  /**
   * Cap on the accessibility snapshot handed to the DOM lane per `read_page`.
   * Set it high enough that the page is never truncated: a truncated snapshot
   * handicaps the DOM lane instead of letting it pay honestly in tokens.
   */
  maxSnapshotChars?: number;
}

export interface RunMetrics {
  lane: Lane;
  taskId: string;
  success: boolean;
  /** Set when the DOM lane's snapshot hit the cap — the run is then a floor, not a measurement. */
  snapshotTruncated?: boolean;
  /** Why a run failed, when it did. */
  failure?: string;
  wallClockMs: number;
  /** Model round-trips (chat completions). */
  turns: number;
  /** Tool/browser actions executed. */
  actions: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LaneAggregate {
  lane: Lane;
  runs: RunMetrics[];
  successRate: number;
  medianWallClockMs: number;
  medianTotalTokens: number;
  medianTurns: number;
}

export interface BenchmarkReport {
  url: string;
  model: string;
  task: TaskSpec;
  startedAt: string;
  lanes: LaneAggregate[];
}
