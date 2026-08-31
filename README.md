# AgentPerf

[![npm: agentperf](https://img.shields.io/npm/v/agentperf?label=agentperf&color=f97316)](https://www.npmjs.com/package/agentperf)
[![npm: @agentperf/react](https://img.shields.io/npm/v/%40agentperf%2Freact?label=%40agentperf%2Freact&color=f97316)](https://www.npmjs.com/package/@agentperf/react)
[![CI](https://github.com/N-45div/AgentPerf/actions/workflows/ci.yml/badge.svg)](https://github.com/N-45div/AgentPerf/actions)
[![live demo](https://img.shields.io/badge/live-agentperf--demo.vercel.app-1c1917)](https://agentperf-demo.vercel.app)

**Measure what AI agents pay to use your website — then stop making them pay it.**

Agents are becoming real visitors to the web. Today they use sites the slow way:
parse the page, guess the buttons, click, wait, re-parse. WebMCP gives a site a
fast lane — typed tools an agent calls directly — and everyone repeats the same
claim about it: *"10x faster, 90% fewer tokens."* Nobody has published the
measurement. AgentPerf is that measurement, and the layer that makes the fast
lane an afternoon of work.

## First numbers (31 Aug 2026)

Same page, same model (`gpt-5.6-luna`), same task (book a salon slot), same
harness-verified success check — the only variable is how the agent touches
the page:

| lane | success | median wall-clock | median tokens | median round-trips |
|------|---------|-------------------|---------------|--------------------|
| DOM driving (accessibility tree) | 100% (3/3) | 14.2s | 10,046 | 8 |
| WebMCP tools (`@agentperf/react`) | 100% (3/3) | **5.5s** | **4,240** | **4** |

**DOM driving paid 2.4x the tokens and 2.6x the wall-clock — not the "10x
faster, 90% fewer tokens" the WebMCP blogosphere repeats without a source.**
The honest number on a deliberately small page, against a baseline that
succeeds, is 2.4x — and the gap should widen with page size, since DOM cost
scales with the page and tool cost doesn't. Full report and per-run data in
[`benchmarks/`](benchmarks/2026-08-31-booking-gpt-5.6-luna/report.md); rerun it
yourself with one command below. Caveats we know about: n=3, one small SPA,
one model, localhost. Heavier pages and more models are next.

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

## Run it yourself

```bash
git clone https://github.com/N-45div/AgentPerf && cd AgentPerf
pnpm install && pnpm -r build && npx playwright install chromium
# terminal 1 — serve the demo
cd apps/demo && npx vite preview --port 4173
# terminal 2 — run the benchmark (any OpenAI-compatible key)
export OPENAI_API_KEY=sk-…
node packages/harness/dist/cli.js run --url http://localhost:4173/ --runs 3
```

Or try the live demo — **https://agentperf-demo.vercel.app** — in Chrome 149+
with `chrome://flags/#enable-webmcp-testing` or the ChatGPT desktop browser,
and tell your agent: *"book me a beard trim tomorrow."* The measured numbers
are on the page; the booking your agent makes shows up in the UI as it works.

## Status

Day 1 of 5, compressed: library (16 tests, ~7.5KB), demo app, harness, the
first honest numbers, the landing page, and the v0.1.0 npm release — all
shipped on day one (31 Aug 2026). Next: heavier pages (turn "the gap widens
with page size" into data), more models, more tasks.

## License

Apache-2.0
