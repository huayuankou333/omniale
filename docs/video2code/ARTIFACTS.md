# Artifact interpretation

- `downloads/design-v1.zip` preserves the original design and its `DESIGN_FREEZE.json` without changes. The original design is also retained separately on disk.
- `PILOT_FREEZE.json` records the initial native-image pilot setup.
- `PILOT_AMENDMENT_01.json` replaces only the entries listed there after the gateway was found to ignore output-token caps, before any candidate implementation was produced. All other initial pilot hashes still apply.
- Hard shared budgets in this pilot are 15 logical model turns, 120 tool calls, 256 reference frames and 120 own-page frames. Output-token limits could not be enforced by the gateway and are not claimed equal. Actual usage is retained.
- The aborted GLM attempt was an infrastructure discovery, not a scored candidate. Its trace is retained.
- The rubric itself is byte-identical to the original 100-point / 43-assertion checklist.
- A one-trial pilot is not the originally proposed three-trial calibration study. Full independent reference certification is still outstanding.
