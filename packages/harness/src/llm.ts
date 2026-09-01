/**
 * Minimal OpenAI-compatible chat client with tool calling. No SDK — the
 * harness talks to any /chat/completions endpoint (OpenAI, or a compatible
 * provider via --base-url) and accounts every token it spends.
 */

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface LlmToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  raw: unknown;
}

export interface AssistantTurn {
  content: string | null;
  toolCalls: ToolCall[];
  rawMessage: unknown;
  promptTokens: number;
  completionTokens: number;
}

export type ChatMessage = Record<string, unknown>;

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Rate limits are a property of the account, not of the lane under test —
 * letting them fail a run would silently bias whichever lane is more
 * token-hungry, which is the lane the benchmark exists to measure.
 */
export async function chat(
  config: LlmConfig,
  messages: ChatMessage[],
  tools: LlmToolDef[]
): Promise<AssistantTurn> {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await chatOnce(config, messages, tools);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      const status = Number(/\((\d{3})\)/.exec(lastError)?.[1]);
      if (!RETRY_STATUSES.has(status) || attempt === MAX_ATTEMPTS) throw error;
      await sleep(2000 * 2 ** (attempt - 1));
    }
  }
  throw new Error(lastError);
}

async function chatOnce(
  config: LlmConfig,
  messages: ChatMessage[],
  tools: LlmToolDef[]
): Promise<AssistantTurn> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      // gpt-5.6 models 400 on function tools unless reasoning is off.
      ...(config.model.startsWith("gpt-5.6") && { reasoning_effort: "none" }),
      tools: tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      })),
      tool_choice: "auto"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${body.slice(0, 400)}`);
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: {
        content: string | null;
        tool_calls?: Array<{
          id: string;
          function: { name: string; arguments: string };
        }>;
      };
    }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const message = data.choices[0]?.message;
  if (!message) throw new Error("LLM response had no choices");

  const toolCalls: ToolCall[] = (message.tool_calls ?? []).map((call) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
    } catch {
      /* malformed arguments stay {} — the tool's own gate reports it */
    }
    return { id: call.id, name: call.function.name, args, raw: call };
  });

  return {
    content: message.content,
    toolCalls,
    rawMessage: message,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0
  };
}
