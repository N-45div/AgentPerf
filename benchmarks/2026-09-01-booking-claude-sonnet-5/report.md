# AgentPerf report — booking

- **URL:** https://agentperf-demo.vercel.app/demo/
- **Model:** anthropic/claude-sonnet-5
- **Task:** You are on the booking page of the Fringe & Co. salon. Book the 'Beard trim' service for Dana Smith (dana@example.com): pick any open slot on the earliest available day, complete the booking, and report the confirmation code the page shows.
- **Started:** 2026-09-01T03:46:28.139Z

| lane | success | median wall-clock | median tokens | median round-trips |
|------|---------|-------------------|---------------|--------------------|
| dom | 100% (3/3) | 25.1s | 21,134 | 8 |
| tools | 100% (3/3) | 16.1s | 8,495 | 4 |

**DOM lane pays 2.5x the tokens and 1.6x the wall-clock of the tools lane** (medians; failed runs included in success rate, excluded from nothing).

## Runs

| lane | # | success | wall-clock | tokens | round-trips | actions | failure |
|------|---|---------|------------|--------|-------------|---------|---------|
| dom | 1 | ✓ | 23.2s | 20,945 | 8 | 9 |  |
| dom | 2 | ✓ | 25.4s | 21,134 | 8 | 9 |  |
| dom | 3 | ✓ | 25.1s | 21,151 | 8 | 9 |  |
| tools | 1 | ✓ | 16.7s | 11,052 | 5 | 3 |  |
| tools | 2 | ✓ | 16.1s | 8,495 | 4 | 3 |  |
| tools | 3 | ✓ | 13.8s | 8,424 | 4 | 3 |  |
