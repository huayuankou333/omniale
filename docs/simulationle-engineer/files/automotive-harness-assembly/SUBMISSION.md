# Submission and replay protocol

Write all files under `/logs/artifacts`. The final controller runs in an unprivileged process, in a fresh read-only copy of the frozen submission. Its working directory is that copy. `ENGINEERING_DIR` identifies the supplied engineering inputs; `HOME` and `TMPDIR` identify writable scratch space. Only these submission files, public inputs and installed scientific software are available. The laboratory and verifier never import the submitted controller into their own interpreter.

`submission.json` has schema version 2 and these fields:

```json
{
  "schema_version": 2,
  "controller": ["python3", "controller.py"],
  "native_model": "assembly.xml",
  "robot_joint_names": {
    "left": ["l_pan", "l_lift", "l_elbow", "l_w1", "l_w2", "l_w3"],
    "right": ["r_pan", "r_lift", "r_elbow", "r_w1", "r_w2", "r_w3"]
  },
  "robot_tcp_sites": {"left": "l_tcp", "right": "r_tcp"}
}
```

The example names are placeholders. The joint arrays follow the manufacturer's shoulder-pan, shoulder-lift, elbow, wrist-1, wrist-2, wrist-3 order. Supply a loadable native MuJoCo MJCF model, its local dependencies and the correct site/joint identities. The native inspection checks both robots' forward kinematics on independent configurations. It also requires at least twelve revolute joints, eight free joints and fourteen actuators, with physical joint actuation on every declared arm joint. Construct the model from the engineering inputs; no authored starter scene is supplied.

The controller reads one JSON observation per line from stdin and writes exactly one JSON action per line to stdout, flushing each response. Write diagnostics to stderr. The first observation includes the work order; subsequent observations include robot encoders, wrist force/torque, cover encoder, episode phase and any active rework order. There are no connector poses, latch success flags or acceptance results in this channel.

Use the same action schema as the commissioning laboratory. A camera action returns an RGB-D acquisition as the next observation; process it and return the next action. A checkpoint action performs the station's physical inspection and returns the next normal observation. Do not wait for an acceptance flag. A finish action ends the episode. A controller response has a sixty-second deadline, including startup. Each replay has a 14400-second wall deadline, 600 simulated seconds and 24000 responses. There are 160 camera acquisitions per episode. Three serial replays have a separate 45000-second verifier ceiling. These replay limits are separate from the 7200-second, 500-decision development budget.

Also include:

- `assembly_plan.json`: `parts` with each of the eight work-order IDs exactly once, `operations` with `part_id` and operation descriptions for all parts, and `inspection_conditions` containing `released`, `retention`, `cover`, `rework`.
- `calibration.json`: `base_frames` and `tool_frames`, each mapping `left` and `right` to rigid 4x4 transforms; `sensor_frames` mapping sensor names to rigid 4x4 transforms; `joint_order` with six names per arm; `uncertainty` with nonnegative `translation_m` and `rotation_rad`; and `method` describing how the nominal transforms and uncertainty were established. Base frames are world-from-base; tool frames are flange-from-TCP; sensor frames are world-from-sensor.
- `deployment.json`: nonempty `hardware_interface`, `payloads`, `limits`, `io_handshake`, `fault_behavior`, `unvalidated_assumptions`, and `hardware_validation`. Limits include `joint_slew_rad_s` at most 0.65 and `mating_force_N` at most 100. `unvalidated_assumptions` is a nonempty list. Set `hardware_validation` to `not_performed` and identify measurements needed before hardware deployment.
- `commissioning.md`: experiments, failures, tested ranges, recovery behavior and remaining physical commissioning work.

Include required dependencies as regular files; symbolic/hard links, devices and sockets are rejected. The submission limit is 200 MB and 2000 files. The native model path must be relative and included. Allowed entry points are `python3`, `python`, `sh` or an included relative executable. Keep native assets relative to the model or within the public engineering inputs.

Each unprivileged worker has 600 CPU seconds, 3 GiB of virtual address space, 64 processes, 64 open files and a 20 MB file-size limit. These apply to the native-model probe and each fresh controller process. The trusted station's physics and video rendering use separate verifier resources.

The verifier freezes and hashes the submission, inspects documentation/native artifacts, then replays the controller in three fresh stations. It generates the physics trace, inspections and reward itself. Candidate logs, videos, claimed scores and synthetic success fields provide no acceptance evidence.
