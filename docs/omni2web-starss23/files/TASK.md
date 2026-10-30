# RoomSound / A real spatial-audio scene explorer

Build a polished, useful web app for exploring this real 60-second room recording. The input is a synchronized 360-degree video and four-channel first-order Ambisonics audio from STARSS23 (SONY / Tampere University). This is a media-understanding AND web-implementation task. Recover audible events and their locations from the supplied evidence tools. Official annotations are not available to you.

The website itself must make sound, space, video, and time interactive. Do not replace it with a requirements summary or a conventional list of audio players. Do not claim isolated source playback: this is a mixed soundscape, without individual stems.

## Assets and perception

Immutable assets are `/media/scene.mp4` (silent 1920x960 equirectangular video), `/media/scene-foa.wav` (24kHz, PCM16, channels W,Y,Z,X), `/media/scene-mono.wav` (W channel), and `/media/scene-stereo.wav` (fixed yaw0 stereo preview). Video and all audio start together at task time0 and last60s. No autoplay. Use an explicit user gesture to start audio.

You can inspect exact video frames, real ASR, a general pretrained sound classifier's uncertain predictions, and raw signal-derived directional energy. These tools do NOT expose official labels. The gateway cannot accept native audio; this is explicitly a shared-perception-tools-assisted agent task. Cross-check evidence. Tools can misclassify, miss overlap, and confuse reverberation with sound direction.

## Product behavior

1. A panoramic viewport that can rotate horizontally through360 degrees using a yaw slider and dragging. Use an equirectangular crop with horizontal field of view120 degrees and vertical field of view90 degrees, centered at elevation0. This defined projection makes marker placement reproducible. The source panorama center is azimuth0; positive azimuth is LEFT, so source x=(180-azimuth)/360*1920. Panorama seams must wrap cleanly. Use a canvas or equivalent, not a static screenshot. Keep viewport aspect ratio4:3.
2. Actual audio must rotate with yaw. Implement the following simple horizontal FOA stereo decoder using the original four channels, not a panner on mono or the fixed stereo preview. For yaw a in radians, L=0.5*(W-X*sin(a)+Y*cos(a)); R=0.5*(W+X*sin(a)-Y*cos(a)). Z is unused in this horizontal decoder. Apply master volume after decoding. This is a simple stereo spatial preview, not an HRTF binaural simulation.
3. Play/pause, scrubbing, master volume, and a marked segment loop. Audio and video must stay aligned after seeking, pausing/resuming, changing yaw, and looping. Never play the mono/preview audio in parallel with the FOA decode. The slider uses the video clock. Start no audio before the user presses Play.
4. Discover audible events from the recording and create an event timeline. Use the ontology: speech, clapping, telephone, laughter, domestic, footsteps, door, music, instrument, water, bell, knock. Merge the dataset's two speech categories to `speech`; no demographic inference is required. Do not mark a visible actor or object as sounding just because it is visible. Represent simultaneous sound sources independently. At least include every event class you find evidence for; uncertain details should be acknowledged.
5. Show markers for currently audible events, at their current world direction. Markers follow the supplied trajectories, disappear outside their active interval, and hide outside the viewport. Clicking an event in the timeline pauses, seeks to the midpoint of its first interval, and recenters the viewport on that event. Filtering affects both timeline and markers, but must not pretend to separate the mixed audio.
6. A clear professional layout, a usable timeline, readable labels, responsive layout, a concise explanation of controls, source attribution, and an evidence note distinguishing observation from inference.

## Deliverables and stable interface

Work only inside your project. Use local HTML/CSS/JavaScript; no network/CDN dependencies. The server supplies immutable `/media/*` assets and serves your own project files. You may use native WebAudio and canvas. Submit `index.html`, implementation files, `events.json`, and `evidence.md`. Submit once without executing, previewing, testing or revising your product. Independent evaluation happens after your submission and is never returned to you.

`events.json` must be `{ "version":1, "events":[...] }`. Each event has:
`{ "id":"unique-id", "class":"speech", "source":"your-consistent-source-id", "start":1.2, "end":3.4, "trajectory":[{"time":1.2,"azimuth":-45,"elevation":8},{"time":3.4,"azimuth":-30,"elevation":8}] }`.
All times are clip-relative seconds. Use separate events for separated audible intervals. Coordinates are degrees, azimuth[-180,180], elevation[-90,90]. Interpolate direction linearly along the shortest azimuth arc; clamp to the closest trajectory endpoint outside its keyframe range. For stationary sources one keyframe is sufficient. Event activity is start<=t<end. Source IDs are your own stable IDs, not official actor numbers. Do not invent precision you cannot support in evidence.md.

Use these public DOM hooks; styling and surrounding structure are your choice:
- `[data-testid="scene-video"]`: the actual HTMLVideoElement, muted. It may be hidden if a canvas displays it.
- `[data-testid="viewport"]`: the visible4:3 panorama surface and marker container. Its bounding box is the exact viewing rectangle.
- `[data-testid="play"]`: toggles play/pause.
- `[data-testid="seek"]`: range input, seconds0..60, responds to input/change.
- `[data-testid="yaw"]`: range input, degrees-180..180; increasing turns LEFT, responds to input/change.
- `[data-testid="volume"]`: range input0..1, default0.8, responds to input/change.
- `[data-testid="loop-start"]`, `[data-testid="loop-end"]`: number inputs in seconds; `[data-testid="loop"]`: checkbox.
- `[data-testid="filter"]`: select, values `all` and ontology class names present.
- `[data-event-id="ID"][data-role="event"]`: clickable visible timeline entry for each event in events.json.
- `[data-event-id="ID"][data-role="marker"]`: visible marker centered at the projected source position when active and in-view. Its bounding-box center must match the source; put long text in an offset child if needed.

Projection: d=wrap(azimuth-yaw) into[-180,180); visible if abs(d)<60 and abs(elevation)<45. Marker x/width=0.5-d/120, y/height=0.5-elevation/90. Keep clipping and seam behavior consistent. Update immediately when paused and seeking/yaw-changing, not only while playing.

## How this is evaluated

50 points assess your inferred audible event activity, spatial directions and event boundaries against held-out official annotations. 50 points assess the actual rendered app: live panorama motion, marker geometry, event navigation/filtering, transport/loop synchronization, real PCM audio decoding and volume behavior, responsive layout and evidence. A beautiful page with incorrect events cannot receive full marks. Missing data/files are failures, not implicit success.

Browser audio is measured from actual output; controlled audio fixtures may be used to verify the prescribed decoder. A variable claiming "playing" or "yaw" is not evidence of sound. The official annotations, reference solution, decoder fixtures, and other candidates are unavailable. Do not attempt to access them. Use evidence and implement the requested product.


## Single-delivery protocol (overrides iterative workflow)

You are starting with an EMPTY project. You have ONE product-generation and delivery opportunity. Before submission, you may call the read-only video_frames and audio_evidence tools in up to TWO response batches (12 calls total). Independent calls should be batched together. Three initial reference frames are supplied; you may request up to9 additional frames (12 total). No browser, shell, syntax check, draft write or product preview tool is available.

Use submit_project ONCE, providing ALL final text files with full contents. Its first invocation ends your run, even if files are incomplete or incorrect. It is not an incremental write tool. You may submit early. At the latest, after the second evidence batch, your next response must submit the finished project. No product repair, self-test, evaluator feedback or second submission is possible. Write honest evidence notes without claiming you ran tests.
