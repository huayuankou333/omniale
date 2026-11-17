# O5 evaluation and evidence scope

Updated November 17, 2026. Current task documentation is version 0.2.2; the original gpt-6.1-sol development used version 0.2.1 and a two-hour continuous wall-clock ceiling. No extra model calls or controller development were added for the diagnostic.

## Distinct evaluation outcomes

- Original trial: recorded score 0/100; rejected before physical replay because inspection_conditions was an object instead of the verifier-required string array. The old public text did not explicitly state this type.
- Format-normalized preflight: the original native model still fails TCP axes, with an orientation discrepancy of about 90 degrees. It remains an invalid native delivery.
- Physical diagnostic: the unchanged controller was replayed with that native gate bypassed. All three seeds scored 0/100. Each demonstrated four bilateral grasp/lifts and completed none of the four formal acceptance checkpoints.

All three runs stop at Cannot measure left_1 mate; the controller catches its own exception, releases the grippers and finishes. Protocol-level controller_error=null is therefore not evidence of a successful strategy. Seed 902 additionally records a persistent fixture collision. A passing final-state snapshot of right_0 in seeds 0 and 731 is not a released-hold acceptance.

## Diagnostic execution

The original OCI launch failed in kernel cleanup before physical execution and is recorded separately as an infrastructure failure. Successful diagnostics used the identical pinned verifier root filesystem in isolated mount, PID, network, IPC and UTS namespaces with chroot and 4 CPU / 8 GiB cgroup limits. The original replay and scoring code, physical parameters and seeds were unchanged. This is a diagnostic measurement of a finished submission, not a fresh Harbor model trial.

The original main freeze hook exceeded 60 seconds. All 62 collected files match the verifier checkpoint and preserved modification times precede the development cutoff, but prompt termination of every original candidate process was not independently proven.

## Perception qualification

The local observability check reconstructs the last recorded seed-0 pose before the failed camera request, a 0.098-second gap. The original RGB-D response is not preserved. Local MuJoCo rendering omits unavailable transparent collision proxy meshes and executes no dynamics. Sensor-only estimation uses RGB-D and public calibration/marker data; hidden pose is used only for error measurement. Thirty depth-noise realizations on this one pose demonstrate local recoverability and do not establish all-stage observability.

The author reference remains intentionally omitted. Full assembly/rework feasibility, complete-cell convergence and hardware transfer remain unverified. Hardware validation was not performed.
