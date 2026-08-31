/**
 * Token-budgeted serialization. Agents pay per token to read state, so the
 * snapshot an agent sees is pruned — long strings truncated, long arrays
 * elided with an explicit marker, depth capped — until it fits the budget.
 * Pruning is deterministic: the same value and budget always produce the
 * same snapshot.
 */

const ELLIPSIS = "…";

/** Rough token estimate (~4 characters per token). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface PruneLimits {
  maxItems: number;
  maxStringLength: number;
  maxDepth: number;
}

function prune(value: unknown, depth: number, limits: PruneLimits): unknown {
  if (value === null || typeof value !== "object") {
    if (typeof value === "string" && value.length > limits.maxStringLength) {
      return value.slice(0, limits.maxStringLength) + ELLIPSIS;
    }
    return value;
  }
  if (depth >= limits.maxDepth) return ELLIPSIS;
  if (Array.isArray(value)) {
    const kept = value
      .slice(0, limits.maxItems)
      .map((item) => prune(item, depth + 1, limits));
    if (value.length > limits.maxItems) {
      kept.push(`${ELLIPSIS} +${value.length - limits.maxItems} more`);
    }
    return kept;
  }
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (entry === undefined || typeof entry === "function") continue;
    out[key] = prune(entry, depth + 1, limits);
  }
  return out;
}

/**
 * Serialize `value` as compact JSON within roughly `budget` tokens.
 * Tightens limits in deterministic steps until the snapshot fits (or the
 * limits bottom out — a pathological value can still exceed a tiny budget).
 */
export function serializeBudgeted(value: unknown, budget: number): string {
  let limits: PruneLimits = { maxItems: 20, maxStringLength: 200, maxDepth: 6 };
  for (let pass = 0; pass < 6; pass++) {
    const text = JSON.stringify(prune(value, 0, limits)) ?? "null";
    if (estimateTokens(text) <= budget || (limits.maxItems === 1 && limits.maxStringLength <= 25)) {
      return text;
    }
    limits = {
      maxItems: Math.max(1, Math.floor(limits.maxItems / 2)),
      maxStringLength: Math.max(25, Math.floor(limits.maxStringLength / 2)),
      maxDepth: Math.max(2, limits.maxDepth - 1)
    };
  }
  return JSON.stringify(prune(value, 0, limits)) ?? "null";
}
