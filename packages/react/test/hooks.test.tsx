import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { AgentBoundary } from "../src/boundary";
import { useAgentAction } from "../src/action";
import { pageStateStore, useAgentState } from "../src/state";

import type { ReactNode } from "react";
import { installFakeModelContext } from "./fake-model-context";

let fake: ReturnType<typeof installFakeModelContext>;

beforeEach(() => {
  fake = installFakeModelContext();
});

afterEach(() => {
  pageStateStore.resetForTests();
  fake.uninstall();
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useAgentAction", () => {
  const schema = z.object({ qty: z.number().int().positive() });

  it("registers on mount and unregisters on unmount", async () => {
    const { unmount } = renderHook(() =>
      useAgentAction("add_to_cart", {
        description: "Add an item",
        input: schema,
        execute: ({ qty }) => `added ${qty}`
      })
    );
    await flush();
    expect(fake.tools.has("add_to_cart")).toBe(true);
    unmount();
    expect(fake.tools.has("add_to_cart")).toBe(false);
  });

  it("refuses invalid input with field paths and does not run the handler", async () => {
    let ran = false;
    renderHook(() =>
      useAgentAction("add_to_cart", {
        description: "Add an item",
        input: schema,
        execute: () => {
          ran = true;
        }
      })
    );
    await flush();
    const result = await fake.call("add_to_cart", { qty: "three" });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("REFUSED");
    expect(result.content[0]!.text).toContain("qty");
    expect(ran).toBe(false);
  });

  it("runs the handler on valid input and returns its result", async () => {
    renderHook(() =>
      useAgentAction("add_to_cart", {
        description: "Add an item",
        input: schema,
        execute: ({ qty }) => ({ added: qty })
      })
    );
    await flush();
    const result = await fake.call("add_to_cart", { qty: 3 });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0]!.text)).toEqual({ added: 3 });
  });

  it("reports handler exceptions as tool errors, not crashes", async () => {
    renderHook(() =>
      useAgentAction("explode", {
        description: "Always fails",
        execute: () => {
          throw new Error("boom");
        }
      })
    );
    await flush();
    const result = await fake.call("explode");
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("boom");
  });

  it("publishes an input schema derived from zod", async () => {
    renderHook(() =>
      useAgentAction("add_to_cart", {
        description: "Add an item",
        input: schema,
        execute: () => "ok"
      })
    );
    await flush();
    const tool = fake.tools.get("add_to_cart")!;
    expect(tool.inputSchema?.type).toBe("object");
    expect(tool.inputSchema?.properties).toHaveProperty("qty");
  });

  it("publishes consequentialHint for high-stakes actions", async () => {
    renderHook(() =>
      useAgentAction("place_order", {
        description: "Place the order",
        consequential: true,
        execute: () => "ordered"
      })
    );
    await flush();
    expect(fake.tools.get("place_order")!.annotations?.consequentialHint).toBe(true);
  });

  it("omits consequentialHint when the action does not declare it", async () => {
    renderHook(() =>
      useAgentAction("search", {
        description: "Search",
        readOnly: true,
        execute: () => []
      })
    );
    await flush();
    expect(fake.tools.get("search")!.annotations).not.toHaveProperty("consequentialHint");
  });

  it("prefixes names inside an AgentBoundary", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AgentBoundary name="cart">{children}</AgentBoundary>
    );
    renderHook(
      () =>
        useAgentAction("checkout", {
          description: "Pay",
          execute: () => "paid"
        }),
      { wrapper }
    );
    await flush();
    expect(fake.tools.has("cart_checkout")).toBe(true);
  });

  it("marks read-only actions in annotations", async () => {
    renderHook(() =>
      useAgentAction("search", {
        description: "Search",
        readOnly: true,
        execute: () => []
      })
    );
    await flush();
    expect(fake.tools.get("search")!.annotations?.readOnlyHint).toBe(true);
  });
});

describe("useAgentState", () => {
  it("exposes live values through one get_page_state tool", async () => {
    const { rerender } = renderHook(({ total }) => useAgentState("cart.total", total), {
      initialProps: { total: 10 }
    });
    await flush();
    expect(fake.tools.has("get_page_state")).toBe(true);

    let result = await fake.call("get_page_state");
    expect(JSON.parse(result.content[0]!.text)).toEqual({ "cart.total": 10 });

    rerender({ total: 25 });
    result = await fake.call("get_page_state");
    expect(JSON.parse(result.content[0]!.text)).toEqual({ "cart.total": 25 });
  });

  it("unregisters the tool when the last slice unmounts", async () => {
    const { unmount } = renderHook(() => useAgentState("a", 1));
    await flush();
    expect(fake.tools.has("get_page_state")).toBe(true);
    unmount();
    expect(fake.tools.has("get_page_state")).toBe(false);
  });

  it("scopes keys inside an AgentBoundary", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AgentBoundary name="cart">{children}</AgentBoundary>
    );
    renderHook(() => useAgentState("items", ["a"]), { wrapper });
    await flush();
    const result = await fake.call("get_page_state");
    expect(JSON.parse(result.content[0]!.text)).toEqual({ "cart.items": ["a"] });
  });
});
