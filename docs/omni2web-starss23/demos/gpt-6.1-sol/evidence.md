# RoomSound — evidence and implementation notes

## Provenance and method

The assets are the supplied 60-second STARSS23 synchronized room recording, attributed to SONY / Tampere University. No official annotations, actor IDs, stems, reference implementation, or held-out labels were available or consulted.

Read-only evidence collection used three audio-evidence requests covering 0–20, 20–40 and 40–60 seconds. These supplied actual-W-channel faster-whisper base.en ASR, uncertain YAMNet AudioSet predictions (0.96 s windows / 0.48 s stride), and raw FOA active-intensity directions in 0.5-second windows. Audio evidence reported W-signal SHA256 `8c781d2c6d38847ca3f2f08970a8d82edd189c5c974ba8e37ae6366ced0cc890`. I did not directly hear the audio through the gateway; acoustic observations below are observations of these shared perception-tool outputs, not a claim of human audition.

Visual evidence: supplied panoramas at 1, 20 and 40 s; additional full frames at 6, 12, 26, 33, 46, 54 s, then 14, 17 and 23 s. Twelve frames total. The application uses the real video, not those reference images.

## Observation versus inference

### Speech (strong class evidence; approximate boundaries)

ASR gives a coherent conversation about travel, departure, getting water, studies and finding work. YAMNet strongly favors speech through approximately 0–12 s, 23–26 s, 28–36 s, 38–50 s and 55–60 s, with shorter / quieter turns in between. Crucially, the ASR segment `12.74–25.88` is an over-broad question timestamp: classification shows little speech through 13–22 s. The question is therefore placed at 23–25.8 s, not throughout that ASR interval.

The upper-band FOA direction repeatedly clusters near −55° to −60°, with elevation around −15°, during the opening travel statement and later questions. The visible right-side seated position is consistent with this direction. A different turn at 4–8.5 s has upper-band directions near 0° and elevation near −7°, consistent with the central seated position. A third recurring voice direction, roughly +160° to +170° and elevation around −16°, appears in the brief reply near 9 s and longer replies near 28–35 s and 40–51 s. The left edge of the panorama contains a seated position in that general direction. These are local stable source names, not official actor identities, and no demographic attribution is made.

The right-side voice moves toward the sink in the 10–12 s evidence and back toward its seat in the 23–26 s question. Sparse trajectory endpoints combine direction measurements with the sampled visual positions. The short −60° acoustic switch at 33–33.5 s is represented independently from the ongoing left-side speech as a tentative interjection. A reverberant or overlapping signal could also explain it. Turns near 35.5, 36–37, 38–40, 51, 52–54 and 54.5 onward are separated by recurring directional changes rather than treating ASR sentence timestamps as speaker labels.

### Door (strong transient / class evidence)

At 12.5–14 s YAMNet predicts door / sliding door, and at 16.3–17.8 s it strongly predicts drawer, cupboard, sliding door and door. W RMS rises substantially at approximately 13–14 and 16.5–17.5 s. Mid/high-band vectors for these transients point around −125° to −150°. The blue door lies near −138° in the supplied panorama, is open at 14 s and closed by 17 s. Two door events at 13–14.2 and 16.5–17.5 s are therefore a defensible interpretation. The class cannot be established from the images alone, and the classifier's drawer/cupboard alternatives are retained as uncertainty rather than additional invented sources. No separate knock is asserted for the weak knock prediction during the same mechanical transient.

### Water (moderate class evidence; uncertain quiet tail)

Around 14.4–16.3 s YAMNet favors liquid, boiling, sizzle, frying and patter, with only modest scores. Persistent high-band energy near −40° to −50° is spatially consistent with the sink, while frames at 14, 17 and 20 s show activity at the faucet. Together these support a water interpretation, rather than an animal or cooking event. The exact onset and especially offset are not resolved. The 14.1–21.2 s interval includes a quiet tail that the generic classifier often calls silence; this duration is lower-confidence than speech or the door transients. The sink direction is rounded to −38°, elevation −10°, rather than copying reverberant elevation excursions from the intensity tool.

### Footsteps (tentative)

The movement-related acoustic evidence is much weaker: an extremely small clip-clop prediction around 12 s, shuffle / room-noise predictions near 13.5 s, and low-frequency energy / transients during transitions. These coincide with the departing central position and movement to the sink in the 12 s frame. Independent, overlapping moving intervals are provided for the two paths. Return steps at 22.6–25.8 s are the least secure estimate: the 23 and 26 s frames establish motion, but the available acoustic model may miss quiet footfalls and much of the low-level signal may instead be handling or chair noise. These are explicitly tentative, not a claim that every visible step is audible. Paths are coarse interpolations; individual foot contacts are not recovered.

### Laughter (weak evidence)

YAMNet returns chuckle / laughter around 8.2–10.5 s, peaking only around 0.04 for chuckle and 0.024 for laughter. A short possible chuckle at 8.6–9.6 s is included as tentative and independent of speech. Assigning it to the left-side source is low-confidence: the vector during overlap is unstable. It is not a confident isolated laugh detection.

### Classes not asserted

No persuasive evidence supports telephone, clapping, bell, music, instrument, domestic or knock as independent audible events. The scene contains visible instruments, bags, chairs and equipment; they are not marked as sounding solely because visible. Tiny guitar / violin / music probabilities under speech and quiet background are insufficient. Extremely low animal predictions during room transients are not used. Uncertain handling sounds are not expanded into precise domestic intervals. No claim is made that omitted quiet events are impossible.

## Accuracy limits

Times use tenths of seconds for practical navigation, not measured tenth-second certainty. Typical speech and transient boundaries are uncertain by roughly 0.3–0.8 s; quiet movement and water endpoints can be uncertain by several seconds. Seated speech directions are approximately rounded cluster centers; moving paths may be wrong by tens of degrees. Elevations are coarse scene-supported estimates. FOA intensity can mix several sources and reverberation; it is not a source tracker. Source consistency across turns is an inference, not verified speaker diarization. All annotations are observations-plus-inference, not official ground truth.

## Playback / projection implementation

- The visible canvas is a 4:3 linear equirectangular crop: horizontal span 120°, vertical span 90°, elevation center 0°. Source x is `(180 − azimuth) / 360 * videoWidth`. A two-part draw wraps the panorama seam.
- Markers use the exact specified linear projection, shortest-arc azimuth interpolation, endpoint clamping and `start <= t < end`. Out-of-view and filtered markers are hidden. Labels are offset from a centered 22×22 px marker target.
- Original WAV RIFF data is parsed locally as four-channel PCM16 (with float32 support for compatible fixtures), preserving W,Y,Z,X order. It is not passed through a browser stereo downmix or replaced by mono/stereo-preview files.
- An AudioBufferSource feeds a four-channel discrete splitter. Six mono gain paths feed a two-channel merger: W to both ears at 0.5; Y to L/R at ±0.5 cos(yaw); X to L/R at ∓0.5 sin(yaw). Z is unconnected. A single master gain follows the merger. There is no extra normalization, panning, limiter, HRTF or parallel audio element.
- AudioContext creation / resume is gated by Play. Data may prefetch, but there is no autoplay or pre-gesture audio output. The actual video is always muted, with volume zero.
- The video clock drives the seek slider, event activity and loop boundary. Seeking, pausing and waiting stop the buffer source. A new source starts at the video time after playback / seeking resumes; drift beyond 85 ms triggers a restart. Yaw updates decoder gain paths without changing either clock. Segment looping resets the video clock and source together; the audio source also has matching loop bounds to avoid an audio tail outside the marked segment.
- Timeline navigation pauses, seeks to the event midpoint, and faces the interpolated source direction. Filtering only changes annotation visibility. The source cards and directional field likewise offer view navigation, never source isolation.
- All implementation files and UI assets are local. The only media requests are the supplied MP4 and original FOA WAV. Native canvas, WebAudio and browser controls are used without dependencies.

## Delivery protocol

This is the single finished-file submission. No code, syntax checks, browser previews, playback tests or evaluator tests were executed, and no product revision or evaluation feedback was received. The notes document the evidence and intended implementation, not a claim of empirically verified browser behavior.
