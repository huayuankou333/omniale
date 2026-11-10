# Public mounting and execution contract (round public-contract-v2)

These requirements supplement the original task and are visible to every model from the first request. Use them to make the submitted artifact compatible with the fixed fixture and the actual Python executor. Design the gear geometry yourself.

## Fixed mounting fixture

All three shaft radii are 2.2 mm (diameter 4.4 mm). Model only the four gears; do not add shafts or housing.

| Shaft | Axis line | Finite mounting span |
|---|---|---|
| Input | global Z through (x,y)=(12,0) | z=20 to 30 mm |
| Compound | global X through (y,z)=(0,18) | x=14 to 42 mm |
| Output | global Y through (x,z)=(40,18) | y=2 to 6 mm |

The spans specify which half-axes can carry gears. An input gear entirely below z=20 or an output gear entirely on negative Y will not be assigned to its intended shaft. The total gear model must still fit the original x=[4,48], y=[-11,11], z=[7,29] mm envelope; the whole shaft need not fit that envelope. Make shaft holes compatible with the 4.4 mm fixture diameter. Compound gears remain separate authored solids but rotate together as one rigid body during the simulation.

The structural classifier infers a gear's axis as its smallest global axis-aligned bounding-box dimension (ties x, then y, then z). On its tessellated vertices, shaft attachment requires axial overlap with [span_min+0.2,span_max-0.2], radial 3rd percentile <=3.15 mm, and radial 97th percentile >=4.0 mm. A component near an axis but with the wrong inferred orientation triggers component_bridges_multiple_axes; the label does not itself prove a Boolean intersection. Exactly one input gear, two compound gears and one output gear are requested. All four must be valid, separate solids with no initial body-body intersection (original numerical rejection threshold >1e-4 mm^3).

## Actual final.py execution rules

Submit only /workspace/final.py, self-contained, assigning the final Build123D object to top-level part. Extra local modules, image files, exported STEP files and reports are not transferred to the verifier. The verifier executes final.py in the restricted namespace below, not as an ordinary imported Python module.

Python: 3.11.15; Build123D: 0.10.0. Allowed import roots: build123d, math, numpy. Other imports, including os, sys, pathlib and itertools, are rejected in final.py. Development scripts run in normal Python and can use other installed libraries, files and Blender. Keep development-only exports and inspections in those scripts.

The only supplied Python builtin names are:
abs, all, any, bool, dict, enumerate, float, int, len, list, max, min, pow, print, range, round, set, str, sum, tuple, zip, __import__.

For example reversed, sorted, open, getattr, isinstance, Exception and __name__ are not supplied by this executor. Use compatible Python constructions in final.py, e.g. values[::-1] instead of reversed(values). NumPy is prebound as np and numpy; math is prebound; Build123D is prebound as build123d and b3d, with its public names exposed. The import hook only allows the roots above and returns importlib.import_module(name), even for from-import syntax; use simple imports and the public checker to verify compatibility.

The original candidate-code execution watchdog is 3600 seconds. The independent verifier has a 7200 second host limit. Your development terminal call limit remains 180 seconds; you can launch longer development work in the background and poll it within your overall budget.

## Public compatibility tool

Before finish, run:
python /opt/simulationle-public/check_submission.py /workspace/final.py

This read-only, inspectable helper uses the original execution restrictions and generic geometry/mounting checks. It reports build errors, solid count, validity, per-solid bounds, inferred shaft assignment, pairwise intersection volumes and the public envelope. It includes no reference model, target geometry, contact simulator, reward or official score. You may invoke it repeatedly within the same development budget. A compatible build and correct static placement do not establish that the gears mesh or transmit motion.

The final independent evaluation still uses the unchanged original scorer and Blender contact simulation. The target remains about -15 rpm output from +30 rpm input. No official scoring feedback is available during development. Use the installed professional tools to develop and inspect your own design.
