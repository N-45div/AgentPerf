import { useAgentAction, useAgentState } from "@agentperf/react";
import { z } from "zod";
import { Race } from "./Race";

const REPORTS = "https://github.com/N-45div/AgentPerf/blob/main/benchmarks";

const MEDIANS = {
  model: "gpt-5.6-luna",
  runsPerLane: 5,
  measuredOn: "2026-09-01",
  pages: {
    salonBooking: {
      accessibilityTreeChars: 1010,
      dom: { successRate: 1, wallClockS: 7.5, tokens: 10079, roundTrips: 5 },
      tools: { successRate: 1, wallClockS: 5.0, tokens: 4268, roundTrips: 4 },
      report: `${REPORTS}/2026-09-01-booking-gpt-5.6-luna-fair-dom/report.md`
    },
    productCatalog: {
      accessibilityTreeChars: 32916,
      dom: { successRate: 1, wallClockS: 24.3, tokens: 102537, roundTrips: 7 },
      tools: { successRate: 1, wallClockS: 6.0, tokens: 7434, roundTrips: 5 },
      report: `${REPORTS}/2026-09-01-catalog-gpt-5.6-luna/report.md`
    }
  },
  headline:
    "The gap is a property of the page: 2.4x tokens on a 1,010-char page, 13.8x on a 32,916-char one.",
  methodology: `${REPORTS}/METHODOLOGY.md`
};

/** Yes, the landing page speaks WebMCP too. */
function LandingAgentSurface() {
  useAgentState("agentperf", {
    what: "Benchmark + React layer for making websites fast for AI agents",
    measured: MEDIANS,
    demo: "https://agentperf-demo.vercel.app/demo/",
    repo: "https://github.com/N-45div/AgentPerf"
  });
  useAgentAction("get_benchmark_results", {
    description:
      "Full measured results of the DOM-driving vs WebMCP-tools benchmark behind this page's claims, with caveats.",
    input: z.object({}),
    readOnly: true,
    execute: () => ({
      ...MEDIANS,
      caveats: [
        "n=5 per lane, but trajectories repeat almost exactly — n=5 measures latency variance, not behavioral variance",
        "two pages, two models, localhost serving",
        "reasoning_effort 'none' on gpt-5.6 (a provider requirement for function tools), applied to both lanes",
        "token counts are uncached prompt+completion totals; provider caching may reduce billed cost unequally across lanes",
        "the pages' tools were written by the same person who wrote the tasks — third-party WebMCP pages are the next run",
        "DOM baseline uses the accessibility tree (cheaper than screenshots) and has post-action page state, dropdown support and matched settle time, so it is not handicapped",
        "corrected 2026-09-01: the launch run handicapped the DOM lane and overstated wall-clock as 2.6x; see METHODOLOGY.md"
      ]
    })
  });
  return null;
}

export function Landing() {
  return (
    <>
      <LandingAgentSurface />

      <header className="hero">
        <div className="wrap">
          <div className="eyebrow">AgentPerf — open source · Apache-2.0</div>
          <h1>
            Agents are users now.
            <br />
            Your frontend <em>bills them like tourists</em>.
          </h1>
          <p className="sub">
            AgentPerf measures what AI agents pay to use your website — tokens, seconds,
            round-trips — then gives your React app a fast lane that cuts the bill.
            Measured, not claimed.
          </p>
          <div className="cta-row">
            <a className="btn primary" href="./demo/">
              Try the live demo
            </a>
            <a className="btn" href="https://github.com/N-45div/AgentPerf">
              GitHub
            </a>
            <a className="btn" href="#numbers">
              The numbers
            </a>
          </div>
        </div>
      </header>

      <Race />

      <section className="block" id="numbers">
        <div className="wrap">
          <h2>The honest numbers</h2>
          <p className="lead">
            The claims everywhere — “10x faster, ~90% fewer tokens” — trace back to a
            methodology-free blog post and token-only counts from the ecosystem's own testing
            against screenshot baselines. Nobody had measured task completion: both lanes,
            wall-clock included, success verified on the rendered page. We did — on two pages,
            because the answer turns out to depend entirely on which page you ask about.
          </p>
          <table className="numbers-table">
            <thead>
              <tr>
                <th>page</th>
                <th>a11y tree</th>
                <th>lane</th>
                <th>wall-clock</th>
                <th>tokens</th>
                <th>round-trips</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={2}>salon booking</td>
                <td rowSpan={2}><code>1,010 ch</code></td>
                <td>DOM driving</td>
                <td><code>7.5s</code></td>
                <td><code>10,079</code></td>
                <td><code>5</code></td>
              </tr>
              <tr>
                <td>WebMCP tools</td>
                <td className="good"><code>5.0s</code></td>
                <td className="good"><code>4,268</code></td>
                <td className="good"><code>4</code></td>
              </tr>
              <tr>
                <td rowSpan={2}>product catalog</td>
                <td rowSpan={2}><code>32,916 ch</code></td>
                <td>DOM driving</td>
                <td><code>24.3s</code></td>
                <td><code>102,537</code></td>
                <td><code>7</code></td>
              </tr>
              <tr>
                <td>WebMCP tools</td>
                <td className="good"><code>6.0s</code></td>
                <td className="good"><code>7,434</code></td>
                <td className="good"><code>5</code></td>
              </tr>
            </tbody>
          </table>
          <p className="lead" style={{ marginTop: 18 }}>
            <strong>2.4x tokens on the tiny page. 13.8x on the realistic one.</strong> Make the
            page 32x heavier and DOM driving pays 10x more, while the tools lane barely moves —
            it never reads the page, it asks. So a single number for “what does WebMCP save” is
            meaningless without the page it was measured on, which is exactly why this ships as
            a harness you point at your own site.
          </p>
          <p className="caveats">
            gpt-5.6-luna · n=5 per lane · 100% success in every lane on both pages · localhost ·
            success verified by the harness against the rendered page, never claimed by the
            model · the DOM lane gets post-action page state, dropdown support and the same
            settle time, so it is not handicapped ·{" "}
            <a href={MEDIANS.pages.salonBooking.report}>booking report</a> ·{" "}
            <a href={MEDIANS.pages.productCatalog.report}>catalog report</a>
          </p>
          <p className="caveats">
            <strong>Correction, 1 Sep 2026:</strong> the launch numbers were 2.4x tokens and
            2.6x wall-clock. An adversarial review of our own harness found the DOM lane was
            handicapped — its actions returned no page state, forcing an extra round-trip each.
            Fixed and re-run: the token ratio survived unchanged, the wall-clock claim did not
            (2.6x → 1.5x). Every finding, including one where a dramatic result turned out to be
            our own bug, is in <a href={MEDIANS.methodology}>METHODOLOGY.md</a>.
          </p>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <h2>The fast lane is three lines</h2>
          <p className="lead">
            Keep your app exactly as it is for humans. Add a second doorway for agents.{" "}
            <code style={{ fontFamily: "var(--mono)", color: "var(--amber)" }}>
              npm i @agentperf/react zod
            </code>
          </p>
          <pre className="code">{`useAgentState(`}<span className="s">"cart"</span>{`, cart);                        `}<span className="c">{`// agents read live state, token-budgeted`}</span>{`

useAgentAction(`}<span className="s">"checkout"</span>{`, {                      `}<span className="c">{`// agents act through a schema gate`}</span>{`
  description: `}<span className="s">"Pay for the items in the cart"</span>{`,
  input: z.object({ email: z.string().email() }),  `}<span className="c">{`// bad input → refusal with field paths`}</span>{`
  execute: ({ email }) => checkout(email)
});`}</pre>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <h2>What's in the box</h2>
          <p className="lead" />
          <div className="cards">
            <div className="card-b">
              <h3>
                <a href="https://www.npmjs.com/package/@agentperf/react">@agentperf/react</a>
              </h3>
              <p>
                <code>useAgentState</code> — every slice flows into one budgeted{" "}
                <code>get_page_state</code> tool. <code>useAgentAction</code> — zod-gated writes
                with structured refusals, so agents self-correct instead of corrupting state.{" "}
                <code>AgentBoundary</code> scopes both. No WebMCP? Everything no-ops.
              </p>
            </div>
            <div className="card-b">
              <h3>
                <a href="https://www.npmjs.com/package/agentperf">agentperf</a> (the harness)
              </h3>
              <p>
                Benchmarks any WebMCP page in stock Chromium — it injects its own{" "}
                <code>document.modelContext</code> host, no browser flag needed. Two lanes, one
                loop, harness-verified success, medians + per-run data.
              </p>
            </div>
            <div className="card-b">
              <h3>Next: priced tools</h3>
              <p>
                Every action carries an inert <code>price</code> field today. When x402 settlement
                is generally available, it starts settling — AgentPerf tells you what your fast
                lane is worth; x402 lets you charge for it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          Built in the open — day one.{" "}
          <a href="https://github.com/N-45div/AgentPerf">github.com/N-45div/AgentPerf</a> · This
          page speaks WebMCP too: ask your agent for <code>get_benchmark_results</code>.
        </div>
      </footer>
    </>
  );
}
