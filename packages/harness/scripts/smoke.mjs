/**
 * Plumbing check, no LLM: loads the demo with the host shim, lists the
 * page's tools, walks a booking through them, and verifies the page shows
 * the confirmation. If this passes, the only untested piece is the model.
 * Usage: node scripts/smoke.mjs <url>
 */
import { chromium } from "playwright";
import { HOST_SHIM } from "../dist/index.js";

const url = process.argv[2] ?? "http://localhost:4173/";
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  await context.addInitScript(HOST_SHIM);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.__agentperf?.listTools().length > 0, undefined, { timeout: 15000 });

  const tools = await page.evaluate(() => window.__agentperf.listTools().map((t) => t.name));
  console.log("tools live:", tools.join(", "));
  if (tools.length < 5) throw new Error(`expected 5 tools, got ${tools.length}`);

  const call = (name, args) =>
    page.evaluate(([n, a]) => window.__agentperf.call(n, a), [name, args]);

  const state = await call("get_page_state", {});
  console.log("get_page_state:", state.content[0].text.slice(0, 140) + "…");

  const slots = await call("list_open_slots", { serviceId: "beard" });
  const first = JSON.parse(slots.content[0].text)[0];
  console.log("first open beard slot:", first.slotId);

  const refused = await call("book_slot", { serviceId: "beard", slotId: first.slotId, name: "Dana", email: "not-an-email" });
  if (!refused.isError || !refused.content[0].text.includes("REFUSED")) {
    throw new Error("schema gate did not refuse a bad email");
  }
  console.log("bad email → structured refusal ✓");

  const booked = await call("book_slot", { serviceId: "beard", slotId: first.slotId, name: "Dana Smith", email: "dana@example.com" });
  if (booked.isError) throw new Error("booking failed: " + booked.content[0].text);
  console.log("booked:", booked.content[0].text);

  const text = await page.evaluate(() => document.body.innerText);
  if (!/FR-[A-Z0-9]{5}/.test(text)) throw new Error("confirmation code not visible on the page");
  console.log("page shows the confirmation ✓ — smoke test passed");
} finally {
  await browser.close();
}
