# Engineering source policy

## Robot and gripper

- Robot: Universal Robots UR5e, from `UniversalRobots/Universal_Robots_ROS2_Description`, revision `0eb1a861f7772fceb38510d90fa2f98ec668070c`. Preserve the original nominal kinematics, inertial parameters, joint limits, collision meshes and visual meshes. This repository's UR5e content is covered by BSD-3-Clause; retain its notices. The supplied nominal description is not a particular robot's factory calibration.
- Gripper: Robotiq 2F-85 from `google-deepmind/mujoco_menagerie`, revision `370c43965323c0944b433b202aac5058b5f907a9`, derived from ROS-Industrial Robotiq descriptions, BSD-2-Clause. Preserve the derivation notes. Upstream pad friction and contact settings are simulation parameters, not independently measured material properties.
- Menagerie's UR5e model is retained for the source audit only. Its handcrafted collision geometry and differing nominal dimensions cannot serve as an independent millimetre-accuracy reference.

## Automotive components

Amphenol Industrial supplies original STEP and customer drawings for AT04-2P, AT06-2S, AT04-6P and AT06-6S. Download from their official product pages; record the discovered file URLs and SHA-256. Preserve original dimensions and named source coordinate frames. The customer drawings state that dimensions are for reference and subject to manufacturing variation. No reproduction right should be inferred from public download availability. The source release contains retrieval metadata and conversion code; supplier originals remain separately provisioned inputs.

AT04 parts are described on the drawings as pin receptacles; AT06 parts as socket plugs. Identify components by full part number and mating datum rather than ambiguous male/female or plug/receptacle shorthand from secondary documents.

The source CAD models are nominal product geometry. They do not supply calibrated latch stiffness, seal friction, conductor properties, material damage limits, batch tolerances or assembled electrical resistance. Explicit assumptions must remain visible. A numerical tolerance requested by this task must not be represented as a manufacturer's certified tolerance.

## Manufacturing fixtures

`analogdevicesinc/ag-industrial-dexterity-benchmarks`, revision `5f5a04c185c354b25aa26a430432a22bfa04daf5`, supplies automotive harness panel STEP, printable mounts, BOM and assembly instructions under CC BY-SA 4.0. Resolve Git LFS objects and verify both content hash and length. Retain attribution and applicable share-alike terms for derivatives. These are physical benchmark fixtures with manufacturing files, not factory production CAD. SLE layout changes must be identified as changes.

## Mandatory conversion evidence

1. Validate native CAD units and solids. Check named overall dimensions against supplier drawings; record differences without silently rescaling geometry to make it fit.
2. Record tessellation parameters and measure surface deviation. A requested meshing tolerance alone is not evidence that the resulting collision model meets it.
3. Preserve mating cavities and keyed geometry. A single convex hull around a concave connector is unacceptable. Check valid and deliberately misaligned insertion paths against source CAD independently of the simulation collision representation.
4. Compare robot forward kinematics against the original URDF at independently sampled joint configurations. Preserve documented limits and transformations.
5. Distinguish geometry verification, simulated physical tests and real hardware calibration in the release receipt. An incomplete gate prevents a validated release claim.

## Hardware-facing delivery

A policy intended for commissioning must declare joint order, units, tool and base calibration, payload and TCP, velocity/acceleration/force limits, I/O handshake, collision exclusions, failure handling and recovery. It must use information available from real sensors. Simulator body poses, teleportation, grasp welds and writing assembly success states are not deployment interfaces. Actual machine operation requires a separate commissioning exercise; this case does not claim that it has occurred.
