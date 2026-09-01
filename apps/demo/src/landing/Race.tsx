/**
 * The before/after race. Totals (tokens, wall-clock, round-trips) are the
 * measured medians from benchmarks/2026-09-01-catalog-gpt-5.6-luna; the step
 * sequences come from real run transcripts. Step *timing* is evenly spaced —
 * dramatization of pace, not of cost.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const SCALE = 0.25; // 1s real time = 0.25s animation

interface LaneSpec {
  key: "dom" | "tools";
  title: string;
  tag: string;
  wallS: number;
  tokens: number;
  turns: number;
  steps: string[];
  verdict: string;
}

const LANES: LaneSpec[] = [
  {
    key: "dom",
    title: "DOM driving",
    tag: "read the page, click, re-read",
    wallS: 24.3,
    tokens: 102537,
    turns: 7,
    steps: [
      "read_page — 32,916 chars of catalog",
      'fill search → "wireless keyboard"',
      "…the whole page again, every read",
      'select_option "Minimum rating" → 4.5+',
      "…and again",
      'click "Add Nimbus Air 75 to cart"',
      "fill name / email, click Place order",
      "task_complete ✓"
    ],
    verdict: "102,537 tokens · 24.3s · 7 round-trips"
  },
  {
    key: "tools",
    title: "WebMCP tools",
    tag: "@agentperf/react fast lane",
    wallS: 6.0,
    tokens: 7434,
    turns: 5,
    steps: [
      "get_page_state — one budgeted snapshot",
      'search_products({category:"keyboards",',
      '  minRating:4.5, inStockOnly:true})',
      "add_to_cart(kb-nimbus-air75) → $89.99",
      "place_order(…) → NW-7YDSV",
      "task_complete ✓"
    ],
    verdict: "7,434 tokens · 6.0s · 5 round-trips"
  }
];

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function Lane({ spec, progress }: { spec: LaneSpec; progress: number }) {
  const tokens = Math.round(spec.tokens * progress);
  const seconds = (spec.wallS * progress).toFixed(1);
  const stepsOn = Math.floor(spec.steps.length * progress + 1e-6);
  const done = progress >= 1;
  return (
    <div className={`lane ${spec.key}${done && spec.key === "tools" ? " winner-lane" : ""}`}>
      <h3>
        {spec.title} <span className="tag">{spec.tag}</span>
      </h3>
      <div className="gauges">
        <div className="gauge">
          <div className="v">{tokens.toLocaleString()}</div>
          <div className="l">tokens</div>
        </div>
        <div className="gauge">
          <div className="v">{seconds}s</div>
          <div className="l">wall-clock</div>
        </div>
        <div className="gauge">
          <div className="v">{Math.round(spec.turns * progress)}</div>
          <div className="l">round-trips</div>
        </div>
      </div>
      <div className="track">
        <div className="fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <ul className="steps">
        {spec.steps.map((step, i) => (
          <li key={step} className={i < stepsOn ? "on" : ""}>
            <span className="n">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ul>
      <div className="verdict">{done ? spec.verdict : " "}</div>
    </div>
  );
}

export function Race() {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState<{ dom: number; tools: number }>({ dom: 0, tools: 0 });
  const frame = useRef(0);

  const play = useCallback(() => {
    cancelAnimationFrame(frame.current);
    if (reduced) {
      setProgress({ dom: 1, tools: 1 });
      return;
    }
    const t0 = performance.now();
    const domMs = LANES[0]!.wallS * 1000 * SCALE;
    const toolsMs = LANES[1]!.wallS * 1000 * SCALE;
    const tick = (now: number) => {
      const elapsed = now - t0;
      setProgress({
        dom: Math.min(1, elapsed / domMs),
        tools: Math.min(1, elapsed / toolsMs)
      });
      if (elapsed < domMs) frame.current = requestAnimationFrame(tick);
    };
    setProgress({ dom: 0, tools: 0 });
    frame.current = requestAnimationFrame(tick);
  }, [reduced]);

  useEffect(() => {
    const timer = setTimeout(play, 500);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame.current);
    };
  }, [play]);

  const done = progress.dom >= 1;
  return (
    <section className="race-section" id="race">
      <div className="wrap">
        <div className="race-head">
          <h2>Same page. Same model. Same task. Watch the bill.</h2>
          <p>
            One agent buys the cheapest in-stock wireless keyboard rated 4.5+ from a 72-product
            store, twice: driving the DOM with a full accessibility-tree driver, and calling the
            page's own WebMCP tools. Both succeed every time. Totals are measured medians (n=5),
            replayed at 4x.
          </p>
        </div>
        <div className="race">
          {LANES.map((spec) => (
            <Lane key={spec.key} spec={spec} progress={progress[spec.key]} />
          ))}
        </div>
        <p className={`big-verdict${done ? " on" : ""}`}>
          Tools lane: <span>13.8x fewer tokens, 4x faster</span> — 100% success in both lanes.
        </p>
        <p className="race-foot">
          Step sequences from real run transcripts; totals are measured medians (n=5).
          <button type="button" className="replay" onClick={play}>
            ↻ Replay
          </button>
        </p>
      </div>
    </section>
  );
}
