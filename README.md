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

## Status

Day 0. Building in the open — first benchmark numbers land here when they're
real, not before.

## License

Apache-2.0
