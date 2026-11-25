# Data attribution and modifications

Source: **EasyCom: An Augmented Reality Dataset to Support Algorithms for Easy Communication in Noisy Environments**.

Authors: Jacob Donley, Vladimir Tourbabin, Jung-Suk Lee, Mark Broyles, Hao Jiang, Jie Shen, Maja Pantic, Vamsi Krishna Ithapu, Ravish Mehra (2021).

Official repository: https://github.com/facebookresearch/EasyComDataset

License: Creative Commons Attribution–NonCommercial 4.0 International (CC BY-NC 4.0). The original license text accompanies this package as `LICENSE-EasyCom.txt`. Research/noncommercial use only under that license; this case does not grant commercial media rights.

The recordings were created for research in a restaurant-like environment with naturally overlapping participant conversations and spatial restaurant-noise playback. This is not a recording of a commissioned commercial documentary and not a synthetic summation of independent voice stems.

Modifications: selected complete one-minute Main records; removed the separate participant-ID portrait banner from the left side of the published videos; re-encoded the actual 1920×1080 scene area without changing time or frame order; removed the embedded stereo audio; copied the original six-channel lossless array WAV; extracted channel 5 losslessly into float WAV; marked a single in-scene still to designate the target. Shared array calibration files are unmodified. The candidate package contains no transcription, VAD, near microphone tracks, head/face trajectories or source participant-ID mapping.

Source URLs, release tree SHA, original LFS object SHA256, per-file hashes and the exact record-to-case mapping are retained in the organizer provenance manifest. Neutral filenames do not make this a private or uncontaminated dataset. Downloading the corresponding public near-mic recordings or annotations would leak evaluation references and is excluded by the test-data policy in the task.
