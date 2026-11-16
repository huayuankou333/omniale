# Francis-99 D3 工程交付报告

**交付状态：部分完成；未建立可信的全机 10 s 动导叶压力风险比较，未宣称 J 改善或水力约束通过。**

以下数值由实际交付文件自动提取；详细解释及限制见后文。

| 实验工况 | Q 均值 m³/s | H 均值 m | DT5 均值 / 标准差 Pa | DT6 均值 / 标准差 Pa |
|---|---:|---:|---:|---:|
|BEP|0.19964408|11.968458|55.522 / 241.507|-101.008 / 240.586|
|PL|0.13982848|11.875267|70.371 / 323.035|-94.286 / 236.473|

这些 DT 通道的均值不是已确认的局部绝压；标准差来自稳态 5 s 记录，不能等同于 10 s 过渡目标。

| 混合平面尝试 | 最新诊断迭代 | 整周入口 / 出口 Q m³/s | 质量不平衡 % | 域内水头 m | 整周 z 力矩 Nm |
|---|---:|---:|---:|---:|---:|
|BEP（未收敛）|50|0.199590 / 0.202342|1.379|123.411|-2723.625|
|PL（未收敛）|60|0.139620 / -0.557145|-499.044|-8003.988|168618.000|

该表反映数值恢复失败/未收敛，不能拿来评价水轮机真实性能。域内水头测量截面与实验不同。

| 单导叶 ALE 测试 | 完成退出码 0 | 进入的末时刻 s | 最大 Courant 数 |
|---|---|---:|---:|
|GV1912_dt1e5|True|0.0001|1.08734|
|GV1912_dt5e6|True|0.0001|0.543865|
|GV1912_motion_test|False|0.017|8.6363e+56|

微秒测试仅覆盖 100 微秒，导叶尚几乎未移动。失败的 1 ms 尝试保留为反证。

分区链驱动器收尾异常：运行中更新驱动脚本，导致旧 Bash 进程在所有组件求解及重构后读取末尾时发生 EOF 引号错误。总体驱动器退出码未捕获，不补写为 0。各组件的实际退出记录、End 标记和保存场逐项核对见 `evidence/component_chain_driver_note.json`，原错误见 `logs/run_component_chain_driver3.log`。当前交付脚本语法检查通过，最终汇总独立执行。

| 单向稳态分区 | 求解完成 | 最新迭代 | 入口 / 出口整周 Q m³/s | 质量不平衡 % | 数值收敛接受 |
|---|---|---:|---:|---:|---|
|BEP GV|True|400.0|0.1995900 / 0.1995904|0.0001993|False|
|BEP RU|True|500.0|0.1995900 / 0.1995885|-0.000756|False|
|BEP DT|True|500.0|0.1995900 / 0.1995884|-0.0008168|False|
|PL GV|True|400.0|0.1396200 / 0.1396205|0.0003644|False|
|PL RU|True|500.0|0.1396200 / 0.1396164|-0.002602|False|
|PL DT|True|500.0|0.1396200 / 0.1395300|-0.06443|False|

分区各自 p_out=0，单向传递速度和湍流剖面，无下游压力反馈。固定步数退出不代表收敛。

BEP 分区转轮末值 z 力矩 -356.844 Nm，最后 100 步范围 49.716 Nm；相对报告水力力矩的绝对值偏差 -42.50%。

BEP 尾水管有效 PIV 位置 74/74，分线/分量 RMSE（m/s）如下。最大最后 100 步速度范围 0.0007128 m/s。图为 `figures/chain_PIV_BEP.png`，逐点数据为 `evidence/chain_PIV_comparison_BEP.csv`。

| 对照 | L1 U | L1 V | L2 U | L2 V | L3 U | L3 V |
|---|---:|---:|---:|---:|---:|---:|
|BEP|0.0771|0.2432|0.0812|0.2184|0.1342|0.0535|

PL 分区转轮末值 z 力矩 -135.641 Nm，最后 100 步范围 41.087 Nm；相对报告水力力矩的绝对值偏差 -67.77%。

PL 尾水管有效 PIV 位置 74/74，分线/分量 RMSE（m/s）如下。最大最后 100 步速度范围 0.7579 m/s。图为 `figures/chain_PIV_PL.png`，逐点数据为 `evidence/chain_PIV_comparison_PL.csv`。

| 对照 | L1 U | L1 V | L2 U | L2 V | L3 U | L3 V |
|---|---:|---:|---:|---:|---:|---:|
|PL|0.1684|0.1946|0.0993|0.3009|0.1696|0.3732|

BEP 转轮迭代敏感性：独立副本从 500 步延长至 1500 步，末值 z 力矩由 -356.844 变为 -498.743 Nm，最后 100 步范围 0.668 Nm；求解与重构完成：True。入口、网格、物性、转速和离散设置的哈希比较见 metrics；原尾水管仍来自 500 步入口，没有替换其数据。图 `figures/runner_iteration_sensitivity.png`。

| 实际 y⁺ 后处理 | 最小值 | 最大值 | patch 均值范围 | 均值低于 30 的 patch 数 / 总数 |
|---|---:|---:|---:|---:|
|DT1912_PL|4.15|39.4|4.61–31.2|55 / 57|
|DT1912_BEP|5.19|50.4|10.4–39.4|54 / 57|
|GV1912_PL|3.15|137|11.3–55.9|7 / 17|
|RU1912_PL|4.43|120|7.78–47.2|25 / 41|
|RU1912_BEP_refined|4.66|63.9|15.2–34|33 / 41|
|GV1912_BEP|4.85|100|12.9–48.3|7 / 17|

patch 数不是壁面面积比例。实际有壁面处于较低 y⁺，不能以原报告的典型高 Re 描述代替本次检验；壁面模型/网格敏感性尚未解决。逐 patch 数据见 `evidence/yplus_patch_statistics.csv`。

资源记录：{"monitored_peak_CFD_RSS_sum_MiB": 4590.625, "minimum_recorded_filesystem_free_GiB": 68.58080291748047, "monitor_elapsed_s": 4865.146372318268, "note": "20-second sampling, covers a portion of the session, process RSS sums can count shared libraries more than once.", "submission_regular_file_bytes": 4946958084, "CFD_local_execution": false, "per_job_GNU_time": {"steady_BEP_correctBC": {"elapsed_wall_clock_hms": "20:31.23", "GNU_time_max_RSS_kbytes": 711088, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}, "steady_PL": {"elapsed_wall_clock_hms": "23:17.45", "GNU_time_max_RSS_kbytes": 750976, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}, "steady_RU1912_BEP": {"elapsed_wall_clock_hms": "12:46.67", "GNU_time_max_RSS_kbytes": 368012, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}, "steady_DT1912_BEP": {"elapsed_wall_clock_hms": "8:23.25", "GNU_time_max_RSS_kbytes": 470700, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}, "steady_GV1912_PL": {"elapsed_wall_clock_hms": "2:20.67", "GNU_time_max_RSS_kbytes": 216112, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}, "steady_RU1912_PL": {"elapsed_wall_clock_hms": "10:39.32", "GNU_time_max_RSS_kbytes": 369804, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}, "steady_DT1912_PL": {"elapsed_wall_clock_hms": "9:25.57", "GNU_time_max_RSS_kbytes": 468728, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}, "steady_RU1912_BEP_refined": {"elapsed_wall_clock_hms": "16:33.71", "GNU_time_max_RSS_kbytes": 375084, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}, "GV1912_dt1e5": {"elapsed_wall_clock_hms": "0:50.34", "GNU_time_max_RSS_kbytes": 289468, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}, "GV1912_dt5e6": {"elapsed_wall_clock_hms": "1:32.35", "GNU_time_max_RSS_kbytes": 289704, "RSS_note": "GNU time on MPI launcher; not the simultaneous total RSS of all ranks."}}}

## 范围与证据分级

这是部分工程交付，尚未达到题目要求的“真实全机 BEP→PL 动导叶轨迹压力风险验证”。已执行的计算、失败的计算与仅供后续使用的方案分开记录；未计算的 J、能量比、绝对最低压力差和峰值力矩差在 `metrics.json` 中保持 `null` / `unverified`。不提供总体评分或隐藏参考答案。

输入为 `/inputs/raw`、`/inputs/geometry_mesh` 和明确提供的只读运行时源码。所有 CFD 均在远端容器执行。本地 Windows 仅编辑并上传脚本。原始提示称可运行 6 小时，桥接器随后报告有效截止为 **2026-11-15 22:47:43.764305 +08:00（14:47:43.764305 UTC）**，总时限改为自最初开始 2 小时，计算按更早的截止安排。

证据等级：实验统计直接来自提供的稳态记录；混合平面结果是实际运行但未收敛的恢复尝试；顺序分区结果是单向周向平均的稳态近似；动网格测试是真实 ALE 流体求解但仅有单导叶和 100 微秒时间窗；执行器轨迹是解析运动学设计；水柱惯性表仅是假设敏感性，均不是全机瞬态验证。

## 原始实验恢复与数据审计

主要来源为提供的 `evidence/workshop.txt` / `workshop.pdf`，表 1–3 和第 4–5 节。数据引用：Trivedi, Chirag (2026), *Francis-99 Workshop 2: Transient operation*, DataverseNO, DOI **10.18710/WLBL7M**, CC0-1.0。源文件哈希和来源见 `evidence/PROVENANCE.json`、`MANIFEST.json`。没有确认的原始变负荷实验时间序列；因此不宣称瞬态实测验证。

- 物性：ρ=999.8 kg/m³，ν=9.57×10⁻⁷ m²/s，g=9.82 m/s²，均来自原报告。
- BEP：α=9.84°，Q=0.19959 m³/s，H=11.94 m，n=332.59 rpm，水力力矩为发电机力矩 616.13 加摩擦力矩 4.52，即 **620.65 Nm**。
- PL：α=6.72°，Q=0.13962 m³/s，H=11.87 m，n=332.84 rpm，水力力矩为 416.39+4.40=**420.79 Nm**。
- 报告描述的变负荷转速约 333 rpm。稳态分别采用上述实验转速。尚无完成的全机瞬态对比；后续共同转速拟固定为 BEP 的 332.59 rpm，并应记录与报告 333 rpm 变负荷设定的差异，不能让基准与候选使用各自稳态转速。
- 原表的不确定性原样为：导叶角 ±0.04，水头 ±0.011，流量 ±0.1，发电机力矩 ±0.03，摩擦力矩 ±1.5，转速 ±0.05，入口绝压 ±0.047，出口绝压 ±0.001，效率 ±0.14，密度 ±0.01。表头未清楚逐项说明这些数值是百分比、绝对单位还是何种覆盖概率，本项目没有擅自将它们全部换算成统一的绝对标准不确定度。报告另明确测量面积不确定性 ±0.1%。

原报告的入口/出口测压截面积是 0.0962 / 0.236 m²，测压位置高差 1.0715 m；实验出口测压截面在数值尾水管出口上游 **1.58 m**。用表中 p、Q、面积和 g 重算 Bernoulli 水头：BEP **11.891820 m**，PL **11.846367 m**，分别不同于表中 11.94 / 11.87 m。没有修改原值强行闭合；目标 J 的归一化仍使用题目要求的 **H_BEP=11.94 m**。差异可能涉及取整、测量处理或截面定义，当前资产无法消除。

压力每工况 25,000 行，按元数据 **5 kHz** 恢复样本时刻 t=i/5000，记录长度 5 s，最后有效样本为 4.9998 s；文本时间戳舍入到 0.001 s，重复值不能用于推算采样间隔。原始文件保存在 `experimental/`；审计后带样本索引时刻的原始序列为 `evidence/pressure_*_audited.csv`。输出包括均值、总体标准差、原始 RMS、峰峰值、最小/最大值、Welch PSD 和多个频带积分。

**压力参考限制：** 文件只明确 Pin 是绝压。DT5/DT6 通道均值接近零，且有负值，不能当作局部绝压；VL2 的绝对/表压定义也未在该文件中明确。因此不通过拟合一个常数来制造局部绝压，更不能据此宣称汽蚀裕度。图 `figures/experimental_pressure.png` 和统计表保留这些通道的原始参考。

统计不确定性另给出 10 个连续 0.5 s 分块均值的 95% t 区间半宽，作为有限记录重复性估计；分块独立性未被证明，不能代替传感器校准、系统误差或总不确定度。Welch 使用 8192 点分段，频率间隔约 0.61035 Hz，短记录对低频涡带和罕见极值的估计很弱，未扣除仪器噪声。

PIV 每工况 200 帧，采样 40 Hz，Nyquist 为 20 Hz，记录 5 s。正轴向速度为 (0,0,1)，因此下游轴向速度通常为负；横向速度按原文件 (-0.191,-0.982,0) 投影。坐标文件以 **mm** 给出，转换为 m；实验位置是 L1 z=-0.3386 m、L2 z=-0.4586 m、L3 中心线 z=-0.4886…-0.3086 m。按 `U#编号` / `V#编号` 精确匹配：75 个坐标点、74 个有速度的点，**319 号缺少速度列**。未补造。L3 文件有“PIV L2”的标题笔误，采用其 Line3 描述及 301…319 点号审计。各点均值、标准差、分块区间在 `evidence/piv_statistics_*.csv`，点号审计在 `experimental_summary.json`；图见 `figures/experimental_piv.png`。PIV 系统不确定度未提供，不虚构百分比。

## 坐标、网格、边界和数值恢复

原点和实验坐标一致，转轴为 z，流体由导叶经转轮向负 z 流动，尾水管随后弯向正 x。官方示例使用负 Ω，即从 +z 朝原点看顺时针；BEP Ω=-34.828743355 rad/s。保留这个符号，入口径向和周向速度均为负。原示例固定入口切/径速度比为 2.14/1.428，本项目在缺少蜗壳/固定导叶上游剖面的情况下沿用它作为**明确的边界假设**，不是测得的入口旋流。

28 个导叶对应 12.857142857° 叶道，15 个主叶片加 15 个分流叶片对应 15 个 24° 转轮叶道。导叶通道的 Q 是整周 Q/28，转轮通道是整周 Q/15，尾水管是整周 Q。不能直接比较三个域的原始通量。BEP 导叶入口投影扇区面积为 0.005045579 m²，径向/切向速度约 -1.412764 / -2.117168 m/s；逐面数值边界经面积积分为 Q/28。具体面中心、法向面积、速度数组和审计 JSON 保存在 `evidence/inlet_*.npz/json`。

采用提供的原始六面体网格及官方 `Allrun` 合并程序恢复 `cases/assembly_BEP/F99MP` 和 `assembly_PL/F99MP`。组装 BEP 为 **1,891,200 单元**（转轮 718,720 + 导叶 281,600 + 尾水管 890,880），141 个边界 patch、3 个 cellZone、20 个 GGI faceZone。BEP `checkMesh` 通过，最大非正交度 69.431°，最大偏斜 3.94367，最小体积 1.09921×10⁻¹² m³；全局包围盒约 (-0.204803,-0.294155,-1.66506)…(4.37587,0.319826,0.0298607) m。各组件和 PL 的实际质量检查见 `logs/checkMesh*.log`。这只是单一网格的质量审计，**没有完成网格独立性验证**。原报告称此网格为高 Re、BEP y+ 通常高于 30；本次另对实际保存的原生稳态场运行 yPlus 后处理，逐 patch 的最小/最大/均值在 `evidence/yplus_patch_statistics.csv`，汇总见前表及 `yplus_summary.json`。BEP 导叶叶面部分 patch 平均约 14–23，局部低至约 5；不能沿用“通常高于 30”替代本次结果，低 y⁺ 与壁面函数处理的敏感性仍需检验。

恢复过程中证实的实际问题：

1. 示例 `MRFZones` 引用 `rotor`，但原网格中的区域名是 **RU**；示例的 `Runner→rotor` 文本替换不适用于该资产。已改为 RU。
2. 自带 `rotatingWallTangentialVelocity` 边界库加载有未解析 `DimensionedField<...>::typeName` 符号。保存源码和编译日志；正式计算改用逐面径向/周向数值 `fixedValue`，避免依赖该库。没有将 OpenFOAM 1912 和 foam-extend 的同名库混装。
3. foam-extend 3.2 的 `mixingPlaneGAMGInterface::agglomerateCoeffs` 明确 `Not implemented`，GAMG 尝试真实失败。退回 BiCGStab/DILU，压力相对容差 0.01、上限 1500 线性迭代；SIMPLE 松弛 0.1、nNonOrthogonalCorrectors=0、初阶 upwind。失败尝试完整保留。
4. 初期低流量启动、全流量切换和压力求解尝试没有获得稳定初场。`steady_BEP_full.log` 包含已排除的初场/边界切换问题；正式全流量重新生成初场后的恢复记录是 `steady_BEP_correctBC.log`。不能混用这些尝试的输出作最终结果。
5. OpenFOAM 1912 的 scotch 插件是 dummy stub，组件计算改用几何 simple/hierarchical 分区，显式隔离库路径和 MPI 配置。

混合平面稳态：固定几何、实验 Q、给定转速，入口 U，出口 p=0，流体头由解决定，没有同时规定流量和净水头。界面使用官方 mixingPlane/cyclicGgi；U,p 面积平均，k,epsilon 通量平均。模型为原官方高 Re **k-epsilon RANS 壁面函数**。`source/FrancisSteadyFoam` 只在公开 MRFSimpleFoam 上添加实际通量、力矩和测点记录，未以实验压力替换数值场。

`diagnostics.csv` 的首列是 **SIMPLE 迭代数，不是物理秒**；`samples.csv` 为同一迭代上的空间样本。转轮力矩从压力和有效应力积分并乘 15，符号按 z 轴保留。BEP/PL 的质量误差、残差、力矩摆幅和 PIV 均值误差自动汇总在 `metrics.json`。质量近似平衡不等于数值收敛；实际的巨大水头/力矩摆动和浮点异常使这些结果不可接受。

混合平面测点采用最近单元中心，距离明确写入 CSV。特别是 VL2 位于所模拟扇区之外，未经周期旋转的最近单元距离约 **0.201 m**，因此这个 VL2 采样无效，**不用于实验验证**。DT5 距最近单元中心约 4.21 mm，DT6 约 1.57 mm，亦需考虑空间采样误差。PIV 在正确坐标比较，绝不把最近单元采样描述为精确壁面压力。

## 顺序分区稳态近似

为绕开旧混合平面压力矩阵的恢复阻塞，另外用 OpenFOAM 1912 依次计算单导叶、单转轮和全尾水管。转轮使用 MRF，真实 24° cyclic 叶道；全尾水管保留弯管与非轴对称几何。每个域独立设 p_out=0；上游实际求得的 U、k、epsilon 按 z（导叶→转轮）或 r（转轮→尾水管）进行面积加权周向平均并传递，映射法向分量经通量校正。没有用实验 PIV 设置尾水管入口。转轮 `RU_SL_*` 壁面在这一近似里视为固定，其他转轮壁面随 MRF 运动；这是与旧示例全部壁面旋转的另一模型差异。

该近似是**单向速度/湍流剖面传递**：没有下游压力反馈、两侧迭代收敛、蜗壳/固定导叶或转静干涉。各域独立压力基准，不能将 p_out=0 逐段简单拼接成绝压，也不能把分区水头和完整实验水头等同。结果仅用作稳态建模敏感性和 PIV 对照，不能作为瞬态轨迹验证。实际边界剖面、校正系数和来源时刻在 `evidence/chain_mapping_*.json`；完整场在 `cases/{GV,RU,DT}1912_{BEP,PL}`。这些目录只有在相应日志和退出码确认完成后才能视为已完成计算。

原生导叶入口湍流边界取 k=0.02 m²/s²、epsilon=0.2 m²/s³，均为建模假设；后续域传递实际求得的剖面。原生稳态采用 k-epsilon 壁面函数、一阶 upwind、SIMPLE consistent、p 松弛 0.2、U/k/epsilon 松弛 0.5，具体非正交修正和线性求解器见可编辑字典。这些选择及未知入口湍流均未完成独立敏感性验证。

另以实际保存的上游速度场、下游初始入口数组和原始网格面法向，独立审计界面整周通量、对流角动量通量和对流动能通量，见 `evidence/chain_transfer_audit.json`。无显式边界值的 zeroGradient 出口采用相邻单元 U 近似面值，其 U·Sf 积分与离散 phi 通量不同；严格数值质量检查以原生 phi 积分及 `chain_flux_*.csv` 为准。映射仅强制入口目标质量通量；周向平均和法向缩放造成的角动量/动能差异保留，不宣称这些量守恒。该审计不包括压力功或黏性通量。

BEP 转轮另有独立复制的 `cases/RU1912_BEP_refined`，将 SIMPLE 预算从 500 延至 1500 步，其他物理/数值输入不变，用来检查力矩迭代漂移。原 500 步案例和尾水管入口来源保留；副本的完成状态及实际迭代范围以报告自动表和日志为准。它仅是迭代敏感性，不能代替网格或湍流模型独立性检验。

计算完成状态应逐项核对求解器退出码、End 标记、重构日志和实际保存的场。控制脚本错误与物理计算状态分别记录；缺少总体驱动器退出记录时不以各阶段成功替它补写 0。本次控制层异常如有记录，见自动摘要与 `metrics.json`。

## 导叶运动与真实瞬态的差距

两个导叶端点网格 faces/owner/neighbour 完全同拓扑。直接按同编号壁面点拟合，转角约 2.881°，最大点误差约 1.67 mm；二维最近形状配准约 2.953°，将转角固定为设计的 3.12° 后拟合枢轴约 (0.2805054,0.1823246) m，最大最近点误差约 1.044 mm。两种枢轴估计不同，说明**不能把端点网格节点直接插值当作精确刚体导叶运动**。`guide_morph_map.npz` 和 `motion_audit.json` 给出一个刚体修正/端点插值映射，并在 21 个中间位置检查了有向单元体积，未见负值；这不是完整非正交、偏斜、周期接口或实际刚体关节验证。

真实 ALE 组件测试采用 OpenFOAM 1912 `pimpleFoam`、`dynamicMotionSolverFvMesh` / displacementLaplacian、导叶 solidBodyMotionDisplacement、壁面 movingWallVelocity。枢轴为上述**拟合假设**；运动表为基准角度的 tabulated6DoFMotion，插值器不是题目 CSV 的严格三次 Hermite，因而也不把该运动表等同于正式轨迹实现。Hub/shroud 点位使用 slip，入口/出口固定点位，周期面为 cyclic。测试给定入口/出口压力，入口保留初始周向速度，**法向流量由压力求解**，没有同时规定流量轨迹。

1 ms 的初次组件尝试在高 Courant 数下发散并以浮点异常结束。重做的 10 / 5 微秒测试覆盖同一 0…0.0001 s 区间，均完成，最大 Courant 数分别约 1.087 / 0.544。末端通量差见 `component_temporal_sensitivity.json`。开始阶段导叶运动极小，不能以这个测试证明 3.12° 全行程或 10 s 压力风险。没有尾水管或转轮，所以这里也**不存在 DT5/DT6 或转轮输出能量**。

完整转静模型需要同时保留 28 导叶和 15 转轮叶道；两者互质，若不使用经独立验证的相位/节距变换，最小共同几何周期是整周 360°。全尾水管还必须允许 m=1 非轴对称不稳定性。拟议完整方案为真实刚体导叶运动加守恒 ALE 变形/重构网格、全周滑移接口、全尾水管 URANS，并针对压力频段考察湍流模型和时间步；它尚未建成/运行。单扇区混合平面和分立稳态拼接不能解析转静干涉或代替涡带瞬态。

BEP 的轴频约 5.54317 Hz，15 主叶片基本叶频约 83.1475 Hz，分流叶片可引入其谐波；转轮参考系下 28 导叶通过频率约 155.209 Hz。1 kHz 输出理论 Nyquist 500 Hz，但实际可解析频段还受求解时间步、格式、网格与采样抗混叠限制。高输出频率或插值都不能补充有效时间分辨率。当前没有完整全机 1 kHz 原始测点序列，不能绘制伪造的 0…10 s 压力频谱。

## 轨迹、目标和水力系统假设

`baseline_trajectory.csv` 只有两个零端速结点，它的三次 Hermite 插值**恰为**题目冻结的 9.84−3.12(3s²−2s³)，没有改变基准。峰值速度 0.468°/s，峰值加速度 0.1872°/s²。

`trajectory.csv` 是满足条件的**执行器峰值速度最小候选**，不是已证实的压力风险最优解。令总角位移 D=3.12°、T=10 s、加速度上限 a=0.2°/s²，采用恒加速度—恒速度—恒减速度。峰值速度 v 满足 D=v(T−v/a)，得到加速时长 1.93405805665 s、v=0.38681161133°/s。四个结点按三次 Hermite 恰好表示这三个二次/一次区间，C1，结点处加速度允许跳变。首末角、端速、单调性、每个区间内部的速度极值和两侧加速度都经提供的解析检查器验证。峰值速度比基准低 17.348%，但**不能将这个数字当成压力 J 改善率**。

`evidence/trajectory_validation.json` 给出解析结果，`figures/trajectory.png` 展示角度、速度和加速度。正式水力约束状态都是未验证：候选转轮能量是否≥98%、最低绝压是否不低于基准、峰值绝对力矩是否不高于基准、最终水力工况是否为 PL。

稳态只是实验流量驱动的开边界组件/混合平面，没有已识别的电站引水系统。正式瞬态需要给定源/尾水边界和水力系统，允许流量随导叶变化。可用的刚性水柱耦合形式为 L/(gA)·dQ/dt=H_up−H_down−H_turb(Q,α,n)−KQ|Q|/(2gA²)，必要时用可压缩水击特征线；L、A、K、波速、泵/水池动态均未从本资产可靠恢复。

为明确这种缺失，`hydraulic_assumption_sensitivity.csv/json` 只作解析尺度检查：假设 Q(α) 为两稳态端点间直线，使用 ΔH_inertia=−L/(gA)·dQ/dt，扫描 L=5/20/100 m，A=0.0962/0.15/0.236 m²。两个端点面积只是报告测压截面，**不是经测量确认的均匀引水管面积**；这些 L 也完全是假设。它不解水轮机动力学、波传播或尾水管局部响应，不能用于 J、汽蚀、能量或力矩验证。这张表不是全机敏感性分析已经完成的声明。

`scripts/evaluate_series.py` 可对未来**实际**统一 0…10 s 序列按真实时间积分，逐点分别去均值，计算 J=√[(Var(p_DT5)+Var(p_DT6))/2]/(ρgH_BEP)，以及原始/去均值 RMS、峰峰值、PSD、频带能量、能量和力矩。它拒绝缺少完整区间的输入；没有将本次稳态迭代序列传进去，也未补造未来序列。缺少可靠绝压列时最低绝压保持未定义。

`postprocessor_formula_checks.json` 只检验该工具对解析正弦、独立压力常数偏置、带符号力矩能量及截断区间的处理。合成输入及 PSD 仅在临时目录使用并删除，没有作为 CFD 或轨迹结果交付，也未填入未计算的水力指标。

## 复跑、环境与交付目录

`run.sh` 可执行：

```bash
cd /workspace/submission
bash run.sh experiments     # 重新处理提供的原始稳态记录
bash run.sh trajectory      # 重建并解析检查严格 Hermite 轨迹
bash run.sh summarize       # 汇总已存在的实际计算文件
bash run.sh validate        # 交付结构、脚本语法和 JSON 审计，不是水力验证
bash run.sh reproduce       # 在 submission/reproductions/<时间戳> 新建工程，保留现有交付
```

`reproduce` 重新解包/组装官方工程、编译带诊断的求解器、恢复 BEP/PL 启动计算、运行分区近似与微秒 ALE 组件测试。它复现的是这里明确标注的部分工程，不是一个保证收敛的全机优化命令。具体每一步在 `scripts/reproduce.sh`；脚本显式初始化各自运行时，MPI 4 进程，OpenBLAS/OMP 单线程。完成某项求解的 `.rc` 必须实际为 0，不能只看文件存在。后续若需继续大规模求解，应先改进初始化/界面/数值稳定性，不能照搬未收敛场。

- `source/`：官方示例、公开求解器修改源码、边界源码；原有 GPL 标识保留，OpenFOAM/foam-extend 为 GPL 系列许可。
- `cases/`：实际网格、可编辑字典、初场、保存的场和分区场；`source/official_examples` 不是已收敛初场。
- `logs/`：编译、网格检查、初始化、每次求解、失败尝试、运行时间与退出码。
- `experimental/`：提供的压力/PIV/坐标原文。
- `evidence/`：来源、环境版本、坐标/流量/运动审计、完整原始序列、PSD、空间统计、实际数值样本、资源记录。
- `metrics.json`：机器可读状态；未验证的量不填伪值。`figures/`：实际数据图和明确标注的设计图。
- `evidence/delivery_validation.json` 与 `delivery_manifest.json`：交付结构/语法检查和文件 SHA-256 清单；不作为设计通过或总体评分。

foam-extend 源码提交为 0b28389350263718780d866c528bace8649841b6；另使用 OpenFOAM 1912 patch 200626。环境和链接信息在 `evidence/environment.txt`；不同运行时使用 `foam_env.sh` 与 `scripts/env1912.sh` 分别初始化。资源上限为 4 CPU / 32 GiB；`evidence/resources.csv` 每 20 秒记录容器 CFD 进程 RSS 和文件系统余量，开始时间晚于最初准备，不能视为整个会话精确峰值。每个关键求解还有 `/usr/bin/time -v` 记录。

最终仍需解决：稳定且经过实验约束的全机 BEP 初场；准确刚体枢轴及接口保形动网格；全周转静滑移与尾水管非轴对称瞬态；已识别/敏感性检验的引水系统；严格相同条件下两条完整 10 s 轨迹；至少 1 kHz 原始压力/力矩序列及空间、时间、采样敏感性；所有水力约束的可靠比较。当前不能推荐把候选直接用于真实机组控制。
