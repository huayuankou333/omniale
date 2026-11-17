# 工程交付格式

正式目录submission/至少包含：

```
submission.json
decision.json
report.md
run_manifest.json
provenance/{parameter_lock,selected_design_lock,software_versions,source_audit}.json
geometry/{baseline,A,B,C,selected_cold}/
solver_inputs/
results/validation.csv
results/nominal_metrics.csv
results/robust_metrics.csv
results/distorted_metrics.csv
results/map_points.csv
results/stall_brackets.csv
results/continuous_search.csv
results/structural_summary.json
results/aeroelastic_damping.csv
results/design_constraints.json
results/uncertainty_budget.json
evidence/
figures/
reproduce.sh
```

submission.json：schema_version=1.0，case_id=SLE_E_D3_NASA_Rotor67_v1，decision为accept/reject/unresolved，selected_design为A/B/C之一或null，run_manifest为相对路径，artifacts数组每项path/bytes/sha256，limitations非空字符串列表。所有路径在submission内，无访问口令/凭据。

run_manifest.json是数组，每行run_id、status(completed/failed/not_run)、model_kind、input_sha256、outputs（path/bytes/sha256）、qualification(passed/failed/unresolved)；completed表示数值运行有实际结果，不等于物理通过。必须登记60名义+576角点+24畸变共660固定ID。selected是选中A/B/C的冻结形状，声明别名映射；不能更换形状保持旧ID。另登记2实验、10均匀地图campaign、12畸变稳定campaign的实际子运行、结构/气弹/连续搜索。campaign状态不以一个点完成推定全体完成。

validation.csv包含78个observable_id，每行pred、U_num95、U_geometry95、status、evidence_path；有诊断预测但未取得资格可保留数字及status=diagnostic；未跑数值留空而非NaN。输入目标不得复制为预测或用目标反推结果。自动工具只作误差算术，不认定物理有效。

nominal/robust/distorted_metrics.csv至少：run_id、Nc_rpm、mc_kg_s、PR_energy、PR_mass、TR、eta、shaft_power_W、torque_Nm、tip_leakage_kg_s、mass_imbalance_rel、energy_imbalance_rel、angular_momentum_imbalance_rel、status、qualification、evidence_path。畸变另含有效转数、探针步长和逐叶循环力/矩。

map_points.csv登记真实背压点与稳态/非定常状态。stall_brackets.csv必须给stable_run_ids、unstable_run_ids、seed集合、Pc上下界、mc/PR/SM区间、增长率及周期域和不确定度，找不到不稳定证据不得写已证失速。continuous_search.csv区分actual_CFD/actual_unsteady/surrogate，给参数、获取策略和确认ID。

结构提供金属材料表、体积/质量、冷热形状、单元/边界、离心/压力/热载荷、映射平衡、应力/位移/模态/谐响应/阻尼与疲劳代理原始结果。aeroelastic_damping.csv给mode、phase_index0..21、speed、q、frequency、work_per_cycle、modal_energy、zeta、uncertainty和实际证据。

图至少包括：几何单位/参考系与叶隙；三方案截面/堆叠；实验径向对照及局部激波；五速压比/效率图；叶隙泄漏和熵增分解；失速模态/传播/括区；固定畸变与逐叶载荷；鲁棒收益误差带与连续失效域；金属应力/变形间隙/Campbell/气弹阻尼。示意、代理和实际场须明显标注。

reproduce.sh分开轻量后处理与昂贵求解，记录版本/编译参数/随机种子/输入哈希及原始退出码。资源或时限不足如实保存not_run，不依赖退出后后台继续补题。自动validate_delivery.py仅检查结构、ID、哈希及基本算术，始终physics_verified=false，engineering_score=null。

补充冻结定义：畸变稳定campaign见inputs/required_distorted_map_campaigns.csv。气弹基准/selected均需覆盖首3阶、3个指定转速和22个行波相位，共396个模态—相位campaign，见inputs/required_aeroelastic_campaigns.csv；它们不计入660个固定气动工况。连续搜索的一个样本要求基准/selected配对实际计算，非零周向畸变使用全周非定常模型。每个制造角点的鲁棒加权效率均按N80/N100/N105所含使命权重之和0.70归一化，并独立满足阈值。
