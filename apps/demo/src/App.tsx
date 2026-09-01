import { useMemo, useState } from "react";
import { AgentSurface } from "./agent-surface";
import { buildSlots, makeCode, SERVICES, type Booking, type Slot } from "./data";

export interface BookingApi {
  /** Returns the confirmation code. Throws with a human-readable reason. */
  book: (serviceId: string, slotId: string, name: string, email: string) => string;
  /** Throws if the code is unknown. */
  cancel: (code: string) => void;
  search: (query: string) => void;
  selectService: (serviceId: string | null) => void;
  selectSlot: (slotId: string | null) => void;
}

export default function App() {
  const [slots, setSlots] = useState<Slot[]>(buildSlots);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmation, setConfirmation] = useState<Booking | null>(null);

  const visibleServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SERVICES;
    return SERVICES.filter(
      (s) => s.name.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q))
    );
  }, [query]);

  const serviceSlots = useMemo(
    () => slots.filter((s) => s.serviceId === serviceId),
    [slots, serviceId]
  );

  const api: BookingApi = {
    book: (svcId, slId, who, mail) => {
      const service = SERVICES.find((s) => s.id === svcId);
      if (!service) throw new Error(`Unknown service "${svcId}". Read get_page_state for valid service ids.`);
      const slot = slots.find((s) => s.id === slId);
      if (!slot) throw new Error(`Unknown slot "${slId}". Use list_open_slots to see what is free.`);
      if (slot.serviceId !== svcId) throw new Error(`Slot "${slId}" belongs to a different service.`);
      if (slot.taken) throw new Error(`Slot ${slot.date} ${slot.time} is already taken. Pick another from list_open_slots.`);
      const booking: Booking = { code: makeCode(), serviceId: svcId, slotId: slId, name: who, email: mail };
      setSlots((prev) => prev.map((s) => (s.id === slId ? { ...s, taken: true } : s)));
      setBookings((prev) => [...prev, booking]);
      setConfirmation(booking);
      setServiceId(svcId);
      setSlotId(null);
      return booking.code;
    },
    cancel: (code) => {
      const booking = bookings.find((b) => b.code === code);
      if (!booking) throw new Error(`No booking with code "${code}" exists on this page.`);
      setBookings((prev) => prev.filter((b) => b.code !== code));
      setSlots((prev) => prev.map((s) => (s.id === booking.slotId ? { ...s, taken: false } : s)));
      if (confirmation?.code === code) setConfirmation(null);
    },
    search: setQuery,
    selectService: (id) => {
      setServiceId(id);
      setSlotId(null);
    },
    selectSlot: setSlotId
  };

  const canSubmit = serviceId !== null && slotId !== null && name.trim() !== "" && email.includes("@");

  return (
    <div className="shell">
      <header>
        <a className="backlink" href="../">← AgentPerf</a>
        <h1>Fringe &amp; Co.</h1>
        <p>Neighborhood salon — book a chair. Humans use the page; agents use the tools.</p>
        <p className="numbers">
          Measured 1 Sep 2026 (n=5, both lanes 100%): an agent booking here through WebMCP
          tools used <strong>2.4x fewer tokens</strong> and finished{" "}
          <strong>1.5x faster</strong> (4,268 vs 10,079 tokens; 4 vs 5 round-trips) than
          driving this same page by DOM. This page is deliberately tiny — its whole
          accessibility tree is 1,010 characters. On the{" "}
          <a href="../catalog/">72-product catalog</a>, the same comparison is{" "}
          <strong>13.8x</strong>.{" "}
          <a
            href="https://github.com/N-45div/AgentPerf/blob/main/benchmarks/2026-09-01-booking-gpt-5.6-luna-fair-dom/report.md"
            target="_blank"
            rel="noreferrer"
          >
            Full report
          </a>
        </p>
      </header>

      <input
        className="search"
        placeholder="Search services (cut, color, beard…)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search services"
      />

      <div className="services">
        {visibleServices.map((s) => (
          <button
            key={s.id}
            className={`card${s.id === serviceId ? " selected" : ""}`}
            onClick={() => api.selectService(s.id === serviceId ? null : s.id)}
          >
            <div className="name">{s.name}</div>
            <div className="meta">{s.minutes} min · ${s.price}</div>
          </button>
        ))}
        {visibleServices.length === 0 && <p className="empty">Nothing matches “{query}”.</p>}
      </div>

      {serviceId && (
        <>
          <h2>Open slots</h2>
          <div className="slots">
            {serviceSlots.map((s) => (
              <button
                key={s.id}
                className={`slot${s.id === slotId ? " selected" : ""}`}
                disabled={s.taken}
                onClick={() => api.selectSlot(s.id === slotId ? null : s.id)}
              >
                <div className="d">{s.date.slice(5)}</div>
                {s.time}
              </button>
            ))}
          </div>

          <form
            className="book"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              api.book(serviceId, slotId!, name.trim(), email.trim());
            }}
          >
            <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
            <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            <button type="submit" disabled={!canSubmit}>Book it</button>
          </form>
        </>
      )}

      {confirmation && (
        <div className="confirm" role="status">
          Booked! Confirmation code <code>{confirmation.code}</code> — show it at the desk.
        </div>
      )}

      {bookings.length > 0 && (
        <>
          <h2>Your bookings</h2>
          <ul className="bookings">
            {bookings.map((b) => {
              const slot = slots.find((s) => s.id === b.slotId);
              const service = SERVICES.find((s) => s.id === b.serviceId);
              return (
                <li key={b.code}>
                  <span>
                    <code>{b.code}</code> — {service?.name} · {slot?.date} {slot?.time} · {b.name}
                  </span>
                  <button onClick={() => api.cancel(b.code)}>Cancel</button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <AgentSurface
        query={query}
        serviceId={serviceId}
        slotId={slotId}
        slots={slots}
        bookings={bookings}
        api={api}
      />
    </div>
  );
}
