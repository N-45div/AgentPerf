# AgentPerf report — booking

- **URL:** http://localhost:4173/
- **Model:** gpt-5.6-luna
- **Task:** You are on the booking page of the Fringe & Co. salon. Book the 'Beard trim' service for Dana Smith (dana@example.com): pick any open slot on the earliest available day, complete the booking, and report the confirmation code the page shows.
- **Started:** 2026-08-31T09:06:09.870Z

| lane | success | median wall-clock | median tokens | median round-trips |
|------|---------|-------------------|---------------|--------------------|
| dom | 100% (3/3) | 14.2s | 10,046 | 8 |
| tools | 100% (3/3) | 5.5s | 4,240 | 4 |

**DOM lane pays 2.4x the tokens and 2.6x the wall-clock of the tools lane** (medians; failed runs included in success rate, excluded from nothing).

## Runs

| lane | # | success | wall-clock | tokens | round-trips | actions | failure |
|------|---|---------|------------|--------|-------------|---------|---------|
| dom | 1 | ✓ | 14.7s | 10,048 | 8 | 9 |  |
| dom | 2 | ✓ | 11.8s | 10,044 | 8 | 9 |  |
| dom | 3 | ✓ | 14.2s | 10,046 | 8 | 9 |  |
| tools | 1 | ✓ | 6.1s | 4,240 | 4 | 3 |  |
| tools | 2 | ✓ | 5.5s | 4,240 | 4 | 3 |  |
| tools | 3 | ✓ | 5.5s | 4,237 | 4 | 3 |  |
