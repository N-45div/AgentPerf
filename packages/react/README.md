# @agentperf/react

**Give your React app a second frontend — for AI agents.** Humans get your DOM;
agents get a token-budgeted state snapshot and typed, schema-gated actions on
the WebMCP standard (`document.modelContext`). One codebase, two doorways.

```bash
npm i @agentperf/react zod
```

```tsx
import { useAgentState, useAgentAction, AgentBoundary } from "@agentperf/react";
import { z } from "zod";

function Cart({ cart }) {
  // agents read this through one get_page_state tool, pruned to a token budget
  useAgentState("cart", cart);

  // agents act through a schema gate — invalid input never reaches your handler,
  // it gets a refusal naming the exact violated fields so it can self-correct
  useAgentAction("checkout", {
    description: "Pay for the items in the cart",
    input: z.object({ email: z.string().email() }),
    execute: ({ email }) => checkout(email)
  });
}
```

- **No WebMCP, no problem** — in browsers without `document.modelContext`
  everything no-ops and your app stays a normal human app. Add
  [`@mcp-b/global`](https://github.com/WebMCP-org/npm-packages) as a polyfill
  if you want tools everywhere.
- **Structured refusals** — validation failures return the violated field
  paths and a fix-and-retry instruction, so agents correct their calls instead
  of corrupting state. Deterministic: same input, same verdict.
- **Token budgeting** — `get_page_state` prunes long arrays and strings to a
  budget (default 1,000 tokens, `setAgentStateBudget` to change), because
  agents pay per token to read your page.
- **`AgentBoundary`** scopes state keys and tool names the way your component
  tree scopes the UI.
- **Read-only/destructive hints** (`readOnly`, `destructive`) map to WebMCP
  annotations; a reserved `price` field is inert today and becomes x402
  settlement in v2 without a breaking change.

Works in Chrome 149+ (WebMCP origin trial / `chrome://flags/#enable-webmcp-testing`)
and the ChatGPT desktop browser. Measure what it saves your agents with
[the AgentPerf harness](https://github.com/N-45div/AgentPerf).

Apache-2.0
