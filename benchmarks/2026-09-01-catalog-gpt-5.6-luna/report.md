# AgentPerf report — catalog-checkout

- **URL:** http://localhost:4173/catalog/
- **Model:** gpt-5.6-luna
- **Task:** You are on the Northwind Supply catalog page, which sells 72 desk-hardware products. Find the cheapest wireless keyboard that is in stock and rated 4.5 or higher — sold-out products do not count, and wired keyboards do not count. Add exactly one of it to the cart, place the order for Dana Smith (dana@example.com), and report the order number the page shows.
- **Started:** 2026-09-01T04:09:20.865Z

| lane | success | median wall-clock | mean wall-clock | median tokens | mean tokens | round-trips |
|------|---------|-------------------|-----------------|---------------|-------------|-------------|
| dom | 100% (5/5) | 24.3s | 20.1s | 1,02,537 | 1,07,065 | 7 |
| tools | 100% (5/5) | 6.0s | 6.4s | 7,434 | 8,247 | 5 |

**DOM vs tools — tokens 13.79x (median) / 12.98x (mean); wall-clock 4.04x (median) / 3.17x (mean); round-trips 7 vs 5.**

Spread — DOM 10.1s–29.0s, 90,084–1,28,717 tokens; tools 5.5s–7.6s, 7,432–9,468 tokens.

Central tendencies are over successful runs only; failures are counted in the success rate. Token counts are uncached prompt+completion totals as the API reports them — provider prompt caching may reduce billed cost, and does so unequally across lanes.

## Runs

| lane | # | success | wall-clock | tokens | round-trips | actions | notes |
|------|---|---------|------------|--------|-------------|---------|-------|
| dom | 1 | ✓ | 10.1s | 1,02,537 | 7 | 8 | claim: Ordered exactly one Nimbus Air 75 wireless keyboard (in stock, rated 4.6) for Dana Smith a |
| dom | 2 | ✓ | 12.1s | 1,16,571 | 8 | 8 | claim: Ordered exactly one Nimbus Air 75, the cheapest in-stock wireless keyboard rated 4.5+, for |
| dom | 3 | ✓ | 24.3s | 1,28,717 | 9 | 9 | claim: Ordered exactly one Nimbus Air 75 wireless keyboard (in stock, rated 4.6) for Dana Smith a |
| dom | 4 | ✓ | 25.2s | 97,414 | 7 | 7 | claim: Ordered exactly one Nimbus Air 75 wireless keyboard ($89.99), the cheapest in-stock keyboa |
| dom | 5 | ✓ | 29.0s | 90,084 | 6 | 8 | claim: Ordered exactly one Nimbus Air 75 wireless keyboard (the cheapest in-stock keyboard rated  |
| tools | 1 | ✓ | 6.0s | 7,432 | 5 | 4 | claim: Ordered exactly one Nimbus Air 75, the cheapest in-stock wireless keyboard rated 4.5 or hi |
| tools | 2 | ✓ | 6.7s | 9,468 | 6 | 5 | claim: Ordered exactly one Nimbus Air 75, the cheapest in-stock wireless keyboard rated 4.5 or hi |
| tools | 3 | ✓ | 7.6s | 9,466 | 6 | 5 | claim: Ordered exactly one Nimbus Air 75, the cheapest in-stock wireless keyboard rated 4.5+, for |
| tools | 4 | ✓ | 5.5s | 7,434 | 5 | 4 | claim: Ordered exactly one Nimbus Air 75, the cheapest in-stock wireless keyboard rated 4.5+, for |
| tools | 5 | ✓ | 6.0s | 7,434 | 5 | 4 | claim: Ordered exactly one Nimbus Air 75, the cheapest in-stock wireless keyboard rated 4.5+, for |
