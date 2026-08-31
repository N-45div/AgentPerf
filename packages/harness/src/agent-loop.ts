/**
 * The agent loop both lanes share, so nothing about the driver differs
 * between them except the tools it holds. task_complete is a harness tool —
 * the model claims completion, the harness verifies it against the page.
 */
import { chat, type ChatMessage, type LlmConfig, type LlmToolDef } from "./llm";

export interface LoopOutcome {
  turns: number;
  actions: number;
  promptTokens: number;
  completionTokens: number;
  claimedDone: boolean;
  claimSummary: string;
  failure?: string;
}

const TASK_COMPLETE: LlmToolDef = {
  name: "task_complete",
  description:
    "Call this exactly once, when the task is fully done and its outcome is visible on the page. " +
    "Summarize the outcome (include any code or value the task asked for).",
  parameters: {
    type: "object",
    properties: { summary: { type: "string" } },
    required: ["summary"]
  }
};

export async function runAgentLoop(options: {
  llm: LlmConfig;
  systemPrompt: string;
  taskPrompt: string;
  tools: LlmToolDef[];
  invoke: (name: string, args: Record<string, unknown>) => Promise<string>;
  maxTurns: number;
}): Promise<LoopOutcome> {
  const messages: ChatMessage[] = [
    { role: "system", content: options.systemPrompt },
    { role: "user", content: options.taskPrompt }
  ];
  const tools = [...options.tools, TASK_COMPLETE];

  const outcome: LoopOutcome = {
    turns: 0,
    actions: 0,
    promptTokens: 0,
    completionTokens: 0,
    claimedDone: false,
    claimSummary: ""
  };
  let nudged = false;

  while (outcome.turns < options.maxTurns) {
    outcome.turns += 1;
    const turn = await chat(options.llm, messages, tools);
    outcome.promptTokens += turn.promptTokens;
    outcome.completionTokens += turn.completionTokens;
    messages.push(turn.rawMessage as ChatMessage);

    if (turn.toolCalls.length === 0) {
      if (nudged) {
        outcome.failure = "model stopped calling tools before claiming completion";
        return outcome;
      }
      nudged = true;
      messages.push({
        role: "user",
        content: "Continue using the tools. When the task is done, call task_complete."
      });
      continue;
    }

    for (const call of turn.toolCalls) {
      if (call.name === TASK_COMPLETE.name) {
        outcome.claimedDone = true;
        outcome.claimSummary = String(call.args.summary ?? "");
        messages.push({ role: "tool", tool_call_id: call.id, content: "Recorded." });
        return outcome;
      }
      outcome.actions += 1;
      let result: string;
      try {
        result = await options.invoke(call.name, call.args);
      } catch (error) {
        result = `ACTION FAILED: ${error instanceof Error ? error.message : String(error)}`;
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: result });
    }
  }

  outcome.failure = `hit the ${options.maxTurns}-turn cap without claiming completion`;
  return outcome;
}
