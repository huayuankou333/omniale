# Submission and replay protocol

Write all files under `/logs/artifacts`. The final controller runs in an unprivileged process, in a fresh read-only copy of the frozen submission. Its working directory is that copy. `ENGINEERING_DIR` identifies the supplied engineering inputs; `HOME` and `TMPDIR` identify writable scratch space. Only these submission files, public inputs and installed scientific software are available. The laboratory and verifier never import the submitted controller into their own interpreter.

The verifier checks the delivery format and native model before starting physical replay. A format rejection produces an invalid-submission result without physical measurements. All four JSON documents must be JSON objects; required fields must be present and non-null. Use JSON numbers for numeric fields, not strings, booleans, NaN or infinity. Additional descriptive fields are allowed and do not establish acceptance.

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

| Field | Required type and contents |
| --- | --- |
| `schema_version` | Integer `2`. |
| `controller` | Array of 1 to 12 strings, each at most 256 characters; the executable and its arguments. The first string is `python3`, `python`, `sh` or an included executable path starting with `./` and containing no `..` path component. |
| `native_model` | String identifying an included regular MJCF file, relative to the submission root, with no `..` path component. |
| `robot_joint_names` | Object with exactly `left` and `right`; each value is an array of six distinct joint-name strings in the manufacturer's order. Every named joint must exist and have physical actuation. |
| `robot_tcp_sites` | Object with exactly `left` and `right`; each value is the string name of an existing TCP site in the native model. |

The example names are placeholders. The joint arrays follow the manufacturer's shoulder-pan, shoulder-lift, elbow, wrist-1, wrist-2, wrist-3 order. Supply a loadable native MuJoCo MJCF model, its local dependencies and the correct site/joint identities. The native inspection checks both robots' forward kinematics on independent configurations. It also requires at least twelve revolute joints, eight free joints and fourteen actuators, with physical joint actuation on every declared arm joint. Construct the model from the engineering inputs; no authored starter scene is supplied.

The declared TCP sites must represent the supplied Robotiq model's `pinch` frame, including its axes. The station mounts the supplied `base_mount` directly under the UR `tool0` frame with the source model's 0.007 m translation along +Z and no additional rotation. The gripper's `base` contributes a further 0.0038 m along +Z and the source quaternion `[1, 0, 0, -1]` (MuJoCo WXYZ, normalized). The `pinch` site is 0.145 m along that base's +Z and has identity local rotation. Thus tool0-from-TCP translation is `[0, 0, 0.1558]` m and rotation is `[[0, 1, 0], [-1, 0, 0], [0, 0, 1]]`. A site with the right position and different axes does not satisfy this frame contract. Robot base positions are in `fixture/FIXTURE_DRAWING.json`; UR flange/tool0 conventions are in `sources/ur-description/doc/robot_frames.rst`. The verifier probes sixteen independent joint configurations and requires maximum TCP position discrepancy at most 0.0001 m and orientation discrepancy at most 0.001 rad for both arms. These model checks are separate from connector assembly tolerances.

The controller reads one JSON observation per line from stdin and writes exactly one JSON action per line to stdout, flushing each response. Write diagnostics to stderr. The first observation includes the work order; subsequent observations include robot encoders, wrist force/torque, cover encoder, episode phase and any active rework order. There are no connector poses, latch success flags or acceptance results in this channel.

Use the same action schema as the commissioning laboratory. A camera action returns an RGB-D acquisition as the next observation; process it and return the next action. A checkpoint action performs the station's physical inspection and returns the next normal observation. Do not wait for an acceptance flag. A finish action ends the episode. A controller response has a sixty-second deadline, including startup. Each replay has a 14400-second wall deadline, 600 simulated seconds and 24000 responses. There are 160 camera acquisitions per episode. Three serial replays have a separate 45000-second verifier ceiling. These replay limits are separate from the 7200-second, 500-decision development budget.

`assembly_plan.json` must contain:

| Field | Required type and contents |
| --- | --- |
| `parts` | Array of exactly eight objects. Each has an `id` string; the IDs are exactly `left_0`, `left_1`, `left_2`, `left_3`, `right_0`, `right_1`, `right_2`, `right_3`, each once. |
| `operations` | Array of at least eight objects. Each operation identifies its `part_id` and describes its operation. Include operations for all eight IDs. |
| `inspection_conditions` | Array of strings containing all four exact names: `released`, `retention`, `cover`, `rework`. An object with these keys is not accepted. |

The inspection field has this exact structure:

```json
"inspection_conditions": ["released", "retention", "cover", "rework"]
```

This is a field fragment, not a complete submission. Keep detailed phase descriptions in an optional separate object such as `inspection_details`; do not replace the required string array with that object. The phase names declare planned inspections; the verifier establishes whether the physical inspections pass.

`calibration.json` must contain:

| Field | Required type and contents |
| --- | --- |
| `base_frames` | Object with exactly `left` and `right`, each a rigid 4x4 numeric transform, world-from-base. |
| `tool_frames` | Object with exactly `left` and `right`, each a rigid 4x4 numeric transform, flange-from-TCP. |
| `sensor_frames` | Nonempty object mapping sensor names to rigid 4x4 numeric transforms, world-from-sensor. |
| `joint_order` | Object with exactly `left` and `right`; each value is an array of six distinct joint-name strings. |
| `uncertainty` | Object with finite nonnegative numeric `translation_m` and `rotation_rad`. |
| `method` | Nonempty string explaining how the nominal transforms and uncertainty were established. |

Each transform is an array of four rows of four finite numbers. Its last row is `[0, 0, 0, 1]`; its 3x3 rotation is orthogonal and has determinant +1. The verifier checks orthogonality with NumPy `allclose` at `atol=1e-6` and checks determinant error at most `1e-6`. Record the actual frames and uncertainties used by the controller.

`deployment.json` must contain:

| Field | Required type and contents |
| --- | --- |
| `hardware_interface` | Nonempty object describing the proposed driver and command/feedback mapping. |
| `payloads` | Nonempty object describing payload assumptions. |
| `limits` | Nonempty object including finite numeric `joint_slew_rad_s` with `0 < value <= 0.65` and `mating_force_N` with `0 < value <= 100`. |
| `io_handshake` | Nonempty object describing device I/O and sequencing. |
| `fault_behavior` | Nonempty object describing watchdogs, fault handling and recovery. |
| `unvalidated_assumptions` | Nonempty array identifying assumptions and measurements required before hardware deployment. |
| `hardware_validation` | Exact string `"not_performed"`. |

Also include `commissioning.md`, covering experiments, failures, tested ranges, recovery behavior and remaining physical commissioning work.

Include required dependencies as regular files; symbolic/hard links, devices and sockets are rejected. The submission limit is 200 MB and 2000 files. The native model path must be relative and included. Allowed entry points are `python3`, `python`, `sh` or an included relative executable. Keep native assets relative to the model or within the public engineering inputs.

Each unprivileged worker has 600 CPU seconds, 3 GiB of virtual address space, 64 processes, 64 open files and a 20 MB file-size limit. These apply to the native-model probe and each fresh controller process. The trusted station's physics and video rendering use separate verifier resources.

The verifier freezes and hashes the submission, inspects documentation/native artifacts, then replays the controller in three fresh stations. It generates the physics trace, inspections and reward itself. Candidate logs, videos, claimed scores and synthetic success fields provide no acceptance evidence.
