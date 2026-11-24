# 数据来源与处理

EPIC-KITCHENS-100 original recordings: D. Damen et al., Rescaling Egocentric Vision, IJCV 2022, 130:33–55.

Dataset: https://epic-kitchens.github.io/

License: CC BY-NC 4.0, https://creativecommons.org/licenses/by-nc/4.0/

Compressed continuous excerpts repacked by lightly-ai/epic-kitchens-100-clips. Source and extraction script: https://huggingface.co/datasets/lightly-ai/epic-kitchens-100-clips .

Delivery mirror used: hf-mirror.com. This is an access mirror, not a claim of original authorship.

Organizer modifications: resampled video to 25fps, decoded existing AAC to 48kHz PCM24, truncated only the sub-frame end, extracted and marked reference stills. No denoising, source separation, injected event, audio replacement, pitch change or montage. PCM container does not restore information lost in source AAC.

Each supplied scene is one continuous excerpt from one original recording. Distinct scenes are independent.

A: https://huggingface.co/datasets/lightly-ai/epic-kitchens-100-clips/resolve/main/clips/P35/P35_103_16.mp4; source SHA256 4de3194c3b07e13d7ebd98543b46111cf50d8ca75450b3412305e27707ca356e

B: https://huggingface.co/datasets/lightly-ai/epic-kitchens-100-clips/resolve/main/clips/P03/P03_101_127.mp4; source SHA256 7a8d412544407f34a9282cd60d439432f04d9068dbd225c248de4ffe302ff3cd

EPIC-SOUNDS（Huh et al., TPAMI 2025）仅用于组织者侧声音候选检索，不提供其声音类别、时间标注或原动作说明。镜像动作裁切不等于本题事件切分；题目仍须从原始音频判断碰撞／摩擦。
