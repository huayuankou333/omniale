# EnsembleLab v2 — investigate, bind performers, build rehearsal cards

Build a complete local rehearsal web app from a REAL90-second URMP excerpt. Five performers were separately recorded and synchronized/composited by the dataset authors. This derivative crops and REORDERS their video panels. Do not assume conventional stage order, first/second-part order, or a correspondence between anonymous WAV filenames and visual slots. No original source names, score, MIDI, ground truth or prior model answers are supplied.

## Media and useful distinctions

`/media/ensemble.mp4`: silent1280×600,10fps,90seconds, five slots numbered1..5. `/media/track-a.wav` through `track-e.wav`: synchronized24kHz PCM16 mono, same task clock, independently permuted. Identify both violinists, both violists and the cellist from evidence. The requests refer to visible clothing/instrument descriptions, not source identities. Distinguish the violinist with glasses and a light jacket from the violinist without glasses in a light printed T-shirt; distinguish the red polo-shirt violist from the other violist in a pale gray long-sleeved shirt. These descriptions are only visual selectors, not track labels. Panels do not change position during this clip.

## Three rehearsal requests

Produce exactly one actionable card for each request, q1,q2,q3. Find the timing and anonymous tracks from evidence; do not use arbitrary convenient snippets. Rest means the gap between the previous note's release and the next note's attack, excluding leading/trailing silence. Tiny gaps between notes are not rests. Use perceptually meaningful note attacks; analyzer fragments are not necessarily new notes. Boundary tolerance is0.4s; arbitrary multi-second loops are not sufficient.

**q1 / Second viola handoff.** Find the red-shirt violist's SECOND internal rest lasting at least3.5seconds. Within that rest the gray-shirt violist continues a moving phrase. Loop from the gray-shirt violist's FIRST note attack inside that rest to the red-shirt violist's next note attack. Remove the gray-shirt violist so I can play that part: its gain0, ALL other tracks1, master0.8.

**q2 / Return of the printed-shirt violin.** In the SECOND HALF of the90-second clip, find the printed-T-shirt violinist's FIRST return after an internal rest of at least2.5seconds. Loop the first FOUR consecutive notes of that return, from first attack through fourth release. Play only that violinist and the cellist at gain0.6 each; all others0, master0.7.

**q3 / Staggered violin return.** Find the FIRST passage where BOTH violinists have been silent together for at least2seconds, then one returns at least0.7seconds earlier than the other. Loop from the earlier violinist's first attack through the later violinist's THIRD note release. Remove the earlier violinist; gain of later violinist0.5, red-shirt violist0.3, gray-shirt violist0.7, cellist0.8; master0.75. Your target is the EARLIER violinist, not the later one.

## Required product behavior

1. Show the actual muted video and five labeled performer cards. Bind each anonymous audio track to its inferred visual slot and instrument. Include a compact timeline showing the three inferred rehearsal intervals and their visual target. A full transcription/piano roll is NOT required.
2. Use a real WebAudio mixer with five independent gains, then a master gain. Start no audio before explicit user gesture. Defaults: all per-track gains1, master0.8. Never synthesize the performance or add a duplicate reference mix, normalization, panning or dynamics.
3. Provide Play/Pause, seek0..90, five gains0..1, master0..1, editable A/B loop. All WAVs and video remain aligned after seek, pause/resume and loop. Changing gain must not reset playback. Clicking a rehearsal card applies THAT CARD's submitted interval and mix, enables looping and begins playback from its start. The target performer's card is visibly selected. Re-selecting another rehearsal replaces the previous rehearsal state completely. Ordinary controls must keep working afterwards.
4. Display short evidence-based reasoning and uncertainty for each card, plus source credit. Make the layout useful on desktop and mobile. Local files only; no external fetch/CDN/dependencies.

## Deliverables and schema

Submit index.html, all local CSS/JS, analysis.json and evidence.md in ONE `submit_project` call. The app must actually load and execute the submitted data; a dormant JSON is insufficient.

`analysis.json` has:
```
{"version":2,"tracks":[{"id":"a","slot":1,"instrument":"violin"},...],
 "cards":[{"id":"q1","title":"...","start":12.3,"end":15.4,"target":"a",
   "gains":{"a":0,"b":1,"c":1,"d":1,"e":1},"master":0.8,
   "reason":"Explain what the audio and visible action support, including uncertainty.",
   "evidence":[{"call":"E01","kind":"audio","track":"a","start":11,"end":17},
               {"call":"E03","kind":"video","slot":1,"start":12,"end":14}]} ,...]}
```
Illustrative numbers/labels ONLY, not answers. Exactly five tracks a..e, integer slots1..5 forming a permutation; instrument violin,viola,cello or unknown. Exactly q1,q2,q3;0<=start<end<=90; gains for all five tracks and master in0..1. Evidence references actual returned evidence-call IDs, never invented ones. For an audio reference the tool must have observed the specified track and interval. For a video reference the slot must have been visible at the returned frame times. A reference should support the selected passage or the discriminating comparison, not merely list unrelated calls. Submit your best estimate even when uncertain.

## Stable DOM interface

- `[data-testid="scene-video"]`: visible actual muted HTMLVideoElement, correct aspect ratio1280/600.
- `[data-testid="play"]`:play/pause button; `seek`:range0..90; `master`:range0..1; `gain-a` through `gain-e`:ranges0..1. Respond to input/change.
- `loop-start`,`loop-end`:number inputs; `loop`:checkbox (visible or usable via associated visible label).
- `rehearse-q1`,`rehearse-q2`,`rehearse-q3`:visible buttons, apply/start the corresponding card as specified.
- `[data-role="performer"][data-slot="1"]` through5:one per video slot; `data-selected="true"` exactly for the active card's inferred target; false otherwise.
- `[data-role="rehearsal"][data-card-id="q1"]` throughq3:card containers. Show inferred start/end, target track and rationale. Keep buttons separate from gain/loop controls.

## Evidence tools and single delivery

Native audio input is unavailable on this gateway. This is TOOL-ASSISTED audiovisual reasoning, not direct hearing. Initial evidence includes four exact video frames and a coarse2-second audio overview for all anonymous stems. The overview and local signal estimates may contain octave errors, missed quiet passages, and merged or fragmented notes. They do not name instruments or performers and never read annotations.

You may perform at most TWO adaptive evidence batches before final submission (at most3 model requests total),12 read-only tool calls,32 video frames TOTAL including4 initial frames, and96 track-seconds of detailed audio analysis. `audio_window` covers at most8seconds for at most2tracks per call; it returns estimated note candidates, pitch/energy/voicing, not truth. `video_probe` returns up to8 exact frames per call over a window at most4seconds, optionally cropped to selected slots. Choose windows that distinguish competing mappings and locate requested attacks/releases; requesting everything is neither available nor needed. Batch independent calls. Do not confuse selecting reference evidence with testing a candidate product.

No browser, shell, code execution, draft writing, candidate preview, self-test, evaluator feedback, or revision tools. The FIRST submit_project call seals every file, even if broken. Do not claim you ran tests. You may submit early; otherwise use the final response to submit. Prioritize a complete working product within20,000 output tokens.

## Scoring frozen before model runs

60points reasoning: mapping/instrument15 (slot2 and instrument1 per track); requested plans36 (start3,end3,target3,correct gain/master assignment3 per card); verified relevant cross-modal evidence9 (audio,video,and temporal linkage1 each per card). Official hidden note boundaries and manually checked visual correspondence define the selected events. Evidence credit measures valid relevant observation provenance, not prose eloquence, and does not substitute for correct answers.

40points execution: media/no-autoplay4; ordinary mixer3; transport3; each rehearsal card8 (applies its OWN submitted bounds/mix/selection and actually loops/sounds correctly); sequence switching/restoration4; responsive layout/source/evidence2. The execution component measures whether the product implements the submitted plan; the reasoning component measures whether that plan answers the requests. Independent browser PCM probes check actual gains and clock alignment. There is no score feedback before sealing.
