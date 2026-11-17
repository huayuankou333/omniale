# O5 local pose observability assessment

This assessment diagnoses one perception subsystem. It neither modifies the task or Sol submission nor constructs an assembly reference policy. It does not replace the recorded evaluation score.

## Evidence and conclusion

The preserved controller selects cameras and marker families together. During the mate stage, `mate_left_1` is evaluated with the hand markers, whereas `rear_left_1`, `rear_back_left_1` and `socket_left_1` are evaluated exclusively with the rear markers. A failed fit does not trigger a robot observation maneuver. The original stderr records successful stage and held estimates for `left_1`, then failed rear-family detections at the mate stage.

In a static reconstruction of the seed-0 pre-insertion state, `mate_left_1` exposes two hand markers, whereas `rear_left_1` exposes all three hand markers and none of the rear markers. Therefore the hard-coded family choice discards useful public camera information. The camera name does not require the image to be interpreted with only that marker family.

For a candidate-observable numerical check, `estimate_from_rgbd.py` receives RGB, depth, the public camera calibration and the public hand-marker coordinates. It detects the three color regions, reconstructs their surfaces, fits sphere centers and solves rigid point registration. Neither segmentation IDs nor simulator truth enter estimation. Simulator truth is used only after estimation to measure the error.

Across 30 independent synthetic depth-noise realizations (standard deviation 0.00001 m), maximum translation error is 0.008979636 mm and maximum orientation error is 0.043410264 degrees. This demonstrates local pose recoverability in the reconstructed state. It is evidence against an intrinsic lack of visual pose information at this stage, and supports a camera/marker-selection weakness in this controller.

## Scope and limits

- The original camera request occurred at t=69.900 s. The last preceding saved state is t=69.802 s: a 0.098 s gap. The original RGB-D response was not preserved in the evidence bundle. This reconstruction is not a bit-identical replay of that response.
- The visible scene and recorded generalized positions come from the independent verifier's scene.xml and trace.jsonl. This check uses MuJoCo 3.5.0 on Windows, with local robot visual assets. Unavailable transparent group-3 connector collision proxy meshes are omitted, since no dynamics are executed and those geometries do not render. The paths and hashes of retained assets and omissions are recorded in visibility-audit.json.
- Segmentation is used exclusively in the author-side visibility count. It is unavailable to the candidate and not used by the RGB-D estimator.
- Noise trials vary depth noise on one fixed recorded pose. They do not sample pose distributions, other seeds, subsequent inspections or the complete assembly workflow.
- The current evidence supports local measurability, not a certification of every task state, real hardware precision, or full-task feasibility.
- Appropriate further task qualification is subsystem observability testing across parts, phases and admissible observation maneuvers. Such qualification does not require a full-score reference policy.

## Files

- `audit.py`: static scene reconstruction and author-side visibility count.
- `visibility-audit.json`: source hash, state timestamp, camera visibility, retained asset hashes and omissions.
- `rear-left1-visible-markers.png`: reconstructed public rear-camera view with detected hand markers annotated.
- `estimate_from_rgbd.py`: isolated sensor-only pose check.
- `rgbd-pose-check.json`: all 30 measured errors.

No model calls, policy development, task edits, acceptance changes or reward updates were performed for this assessment.
