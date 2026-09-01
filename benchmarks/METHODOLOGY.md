# Methodology, and what an adversarial review of it found

AgentPerf exists because the numbers circulating about WebMCP had no
methodology behind them. That obligation runs both ways, so this file is the
audit of our own.

On 1 Sep 2026 the harness was reviewed adversarially — the brief was to prove
our published numbers were rigged, mismeasured, or unrepresentative. It found
one invalidating problem and several material ones. All of them are recorded
here, fixed or disclosed. The first one changed a published number.

## The invalidating finding: our DOM baseline was handicapped

**The attack.** "Your DOM lane isn't 'how browser agents work today' — it's a
strawman you built to lose. `click` returned `Clicked button "Beard trim".`
and nothing else, so the model had to burn an entire extra round-trip on
`read_page` to see what happened. Every real accessibility-tree driver —
Playwright MCP, Chrome DevTools MCP, browser-use — returns the post-action
snapshot attached to the action result. You doubled the DOM lane's
round-trips by fiat, then billed it for re-sending the transcript on each
extra trip. And you called that baseline 'conservative in the DOM lane's
favor.'"

**It was right.** The DOM lane's `click`/`fill` returned a bare confirmation
string, and both the system prompt and `read_page`'s own description told the
agent to re-read after every action — an instruction the tools lane never
got. That is a harness artifact, not a property of DOM driving.

**The fix.** `click` and `fill` now return the post-action accessibility
snapshot with the result, one round-trip per action, the way real drivers
work. The re-read instruction is gone from both lanes. Both lanes now get an
identical 150 ms post-action settle — previously only the DOM lane paid one,
250 ms per click.

**What it did to the numbers**, same page, same model (`gpt-5.6-luna`), same
task:

| | round-trips | tokens | wall-clock |
|---|---|---|---|
| before (handicapped DOM lane) | 8 vs 4 | 2.37x | 2.59x |
| **after (fair DOM lane)** | **5 vs 4** | **2.36x** | **1.50x** |

The DOM lane's round-trips fell from 8 to 5, exactly as predicted. The
**wall-clock claim did not survive: 2.6x was wrong, the honest number is
1.5x.** The token ratio did survive, essentially unchanged at 2.36x — fewer
turns, but each one now carries a page snapshot, and the two effects cancel.
That is the number the original launch quoted, and it holds up.

## The same mistake, caught a second time — and what it nearly cost

Building the heavy page produced a dramatic first result: on the 72-product
catalog the DOM lane succeeded **1 time in 5**, and its own recorded claims
showed why — it kept ordering a keyboard rated 4.2 when the task demanded 4.5
or higher, announcing success each time. "DOM driving doesn't just cost more
on a real page, it buys the wrong thing" is a far better headline than any
cost ratio.

It was also wrong, and for exactly the reason the review had just flagged.
The catalog's rating filter is a `<select>`, and the DOM lane had `click`,
`fill` and `read_page` — no way to operate a dropdown at all. Real drivers
have one. The agent could not use the page's own filter, so it was left
comparing 72 ratings by eye.

Adding a `select_option` tool took the DOM lane from **20% to 100%
success**. The failure was our harness's missing capability, not a property
of DOM driving, and publishing it would have been the same category of error
as the handicap above — with a much louder headline attached.

Two rules came out of this: a lane is only a baseline if it can do what the
real thing can do, and a result that flatters the conclusion gets audited
harder than one that doesn't.

## Other findings, fixed

- **Vacuous success.** The success check was a regex over the whole page. The
  landing page renders a sample confirmation code, so pointing the booking
  task at `/` would have scored a pass with no booking at all — and the first
  published report recorded exactly that URL (the page it served at run time
  was the salon app; the landing page moved there later). A run whose success
  pattern already matches at load is now rejected as an unverifiable task.
- **Zeros in the median.** A crashed run recorded `totalTokens: 0`, and the
  median was taken over all runs — so a lane that crashed had its reported
  cost dragged toward zero, understating exactly the lane that failed.
  Crashed runs now report the tokens they actually spent, and central
  tendencies are over successful runs only, with failures in the success rate.
- **Rate limits biasing the result.** A 429 failed a run outright, which
  silently penalizes whichever lane spends more tokens — the lane under
  measurement. Retries now back off exponentially.
- **Unauditable runs.** The model's own completion claim was computed and
  thrown away. It is now recorded per run, alongside mean, median and range,
  so a reader can audit a run instead of trusting it.
- **Estimator shopping.** With n=3 the median is just the middle sample.
  Reports now carry mean and median and the full spread. Runs are n=5.

## Known limitations, disclosed

- **`reasoning_effort: "none"`.** `gpt-5.6` returns a 400 on function tools
  otherwise. Reasoning tokens are suppressed in *both* lanes, and the
  direction of that bias is genuinely unknown — which is why the
  `claude-sonnet-5` row, which carries no such workaround, matters.
- **Trajectories are near-identical across runs.** Turn counts and token
  totals repeat almost exactly, so n=5 measures latency variance, not
  behavioral variance. Wall-clock is the noisy metric; tokens and round-trips
  are the stable ones, and the stable ones are what we lead with.
- **Uncached token counts.** We report prompt+completion totals as the API
  gives them. Provider prompt caching may reduce billed cost, and does so
  unequally across lanes, so "tokens" here is not "dollars".
- **Tool granularity is a design variable.** These pages' tools were written
  by the same person who wrote the tasks. A task poorly covered by a site's
  tools will show a smaller gap. Both demo pages carry tools irrelevant to
  their task (`cancel_booking`, `get_product`) and pay for those schemas
  every turn, but that does not fully answer the objection. Third-party
  WebMCP pages are the priority for the next run.
- **Fuzzy element targeting.** The DOM lane resolves elements with
  `exact: false` and `.first()`. On these pages that happens to favor the DOM
  lane (`.first()` lands on the earliest slot, which is what the task wants).

## What was checked and found clean

- **No cherry-picking.** `results/` contains every run. The only discarded
  entry from the first launch is a set of 404s from a mistyped model id,
  committed alongside the real run.
- **Arithmetic.** Per-run data is published with every report so the medians,
  means and ratios can be recomputed.
- **Snapshot truncation.** It never fired on the small page (that page's
  entire accessibility tree is 1,010 characters). The cap is now 120,000 and
  any run that hits it is flagged, because its cost would be a floor rather
  than a measurement.
