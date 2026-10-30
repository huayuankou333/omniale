# RoomSound evidence note

## What is observed in the supplied evidence

The 60-second recording has sustained conversational speech. ASR returns phrases beginning near 0.3 s, 3.7 s, 9.1 s, 10.9 s, 12.7 s, 25.9 s, 30.7 s, 35.7 s, 36.7 s, 37.7 s, 38.7 s, 40.3 s, 51.3 s and 54.3 s; YAMNet independently classifies speech across most active windows. Speech intervals in `events.json` group the likely conversational turns rather than claiming word-level boundaries or speaker identity. There are quiet gaps, notably around 20–22 s and 26–27 s. Overlap and turn boundaries are approximate.

In the opening, frequency-band FOA energy often clusters around azimuth −55° during one voice, then around 0–20° during another. Later, dominant energy changes markedly and sometimes clusters near ±160°. Since the direction tool measures the mixture and reverberation, those later changes cannot confidently establish that a person moved. Source IDs are stable descriptive groupings, not known identities; directions are intentionally coarse estimates. Degrees use the prompt's convention (positive azimuth points left). Elevation is held near −12° for speech as a restrained, approximate horizontal placement rather than a precise measured height.

Between roughly 12.5 and 17.5 s, generic class predictions include door/sliding-door, cupboard/drawer movement, liquid/boiling/patter and other domestic-like labels. This coincides with visible kitchen activity, but the video is not treated as proof of sound: the sound-class evidence motivates the tentative door and water events. The labels and boundaries are uncertain, particularly for water, which may instead be kitchen handling or another transient. Therefore no additional sound classes are asserted. Visibility of instruments or people is not used to infer music, footsteps, laughter, or other unverified activity.

## Interface and audio implementation

The equirectangular video is rendered into a wrapped 120° by 90° crop centered at elevation 0 in a 4:3 canvas. Marker positions follow the supplied azimuth/elevation projection and only appear during each event's active interval and inside the viewport. The four-channel WAV is decoded once through WebAudio; channels are interpreted in the supplied W,Y,Z,X order. A live processor applies the specified horizontal FOA decoder for current yaw, ignores Z, and applies master gain after decoding. The video is muted; no mono or fixed-stereo asset is played. Audio starts only in response to Play. Timeline filtering changes event presentation, not sound.

## Provenance and limits

Media attribution: STARSS23 (SONY / Tampere University), as specified with the recording. The analysis used the provided ASR, generic pretrained sound-class predictions, and signal-derived FOA energy directions, cross-checked against the supplied video frames. These are shared perception aids—not official annotations. No official labels were available or accessed. This app presents a single mixed recording, not isolated stems, and its event locations/timing should be read as exploratory estimates rather than ground truth.