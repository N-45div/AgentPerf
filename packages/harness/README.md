# agentperf (benchmark harness)

Lands Day 3. Runs the same task against the same app two ways — an agent
driving the DOM through the accessibility tree vs. the same agent calling
WebMCP tools — and reports wall-clock, tokens, round-trips, and success rate
over N runs. Failed runs are reported, not discarded.
