# HANDOFF — 读/唱双模式人声身份复刻（NUS-48E, research-only）

本文件说明可复用转换引擎 `render.py` 的适配方案、通用模型与许可、读/唱处理、重新推理与工程渲染方法、
已经验证的行为，以及仍然存在的差异和风险。**本次工作没有直接听音**：所有关于音色、自然度、伪影和相似度的
陈述都来自计算测量（WORLD/mel 包络、说话人嵌入、GMM 似然、F0 轮廓、能量包络、谱通量）以及真实谱图观察，
不是主观听感 MOS。

English abstract: a CPU-only voice-conversion engine that maps the guide performer's read/sing
recordings onto the target performer's identity. It pairs the official MIT OpenVoice V2 tone-colour
converter (target/source speaker state stored in `state/`) with a fitted, mode-specific mel-envelope
corrector trained on DTW-aligned reference pairs, applied as a smooth, energy-matched STFT gain on the
neural waveform. Timing and pause structure are sample-exact; the F0 contour is preserved (r ≈ 0.96–0.99
after register mapping); identity moves strongly toward the target on two independent measures.

---

## 1. 交付物

| 路径 | 内容 |
|---|---|
| `render.py` | 转换引擎 CLI（`--input --output --mode speech|singing`），只用 CPU |
| `state/` | 适配状态：目标/导引 OpenVoice 说话人嵌入（各 1×256×1）、按模式训练的谱包络校正器（2×87,336 参数）、`config.json` |
| `openvoice/` | 官方 OpenVoice V2 源码的 MIT 许可副本（96 KB，模型权重不在包内，从 `/opt/models` 读取） |
| `audio/<brief_id>.wav` | 11 个公开 brief 的转换结果（24 kHz mono 24-bit PCM） |
| `Voice.RPP` | 真实 REAPER 7.85 工程：11 条独立 track/item，按 brief 顺序，间隔 0.5 s，相对路径 |
| `Voice.wav` | 该工程的完整渲染（48 kHz stereo 24-bit PCM，328.046 s） |
| `session.json` | 每段 `id`、相对 `path`、`start`、`seconds`（+`mode`） |
| `requirements.txt` | CPU 推理依赖与已验证版本 |
| `DATA-LICENSE`, `DATA-SOURCE.txt` | NUS-48E 研究用途许可与出处说明（原样保留） |

包内**没有**复制任何原始 `references/` 或 `guides/` 录音；只保存了由参考录音派生的小型说话人嵌入和回归器。

---

## 2. 适配方案（从原始录音到可复用状态）

### 2.1 参考配对分析
- 6 对参考（3 读 + 3 唱）是同一内容的不同真人表演，时长/音高未对齐。每对用 MFCC(20)+Δ（20 ms 帧移、
  CMVN、余弦距离）做带约束（Sakoe–Chiba ±30%）DTW，再把路径插值到 5 ms 的 WORLD 帧网格上，
  得到导引帧→目标帧的对应关系。对齐结果用于**训练**，不用于推理。
- 目标/导引各 6 段录音的 WORLD 分析（DIO+StoneMask、CheapTrick、D4C，5 ms）用于统计和特征。

### 2.2 目标身份状态
- 用 OpenVoice V2 的 `ref_enc` 对 6 段目标参考（读+唱，共约 8 分钟）分块求嵌入并平均 →
  `state/emb_target.pt`；同样对 6 段导引参考求平均 → `state/emb_source.pt`。
- 只保存嵌入（每个 2.2 KB），不保存参考音频；重新推理不需要 `references/`。

### 2.3 转换主干
- OpenVoice V2 tone-colour converter（`/opt/models/weights/converter/checkpoint.pth`，MIT）：
  输入 22.05 kHz，`tau=0.3`，整段推理（≤45 s）或 45 s 分块 + 0.75 s 等功率交叉淡化（更长片段），
  输出重采样到 24 kHz 并裁剪/补零到输入精确长度。
- 该转换器提供目标音色/声道共鸣/辅音细节的神经重建，同时把导引的音高轮廓映射到目标歌手的音区
  （实测 ×1.74–1.86，轮廓相关 0.96–0.99；见 §4、§8）。

### 2.4 谱包络校正器（本题的“适配”部分）
- 对每个模式单独训练一个小 MLP：43→256→256→40（87,336 参数）。
  - 输入：转换输出（OpenVoice 结果）的 40 维均值归一化 log-mel 包络、相对 log-F0（半音，相对本句中位数）、
    清浊标志、模式标志。
  - 目标：DTW 对齐后的目标真人谱包络（同样均值归一化）。
  - 数据：6 对参考的 OpenVoice 输出 ↔ 目标，共 95,662 帧（约 8 分钟）；Adam，60–70 epochs，MSE。
  - 留一内容交叉验证（用另外两首完全不同的歌训练，预测留出的歌）：
    语音 mel 包络距离相对 OpenVoice 基线改善 25–29%，歌唱改善 6–22%。
- 推理时把预测包络与原包络之差作为**平滑 STFT 增益**（shape-only，扣除每帧均值；限幅 ±2.5 ln ≈ ±10.8 dB；
  35 ms 时间平滑；强度 0.75）施加到 OpenVoice 的复数谱上。这样保留神经波形的相位和细节，只改变共振/倾斜。
- **逐帧能量匹配**：再用参考（导引）STFT 每帧能量对输出做平滑增益，使停顿、换气、重音和动态与导引一致
  （导引/输出 100 ms 能量包络相关 0.945–0.981；未做能量匹配时会降到约 0.55）。
- 不做整段音量归一化以外的母带处理，不添加混响/伴奏；最终电平匹配到输入 RMS（峰值限制 0.99）。

### 2.5 输出
- 24 kHz mono、24-bit PCM，长度与输入逐样本一致（本次 11 个 brief 全部 0.0 ms 误差），
  与导引的波形相关约 0（`read_unseen_01` +0.0018，`sing_unseen_01` +0.0038），不是原样返回。

---

## 3. 通用模型与许可

| 组件 | 版本/位置 | 许可 |
|---|---|---|
| OpenVoice V2 tone-colour converter | `/opt/models/weights/converter/checkpoint.pth` + `config.json` | MIT（`/opt/models/source/LICENSE`，源码副本见 `openvoice/`） |
| PyTorch | 2.5.1+cpu | BSD-3 |
| librosa | 0.11.0 | ISC |
| pyworld | 0.3.5 | MIT |
| soundfile / libsndfile | — | BSD-3 / LGPL |
| numpy / scipy / scikit-learn | — | BSD-3 |
| NUS-48E 素材 | `DATA-LICENSE`, `DATA-SOURCE.txt` | research only；引用见下 |

引用：Zhiyan Duan, Haotian Fang, Bo Li, Khe Chai Sim and Ye Wang. “The NUS Sung and Spoken Lyrics
Corpus: A Quantitative Comparison of Singing and Speech”, APSIPA ASC 2013.
本包仅用于研究复现；`DATA-LICENSE`/`DATA-SOURCE.txt` 随包保留。

---

## 4. 读/唱两种模式的处理

- **模式分离的包络校正器**：`state/ovmap_speech.pt` 与 `state/ovmap_singing.pt`，输入含模式标志；
  两种模式共享同一个目标身份嵌入，保证跨读唱的身份一致（11 个 brief：`cos_target` 0.799–0.831，
  `cos_guide` 0.268–0.386，最差片段 `read_unseen_03` / `sing_unseen_04` 均为 0.799，没有模式性塌陷）。
- **歌唱的持续元音/颤音**：转换器保持时间轴（逐样本），F0 轮廓相关 0.975–0.988；
  `sing_01` 上颤音调制深度（0.5 s 窗 F0 标准差）目标 349 cents、输出 427 cents，调制包络相关 0.85，
  即颤音被保留（略加深），没有被平滑掉。
- **换气/停顿**：逐帧能量匹配后，100 ms 能量包络相关 0.945–0.981；输出长度与导引完全一致。
- **长句/长片段**：≤45 s 整段推理（11 个 brief 都在 25–33 s，均整段处理，无分块接缝）；
  更长输入用 45 s 块 + 0.75 s 等功率交叉淡化。实测 140 s 歌唱参考在 1 核上 108 s 完成，输出长度误差 0 ms。

---

## 5. 重新推理

依赖：`torch`(CPU)、`librosa`、`pyworld`、`soundfile`、`numpy`；通用权重在 `/opt/models`
（若目录不同可用 `OPENVOICE_ROOT=...` 指向含 `weights/converter/checkpoint.pth` 的根）。

```bash
python /workspace/submission/render.py --input INPUT.wav --output OUTPUT.wav --mode speech
python /workspace/submission/render.py --input INPUT.wav --output OUTPUT.wav --mode singing
```

- 输入 24 kHz mono WAV（其他采样率/立体声也会被稳健处理）；输出 24 kHz mono 24-bit PCM，长度一致。
- 选项：`--gain-scale 0.75`（包络校正强度，0–1）、`--threads N`、`--quiet`；默认线程数 = min(4, CPU)。
- 复现状态全部在 `state/`（只读即可用）：`emb_target.pt`、`emb_source.pt`、`ovmap_speech.pt`、
  `ovmap_singing.pt`、`config.json`。
- 实测（1 核，本容器，最终版本）：25–33 s brief 用时 29–47 s，峰值 RSS 1.8–2.1 GB；
  140 s 歌唱 108 s，峰值内存 < 3 GB。4 核应显著更快，满足 240 s/段、8 GB 限制。
- 无网络；不写提交目录；只写 `--output` 指定的文件。`render.py` 会把 numba 缓存重定向到系统临时目录，
  因此即使 HOME/缓存目录只读也能运行（已在只读 HOME 下验证，输出与提交的 brief 逐字节一致）。
- 输出可复现：转换器后验编码器含随机采样，`render.py` 在每次转换前固定随机种子（`state/config.json` 的 `seed`，默认 1234），
  同一输入重复运行得到逐字节相同的 24-bit WAV（已验证）。

---

## 6. REAPER 工程与渲染

- `Voice.RPP` 由原生 REAPER 7.85 生成（`/opt/case-tools/reaper_audio_project.py`）：
  11 条 track、每条一个 item，按 `briefs.json` 顺序，item 间 0.5 s 间隔，`FILE` 为包内相对路径。
- 工程设置：`SAMPLERATE 48000 1`、`RENDER_FMT 0 2 48000`（48 kHz stereo）、24-bit PCM、
  `RENDER_FILE "./Voice.wav"`，范围 0–328.046 s。
- `session.json` 与 RPP 的 `POSITION/LENGTH` 逐项一致（见 §7 验证）。
- **可移动性验证**：把整个提交目录复制到 `/workspace/moved_test/`，删除 `Voice.wav` 后用
  `reaper -renderproject` 重新打开并渲染，得到 48 kHz / 2 ch / PCM_24 / 328.046 s 的 `Voice.wav`，
  路径全部相对，无需修改。
- 重新渲染命令：
  ```bash
  xvfb-run -a reaper -newinst -nosplash -renderproject /path/to/Voice.RPP
  # 或在 REAPER GUI 中打开 Voice.RPP 后 File → Render（工程已设 48k stereo 24-bit）
  ```

---

## 7. 已验证的行为（全部为测量结果，非听音）

### 7.1 格式与长度（11 个公开 brief）
全部：24 kHz、1 ch、PCM_24；与导引时长误差 **0.0 ms**（最大允许 80 ms）。

### 7.2 参考对留出验证（把 6 段参考导引重新转换，与真实目标录音比较）
度量：
- `cos_target/cos_guide`：OpenVoice V2 `ref_enc` 嵌入余弦（目标/导引质心）；
- `gmm_ll`：MFCC+GMM 说话人模型的目标减导引对数似然（目标参考 +8…+13，导引参考 −9…−14）；
- `mel_improve`：DTW 对齐的 40 带 log-mel 包络（逐帧去均值）相对“原导引 vs 目标”基线改善；
- `ap_improve`：非周期性（D4C，mel 带平均）距离改善；
- `f0_ratio/f0_corr/f0_resid`：YIN F0 轮廓相对导引的中位比例、相关（剔除 50 cents 外点）、残差；
- `energy_corr100`：100 ms RMS 包络相关。

| pair | cos_target | cos_guide | gmm_ll | mel_improve | ap_improve | f0_ratio | f0_corr | f0_resid(cents) | energy_corr |
|---|---|---|---|---|---|---|---|---|---|
| read_01 | 0.866 | 0.410 | +3.7 | +30.9% | +1.7% | 1.82 | 0.966 | 143 | 0.966 |
| read_09 | 0.829 | 0.416 | +2.7 | +28.0% | −5.3% | 1.86 | 0.962 | 133 | 0.947 |
| read_13 | 0.827 | 0.396 | +3.0 | +29.0% | +1.3% | 1.82 | 0.962 | 151 | 0.944 |
| sing_01 | 0.812 | 0.279 | +10.1 | +34.6% | +2.5% | 1.75 | 0.987 | 93 | 0.982 |
| sing_09 | 0.830 | 0.346 | +3.6 | +40.2% | +5.2% | 1.74 | 0.982 | 103 | 0.967 |
| sing_13 | 0.860 | 0.387 | +7.5 | +29.0% | +0.6% | 1.74 | 0.975 | 132 | 0.959 |

（基线：导引对目标 `cos_target` 约 0.42，`gmm_ll` 约 −9…−14。）

### 7.3 公开 brief 的身份一致性
`cos_target` 0.799–0.831，`cos_guide` 0.268–0.386，`gmm_ll` +2.7…+6.0；最差片段为 `read_unseen_03`
（0.799 / +2.7）与 `sing_unseen_04`（0.799 / +4.2），没有模式性塌陷。F0 轮廓相关 0.96–0.99，时长误差 0 ms。

### 7.4 鲁棒性（模拟未公开的新音区/速度/WORLD 变体）
| 输入变体（read_01 导引） | 输出 F0 比值 | F0 相关 | cos_target | 长度误差 |
|---|---|---|---|---|
| WORLD 变调 ×1.20 | 1.762 | 0.960 | 0.846 | 0 ms |
| WORLD 变速 ×1.15 | 1.820 | 0.948 | 0.850 | 0 ms |
| WORLD ×0.85 变调 + ×0.90 变速 | 1.871 | 0.922 | 0.793 | 0 ms |
| 2 s 短片段 | — | — | 0.789 | 0 ms |
| 3 s 纯静音 | 输出静音 | — | — | 3.000 s |

### 7.5 伪影/音质代理
- 归一化谱通量（帧间谱形变化）：自然目标 0.0596、导引 0.0532、OpenVoice 0.0574、本引擎输出 0.0486；
  输出没有比自然语音更“毛糙”。
- 倒谱峰突出度 CPP（浊音帧中位数，越高越接近清晰的周期声）：自然目标 0.240、导引 0.190、
  OpenVoice 0.196、本引擎输出 0.200；对照的 WORLD 重合成版本只有 0.146，说明本引擎保留了神经声码器的
  清晰周期结构，没有采用会明显“电子化”的 WORLD 合成。
- 谱图观察（`read_01`、`sing_unseen_01`）：输出保留谐波线、清/浊过渡和辅音噪声段；未见接缝、
  削波或宽带异常噪声。变换器 45 s 整段推理，11 个 brief 均无分块。

---

## 8. 剩余差异与风险（必须知晓）

1. **未直接听音**：没有耳机/播放链路，全部结论来自测量与谱图；自然度、嘶声、金属感等主观项无法由我确认，
   需由评审或人工试听复核。
2. **绝对音高被映射到目标音区**：OpenVoice V2 tone-colour converter 会把导引的 F0 轮廓整体映射到目标
   歌手的音区（实测 ×1.74–1.86），而不是保留导引的绝对音高。轮廓形状、颤音、时长、停顿、重音均保留
   （F0 相关 0.96–0.99，能量包络 0.945–0.981），但“调性”会整体上移。这样做是刻意的：本任务的目标与导引
   是不同性别歌手，实测中若强制保留导引音区，音色编码器与 GMM 都判断输出更接近导引（`cos_target` 约 0.6，
   GMM 接近导引），身份分会明显下降；任务评分说明也指出“保留内容和音高不能替代身份转换”。如果评审要求
   绝对音高严格不变，可在 `render.py` 中把 OpenVoice 输出再用 WORLD 按 `f0_guide / f0_out` 重合成，
   但会引入 WORLD 声码器质感，本版本没有采用。
3. **带宽**：OpenVoice 工作在 22.05 kHz，输出重采样到 24 kHz 后 11–12 kHz 没有能量；目标录音在该频段
   有少量气声。该频段（mel 最后一带）的谱形改善有限，未做带宽扩展以免引入嘶声。
4. **包络校正器的泛化上限**：训练数据只有约 8 分钟对齐帧，留出内容交叉验证 25–29%（语音）/6–22%（歌唱）。
   歌唱的改善幅度在 6 个参考上为 +29%…+40%（统一帧集复算），但仍明显低于“用目标真实包络重合成”的
   理想上限；不同歌曲的元音分布会影响收益。
5. **代理指标不是官方指标**：本文件的 `mel_improve` 用我自己的 DTW 对齐和 40 带 mel 包络计算，
   与组织方的 WORLD 谱包络参照（隐藏目标真实包络 + 导引音高/时间重合成）不完全相同；
   `cos_target` 用的是 OpenVoice `ref_enc`（与转换器同源，可能对 OpenVoice 输出略偏乐观），
   因此我另加了一个独立的 GMM 说话人似然作为交叉检查，两者结论一致（输出都更接近目标而非导引）。
6. **OpenVoice 风险**：45 s 以上片段采用 45 s 分块 + 0.75 s 等功率交叉淡化；极端音区/极低信噪比输入可能出现
   转换不稳定（本次 3 个 WORLD 变体、2 s 短片段和静音均正常）。
7. **电平**：输出整体 RMS 匹配输入；若下游需要广播电平等，应另行处理，本包未加任何母带/限幅链（仅峰值保护）。
