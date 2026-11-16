# Independent assembly acceptance

The verifier stops commissioning, freezes and SHA-256 hashes regular submission files, inspects the native model and documentation, then runs three fresh physical stations. The controller has no access to the station model, inspector or prior evidence. The score is the mean over three replays. Candidate logs and claimed completion times are not evidence. Invalid artifacts or controller protocol failures receive zero; evaluator infrastructure failures are reported separately and do not become fabricated model rewards.

| Criterion | Points | Physical evidence |
|---|---:|---|
| Released assembly | 50 | Per-part geometry throughout the five-second released hold, with a previously observed bilateral physical grip and at least 10 mm lift |
| Retention | 10 | Per-part geometry throughout the hold, 0.5 N upward load and post-load release |
| Routing | 10 | All eight released; actual rod centreline crossings, bend radii, segment forces and terminated endpoint errors throughout inspection holds |
| Cover closure | 10 | Per-part geometry, released hold and actual closed cover encoder |
| Selective rework | 10 | Actual disconnect, alternate route, reseat and final hold; cover opened; all other connections preserved |
| Executable delivery | 10 | Valid native/documentation package and all eight connectors accepted after release |

The first, second, fourth and fifth criteria allocate their points across eight connectors. Routing uses the worst inspected fraction of accepted cable routes. Full acceptance requires every part in every phase, all cable routes, cover, rework and executable delivery. An average cannot turn a failed part into a full pass. Persistent excessive mating force, forbidden robot/fixture contact or cover/cable pinch invalidates the physical run.

For each rigid connector, lateral error + 0.12 mm must be at most 0.50 mm; axial error + 0.12 mm at most 0.30 mm; orientation error + 0.001 rad at most one degree. The maximum error of four non-coplanar functional witness points, plus translation and propagated angular uncertainty, must be at most 1.0 mm. Thus commanded poses on the raw tolerance boundary fail the guard band. Datum identity and orientation are checked separately for each of the eight original parts.

Each cable must cross its specified portal plane at x=-0.17 m or +0.17 m, within the part's portal Y interval and z=0.685 to 0.785 m. Normal portals use the corresponding socket Y coordinate with 0.055 m half-width; the selected rework branch uses Y=0.425 m with 0.012 m half-width. Minimum discrete centreline bend radius is 15 mm, maximum segment force magnitude is 20 N for a trunk and 8 N for a branch, and permanently terminated endpoint error is at most 0.30 mm. The discrete rod model and its force interpretation are declared nominal assumptions.

Mating-force monitoring includes the axial components of actual normal and friction contact forces. More than 100 N for 0.08 s is an assumed damage violation. Physical robot contact with the fixture above 20 N for 0.08 s, or aggregate cover/retainer contact with cables above 2 N for 0.08 s, is also a violation. Monitoring samples every 0.02 s. These are task limits, not manufacturer specifications or measured failure loads.

The two free splice envelopes must remain captive in their physical keeper cages. A center more than 12 mm from its nominal X or Y coordinate, or outside world Z=0.697 to 0.731 m, is a junction-escape violation that zeros the physical run. This rejects using a numerical escape from the tooling to obtain an otherwise unreachable route; the declared bounds lie outside the keeper's intended motion clearance.

A score of 100 establishes this nominal simulated contract only. Source CAD and a passing digital strategy do not establish production tolerances, insertion/latch curves, cable constitutive accuracy, robot serial calibration, communications safety or hardware readiness. No electrical-continuity score is inferred from housing alignment. The deployment document must explicitly state that hardware validation was not performed.
