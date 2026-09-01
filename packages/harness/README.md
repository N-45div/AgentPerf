# agentperf

**Measure what AI agents pay to use a website.** Same page, same model, same
task, same verification — two lanes:

- **dom** — the agent reads the accessibility tree and clicks/types, the way
  browser-driving agents work today. (Text-based driving is *cheaper* than
  screenshots, so this baseline is conservative in the DOM lane's favor.)
- **tools** — the agent calls the page's own WebMCP tools. The harness injects
  a `document.modelContext` host before page load, so it benchmarks any
  WebMCP page in stock Chromium — no browser flag, no origin trial.

Success is verified by the harness against the rendered page, never claimed by
the model. Failed runs are reported, not discarded.

```bash
npm i -g agentperf
npx playwright install chromium
export OPENAI_API_KEY=sk-…            # any OpenAI-compatible endpoint works
agentperf run --url https://your-app.example --runs 3
```

Output: per-run and median wall-clock, tokens (prompt+completion), model
round-trips, actions, success rate — as a markdown table and JSON under
`results/`.

Options: `--lane both|tools|dom` · `--runs N` · `--model <id>` (default
`gpt-5.6-luna`) · `--base-url <url>` for compatible providers · `--task
booking|path/to/task.json` · `--max-turns N` · `--max-snapshot-chars N` ·
`--out dir`. A task file is `{ id, prompt, successPattern, maxTurns }` — the
prompt is handed to both lanes verbatim and `successPattern` is a regex the
page's visible text must match when the task is truly done.

`--max-snapshot-chars` caps the accessibility snapshot the DOM lane receives
per `read_page`. It defaults to 120,000 — deliberately generous, so a heavy
page reaches the DOM agent whole and it pays for the page in tokens instead
of being handicapped by truncation. Runs that still hit the cap are flagged
in the report, because their measured cost is a floor rather than the real
number.

Instrument your app with [`@agentperf/react`](https://www.npmjs.com/package/@agentperf/react)
to give it the tools lane.

Apache-2.0
