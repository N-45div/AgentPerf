export interface Service {
  id: string;
  name: string;
  minutes: number;
  price: number;
  tags: string[];
}

export interface Slot {
  id: string;
  serviceId: string;
  /** ISO date, local. */
  date: string;
  /** 24h "HH:00". */
  time: string;
  taken: boolean;
}

export interface Booking {
  code: string;
  serviceId: string;
  slotId: string;
  name: string;
  email: string;
}

export const SERVICES: Service[] = [
  { id: "cut", name: "Classic cut", minutes: 30, price: 28, tags: ["hair", "cut"] },
  { id: "cut-wash", name: "Cut & wash", minutes: 45, price: 38, tags: ["hair", "cut", "wash"] },
  { id: "color", name: "Full color", minutes: 90, price: 95, tags: ["hair", "color"] },
  { id: "beard", name: "Beard trim", minutes: 20, price: 18, tags: ["beard", "trim"] },
  { id: "kids", name: "Kids cut (under 12)", minutes: 25, price: 20, tags: ["hair", "cut", "kids"] },
  { id: "style", name: "Event styling", minutes: 60, price: 70, tags: ["hair", "style", "event"] }
];

const HOURS = [10, 11, 12, 14, 15, 16, 17];

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Deterministic pseudo-availability: same slot grid every load. */
export function buildSlots(): Slot[] {
  const slots: Slot[] = [];
  for (const service of SERVICES) {
    for (let day = 1; day <= 3; day++) {
      const date = isoDate(day);
      for (const hour of HOURS) {
        const seed = (service.id.length * 7 + day * 13 + hour * 17) % 5;
        slots.push({
          id: `${service.id}-${date}-${hour}`,
          serviceId: service.id,
          date,
          time: `${String(hour).padStart(2, "0")}:00`,
          taken: seed === 0
        });
      }
    }
  }
  return slots;
}

export function makeCode(): string {
  return "FR-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}
