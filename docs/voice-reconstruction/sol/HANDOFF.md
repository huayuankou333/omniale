# 目标人声身份 · 读 / 唱双模式交接

## 交付与使用

本包是**固定导引表演者 → 固定目标表演者**的音色转换器，不是文字 TTS，也不是预渲染文件检索。新查询的内容、时间轴及基频来自输入；参考录音仅在适配时使用。推理不需要 `references/`、`guides/`、网络或 GPU。

```bash
python /workspace/submission/render.py --input INPUT.wav --output OUTPUT.wav --mode speech
python /workspace/submission/render.py --input INPUT.wav --output OUTPUT.wav --mode singing
```

移动整个目录后，以新位置调用 `render.py` 即可，工作目录不限。输入必须是 **24 kHz、mono WAV**；输出为 **24 kHz、mono、24-bit PCM WAV**，样本数与输入相同。可加 `--report /tmp/run.json` 保存数值运行报告。程序只读取包内资源，只向指定输出位置写文件。

| 文件 | 用途 |
|---|---|
| `render.py` | 唯一的声音转换入口；两个模式共用目标身份状态 |
| `state/content_encoder.pt` | OpenVoice V2 通用、冻结的声学编码器子集 |
| `state/voice_mapper.pt` | 两个小型、目标专用谱包络 / 非周期性映射网络 |
| `state/phonetic_forest.npz` | 目标专用回归森林，压缩为节点及叶均值数组 |
| `state/resonance.npz`、`state/config.json` | 模式条件共鸣校准及适配参数说明 |
| `vendor/openvoice/`、`licenses/` | 必需官方模型源码、模型卡及许可 |
| `audio/*.wav` | 全部 11 个公开 brief 的独立转换 stems |
| `Voice.RPP`、`Voice.wav`、`session.json` | 原生 REAPER 工程、完整演示、精确排布清单 |
| `validation/` | 格式、声学、可移植性及本地模型选择的测量记录 |

Python 运行依赖：`numpy`、`scipy`、`torch`（CPU）、`soundfile`、`pyworld`、`soxr`。版本见 `validation/environment.json`。推理不需要 scikit-learn；森林已导出为纯 NumPy 数组。所有必要权重均在包中，不再读取 `/opt/models`。

## 适配方案

### 1. 独立表演的配对对齐

只使用公开参考中的 6 组 guide/target 配对：歌曲 ID `01 / 09 / 13` 的朗读及歌唱，共 12 个真实录音。没有使用未公开目标录音、外部语音助手或音素标签。

- WORLD：24 kHz、10 ms 步长，DIO + StoneMask 基频，CheapTrick 谱包络，D4C 非周期性。
- 在 256 点 mel 频率坐标上投影 log-power 谱为 48 维正交余弦系数。训练谱形时排除能量系数；非周期性用 3 / 6 / 9 kHz 三个 dB 控制值。
- 初始对齐采用经过统计归一化、声道长度补偿的谱形、相对能量和清浊信息。歌唱另加入相对音高轮廓，避免把八度 / 调性差异当成内容差异。
- 在 20 ms 网格做带约束的单调 DTW，再插值回 10 ms；用初始学得的目标空间映射做一次细化。不是按文件总时长线性拉齐。
- 静音、清浊不一致及局部匹配不可靠的帧降权，减少把错误配对学成辅音 / 元音替换。

### 2. 声道与质感映射

输入包含源谱形、局部平滑 / 变化量、清浊 / 非周期性、音高、模式，以及冻结 OpenVoice V2 posterior encoder 的 192 维确定性声学表示。编码器条件音频做一致的幅度归一化，**该归一化不施加到最终人声音量**。

学习目标是目标真人的谱形和非周期性，而不是目标真人的音高或时间。共享网络使用显式 `speech / singing` 条件，跨模式共同学习同一个目标身份。最终组合为：

- 55%：两个不同初始化的小网络；每个网络使用相邻训练阶段的权重平均，降低少量参考上的过拟合；
- 45%：128 棵、最大深度 24 的 ExtraTrees 多输出回归器，补充局部元音 / 辅音条件映射；
- 对有声部分做保守的目标协方差恢复，减轻回归均值造成的共鸣峰对比度收缩。校准只来自参考，不根据查询文件名或查询的目标答案决定。

训练加入源 WORLD 重合成变体：基频倍率 `0.80 / 1.22 / 1.45`，速度倍率 `0.90 / 1.13 / 1.00`。这些变体沿对应时间位置保留同一目标谱形标签，用于抑制对固定音区、速度及原始录音波形的依赖。**没有原始参考 / 导引 WAV、逐帧参考库或已转换音频查表资源随引擎分发。**

### 3. 新片段推理及读唱差异

1. 在查询本身的 10 ms 网格分析 WORLD 参数。
2. 提取通用声学表示，映射目标谱形与非周期性。
3. 逐帧继承源谱包络的总能量，用目标谱形重分配能量；源无声 / 无周期帧不被强制变成有音高声音。
4. **源 F0 数值、清浊时间位置、采样时间网格直接交给 WORLD 合成**，不按目标参考的平均音高转调，不量化音符，不做颤音拉直或节奏修正。
5. 谱形只做约 6.5 ms 的短平滑，非周期性约 10 ms；没有长段时间伸缩或累积状态，因此拼接新内容不会依赖前一次调用。
6. 最后只做一次线性电平补偿以接近导引 RMS；若会溢出，则整段线性降低至峰值不超过 0.985。**没有压缩器、限制器、伴奏、混响、响度母带或其他工程 FX。** 个别公开朗读段因重建后的峰均比不同，整体电平有所降低；乐句起伏仍来自导引。

`speech` 重点依靠短谱形变化和辅音上下文；`singing` 使用同一身份映射中的歌唱条件以及持续元音训练分布。两者没有不同的目标人声、替代文字或预设旋律。

## REAPER 工程与完整演示

在 REAPER 7.85 实际创建、保存、重开并渲染了 `Voice.RPP`，不是仅用文本模拟的工程占位物。

- 11 条独立可编辑轨道，各一个完整 WAV item，顺序与 brief 清单一致。
- 中间各 **0.500 秒**，11 个具名 region；item 不锁定、不循环、时间基准为秒，播放速率 1、变调 0，无自动淡入淡出，无工程插件。
- 音源为包内 `audio/...` 相对路径。不要只移动 `.RPP`，请同时保留 `audio/`。
- `session.json` 是列表，每项含 `id / path / start / seconds`，时间单位为秒。
- `Voice.wav`：**48 kHz stereo、24-bit PCM，326.0456667 秒**。这是无伴奏、居中的单人声 stereo 演示，不是立体声空间效果。

图形界面：打开 `Voice.RPP`，使用 File → Render；工程已保存全片段范围、48 kHz、stereo、24-bit WAV 输出设置。

本环境命令行重渲染：

```bash
python /workspace/submission/render_session.py
# 或工程已经移动：
python /new/location/render_session.py --project /new/location/Voice.RPP
```

该辅助脚本调用已安装的 REAPER 与 Xvfb，默认输出工程旁边的 `Voice.wav`。渲染目录应可写。转换引擎本身不依赖 REAPER。

## 已验证的行为与证据边界

**本环境没有直接听音接口。本次只进行了波形 / 谱图观察、程序检查和计算测量；没有人工听音、专家相似度评分或完整可懂度认证。下面不是组织方封存指标，也不代表已经达到 80/100。**

- 全部公开 stem：24 kHz mono PCM_24，样本数与各输入精确相同，未检测到 PCM 削波。检查见 `validation/public-renders.json` 和 `validation/acoustic-checks.json`。
- 在同一时间网格重估输出 F0：各公开朗读段的共同有声帧中位绝对差约 **7.4–8.1 cents**；歌唱约 **2.2–3.7 cents**。这包含分析器和重合成误差，并不等于基频真值误差。两端清浊不一致的帧不在此中位数内；完整清浊一致率及尾部误差已保留在 JSON。
- 有效帧的 log-RMS 包络相关约 **0.995–0.998**，用于检查时间 / 乐句能量保持，不能作为可懂度或目标身份评分。
- 将引擎复制到只读目录、从 `/tmp` 启动，在 4 核 CPU、8 GiB 地址空间限制及 240 秒 CPU 限制下，转换了新拼接且变调 / 变速的查询：
  - 歌唱 103.33 秒（音高 ×1.31、速度 ×0.87）：含解释器启动约 **12.14 秒**，子进程峰值 RSS 约 **860 MiB**；重复输出逐字节一致。
  - 朗读 72.38 秒（音高 ×0.84、速度 ×1.17）：含启动约 **8.99 秒**，峰值 RSS 约 **757 MiB**。
  - 两种模式均精确保持样本数。详见 `validation/runtime-portability.json`。这些是本机实测，不是无限长度输入的速度保证。
- 把工程和 stems 复制到另一目录重开并用 REAPER 原生渲染，得到与原目录演示 **PCM 完全相同** 的结果。10 个间隙各 0.5 秒，渲染内均为数字静音。见 `validation/project-portability.json`。
- 模型选择阶段做了按歌曲 ID 同时留出读 / 唱的三折验证。局部谱形误差代理（dB，越低越好）的例子：

  | 留出内容 | 未转换导引 | 候选混合映射 |
  |---|---:|---:|
  | read_01 | 10.228 | 7.354 |
  | read_09 | 10.568 | 6.709 |
  | read_13 | 9.976 | 6.587 |
  | sing_01 | 11.173 | 7.316 |
  | sing_09 | 12.538 | 6.566 |
  | sing_13 | 10.629 | 6.295 |

  此表比较独立表演经 DTW 对齐后的非能量谱系数，并受对齐误差、演出差异及帧筛选影响。它是本地方案选择的声学代理，不是身份主观评分；最终交付模型另用全部参考拟合。折内网络 / 森林规模、定义和其他结果见 `validation/model-selection.json`。

### 剩余差异 / 使用限制

- 极短爆破、齿擦音、气声与清浊边缘可能受 10 ms WORLD 分解和回归平滑影响；无法据此保证每个音素的主观清晰度。
- 目标元音共鸣和质感是少量独立表演学习到的统计重建，不是目标真人实际录制的新演出。未见音素上下文、非常极端的音区或特殊嘶哑唱法可能偏离目标。
- 无人工听音验证；WORLD 的周期 / 噪声模型本身也可能产生合成感。诊断谱图见 `validation/pitch-and-resonance.png`、`validation/singing-envelope.png`，不能替代试听。
- 该状态针对本任务的导引表演者及其变体。没有验证任意其他说话人、多人、带伴奏、强混响或其他语言的身份迁移。

## 模型、数据及许可

- **OpenVoice V2**：环境所供 `converter/checkpoint.pth` 的通用 posterior encoder 子集，未预先含本任务的目标适配。只作为冻结声学编码器使用；没有调用其 decoder、flow 或参考声纹转换接口生成交付音频。官方源码及权重模型卡为 **MIT**；许可证见 `licenses/OpenVoice-MIT.txt`，模型卡见 `licenses/OpenVoice-V2-model-card.md`。父 checkpoint SHA-256 及运行配置见 `state/config.json`。
- 目标专用网络、森林及共鸣校准由允许的 NUS-48E 参考适配而来；**数据及本次声音适配 / 示例仅限研究用途**，通用模型的 MIT 许可不取消 NUS 数据限制。保留根目录原文 `DATA-LICENSE` 和 `licenses/NUS-48E-README.md`。
- NUS-48E 引用：Zhiyan Duan, Haotian Fang, Bo Li, Khe Chai Sim and Ye Wang. **“The NUS Sung and Spoken Lyrics Corpus: A Quantitative Comparison of Singing and Speech.”** APSIPA ASC, 2013.

如需完整性复查：

```bash
python /workspace/submission/verify.py
```

`MANIFEST.sha256` 可用于核对核心代码、模型、工程及音频文件。不要把本研究评测构造中的恢复场景当成真实商业授权或真人代言。
