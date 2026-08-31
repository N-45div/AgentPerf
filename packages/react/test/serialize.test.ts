import { describe, expect, it } from "vitest";
import { estimateTokens, serializeBudgeted } from "../src/serialize";

describe("serializeBudgeted", () => {
  it("returns small values untouched", () => {
    const value = { cart: { items: 2, total: 49.5 } };
    expect(serializeBudgeted(value, 500)).toBe(JSON.stringify(value));
  });

  it("stays within budget for large arrays and marks the elision", () => {
    const value = {
      products: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `Product number ${i} with a reasonably long display name`,
        price: i * 10
      }))
    };
    const text = serializeBudgeted(value, 300);
    expect(estimateTokens(text)).toBeLessThanOrEqual(300);
    expect(text).toContain("more");
  });

  it("truncates long strings", () => {
    const text = serializeBudgeted({ blob: "x".repeat(5000) }, 100);
    expect(estimateTokens(text)).toBeLessThanOrEqual(100);
    expect(text).toContain("…");
  });

  it("is deterministic", () => {
    const value = { list: Array.from({ length: 100 }, (_, i) => i) };
    expect(serializeBudgeted(value, 50)).toBe(serializeBudgeted(value, 50));
  });

  it("drops functions and undefined, keeps null", () => {
    const text = serializeBudgeted({ a: null, b: undefined, c: () => 1, d: 2 }, 100);
    expect(JSON.parse(text)).toEqual({ a: null, d: 2 });
  });

  it("caps depth with an ellipsis", () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: { h: 1 } } } } } } } };
    const text = serializeBudgeted(deep, 10);
    expect(text).toContain("…");
  });
});
