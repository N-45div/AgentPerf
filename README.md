# AgentPerf

**Measure what AI agents pay to use your website — then stop making them pay it.**

Agents are becoming real visitors to the web. Today they use sites the slow way:
parse the page, guess the buttons, click, wait, re-parse. WebMCP gives a site a
fast lane — typed tools an agent calls directly — and everyone repeats the same
claim about it: *"10x faster, 90% fewer tokens."* Nobody has published the
measurement. AgentPerf is that measurement, and the layer that makes the fast
lane an afternoon of work.

Two pieces:

- **`agentperf` — the benchmark.** One real app, one task ("find X, book a
  slot, check out"), run two ways: an agent driving the DOM through the
  accessibility tree vs. the same agent calling WebMCP tools. Reported honestly:
  wall-clock, tokens, round-trips, success rate over N runs, harness open so
  anyone can rerun it.
- **the React layer** — a thin add-on over the existing WebMCP runtime
  ([`@mcp-b/react-webmcp`](https://github.com/WebMCP-org/npm-packages)) that
  adds what it doesn't have: `useAgentState` (a token-budgeted snapshot of live
  app state), agent boundaries, and schema-gated writes with structured
  refusals so an agent can self-correct instead of corrupting your data.

## The React layer, in three lines

```tsx
useAgentState("cart", cart);                       // agents read live state, token-budgeted
useAgentAction("checkout", {                       // agents act through a schema gate
  description: "Pay for the items in the cart",
  input: z.object({ email: z.string().email() }),
  execute: ({ email }) => checkout(email)
});
<AgentBoundary name="cart">…</AgentBoundary>        {/* scopes both, like a component tree */}
```

Invalid input never reaches your handler — the agent gets a refusal naming the
exact violated fields, so it fixes its call instead of corrupting your state.
Browsers without WebMCP: everything no-ops and the page stays a normal human
app (add [`@mcp-b/global`](https://github.com/WebMCP-org/npm-packages) as a
polyfill if you want the tools everywhere).

## Layout

- [`packages/react`](packages/react) — `@agentperf/react`, the layer above. Built, tested.
- [`packages/harness`](packages/harness) — the benchmark runner (Day 3).
- [`apps/demo`](apps/demo) — one app, twice: plain vs. instrumented (Day 2).

## Roadmap

- **v1 (this week):** the benchmark numbers, the demo pair, npm release.
- **v2 — priced tools:** every `useAgentAction` already carries an inert
  `price` field. When [x402](https://www.x402.org/) settlement (Cloudflare's
  Monetization Gateway, AWS CloudFront) is generally available, that field
  starts settling: AgentPerf tells you what your fast lane is worth, x402 lets
  you charge for it. Measurement first, monetization second — you can't price
  a tool call you haven't measured.

## Status

Day 1 of 5. Library core is up: 16 tests, ~7.5KB ESM. First benchmark numbers
land here when they're real, not before.

## License

Apache-2.0
