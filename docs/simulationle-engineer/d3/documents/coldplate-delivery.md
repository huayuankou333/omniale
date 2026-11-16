# 提交约定

所有JSON遵循UTF-8和标准JSON，不允许NaN、Infinity、重复id或以0代替未计算值。数值未完成用null，并给出status和reason。文件路径均相对submission/，不得逃逸到外部目录、使用绝对路径或伪造不存在的证据。文件夹名与 `contract.json` 一致。

## 运行记录

`steady_runs.json` 为数组，每项有：

- `id`：固定工况使用required_steady_runs.json原id；额外工况用唯一id。
- `geometry`：baseline/design/alternative_1/alternative_2；`kind`：anchor/adversarial/alternative。
- `load_id`、`fault_id`、`conditions`（pump_head_factor、Tin_K、power_factor、machining_offset_mm、TIM_factor），`geometry_sha256`（本工况实际几何配置JSON的hash）。
- `status`：verified_candidate/numerically_invalid/unresolved。这里verified_candidate只代表提交者声称结果可审查，未经过独立物理认证。
- `Q_L_min`、`dp_plate_total_Pa`、`dp_pump_Pa`、`dp_external_Pa`、`package_max_K`（6项）、`Tout_bulk_K`、`Tfluid_max_K`、`p_absolute_min_Pa`、`mass_imbalance_fraction`、`energy_imbalance_fraction`、`interface_heat_imbalance_fraction`。
- `evidence`：非空文件记录数组，每项为 `{"path":"raw/...","sha256":"..."}`。至少关联求解日志、体网格、边界/物性字典、原始流体速度/压力/温度场、各固体温度场、可重放积分脚本。不能只链接一个摘要JSON当作全部物理证据。
- `reason`：未完成/失败原因；成功时解释稳态窗口、流动模型与泵根稳定性，或引用report对应段。

`transient_runs.json` 为4项数组，id为`baseline_single`、`baseline_pair`、`design_single`、`design_pair`，含geometry、fault_id、status、`time_s`、`Q_L_min`时序、`package_max_K`二维数组（每时刻6项）、`evidence`。附全时段能量积分、储热项、边界历史和原始检查点文件；至少记录0、5、20、25、40、70、120秒及足以解析峰值的中间采样。不能只交7个时间点宣称解析了峰值。

## 其它结构化文件

- `delivery.json`：case_id、model_id、started_at_utc、finished_at_utc、status、file_manifest（path/sha256）；file_manifest覆盖实际证据但可排除自身防止循环hash。
- `calibration_lock.json`：locked_at_utc、model_config_sha256、parameters、calibration_ids、validation_ids、history_path；history含每次修改的时间和理由；不得向验证工况单独拟合。
- `validation.json`：对象，键`predictions`为数组，id对齐30个观测点，含predicted、unit、status、evidence。温度用°C，压差用Pa。另附geometry_reconstruction、uncertainty、fit_diagnostics文字或文件指针。不得将实验试件几何和工业题几何混为一体。
- `screening.json`：对象，`geometries`含baseline/design，每项提供corner_count=11520、table_path、table_sha256、surrogate_type、cross_validation、selected_adversarial_ids。表格必须逐点列完整输入/输出/status，不能只填计数；使用普通CSV即可。
- `uncertainty.json`：连续对抗搜索的初始点、最终点、约束、至少24次/几何记录、保守界/误差处理、已知模型外推区及robust_status。没有证明的界不得标成certified。
- `convergence.json`：各几何最坏稳态的至少三级网格和最坏瞬态的至少三级时间步长，列网格规模、步长、守恒、Q、热点和误差估计，附evidence。
- `design.json`：baseline/final/alternatives配置与hash、几何/制造审计、质量、选型和淘汰依据。
- `decision.json`：decision=accept/reject/unresolved，evidence_status=complete/partial，constraints逐项给bound/status/evidence，worst_case_temperature_bounds_K、paired_improvement_lower_K、remaining_risks。accept必须有全部硬门槛；reject必须区分“此候选失败”与“整个设计空间不可行”，不得无证据扩大结论。
- `report.md`：工程结论、实验验证、泵工作点、堵塞机理、筛选到高保真复核、制造及维护建议、原始证据索引。
- `limitations.md`：明确数值、实验转移、模型形式和时间预算未完成项；`dependencies.lock`和`run_all.sh`记录可复现环境与命令。

## 检查器的含义

`python public/tools/validate_delivery.py --public public --submission submission --out audit_check.json`。

退出0：提交结构、必要覆盖和基本代数检查通过，**physics_verified仍为false**；退出2：合法但不完整；退出1：格式、证据、输入或代数矛盾。严格检查不能判断场是否真实求解，也不自动评分。专家应复跑选定原始算例、独立积分、核对制造几何和实验误差，按rubric给分。
