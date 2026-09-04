/**
 * Plumbing check, no LLM and no API key: loads a demo page with the host
 * shim, lists the tools it registers, walks a real task through them, and
 * verifies the page rendered the outcome. If this passes, the only untested
 * piece is the model.
 *
 * Usage: node scripts/smoke.mjs <url> [salon|catalog]
 * Mode defaults to catalog when the URL contains "catalog", otherwise salon.
 */
import { chromium } from "playwright";
import { HOST_SHIM } from "../dist/index.js";

const url = process.argv[2] ?? "http://localhost:4173/demo/";
const mode = process.argv[3] ?? (url.includes("catalog") ? "catalog" : "salon");
const MIN_TOOLS = { salon: 5, catalog: 6 };

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  await context.addInitScript(HOST_SHIM);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.__agentperf?.listTools().length > 0, undefined, {
    timeout: 15000
  });

  const tools = await page.evaluate(() => window.__agentperf.listTools().map((t) => t.name));
  console.log(`[${mode}] tools live:`, tools.join(", "));
  if (tools.length < MIN_TOOLS[mode]) {
    throw new Error(`expected at least ${MIN_TOOLS[mode]} tools, got ${tools.length}`);
  }

  const call = (name, args) =>
    page.evaluate(([n, a]) => window.__agentperf.call(n, a), [name, args]);

  const state = await call("get_page_state", {});
  console.log("get_page_state:", state.content[0].text.slice(0, 120) + "…");

  if (mode === "salon") {
    const slots = await call("list_open_slots", { serviceId: "beard" });
    const first = JSON.parse(slots.content[0].text)[0];
    console.log("first open beard slot:", first.slotId);

    const refused = await call("book_slot", {
      serviceId: "beard",
      slotId: first.slotId,
      name: "Dana",
      email: "not-an-email"
    });
    if (!refused.isError || !refused.content[0].text.includes("REFUSED")) {
      throw new Error("schema gate did not refuse a bad email");
    }
    console.log("bad email → structured refusal ✓");

    const booked = await call("book_slot", {
      serviceId: "beard",
      slotId: first.slotId,
      name: "Dana Smith",
      email: "dana@example.com"
    });
    if (booked.isError) throw new Error("booking failed: " + booked.content[0].text);
    console.log("booked:", booked.content[0].text);

    const text = await page.evaluate(() => document.body.innerText);
    if (!/FR-[A-Z0-9]{5}/.test(text)) throw new Error("confirmation code not visible on the page");
  } else {
    // The heavy page, running the same task the benchmark measures — minus the model.
    const found = await call("search_products", {
      query: "wireless",
      category: "keyboards",
      minRating: 4.5,
      inStockOnly: true,
      sortBy: "price"
    });
    const cheapest = JSON.parse(found.content[0].text).products[0];
    console.log("cheapest qualifying:", cheapest.name, "$" + cheapest.price);
    if (cheapest.id !== "kb-nimbus-air75") {
      throw new Error(`expected kb-nimbus-air75 to be cheapest qualifying, got ${cheapest.id}`);
    }

    const refused = await call("place_order", { name: "Dana", email: "not-an-email" });
    if (!refused.isError || !refused.content[0].text.includes("REFUSED")) {
      throw new Error("schema gate did not refuse a bad email");
    }
    console.log("bad email → structured refusal ✓");

    const added = await call("add_to_cart", { productId: cheapest.id, quantity: 1 });
    if (added.isError) throw new Error("add_to_cart failed: " + added.content[0].text);

    const ordered = await call("place_order", { name: "Dana Smith", email: "dana@example.com" });
    if (ordered.isError) throw new Error("place_order failed: " + ordered.content[0].text);
    console.log("ordered:", ordered.content[0].text);

    const text = await page.evaluate(() => document.body.innerText);
    if (!/NW-[A-Z0-9]{5}/.test(text)) throw new Error("order number not visible on the page");
  }

  console.log(`[${mode}] page shows the outcome ✓ — smoke test passed`);
} finally {
  await browser.close();
}
