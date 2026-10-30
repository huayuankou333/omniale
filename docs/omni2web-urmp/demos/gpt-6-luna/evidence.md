# EnsembleLab v2 — evidence & inference notes

## Local evidence provenance

The only media used by the app are `/media/ensemble.mp4` and `/media/track-a.wav` through `track-e.wav`; there are no network dependencies. The video is muted, and no audio is started until the play or a rehearsal button is explicitly activated. Analysis used the supplied coarse anonymous 2-second summaries plus read-only tool observations. These observations are estimates, not ground truth: the deterministic pitch/energy helper can omit quiet notes, split sustained notes, merge repeats, and produce octave errors.

Returned evidence calls referenced in `analysis.json`:

- **E01**, audio, tracks a and d, 18–26 s: overlapping high-register candidate runs near 20.6–21.9 and 24.2–25.7 s; supports the high-register violin-pair characterization but not a definitive source-to-person ordering.
- **E05**, audio, c and e, 50–58 s: c has a sequence of changing candidates from approximately 53.9 s into the following seconds; e has sustained activity through about 53.4 s, then a long quiet interval and a clear resumption near 57.5 s. This is the handoff comparison.
- **E06**, audio, a and d, 56–64 s: both stems have long quiet spans around 57.4–59.8 s and then resume together; it helps distinguish an earlier isolated quiet patch from the later stagger used for q3.
- **E07**, audio, a and d, 72–80 s: a resumes around 74.5 s; d's next clear run is around 75.8 s. Also shows the short sequence used for q2 and the later violin's return notes for q3.
- **E08**, video, slots 1, 2, 4 and 5, sampled at 53–57 s: visible violin/viola body and bow action at the same handoff interval. The frame sequence links the active mid-register phrase to the pale-sleeved slot 2 and identifies the conspicuous red polo in slot 5. Slot 3 is omitted in this probe.
- **E09**, video, slots 1, 2 and 4, sampled at 58–62 s: shows both violinists and the light printed-shirt performer in slot 4 continuing after the earlier activity, supporting the visual selector; this is a comparison, not exact note-boundary evidence.

Video panel order is fixed in the submitted silent composite. Visual selectors used: slot 1 is the glasses/light-jacket violinist; slot 2 is the pale long-sleeved viola; slot 3 is the striped-top cellist; slot 4 is the light printed-shirt violinist; slot 5 is the red-polo violist. Anonymous-track bindings in the submitted plan are a→slot 4, b→slot 3, c→slot 2, d→slot 1, e→slot 5. The instruments and associations are best estimates from instrument size/handling, register/range, and time-aligned visual activity, rather than identities emitted by an audio classifier.

## Card reasoning / uncertainty

- **q1**: the red-polo e part's approximate 53.4–57.4 s internal rest and c's continuing moving phrase lead to a loop from c's first candidate attack within the rest (estimated 53.87 s) to e's next attack (57.44 s). c is the target and muted. E05 and the contemporaneous E08 frames support the temporal and visual linkage. The exact phrase attack/release can differ from the candidate detector's fragments.
- **q2**: a is estimated to return in the second half at 74.54 s after a shared quiet interval. Four perceptual note attacks are estimated near 74.54, 75.12, 75.52 and 76.01 s, with the fourth release around 76.43 s. a and the cellist b are retained at 0.6. The candidate sequence can conflate bow changes and note boundaries; E07 is the event evidence, while E08 provides slot-4 appearance context rather than same-time frames.
- **q3**: the earliest plausible shared violin silence window in the later passage is around 72.2–74.5 s. a returns first (about 74.54); d follows around 75.84, a stagger exceeding 0.7 s. The loop begins with the earlier attack and ends at the later violin's third return-note release, estimated around 76.73 s. a is removed, not d. E07 provides both audio tracks and E09 is a nearby visual comparison. Residual low-level energy and uncertain segmentation limit confidence in the silence and third-note boundaries.

## Credit

University of Rochester Multi-Modal Music Performance (URMP) dataset, performance video and synchronized isolated instrumental recordings. The supplied exercise media are a silent reordered-panel derivative and anonymous stem permutation; no original performer names, score, MIDI or ground-truth event labels were available for this analysis.
