/**
 * Live page state exposed to agents through one `get_page_state` tool.
 *
 * Components declare slices with `useAgentState(key, value)`. The store keeps
 * a getter per key — values are resolved at call time, never at registration
 * time, so re-renders never tear down and re-register the tool. The tool is
 * registered when the first slice mounts and unregistered (via its
 * AbortController) when the last one unmounts, which fires the browser's
 * `toolchange` event so an idle agent learns the surface moved.
 */
import { useContext, useEffect, useRef } from "react";
import { BoundaryContext, scopedKey } from "./boundary";
import { serializeBudgeted } from "./serialize";
import { textResult, webmcpSupported } from "./types";

export const DEFAULT_STATE_BUDGET = 1000;

interface StateEntry {
  description?: string;
  get: () => unknown;
}

class PageStateStore {
  private entries = new Map<string, StateEntry>();
  private controller: AbortController | null = null;
  budget = DEFAULT_STATE_BUDGET;

  add(key: string, entry: StateEntry): void {
    this.entries.set(key, entry);
    this.ensureRegistered();
  }

  remove(key: string): void {
    this.entries.delete(key);
    if (this.entries.size === 0 && this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  snapshot(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of this.entries) out[key] = entry.get();
    return out;
  }

  private ensureRegistered(): void {
    if (this.controller || !webmcpSupported()) return;
    const controller = new AbortController();
    this.controller = controller;
    Promise.resolve(
      document.modelContext!.registerTool(
        {
          name: "get_page_state",
          description:
            "Read a live snapshot of this page's application state, as compact JSON. " +
            "Call this before acting so you work from what the page actually shows, " +
            "not from a guess. Long values are pruned to stay small; a trailing " +
            "'… +N more' marker means an array was elided.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true },
          execute: () => textResult(serializeBudgeted(this.snapshot(), this.budget))
        },
        { signal: controller.signal }
      )
    ).catch(() => {
      if (this.controller === controller) this.controller = null;
    });
  }

  /** Test-only: forget all slices and drop the registration. */
  resetForTests(): void {
    this.controller?.abort();
    this.controller = null;
    this.entries.clear();
    this.budget = DEFAULT_STATE_BUDGET;
  }
}

export const pageStateStore = new PageStateStore();

export interface AgentStateOptions {
  /** What this slice means, for future per-slice docs. */
  description?: string;
}

/**
 * Expose a slice of live app state to agents under `key`. The current value
 * is captured on every render; agents always read the latest through
 * `get_page_state`. Inside an `<AgentBoundary name="cart">`, `key` becomes
 * `cart.key`.
 */
export function useAgentState<T>(key: string, value: T, options?: AgentStateOptions): void {
  const scope = useContext(BoundaryContext);
  const fullKey = scopedKey(scope, key, ".");
  const valueRef = useRef<T>(value);
  valueRef.current = value;
  const descriptionRef = useRef(options?.description);
  descriptionRef.current = options?.description;

  useEffect(() => {
    pageStateStore.add(fullKey, {
      get: () => valueRef.current,
      description: descriptionRef.current
    });
    return () => pageStateStore.remove(fullKey);
  }, [fullKey]);
}

/** Set the total token budget for the `get_page_state` snapshot. */
export function setAgentStateBudget(tokens: number): void {
  pageStateStore.budget = tokens;
}
