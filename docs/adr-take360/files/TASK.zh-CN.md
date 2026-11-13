# OmniALE D3-B 360版：表演匹配候选池的表演驱动 ADR

为 91.500 秒、24个镜头的无声锁画表演片完成真实替代录音配音。观察脸、口型和表演，听辨身份、情绪和强度，在360条真实候选中寻找合适录音，再用REAPER编辑、Shotcut/MLT封装。画面是RAVDESS真实实验室表演，非电影实景。

## 输入
- picture_locked.mp4：1280×720、30fps、2745帧，不得改变画面、顺序、帧数或速度。
- calibration/role_A.mp4 … role_H.mp4：8名目标演员的有声中性校准片。用于脸—声音对应，禁止作为最终配音源。
- candidates/C001.wav … C360.wav：12名演员的真实第二遍录音，包含4名非目标演员、两条台词、八类情绪以及普通/强烈强度。每位演员30条。目标画面来自第一遍，原始同步声不提供。
- voice_groups.json：按同一说话人匿名分组和试听入口，只帮助组织检索；不透露其对应角色或表演标签。候选没有情绪或强度标签。
- input_manifest.json、candidate_manifest.json：时长、路径、哈希与镜头位置。

## 必须完成
1. 自行从画面理解表演。按同一演员、同一句话、符合画面的情绪和强度选择录音。不要把性别相同当作身份相同，不要通过音量变化冒充另一种表演强度。
2. 本题情绪词表为neutral/calm/happy/sad/angry/fearful/disgust/surprised，强度为normal/strong（neutral只有normal）。题面不告诉每句答案。选段采用原论文独立人类验证：无声画面的情绪识别率至少80%，正确替代录音至少70%；这些不是agent成绩。
3. 完整保留台词，分段剪接、保调时间伸缩、淡化，兼顾句首、句尾、句内发音，不只做整句平移。保持真实演员音高。禁止生成语音、变声、外部录音、使用校准声作为答案。
4. REAPER中保留可编辑片段和固定A–H角色分轨，实际渲染；Shotcut/MLT使用新混音封装。成片不加字幕、遮挡或音乐。目标-20 LUFS±3、真峰值≤-1dBTP，避免辅音截断、点击、明显伸缩伪影。
5. 先提交v1。宿主封存后发出统一的四句返修；只改指定句，其他20句PCM保持一致。再交v2。

| 镜头 | 全片秒数 | 完整台词 |
|---|---|---|
| S01 | 0.000–4.000 | Kids are talking by the door. |
| S02 | 4.000–8.400 | Kids are talking by the door. |
| S03 | 8.400–12.233 | Kids are talking by the door. |
| S04 | 12.233–16.367 | Kids are talking by the door. |
| S05 | 16.367–20.200 | Kids are talking by the door. |
| S06 | 20.200–24.333 | Kids are talking by the door. |
| S07 | 24.333–28.400 | Dogs are sitting by the door. |
| S08 | 28.400–31.867 | Kids are talking by the door. |
| S09 | 31.867–35.467 | Dogs are sitting by the door. |
| S10 | 35.467–39.467 | Kids are talking by the door. |
| S11 | 39.467–43.233 | Dogs are sitting by the door. |
| S12 | 43.233–46.467 | Dogs are sitting by the door. |
| S13 | 46.467–50.367 | Kids are talking by the door. |
| S14 | 50.367–54.367 | Kids are talking by the door. |
| S15 | 54.367–57.667 | Kids are talking by the door. |
| S16 | 57.667–60.767 | Dogs are sitting by the door. |
| S17 | 60.767–64.933 | Dogs are sitting by the door. |
| S18 | 64.933–68.333 | Dogs are sitting by the door. |
| S19 | 68.333–71.433 | Kids are talking by the door. |
| S20 | 71.433–75.500 | Dogs are sitting by the door. |
| S21 | 75.500–78.900 | Kids are talking by the door. |
| S22 | 78.900–82.900 | Kids are talking by the door. |
| S23 | 82.900–87.133 | Kids are talking by the door. |
| S24 | 87.133–91.500 | Dogs are sitting by the door. |

## 交付与判分
每版：final.mp4、mix.wav、role_A.wav … role_H.wav、audio_plan.json、reaper/session.rpp、shotcut/project.mlt、edit_log.json。日志采用 {"shots":[{"shot":"S01","role":"A","candidate_ids":["C001"],"sync_evidence":"具体观察","processing":"处理说明"},...]}，示例非答案。工程使用真实候选相对路径，交付可重放。

20条计分rubric共100分：身份/台词/表演60，同步30，听感混音10；工程只设门槛不加分，无返修/保护独立计分维度。每句内容2.5：正确演员与完整台词是门槛；通过后身份/内容.75，正确情绪1.25，正确情绪下强度.5。错演员不能靠情绪碰巧相同拿内容分。听感与客观混音保留2:1比例，即20/3和10/3分。固定四句返修仍执行，最终v2按同一内容、同步和质量标准判分，以便与既有Sol交付比较。

工程门槛采用最低上限：成片缺失或无法解码为0；来源日志或最终音轨追溯失败上限50；REAPER无法重放或混音不一致上限60；Shotcut工程、锁画帧数/尺寸/帧率/SSIM不合格上限75；八角色分轨不完整、不隔离或不能求和上限85。全部通过上限100。总分=min(内容+同步+质量, 工程上限)。

同步用原声辅助声学锚点作自动参考：≤80ms满分、≤160ms半分；不是已经人工验证的精确唇形真值。总分标为自动初评，保留音视频证据与人工复核入口。质量由具备真实音频输入的Qwen盲评，不能覆盖身份错误。模型自行作决定，宿主不提供正确候选或隐藏时间锚点。

共同预算：v1有效时间120分钟，v2 35分钟；360个模型回合、650次工具、600帧、200次听觉调用。接口失败、重试等待不消耗有效时间；不因基础设施错误扣分。各模型均使用相同外部听觉工具，这不是原生音频能力测试。

素材许可CC BY-NC-SA4.0。此题是OmniALE新构题，不是RAVDESS论文原生agent benchmark。

本轮360条变体保留全部24个镜头和固定四句返修，12名候选演员各30条；仅候选数量与检索组织变化。外部听觉服务的等待时间从有效编辑时长扣除，已成功观察保留在本轮日志。预算达到70%时提醒导出，85%时提醒优先完成交付。
