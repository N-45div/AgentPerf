import { useAgentAction, useAgentState } from "@agentperf/react";
import { z } from "zod";
import { Race } from "./Race";

const MEDIANS = {
  task: "book a salon slot (Fringe & Co. demo)",
  model: "gpt-5.6-luna",
  runsPerLane: 3,
  dom: { successRate: 1, wallClockS: 14.2, tokens: 10046, roundTrips: 8 },
  tools: { successRate: 1, wallClockS: 5.5, tokens: 4240, roundTrips: 4 },
  report: "https://github.com/N-45div/AgentPerf/blob/main/benchmarks/2026-08-31-booking-gpt-5.6-luna/report.md"
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
        "n=3 per lane",
        "one small single-page app",
        "one model",
        "localhost serving — network latency not included",
        "DOM baseline uses the accessibility tree, which is cheaper than screenshots — conservative in the DOM lane's favor"
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
            wall-clock included, success verified on the rendered page. We did — against the
            cheaper accessibility-tree baseline, so 2.4x is the conservative number on a
            deliberately small page. And DOM cost scales with page size; tool cost doesn't.
          </p>
          <table className="numbers-table">
            <thead>
              <tr>
                <th>lane</th>
                <th>success</th>
                <th>median wall-clock</th>
                <th>median tokens</th>
                <th>round-trips</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>DOM driving (accessibility tree)</td>
                <td>100% (3/3)</td>
                <td><code>14.2s</code></td>
                <td><code>10,046</code></td>
                <td><code>8</code></td>
              </tr>
              <tr>
                <td>WebMCP tools (@agentperf/react)</td>
                <td>100% (3/3)</td>
                <td className="good"><code>5.5s</code></td>
                <td className="good"><code>4,240</code></td>
                <td className="good"><code>4</code></td>
              </tr>
            </tbody>
          </table>
          <p className="caveats">
            gpt-5.6-luna · booking task · n=3 per lane · localhost · success verified by the
            harness against the rendered page, never claimed by the model · failed runs are
            reported, not discarded (there were none) ·{" "}
            <a href={MEDIANS.report}>full report &amp; per-run data</a>
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
