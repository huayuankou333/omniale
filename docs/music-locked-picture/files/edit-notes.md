# 锁画配乐重剪｜照料，而不是征服

## 交付与工程入口

- `long.mp4` / `short.mp4`：80 秒 / 20 秒。原 H.264 画面流直接复制，未重编码、变速、增删帧或叠加任何画面。
- `long-music.wav` / `short-music.wav`：48 kHz、24-bit PCM、立体声，分别恰为 3,840,000 / 960,000 样本；时间零点对齐锁画首帧。
- `project/long.RPP` / `project/short.RPP`：两个独立、可编辑的 REAPER 工程。不是把完成的 WAV 放回工程冒充剪辑。每个乐段仍引用完整录音，有源偏移、淡化、增益、自动化及长版追逐段的原生变速。
- `source-manifest.json`：原始下载 ID、SHA256、许可、完整原件、解码/变调关系，以及逐项使用范围。`evidence/` 保留实际读取的作者曲目页许可摘录、HTTP 元数据、下载链与质检记录。

## 选曲与叙事方向

采用 Scott Buckley 的 **《Childhood》** 和 **《Felicity》**。两首的作者独立曲目页均明确授予 CC BY 4.0，允许署名条件下的商业使用与改编；不是依据搜索摘要判定许可。完整下载原件均在 `project/sources/`。

《Childhood》作者描述为简单的钢琴与弦乐、表现童真。它适合让小龙仍是一个需要照料的生命，而不是危险怪物。以钢琴的重复音型和围绕 E / C♯m / A 的材料贯穿发现、试探和照料；伤口出现时让位给表情，手被接受后才把音乐逐渐打开。第一次相处保留了约 45 秒的连续原乐句发展，不为每次转头、跳跃或伸手另贴一个重音。

《Felicity》作者描述为带曼陀林、提琴、合成器及原录音鼓组的希望感民谣/流行钢琴曲。这里只取末段短乐句与独立的终止和弦，整曲先升三半音，让最后的主和弦落到 E，与前面的钢琴世界连接。原录音中的鼓组是音乐的一部分，没有添加脚步、龙叫、鸡叫、环境声等音效。最后的追逐是“恢复活力后的玩耍”，并不把它升格成英雄战斗高潮；因此节奏变轻快，响度不刻意盖过此前照料关系的情绪峰值。

## 长版：让关系有时间形成

- **0–约 7 秒**：钢琴建立轻微流动，承接屋顶运动，不预告一场大战。
- **约 7–17 秒**：发现小龙、看见伤口。适度下收音量；保留钢琴的脆弱感，不用惊吓重击强调鲜血。
- **约 17–31 秒**：伸手、犹豫、接受接触。音乐持续呼吸，信任形成后才渐渐回暖。
- **31–44.458 秒**：室内照料与微笑。沿用原曲自然发展的弦乐，不在每次抚摸上打点。
- **44.458–约 58 秒**：夜景先转入原曲尾部的 A 悬置和弦衰减，再以较弱的开头钢琴回忆接续；这是配器密度的撤退，不是给同一段音乐简单盖一条全程音量线。
- **约 58–73.167 秒**：恢复蒙太奇引入后段较丰满的弦乐材料，随光线、时间流动和康复逐步回升。
- **73.167–80 秒**：《Felicity》的短上行收束段带出玩耍感；78.480 秒接入专门取出的 E 主和弦，尾音随最后画面淡出，而不是在 80 秒把持续行进的乐句截断。

## 短版：不是长版前 20 秒，也不是机械加速

短版先给了五秒夜景，再回到发现伤口，照料段更短，最后更早出现追逐。因此重新剪成一条独立弧线：

1. 把长版夜景的同一悬置尾句移到 **0 秒**，先给“关系/记忆”的安静问句；不沿用长版开场的运动感。
2. 在 **5 秒**日景出现时才放入熟悉的钢琴主题。约 7.8 秒进入的 C♯m 材料跨过伤口特写，不提前把受伤演成欢庆。
3. **9.9 秒**预叠弦乐，跨入 10 秒的照料空间；跳过长版里漫长的伸手试探，把希望的回答提前。
4. **15.167 秒**重新接《Felicity》的较后半句，按短版的镜头顺序做一个短的释放；此处是原速，不是把长版整段快放。
5. **18.620 秒**便落到与长版相同的 E 终止和弦，留出独立尾音。片末跳跃不再额外贴一次重击，保持轻巧和余韵。

共同身份来自同一钢琴主题、同一夜景悬置和弦、同调的末段材料及同一个终止和弦；两版并非只用了“同类乐器”。

## 可核对的剪辑表

以下单位均为**秒**。源时间从完整 MP3 **无缝解码后的第一个样本**计起，包含原录音的前置静音；不是 MP3 包的 PTS。`Felicity-E-48k.wav` 是完整录音的 +3 半音版本，时轴长度未改变，所以其时间仍对应原曲同一时刻。目标范围包括交叉淡化把手，会有重叠；并非同时持续播放两首完整曲子。

源缩写：**C** = `project/media/Childhood-48k.wav` ← `sources/sb_childhood.mp3`；**F+3** = `project/media/Felicity-E-48k.wav` ← `media/Felicity-48k.wav` ← `sources/sb_felicity.mp3`。

### 长版

| 工程轨道 | 目标范围 | 源 | 源范围 | 播放率 | 淡入 / 淡出 |
|---|---:|:---:|---:|---:|---:|
| 01 | CHILDHOOD - discovery / trust | 0.000000–44.958333 | C | 1.320000–46.278333 | 1.000× | 0.045 / 0.720 |
| 02 | NIGHT - suspended A / room to breathe | 44.458333–50.708333 | C | 123.120000–129.370000 | 1.000× | 0.180 / 1.100 |
| 03 | NIGHT - piano recollection | 49.600000–59.150000 | C | 1.320000–10.870000 | 1.000× | 0.650 / 1.150 |
| 04 | RECOVERY - strings return | 58.000000–73.666667 | C | 98.210000–113.876667 | 1.000× | 0.850 / 0.650 |
| 05 | FELICITY - back on our feet | 73.166667–78.562222 | F+3 | 180.600000–186.670000 | 1.125× | 0.080 / 0.095 |
| 06 | CADENCE - E / final tail | 78.480000–80.000000 | F+3 | 198.580000–200.100000 | 1.000× | 0.012 / 0.750 |

### 短版

| 工程轨道 | 目标范围 | 源 | 源范围 | 播放率 | 淡入 / 淡出 |
|---|---:|:---:|---:|---:|---:|
| 01 | NIGHT - memory before the encounter | 0.000000–5.600000 | C | 123.120000–128.720000 | 1.000× | 0.120 / 0.800 |
| 02 | CHILDHOOD - discovery / wound | 5.000000–10.300000 | C | 1.320000–6.620000 | 1.000× | 0.045 / 0.400 |
| 03 | CARE - strings answer the question | 9.900000–15.620000 | C | 98.210000–103.930000 | 1.000× | 0.320 / 0.500 |
| 04 | FELICITY - playful release | 15.166667–18.716667 | F+3 | 183.160000–186.710000 | 1.000× | 0.080 / 0.120 |
| 05 | CADENCE - E / short signature | 18.620000–20.000000 | F+3 | 198.580000–199.960000 | 1.000× | 0.012 / 0.640 |

精确时间、增益和全部叙事音量节点另见 `project/edit-map.json` 及清单的 `uses`。变速仅作用于长版《Felicity》乐段，1.125×、保持音高；不是画面变速。各拼接先考虑和声与乐句走向，再处理画面转折。末段舍弃原曲原本要继续行进的下一和弦，改接该曲真正的尾部主和弦，形成这两版各自的收束。

## 混音与导出

- 《Childhood》保留原音色，不进行全曲调性/速度处理。
- 《Felicity》的完整录音用高质量 Rubber Band 升三半音并保持时长，再做 48 Hz 高通、280 Hz / Q 0.8 / −1 dB 宽钟形削减、6 kHz 以上 −1.5 dB 高架，减轻低中频拥挤与变调后的亮感。处理是全长音源级别的，不是冻结好的最终混音；原解码版和原 MP3 也完整保留。可选的 `prepare-sources.sh` 写明离线重建配方，工程本身不需运行它。
- 淡化为 REAPER 原生线性淡化。主线、夜间钢琴及恢复段有可编辑的轨道音量自动化；密度变化与自动化共同形成弧线。整体校准为长版 +1.2 dB、短版 +1.6 dB（叠加于各项叙事/素材增益）。
- Master 用随 REAPER 提供的 **ReaLimit**：阈值 −2 dB、上限 −1.5 dB、True peak 开、High quality、释放 15 dB/s。用于安全兜底，留出 AAC 编码余量。无第三方插件、外部采样库、生成音乐或新增音效。
- 最终 WAV **直接由提交的 RPP 渲染**，没有后续另做一次响度归一化。MP4 的 AAC-LC 320 kb/s、48 kHz 立体声音轨直接从对应 WAV 编码，未再混音。AAC 属有损编码，故并非与 PCM 逐字节相同，但来源为同一完成混音。

| 实测项目 | 长版 | 短版 |
|---|---:|---:|
| WAV 积分响度 | −15.94 LUFS | −15.92 LUFS |
| WAV 真峰值 | −1.51 dBTP | −2.16 dBTP |
| MP4 音轨积分响度 | −15.95 LUFS | −15.93 LUFS |
| MP4 音轨真峰值 | −1.50 dBTP | −2.16 dBTP |
| 锁画 / 成片帧数 | 1920 / 1920 | 480 / 480 |

音频测量使用实际文件的 EBU R128 / true-peak 分析；日志只取 `input_*` 数值，`loudnorm` 的模拟处理输出送往 null，**未**用于修改成片。另核对首尾样本、拼接边界、声道、时长与 AAC 时间对齐。数值检测不冒充人工听审。

## 离线打开与重渲染

1. 保持 `project/` 的内部结构完整，打开 `long.RPP` 或 `short.RPP`。参考锁画也在包内，画面轨无 Master send；不要移动或改动画面项。
2. 轨道按功能着色命名；音量包络仍激活，为方便总览隐藏了独立包络行。选轨按 **V** 可显示/编辑音量包络。完整音源可继续改入出点，原件在 `sources/`。
3. `File → Render` 已保存立体声 Master、48 kHz、24-bit WAV、Custom bounds：长版 0–80 秒 / 短版 0–20 秒、无额外尾长。默认相对输出为 `../long-music.wav` / `../short-music.wav`，重渲染会替换交付 WAV，按提示确认覆盖即可。不要用整个工程的尾部自动检测替代这些边界。
4. 可选：从 Actions → ReaScript 加载包内 `render-both.lua`，它按自身所在位置定位两个 RPP 并导出，不依赖当前工作目录。无需网络。
5. 已把工程实际搬到另一个**含空格**的目录，从不同工作目录加载，解析的所有音/视频文件均在搬迁副本内；两版重渲染与交付 WAV **逐样本相同**。工程只需要 REAPER 自带的 ReaLimit。详见 `evidence/verification.json`。

## 署名、许可与再发布说明

以下署名应随交付保留；如上传视频，也请粘贴到视频说明中（尤其是 YouTube）。本次还已写入 MP4 元数据及 RPP 工程备注，不添加任何画面字幕。

> **Music:** 'Childhood' and 'Felicity' by **Scott Buckley** — released under **CC BY 4.0**. www.scottbuckley.com.au  
> Childhood: https://www.scottbuckley.com.au/library/childhood/  
> Felicity: https://www.scottbuckley.com.au/library/felicity/  
> License: https://creativecommons.org/licenses/by/4.0/  
> Changes: music excerpted, re-edited, crossfaded and mixed for these two picture locks; Felicity transposed +3 semitones and EQed; its long-version chase excerpt time-stretched with pitch preserved. No endorsement by the composer is implied.

> **Picture:** **Sintel © Blender Foundation / Durian Open Movie Project**, **CC BY 3.0**.  
> Source and sharing: https://durian.blender.org/sharing/  
> License: https://creativecommons.org/licenses/by/3.0/  
> Prior task adaptation: excerpted, scaled and silenced, with shots rearranged for the short version. This delivery replaces the music only; both supplied picture locks are unchanged. No original film audio/music is used.

许可适用于相应来源材料，遵守其署名及改动说明要求；本交付不为这些 CC 材料增加限制，也不声称作者为本次改编背书。
