# Executor repair v2

The earlier A3/A4 attempts were aborted as infrastructure-invalid, score=null,
after repeated Docker policy-container startup/teardown timeouts consumed
development turns without native simulations. They are preserved without score.

This version uses the same byte-identical original checker on the Linux host
for pure netlist parsing, and persistent pinned native sandboxes for simulation.
Each native process still has its own 120-second execution timer. Container
startup and Docker transport failures are infrastructure faults, not DUT failures.
All electrical thresholds, fixture models, original gates, submission rules,
score formula and per-valid-trial model budgets are unchanged. The valid trial
starts from a fresh empty source and context; no interrupted candidate is copied.
No reference solution or private verifier is accessible in the agent container.

Native sandboxes also set OMP_THREAD_LIMIT=1 and OMP_WAIT_POLICY=PASSIVE. The pinned system spinit requests eight threads despite OMP_NUM_THREADS=1; the hard thread limit avoids oversubscription under the unchanged two-CPU cap. No electrical options or original source files change.
