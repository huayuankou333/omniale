# Attribution and modifications

Input recording and original task metadata: NJU-LINK / WebCompass, video-generation instance 78.
Source: https://huggingface.co/datasets/NJU-LINK/WebCompass
Source project: https://github.com/NJU-LINK/WebCompass
The dataset card declares Apache License 2.0. The input MP4 is retained byte-for-byte.

OmniALE adaptation, 2026-10-21: rewritten task boundaries, evidence-anchored checklist, operation scenarios, scoring/validation helpers, and design showcase. These additions are released under Apache License 2.0. The new checklist is not the original WebCompass rubric. Source-video website author and deployed URL are not identified in the supplied dataset metadata; no ownership or affiliation with that website is claimed.

Reference JPEG frames are decoded derivatives of the source recording, with timestamps recorded in evaluator/references/index.json.
This is a public-source derivative development case, not a novel held-out benchmark.
