# AgentPerf report — booking

- **URL:** http://localhost:4173/demo/
- **Model:** gpt-5.6-luna
- **Task:** You are on the booking page of the Fringe & Co. salon. Book the 'Beard trim' service for Dana Smith (dana@example.com): pick any open slot on the earliest available day, complete the booking, and report the confirmation code the page shows.
- **Started:** 2026-09-01T04:01:35.275Z

| lane | success | median wall-clock | mean wall-clock | median tokens | mean tokens | round-trips |
|------|---------|-------------------|-----------------|---------------|-------------|-------------|
| dom | 100% (5/5) | 7.5s | 7.9s | 10,079 | 10,079 | 5 |
| tools | 100% (5/5) | 5.0s | 5.0s | 4,268 | 4,268 | 4 |

**DOM vs tools — tokens 2.36x (median) / 2.36x (mean); wall-clock 1.50x (median) / 1.56x (mean); round-trips 5 vs 4.**

Spread — DOM 5.8s–11.6s, 10,072–10,085 tokens; tools 4.3s–5.5s, 4,266–4,270 tokens.

Central tendencies are over successful runs only; failures are counted in the success rate. Token counts are uncached prompt+completion totals as the API reports them — provider prompt caching may reduce billed cost, and does so unequally across lanes.

## Runs

| lane | # | success | wall-clock | tokens | round-trips | actions | notes |
|------|---|---------|------------|--------|-------------|---------|-------|
| dom | 1 | ✓ | 11.6s | 10,072 | 5 | 6 | claim: Booked Beard trim for Dana Smith on 2026-09-02 at 10:00, the earliest available day. Confi |
| dom | 2 | ✓ | 7.6s | 10,074 | 5 | 6 | claim: Booked Beard trim for Dana Smith at the earliest available slot, 2026-09-02 10:00. Confirm |
| dom | 3 | ✓ | 6.7s | 10,084 | 5 | 6 | claim: Booked Beard trim for Dana Smith (dana@example.com) on the earliest available day, 2026-09 |
| dom | 4 | ✓ | 7.5s | 10,085 | 5 | 6 | claim: Booked the Beard trim for Dana Smith (dana@example.com) on 2026-09-02 at 10:00, the earlie |
| dom | 5 | ✓ | 5.8s | 10,079 | 5 | 6 | claim: Booked the Beard trim service for Dana Smith at the earliest available slot, 2026-09-02 10 |
| tools | 1 | ✓ | 5.5s | 4,268 | 4 | 3 | claim: Booked Beard trim for Dana Smith on the earliest available day, September 2, 2026 at 10:00 |
| tools | 2 | ✓ | 5.0s | 4,266 | 4 | 3 | claim: Booked Beard trim for Dana Smith on 2026-09-02 at 10:00, the earliest available day. Confi |
| tools | 3 | ✓ | 4.3s | 4,270 | 4 | 3 | claim: Booked Beard trim for Dana Smith on the earliest available day, September 2, 2026 at 10:00 |
| tools | 4 | ✓ | 5.3s | 4,268 | 4 | 3 | claim: Booked Beard trim for Dana Smith at the earliest available slot, September 2, 2026 at 10:0 |
| tools | 5 | ✓ | 5.0s | 4,268 | 4 | 3 | claim: Booked Beard trim for Dana Smith on 2026-09-02 at 10:00, the earliest available day. Confi |
