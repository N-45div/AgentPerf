# AgentPerf

[![npm: agentperf](https://img.shields.io/npm/v/agentperf?label=agentperf&color=f97316)](https://www.npmjs.com/package/agentperf)
[![npm: @agentperf/react](https://img.shields.io/npm/v/%40agentperf%2Freact?label=%40agentperf%2Freact&color=f97316)](https://www.npmjs.com/package/@agentperf/react)
[![CI](https://github.com/N-45div/AgentPerf/actions/workflows/ci.yml/badge.svg)](https://github.com/N-45div/AgentPerf/actions)
[![license: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-8b8b8b)](LICENSE)
[![live demo](https://img.shields.io/badge/live-agentperf--demo.vercel.app-1c1917)](https://agentperf-demo.vercel.app)

**Measure what AI agents pay to use your website — then stop making them pay it.**

Agents are real visitors now, and they use sites the slow way: parse the page,
guess the buttons, click, wait, re-parse. WebMCP gives a site a fast lane —
typed tools an agent calls directly — and everyone repeats the same unsourced
claim about it: *"10x faster, 90% fewer tokens."* AgentPerf is the measurement,
and the React layer that makes the fast lane an afternoon of work.

## 📦 Packages

| package | install | what it is |
|---------|---------|------------|
| [`agentperf`](https://www.npmjs.com/package/agentperf) | `npm i -g agentperf` | The benchmark CLI. Runs the same task via DOM driving vs. WebMCP tools; reports wall-clock, tokens, round-trips, success rate. Benchmarks **any** WebMCP page in stock Chromium — it injects its own `document.modelContext` host, no browser flag needed. |
| [`@agentperf/react`](https://www.npmjs.com/package/@agentperf/react) | `npm i @agentperf/react zod` | The fast lane for React apps: `useAgentState` (token-budgeted state snapshots), `useAgentAction` (schema-gated actions with structured refusals), `AgentBoundary` (scoping). No-ops safely in browsers without WebMCP. |

## The numbers (measured 31 Aug 2026)

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
[`benchmarks/`](benchmarks/2026-08-31-booking-gpt-5.6-luna/report.md). Caveats
we know about: n=3, one small SPA, one model, localhost. Heavier pages and
more models are next.

## Quick start — give your app the fast lane

```bash
npm i @agentperf/react zod
```

```tsx
import { useAgentState, useAgentAction } from "@agentperf/react";
import { z } from "zod";

function Cart({ cart }) {
  // agents read live state through one token-budgeted get_page_state tool
  useAgentState("cart", cart);

  // agents act through a schema gate — invalid input never reaches your
  // handler; it gets a refusal naming the exact violated fields
  useAgentAction("checkout", {
    description: "Pay for the items in the cart",
    input: z.object({ email: z.string().email() }),
    execute: ({ email }) => checkout(email)
  });
}
```

Works in Chrome 149+ (WebMCP origin trial) and the ChatGPT desktop browser.
Browsers without WebMCP: everything no-ops and your app stays a normal human
app — add [`@mcp-b/global`](https://github.com/WebMCP-org/npm-packages) as a
polyfill if you want the tools everywhere.

## Quick start — measure any WebMCP page

```bash
npm i -g agentperf
npx playwright install chromium
export OPENAI_API_KEY=sk-…            # any OpenAI-compatible endpoint works
agentperf run --url https://your-app.example --runs 3
```

Success is verified by the harness against the rendered page, never claimed
by the model. Failed runs are reported, not discarded. Options:
`--lane both|tools|dom` · `--runs N` · `--model <id>` · `--base-url <url>` ·
`--task booking|path/to/task.json` · `--max-turns N` · `--out dir`.

## Try it in two minutes

Open **https://agentperf-demo.vercel.app** — the race on the landing page is
the measured median run, replayed. Then open
[`/demo/`](https://agentperf-demo.vercel.app/demo/) in Chrome 149+ with
`chrome://flags/#enable-webmcp-testing` (or the ChatGPT desktop browser) and
tell your agent: *"book me a beard trim tomorrow."* The dock reads **"5 tools
live"**; the booking your agent makes shows up in the UI as it works. Even the
landing page speaks WebMCP — ask your agent for `get_benchmark_results`.

## How it works

- **One state tool, not a DOM dump.** Every `useAgentState` slice flows into a
  single `get_page_state` tool whose snapshot is pruned to a token budget
  (default 1,000) — long arrays elided with explicit markers, values resolved
  at call time so re-renders never churn registrations.
- **Writes are gated, refusals are structured.** `useAgentAction` validates
  every call with zod before your handler runs. Bad input gets back the
  violated field paths and a fix-and-retry instruction — deterministic, so
  agents self-correct instead of corrupting state.
- **The harness is its own WebMCP host.** It injects `document.modelContext`
  before page load, captures whatever the page registers, and drives both
  lanes with the identical agent loop. The DOM baseline uses the accessibility
  tree — *cheaper* than screenshots, so the comparison is conservative in the
  DOM lane's favor.

## Repo layout

- [`packages/react`](packages/react) — `@agentperf/react`
- [`packages/harness`](packages/harness) — the `agentperf` CLI
- [`apps/demo`](apps/demo) — the landing page + Fringe & Co. demo app
- [`benchmarks/`](benchmarks/) — published reports, per-run data included

## Roadmap

- **Heavier pages** — turn "the gap widens with page size" from an argument
  into a measured curve.
- **More models, more tasks** — the harness already takes `--base-url`; every
  OpenAI-compatible provider is a data point.
- **Priced tools (x402)** — every `useAgentAction` carries an inert `price`
  field today. When [x402](https://www.x402.org/) settlement (Cloudflare
  Monetization Gateway, AWS CloudFront) is generally available, it starts
  settling: AgentPerf tells you what your fast lane is worth; x402 lets you
  charge for it.

## Contributing

Issues and PRs welcome — especially new benchmark tasks, heavier target pages,
and runs on other models/providers (attach the `results/` JSON).

```bash
pnpm install
pnpm -r build
pnpm -r test          # library unit tests
node packages/harness/scripts/smoke.mjs <url>   # full plumbing, no LLM needed
```

CI runs typecheck, tests, and the no-LLM smoke test on every push.

## License

[Apache-2.0](LICENSE)
