# 研究与工程来源

核查日期：2026-11-07。本题为 OmniALE 新设计的跨软件声音制作任务。下列工作仅支持具体设计取舍，不代表其作者验证过我们的事件表、权重、阈值或模型成绩。

| 来源 | 原始入口 | 本题借鉴 | 没有照搬的部分 |
|---|---|---|---|
| FoleyBench: A Benchmark For Video-to-Audio Models | https://arxiv.org/abs/2511.13219 ；正文 https://arxiv.org/html/2511.13219v2 | 把语义相关性、时间对应和音质分开；关注多声源和较长片段 | 原工作对生成模型的指标不直接转为本题 agent 的百分制；不把单个答案的 FAD 当真值 |
| AgenticVBench: Can AI Agents Complete Real-World Post-Production Tasks? | https://arxiv.org/abs/2605.27705 ；正文 https://arxiv.org/html/2605.27705v1 | 程序检查结合专家 rubric；Repair 中的修改区域/非目标区域保护、实际渲染核验；Repurpose 的专家标签校准 judge | 本题不照搬原任务的 0.9/0.1 修复公式，不使用针对单一 golden reference 的波形接近度评价创意音色 |
| Agents' Last Exam | https://arxiv.org/abs/2606.05405 | 真实软件中的交付、操作轨迹、硬检查与任务相关的判断 | 本题没有 ALE 官方断点和官方满分答案；权重是本题设计 |
| EBU R128 / loudness metering | https://tech.ebu.ch/publications/r128 | integrated loudness、true peak 和测量方法的区分 | EBU 页面推荐 -23 LUFS；本题 -20±2 LUFS 是独立的审片规范 |
| Blender Studio: Charge | https://studio.blender.org/projects/charge/ ； https://video.blender.org/api/v1/videos/04da454b-9893-4184-98f3-248d00625efe | 实际高质量电影画面与官方来源 | 原音轨不提供给候选，也不当作唯一声音答案 |
| Blender remixing 内容说明 | https://studio.blender.org/remixing/ | 核对开放内容说明；具体许可版本再以原片片尾核实 | 不把网页的一般 CC BY 说明冒充每个素材的具体版本 |
| Freesound API | https://freesound.org/docs/api/overview.html ； https://freesound.org/docs/api/resources_apiv2.html | 真实在线查询、预览、下载、作者和许可记录 | 不把预览当原始无损素材，不绕过认证；正式启动前必须验收宿主认证 |
| REAPER ReaScript | https://www.reaper.fm/sdk/reascript/reascript.php | 原生编辑、参数控制、保存和渲染的脚本入口 | 桥接只执行，不代模型判断声音和事件 |
| Shotcut features | https://shotcut.org/features/ | 多轨混音和 MLT 项目保存、加载与导出 | 不以直接 FFmpeg 拼接替代指定软件阶段 |

## 为什么不直接用相似度分代替内容分

本题允许同一科幻动作存在不同但合理的声音设计。语义嵌入相近不证明是谁在发声，也不证明具体接触对齐；逐样本波形距离则会惩罚合理创意。我们以实际画面事件为约束，逐项保留声源识别、动作相容性和可闻起音，再用技术测量与有限的盲听评价补充。

## “客观依据”的界限

帧数、时间映射、解码偏移、LUFS、true peak、下载哈希、软件调用、工程重开和指定增益变化可以程序复查。材质相容、声源身份、掩蔽和合理空间需要听觉判断；它们必须有固定问题、局部证据、正负对照和争议处理，不应宣称完全无主观成分。

论文中报告的基准得分不能预测 Luna/Sol 在本题的分数。本题没有为了指定模型低于某个分数而预先调权。
