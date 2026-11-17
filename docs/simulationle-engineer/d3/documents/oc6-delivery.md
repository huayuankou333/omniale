# 模型交付格式

提交可写目录 `submission/`，所有文件仍保存在 SLE_E_D3 范围内。最低要求：

```
submission.json
report.md
decision.json
run_manifest.json
provenance/parameter_lock.json
provenance/software_versions.json
geometry/{baseline,candidate,alternative_A,alternative_B}/
solver_inputs/
results/validation.csv
results/fixed_loads.csv
results/coupled_metrics.csv
results/uncertainty_budget.json
results/design_constraints.json
results/structural_summary.json
results/continuous_search.csv
evidence/       # 实际时序、场、压力、网格、结构解、日志
figures/        # 实际结果的可视化
reproduce.sh
```

`submission.json` 参照 `templates/submission_schema.json`：case_id=`SLE_E_D3_OC6_v1`，schema_version=`1.0`，decision三选一，run_manifest为相对路径，artifacts为带path/sha256/bytes的清单，limitations是非空字符串列表（无材料缺口也注明本题原始实验时序未提供）。路径不得越界，不包含口令、访问令牌或主机私有配置。

`run_manifest.json` 为JSON数组。每条至少有 run_id、status(completed/failed/not_run)、model_kind、input_sha256、outputs数组(path/sha256/bytes)。status为completed必须有非空原始输出，不能只引用PDF或静态CAD。failed写明错误和日志；not_run注明原因。固定列表中的1086条记录（30固定+288名义+768角点）都要登记；只有求解完成才能算完成覆盖。另登记5个实验构型、5个空槽、自由衰减、动态CFD、备选设计和新增不利工况，不得放到计数中冒充固定矩阵的一部分。

`results/validation.csv` 一行一观测：observable_id,pred,U_num95,status,evidence_path。全部30个ID与输入完全匹配。写实际预测，不复制实验值。未完成用status=not_run、数值留空；不使用NaN/Infinity。`status=completed`须指向求解原始证据。

`results/coupled_metrics.csv` 至少run_id、duration_valid_s、dt_output_s、LF_horizontal_rms_m、LF_pitch_rms_rad、WF_heave_rms_m、offset_p99_m、pitch_abs_max_deg、line1/2/3_DEL_N、line1/2/3_peak_N、status、timeseries_path。保留基准/候选每种子指标，不只提供汇总比例。

`results/fixed_loads.csv` 至少run_id、复数波幅、Fx/Fy/Fz/Mx/My/Mz在f1/f2/fd处的复数幅值、参考点、压力/黏性分量、稳态窗口、误差界与证据路径。原始全局时序与每柱时序均保留。

结构结果须有材料表、净/名义厚度、实体/壳/梁模型、网格收敛、场映射、时刻/工况、反力闭合、应力/屈曲/接头验算。交付设计参数表、安装分块图、质量/BOM和水下检修计划。

图至少包含：两构型及参考系；B1–B5实验区间对比；自由液面/旋涡与表面压力实际场；差频和一阶谱；QTF频对/波向覆盖；6DOF与三条线张力；基准/候选配对收益区间；Pareto/失效边界；附件应力与安装分块。纯示意图标为示意，不得显示为求解结果。

`python public/tools/validate_delivery.py submission/` 只检查基本结构、固定ID覆盖、文件哈希和幅值算术。它不会由一个 `completed` 标签推断物理有效；`physics_verified`恒为false。评审需独立读取完整时序、场与重跑日志。
