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

export interface RunMetrics {
  lane: Lane;
  taskId: string;
  success: boolean;
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
