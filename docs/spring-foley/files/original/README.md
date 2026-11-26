# Spring — 无音乐拟音 / 24 fps 锁定画面

打开 `final.mp4` 即可看片。可编辑声音工程为 `reaper/session.rpp`（REAPER 7.85，原生 ReaEQ）；请保留目录结构，工程引用 `media/` 中的画面及源录音。蓝色光体以实录水下气泡、掠风和玻璃尾音组合；杏色光体以细火纹理区分。巨兽重量由木材弯屈、低通远雷和地表碎屑承担；悬空的脚不加落地冲击。没有音乐、台词或原片音轨。

`shotcut/project.mlt` 是 1920×804、24p 的 Shotcut 交接工程，五条立体声分轨从首帧开始直接相加，不使用 `mix.wav` 作为附加轨。移动工程时保留相对路径。MLT 视频导出为 H.264 / AAC 48 kHz；容器呈现时长裁去 AAC 最后一包的填充，不重新编码。WAV 是 48 kHz、24 bit、2 声道，每轨 7,200,000 采样帧。首版混音 −20.8 LUFS-I、−1.8 dBTP；五分轨求和与 `mix.wav` 的残差峰值约 −132.5 dBFS（24 位量化）。

## 导演返修

终版仅修改 REAPER 的 AMB 总线音量包络：29.5–30.0 秒淡入衰减，30.0–100.0 秒保持 −4.0 dB，100.0–100.5 秒复位。35.0–95.0 秒实测下降 **4.00 dB**；5.0–25.0 秒和 110.0–145.0 秒的 AMB 与封存首版逐采样相同，四条前景分轨全长也逐采样相同。终版 WAV 和视频音频均测得 **−21.2 LUFS-I、−1.7 dBTP**。详见 `revision_report.json`。

## 来源与已知限制

源片为 **Spring (2019)**，Blender Animation Studio / Blender Foundation，编剧和导演 Andy Goralczyk，CC BY 4.0。参见 `CREDITS.md` 和 `credits/` 中随附的完整原片署名（不拼入锁定片段）。改变：提取原片 220–370 秒、去掉原声、加入本次拟音。

录音作者、许可、原下载预听 MP3 的 SHA-256 和每次用量见 `asset_manifest.json`。`media/*.wav` 来自平台高质量预听压缩编码，不是原始无损录音。幻想生物的材料和动作声音属于画面解释；犬爪部分用加速土石足音拟成，远处步幅和未入画的接触按镜头节奏推定。`cue_sheet.json` 采用片段相对时间；`processing_manifest.json` 记录轨道滤波、路由与自动化，各剪辑的实际设置列在 cue sheet。
