/**
 * The entire agent frontend of this app. Delete this file and Fringe & Co.
 * is a normal human-only React app; keep it and any WebMCP agent gets a
 * fast lane. This file is the diff the README talks about.
 */
import {
  useAgentAction,
  useAgentState,
  webmcpSupported
} from "@agentperf/react";
import { z } from "zod";
import { SERVICES, type Booking, type Slot } from "./data";
import type { BookingApi } from "./App";

interface AgentSurfaceProps {
  query: string;
  serviceId: string | null;
  slotId: string | null;
  slots: Slot[];
  bookings: Booking[];
  api: BookingApi;
}

export function AgentSurface({ query, serviceId, slotId, slots, bookings, api }: AgentSurfaceProps) {
  // --- What agents can read (one token-budgeted get_page_state tool) ---
  useAgentState(
    "services",
    SERVICES.map((s) => ({ id: s.id, name: s.name, minutes: s.minutes, price: s.price }))
  );
  useAgentState("selection", { query, serviceId, slotId });
  useAgentState(
    "bookings",
    bookings.map((b) => ({ code: b.code, serviceId: b.serviceId, slotId: b.slotId }))
  );

  // --- What agents can do ---
  const search = useAgentAction("search_services", {
    description:
      "Filter the service list by a text query (matches names and tags like 'cut', 'color', " +
      "'beard'). The page updates so the person sees what you searched. Returns the matches.",
    input: z.object({ query: z.string().min(1) }),
    readOnly: true,
    execute: ({ query: q }) => {
      api.search(q);
      const matches = SERVICES.filter(
        (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.tags.some((t) => t.includes(q.toLowerCase()))
      );
      return matches.map((s) => ({ id: s.id, name: s.name, price: s.price }));
    }
  });

  const list = useAgentAction("list_open_slots", {
    description:
      "List the free slots for one service over the next three days. Slot ids from here are " +
      "what book_slot accepts. The page navigates to that service so the person follows along.",
    input: z.object({ serviceId: z.string() }),
    readOnly: true,
    execute: ({ serviceId: svcId }) => {
      if (!SERVICES.some((s) => s.id === svcId)) {
        throw new Error(`Unknown service "${svcId}". Call get_page_state for valid service ids.`);
      }
      api.selectService(svcId);
      return slots
        .filter((s) => s.serviceId === svcId && !s.taken)
        .map((s) => ({ slotId: s.id, date: s.date, time: s.time }));
    }
  });

  const book = useAgentAction("book_slot", {
    description:
      "Book one open slot for one service. Requires the person's name and email. Returns a " +
      "confirmation code. Refused when the slot is taken, unknown, or belongs to another service.",
    input: z.object({
      serviceId: z.string(),
      slotId: z.string(),
      name: z.string().min(1),
      email: z.string().email()
    }),
    price: "$0.00", // reserved for x402 settlement — inert today
    execute: ({ serviceId: svcId, slotId: slId, name, email }) => {
      const code = api.book(svcId, slId, name, email);
      return `Booked. Confirmation code: ${code}. The person can see it on the page.`;
    }
  });

  const cancel = useAgentAction("cancel_booking", {
    description:
      "Cancel an existing booking by its confirmation code and free the slot again. " +
      "Only bookings made on this page can be cancelled.",
    input: z.object({ code: z.string() }),
    destructive: true,
    execute: ({ code }) => {
      api.cancel(code);
      return `Booking ${code} cancelled; its slot is open again.`;
    }
  });

  // --- The dock: humans see what agents can see ---
  const supported = webmcpSupported();
  const live = [search, list, book, cancel].filter((t) => t.supported).length + (supported ? 1 : 0);
  return (
    <div className="dock" data-testid="agent-dock">
      {supported ? (
        <>
          <span className="n">{live} tools live</span> — this page speaks WebMCP.
          <div className="hint">Ask your agent: “book me a beard trim tomorrow.”</div>
        </>
      ) : (
        <>
          No WebMCP in this browser.
          <div className="hint">
            Chrome 149+ with chrome://flags/#enable-webmcp-testing, or the ChatGPT browser.
            The page works normally for humans either way.
          </div>
        </>
      )}
    </div>
  );
}
