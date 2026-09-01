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

## The numbers

Same page, same task, same harness-verified success check — the only variable
is how the agent touches the page. `gpt-5.6-luna`, n=5 per lane, both lanes
100% successful on both pages:

| page | accessibility tree | lane | median wall-clock | median tokens | round-trips |
|------|--------------------|------|-------------------|---------------|-------------|
| salon booking | 1,010 chars | DOM driving | 7.5s | 10,079 | 5 |
| salon booking | | **WebMCP tools** | **5.0s** | **4,268** | **4** |
| product catalog | 32,916 chars | DOM driving | 24.3s | 102,537 | 7 |
| product catalog | | **WebMCP tools** | **6.0s** | **7,434** | **5** |

**The gap is a property of the page, not of WebMCP: 2.4x tokens on a tiny
page, 13.8x on a realistic one.** Make the page 32x heavier and the DOM lane
pays 10x more while the tools lane barely moves (4,268 → 7,434) — it never
reads the page, it asks. Wall-clock follows: 1.5x on the small page, 4.0x on
the heavy one.

That is the whole argument for measuring instead of quoting a headline. **A
single number for "how much does WebMCP save" is meaningless without the page
it was measured on** — which is why this ships as a harness you point at your
own site, not just as a result.

The saving also replicates across model families. On the small page,
`claude-sonnet-5` (via OpenRouter, no vendor-specific workarounds) pays 2.5x
the tokens with the same round-trip counts — the earlier run is in
[`benchmarks/`](benchmarks/).

> **Correction, 1 Sep 2026.** The launch numbers were 2.4x tokens and 2.6x
> wall-clock. An adversarial review of our own harness found the DOM lane was
> handicapped — its actions returned no page state, forcing an extra
> round-trip each — so its round-trips were inflated 8 vs 5. Fixed and re-run:
> the **token ratio survived unchanged (2.36x)**, the **wall-clock claim did
> not (2.6x → 1.5x)**. Every finding, including one where a dramatic result
> turned out to be our own bug, is written up in
> [`benchmarks/METHODOLOGY.md`](benchmarks/METHODOLOGY.md).

### Why measure at all

The claims in circulation — *"10x faster, ~90% fewer tokens"* — trace to a
methodology-free blog post (the 10x), and to token-only counts from the
ecosystem's own testing against *screenshot* baselines: Google's early
figures, and MCP-B creator Alex Nahas's [CDP-server
benchmark](https://github.com/WebMCP-org/chrome-devtools-quickstart), which
honestly notes that speed is "harder to measure."

Nobody had measured **task completion**: both lanes, wall-clock included,
success verified on the rendered page, failures counted. That's what this
does — against the far cheaper accessibility-tree baseline, and against a DOM
lane given the capabilities a real driver has: post-action page state,
dropdown support, matched settle time, structurally parallel prompts. Where a
choice could flatter the tools lane, it was made the other way.

Known limits, in full: two pages, two models, localhost, n=5 with
near-identical trajectories per run (so n=5 measures latency variance, not
behavioral variance), `reasoning_effort: "none"` on `gpt-5.6` (a provider
requirement, applied to both lanes), uncached token counts, and tools written
by the same person who wrote the tasks. All of it, plus the two times a result
turned out to be our own bug, is in
[`METHODOLOGY.md`](benchmarks/METHODOLOGY.md). Third-party WebMCP pages are
the priority for the next run.

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
the measured median run, replayed. Then open one of the two demo pages in
Chrome 149+ with `chrome://flags/#enable-webmcp-testing`, or in the ChatGPT
desktop browser:

- [`/demo/`](https://agentperf-demo.vercel.app/demo/) — the salon. Say *"book
  me a beard trim tomorrow."* The dock reads **"5 tools live"** and the
  booking appears in the UI as the agent works.
- [`/catalog/`](https://agentperf-demo.vercel.app/catalog/) — the 72-product
  store, the heavy page from the table above. Say *"find me the cheapest
  in-stock wireless keyboard rated 4.5 or better and order it."* Your agent
  answers in about 7,000 tokens; driving the same page by DOM costs 102,000.

Even the landing page speaks WebMCP — ask your agent for
`get_benchmark_results` and it returns these numbers with the caveats
attached.

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
- [`apps/demo`](apps/demo) — landing page, Fringe & Co. salon app, Northwind catalog
- [`benchmarks/`](benchmarks/) — published reports with per-run data, and [METHODOLOGY.md](benchmarks/METHODOLOGY.md): the adversarial review of this harness and what it changed

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
