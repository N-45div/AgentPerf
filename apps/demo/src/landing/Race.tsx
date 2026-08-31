/**
 * The before/after race. Totals (tokens, wall-clock, round-trips) are the
 * measured medians from benchmarks/2026-08-31-booking-gpt-5.6-luna; the step
 * sequences come from real run transcripts. Step *timing* is evenly spaced —
 * dramatization of pace, not of cost.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const SCALE = 0.4; // 1s real time = 0.4s animation

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
    tag: "how browser agents work today",
    wallS: 14.2,
    tokens: 10046,
    turns: 8,
    steps: [
      "read_page — full accessibility tree",
      'click "Beard trim"',
      "read_page — the page changed, read it again",
      'click slot "09-01 10:00"',
      'fill "Your name" → Dana Smith',
      'fill "Email" → dana@example.com',
      'click "Book it"',
      "read_page — hunt for the confirmation",
      "task_complete ✓"
    ],
    verdict: "10,046 tokens · 14.2s · 8 round-trips"
  },
  {
    key: "tools",
    title: "WebMCP tools",
    tag: "@agentperf/react fast lane",
    wallS: 5.5,
    tokens: 4240,
    turns: 4,
    steps: [
      "get_page_state — one budgeted snapshot",
      'list_open_slots("beard")',
      "book_slot(…) → FR-K3QZV",
      "task_complete ✓"
    ],
    verdict: "4,240 tokens · 5.5s · 4 round-trips"
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
            One agent books a salon slot twice: driving the DOM the way browser agents do today,
            and calling the page's own WebMCP tools. Totals are measured medians, replayed at 2.5x.
          </p>
        </div>
        <div className="race">
          {LANES.map((spec) => (
            <Lane key={spec.key} spec={spec} progress={progress[spec.key]} />
          ))}
        </div>
        <p className={`big-verdict${done ? " on" : ""}`}>
          Tools lane: <span>2.4x fewer tokens, 2.6x faster</span> — 100% success in both lanes.
        </p>
        <p className="race-foot">
          Step sequences from real run transcripts; totals are measured medians (n=3).
          <button type="button" className="replay" onClick={play}>
            ↻ Replay
          </button>
        </p>
      </div>
    </section>
  );
}
