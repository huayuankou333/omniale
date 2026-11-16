# AHEAD/HYLON sol测试结果复核

结论：测试已正常结束，工程验收未通过。提交提供了实际前处理、网格、化学对照和三维启动计算证据，但没有得到合格的回火边界或满足约束的抑制设计。工程结论是“证据不足，拒绝放行”，不是证明所有允许改型都不可行。

指定模型gpt-6.1-sol，reasoning effort为xhigh。北京时间2026年11月16日13:05:02开始、15:00:02结束，实际6899.41秒，约1小时55分钟；两小时上限为15:05:02。CLI退出码0，287次执行桥接，资源保护未触发。这里的正常退出只描述测试流程，不代表工程成功。模型的实际解析版本字段未提供，记录保留requested_model，不编造resolved版本。

| 项目 | 复核结果 |
|---|---|
| 原始数据审计 | 有实做：AHEAD重复工况、单位、缺测与标签处理；HYLON测量负值及受限局部NO列处理；尚无完整定量配准验证 |
| 几何与网格 | 有AHEAD、HYLON独立几何/网格；另有2562289单元基准网格通过checkMesh，但该细网格没有反应流结果；P2网格仍有质量失败 |
| 化学前处理 | 提交27个一维自由火焰结果，覆盖多机理、混合/多组分/Soret；不代替三维模型验证 |
| 三维反应流 | delivery索引12条启动/重放记录，全部标numerically_invalid；部分正常结束，但未达到可信时窗与守恒门槛 |
| 正式外部验证 | 无合格预测覆盖、RMSE或锁定模型迁移验收 |
| 回火边界 | 完成0/36条；36条索引均为unresolved，不能因文件存在记为完成 |
| 配对设计收益 | 验证0/18对；安全phi与收益均未知 |
| 工程约束 | 没有可验收的压降、燃尽、NOx、壁面热负荷、金属峰温和压力波动配对比较 |
| 参考解与评分 | 参考解继续空缺；本次未给专家最终分数 |

独立复查在原submission之外重新运行冻结题目的validate_delivery.py：证据索引哈希/格式errors为空，但structural_pass=false，退出码2，有37项incomplete（36条搜索加缺少约束比较）。physics_verified=false；检查器不验证物理正确性。完整输出见validator_recheck.json，汇总见result_summary.json。

主要失败与限制：

1. 早期8.8/9.6候选求解日志含实际浮点异常调用栈；后续转为LES并进行短时恢复与重放。基准H、C和9.6候选的保存反应段约0.62–0.67τ，没有达到10τ启动和20τ无事件观测要求。三组固定步长只各运行10微秒，不能当作回火边界或统计量的时间收敛证明。
2. 基准H末帧出现上游正Qdot，但对应单元当前温度低于配置Treact=800 K；源项时间层、TDAC/ISAT与化学截止一致性未厘清。没有足够连续时间和有效守恒证据，不能据此确认回火或自燃。
3. 主三维模型未实现经验证的非单位Lewis/Soret对照、CHT和壁面淬熄。模型调整标为exploratory，原校准锁中的代码/网格生成器哈希不能匹配保留文件；没有可接受的正式锁定验证。
4. 提交的CAD截面审计显示原节流套筒局部壁厚约0.4 mm，简单扩孔至8.8/9.6 mm会移除套筒，且固定件存在8.8 mm配合孔。该发现需要机械专家核对制造约束和允许设计空间；原题“壁厚≥1 mm”与实际原件的关系应在下一版澄清。本轮不改冻结题目，不将此发现解释成所有设计皆不可行。

这些结果支持“本轮固定预算下未完成核心工程任务”。一次预算受限测试不能单独证明模型普遍无法解决该问题，也不能证明尚无参考解的优化目标可达。

服务器完整产物保留在：
`/home/adminweihunj/SLE_E_D3/evaluations/ahead_hylon_gpt61sol_20261116_01/workspace/submission/`

共3445个文件、2071757471字节，约2.07 GB。原始大场保留服务器；本地submission是约5.4 MB压缩元数据包展开的审查子集，包含报告、代码、部分日志与审计，不是完整可求解镜像。下载包SHA256为70d4df97b0f4e81009bd67c0dc658cc158623aeeab17f5a22b6a6ad670def71f，已校验。完整文件目录见submission_file_inventory.json。

证据入口：run/agent_status.json；run/resource_guard.json；submission/report.md；submission/decision.json；submission/delivery.json；submission/audit/calibration_lock_audit.json；submission/audit/time_refinement_startup.json；submission/audit/chemical_source_consistency.json；submission/audit/manufacturing.json；validator_recheck.json。
