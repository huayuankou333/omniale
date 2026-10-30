# EnsembleLab v2 — evidence notebook

## Scope and provenance

This is a best-estimate plan, not a ground-truth transcription. Native audio hearing was unavailable. Observations came from the supplied coarse two-second overview, four initial exact video frames (1, 28, 55, 82 s), and returned read-only evidence E01–E12. No source identities, annotations, score, MIDI, or pretrained instrument classifier were used. No execution or product tests were run.

Audio evidence uses a deterministic YIN-like estimate at 24 kHz: 2,048-sample windows, 10 ms hop, 60–1,000 Hz pitch search, median smoothing, and energy/periodicity gating. It can miss quiet notes, fragment vibrato, merge repeated pitches, or choose an octave. Its reported boundaries are estimates, not exact note truth. Video is 10 fps; bow motion can be preparation rather than sound. Confidence in the violin-to-stem distinction is lower than confidence in the visual clothing selectors.

## Evidence register

| ID | Returned observation |
|---|---|
| E01 | Audio a,d, 16–24 s |
| E02 | Audio a,d, 52–60 s |
| E03 | Audio c,e, 51–59 s |
| E04 | Audio a,d, 35–43 s |
| E05 | Video slots 1,2,4,5 at 53.0, 53.6, 54.2, 54.8, 55.3, 55.9, 56.5, 57.0 s |
| E06 | Video slots 2,4 at 37.0, 37.8, 38.6, 39.4, 40.2, 41.0 s |
| E07 | Audio e, 0–8 s |
| E08 | Audio e, 8–16 s |
| E09 | Audio e, 16–23 s |
| E10 | Audio d, 59.5–62.5 s |
| E11 | Audio c, 53–56 s |
| E12 | Video slots 2,4 at 39.0, 39.3, 39.6, 39.9, 40.2, 40.5, 40.8, 41.1 s |

All evidence references in analysis.json are subintervals of these returned observations. Video references describe ranges containing returned frame times, not claims of continuous observation. The frame files themselves are reference evidence, not additional product assets.

## Binding the players

| Stem | Slot | Instrument / visual selector | Basis and uncertainty |
|---|---:|---|---|
| a | 2 | Violin, glasses and light jacket | One of the two high-register stems a,d. The staggered return comparison in E04/E06/E12 is the main discriminator. Estimated earlier return assigned to this player. Moderate confidence: still frames and preparation movements make this binding less secure than the instrument family. |
| b | 3 | Cello, striped top | The visible cello is unmistakable; b has the uniquely persistent bass register in the overview, with medians reaching MIDI 36–48. High confidence, though no detailed b window was requested. |
| c | 1 | Viola, pale gray long-sleeved shirt | Middle-register moving stem c continues through the 54–56 s passage while the violin pair and red-shirt player rest. E03/E11 show the moving line and E05 shows this player's changing bow action. Moderate-high confidence. |
| d | 4 | Violin, light printed T-shirt, no glasses | Complementary violin binding to a. E04/E06/E12 compare the staggered return; E02/E05 link the shared later rest/return. Moderate confidence. |
| e | 5 | Viola, red polo | Middle/lower register; long gap around 53.38–57.44 s matches the red player's stationary lowered bow in E05. The other viola c moves. Moderate-high confidence. |

Clothing identifies visual slots, not anonymous files. Instruments are not assigned from conventional seating or filename order. The audio median alone does not distinguish a violin from a viola: the correspondence also uses the selective rests and visible action.

## q1 — second viola handoff

**Submitted loop: 53.87–57.44 s. Target c / slot 1.**

E07–E08 find red-stem e's earlier internal gaps near 3.38–5.9, 8.92–11.54, and 12.56–15.1 s, all below 3.5 seconds. Leading silence is excluded. E09 finds a longer internal gap from approximately 18.11 to 21.85 s, about 3.74 seconds. The coarse overview does not indicate another qualifying e gap between this and the later passage: the gap around 36–38 s is shorter. E03 then finds e's release at 53.38 and its return at 57.44, about 4.06 seconds: the estimated second qualifying rest.

Within that second rest, c's first estimated attack is 53.87 s (MIDI 57), then 59 near 54.22, 60 near 54.35, 62 near 54.72, and 64 near 54.97. E11 confirms the same local signal estimates. This is a moving phrase, not silence or a sustained note. E05 shows slot 1 continuing bow action while slot 5 lowers its bow and waits. End at e's returning attack, not at a convenient bar boundary.

The e estimate changes from MIDI 69 at 57.44 to 57 at 57.52: this is treated as an octave-error fragment of one attack, not two notes. The c attack may be slightly earlier than its first reliable voiced estimate. The rest count uses the coarse overview outside the detailed windows and is consequently less certain than the local boundary estimates.

Mix: a1, b1, c0, d1, e1; master 0.8.

## q2 — printed-shirt violin return

**Submitted loop: 56.18–60.17 s. Target d / slot 4.**

The first estimated qualifying internal rest for d whose return is in the second half is 53.68–56.18 s, approximately 2.50 seconds (E02). Before this, d remains active through the second-half lead-in. E05 shows the printed-shirt violinist stop, wait, and bow again by 56.5 s. Both violins have very similar returns here, so the discriminating a/d mapping comes primarily from the staggered comparison, not this shared event.

Four consecutive musical notes are estimated as:

1. D5 / MIDI 74, 56.18–56.79 s;
2. E5 / 76, 56.80–57.14 s;
3. D5 / 74, quiet estimate 57.20–57.31 s, with weak voicing later;
4. D5 / 74, 59.84–60.17 s (E10).

The fourth note is **not** a fabricated split of the first three. A real intervening rest is retained inside the loop. The next note changes to C5 near 60.20. This interpretation is uncertain because the third release is weak and the preceding rest sits directly on the requested 2.5-second threshold. The submitted end is the fourth release, not the next attack.

Mix: a0, b0.6, c0, d0.6, e0; master 0.7.

## q3 — staggered violin return

**Submitted loop: 39.12–41.30 s. Target a / slot 2, the EARLIER violin.**

E01 rules out the prominent earlier shared rest: a releases around 17.73, d around 18.02; both return near 20.65. The shared silence is long enough but the stagger is only about 0.02 seconds, not 0.7. The next short gap around 22–24 s does not provide a qualifying stagger in the overview.

In E04, a finishes around 36.28 and d around 36.62. Neither has a detected note until a at 39.12. Shared silence is therefore approximately 2.50 seconds. The later d return is 40.44, giving a 1.32-second stagger. E06/E12 show the waiting and subsequent bow gestures of the two players; this is the selective passage used to estimate a = glasses/light jacket and d = printed T-shirt. Bow preparation is the main source of mapping uncertainty.

The later d notes are D5 40.44–40.72, E5 40.71–41.02, F5 41.00–41.30. Tiny apparent overlaps reflect analysis-window smoothing, not extra notes. End at the third release, 41.30. The earlier a returns around G4, then A-flat4 and G4; its target is removed, not the later violin.

Mix: a0, b0.8, c0.7, d0.5, e0.3; master 0.75.

## Product implementation

The app fetches and renders analysis.json; the cards apply those exact submitted fields. The only audio sources are the five supplied WAVs. Each decoded mono stem has its own GainNode, followed by one master GainNode and the output. There is no normalization, panning, compressor, synthesizer, or duplicate reference mix.

AudioContext creation/resume and playback are initiated by Play or a rehearsal button. All five AudioBufferSourceNodes start against the same WebAudio clock. Native buffer loop points provide sample-aligned repeated audio. A shared clock drives the seek display and corrects the muted video's drift. Pause, seek, and loop edits recreate the disposable source nodes at a shared offset; gain edits do not recreate sources. Seeking outside an enabled loop disables that loop so the ordinary seek remains usable. Each rehearsal click completely replaces gains, master, loop bounds, enabled state, position, and target selection. Reset restores all five gains to 1, master to 0.8, no loop, position zero, and no selected target.

## Source credit

University of Rochester Multi-Modal Music Performance (URMP) dataset; Li et al., *Creating a Multitrack Classical Music Performance Dataset for Multimodal Music Analysis: Challenges, Insights, and Applications*. The dataset authors recorded performers separately and synchronized/composited them. This task supplies a cropped, reordered 90-second derivative. Original performer identities and source piece names are not inferred here.
