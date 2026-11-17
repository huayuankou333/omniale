# Automotive harness assembly and selective rework

O5 commissions two UR5e arms with Robotiq 2F-85 grippers to assemble two branched automotive harnesses: two six-pin trunks and six two-pin branches. The deployed controller must grasp, lift, insert, release, withstand retention loads, route permanent cables, close a physical cover and selectively disconnect/reroute/reseat one branch while preserving the other seven connections.

This is a declared nominal simulation contract. Manufacturer geometry, authored tooling, assumed constitutive behavior and empirical hardware validation are separate claims. Connector insertion measurements, wire characterization and serial-specific robot calibration are unavailable. EmpiricalHardwareValidation is always zero; simulation success does not establish production readiness.

## Engineering contract

Every connector must meet 0.5 mm lateral, 0.3 mm axial, one degree orientation and 1.0 mm maximum witness error, including 0.12 mm translational and 0.001 rad angular guard bands. Passive latches must recover. Inspections include five-second released holds, a nominal 0.5 N upward retention load, cover closure and selective rework. Actual cable passage, curvature, tension and permanent terminations are checked. Full acceptance requires all eight parts and all phases.

The separate station accepts bounded joint, gripper, cable-retainer, cover and mechanical release-tool commands. Feedback consists of encoders, flange reaction wrenches and rendered RGB-D acquisitions. It exposes no connector poses or acceptance flags. Submitted code runs outside the station. Candidate logs and claimed scores are not acceptance evidence.

## Inputs and runtime

Robot geometry comes from the pinned Universal Robots description; the gripper is the pinned Menagerie derivative. Official Amphenol AT04/AT06 STEP models supply connector geometry. The deployed panel, loading pockets, routing guides, supports, cover and finger push lips are authored tooling. The acquired Industrial Dexterity Benchmarks files are reference material; its panel is not deployed and no vehicle-OEM body CAD is claimed.

Python, MuJoCo 3.5.0, CadQuery/OpenCASCADE, NumPy/SciPy, trimesh and xacro are available. Native contact retains source concave mating surfaces, massive passive seal/latch degrees of freedom, robot/gripper linkage and permanently terminated ball-jointed cable rods. Public nominal assumptions are in environment/public/nominal_physics.json. No ROS 2, Isaac Sim or physical driver deployment is demonstrated.

Large inputs, prepared components, runtime images and validation traces remain in checksum-addressed external archives. The author reference is intentionally omitted. Supplier redistribution permission has not been established. See [SOURCE_POLICY.md](SOURCE_POLICY.md), [assets.json](assets.json) and [authoring/README.md](authoring/README.md).

## Execution and evaluation

Prepare a fresh execution copy using the exact manifest assets and run through Harbor. Candidate resources are 4 CPU and 8 GiB, with 7200 continuous development wall seconds and 500 model decisions, including retry/wait time. The isolated commissioning service has separate declared resources and experiment limits.

Use the task-specific preparer:

```sh
python authoring/prepare_execution.py --assets "$O5_ASSETS" --output "$O5_RUN/task" --load-runtime
```

Generate the Harbor job from host model settings containing `model_name` and `model_config`:

```sh
python authoring/make_job.py --prepared "$O5_RUN/task" --model-settings "$O5_MODEL_SETTINGS" --jobs-dir "$O5_RUN/jobs" --output "$O5_RUN/job.json"
uv run --locked harbor run --config "$O5_RUN/job.json"
```

The generator validates Harbor's job schema and sets the Pi adapter to 500 decisions, both development deadlines to 7200 seconds, one attempt and no whole-trial retry. Model capabilities must match the selected deployment. Credentials stay in the host environment. Task metadata describes the turn budget; the job's Pi argument enforces it. Failed provider requests and context compaction do not add model decisions; their elapsed time remains inside the same development deadline. Record the configuration and controller turn/usage receipt with every trial. See the repository's development guide for the external Pi interface and host-only credential handling.

After candidate work stops, collection hooks terminate candidate processes, freeze/hash their files and close commissioning. The independent verifier validates documentation/native kinematics, then replays the submitted executable in three fresh stations. The public [submission contract](environment/public/SUBMISSION.md) specifies JSON field types, required keys, limits and a phase-array example. A delivery-format rejection stops before physical replay and supplies no evidence of physical assembly performance. Each episode has separate limits of 600 simulated seconds, 14400 verifier wall seconds, 24000 responses and 160 camera acquisitions. The complete verifier ceiling is 45000 seconds. These limits account for native source-surface contact simulation; independent replay does not extend the 7200-second model development budget.

Tests execute the evaluator and write reward.json plus verifier-owned physical traces. Results separate scientific score, artifact validity, infrastructure failure, full acceptance and unperformed hardware validation. Scoring checks the submitted executable against the declared physical and delivery criteria; it does not compare with a reference policy or trajectory. No author reference or full reference qualification is required to evaluate a model submission. Independent model difficulty calibration is a separate experiment.

To evaluate an already finished submission without starting a model trial, use the same prepared task:

```sh
python authoring/evaluate_submission.py --prepared "$O5_RUN/task" --submission "$O5_SUBMISSION" --output "$O5_EVALUATION"
```

This Linux/Docker command checks the prepared source, public inputs, trusted components, runtime and verifier inventories, freezes and hashes the submission, builds a verifier from the pinned runtime and evaluates seeds 0, 731 and 902 in a container with no host mounts or network. Results are in `verifier/report.json` and `verifier/reward.json`; each `verifier/episode-<seed>/` contains the independently generated trace, inspections and video metadata. `EXECUTION.json` records the image, submission hashes, resource limits and exit status. Missing verifier results are reported as infrastructure failures. It makes no model requests. Use it after candidate work has stopped.

The execution archives provide the public inputs, trusted components and runtime. The standard solution directory is an intentionally empty reference placeholder, and no reference archive is included. The standalone evaluator has been exercised with valid zero-action and invalid-submission controls. These checks establish evaluation behavior; complete assembly/rework feasibility and complete-cell numerical convergence remain unverified. The optional full qualification checker in authoring/ verifies a stronger evidence claim and is not a prerequisite for submission evaluation. Reference omission alone establishes neither task impossibility nor failure by any particular model.
