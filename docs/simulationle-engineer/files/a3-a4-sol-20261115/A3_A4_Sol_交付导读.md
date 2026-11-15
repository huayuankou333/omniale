# A3 / A4 Sol 评测交付

最终结果：A3 50分，A4 40分，task success均为0。先读 `A3_A4_Sol_实测报告_20261115.md`。

`A3_Sol_result.json`、`A4_Sol_result.json` 是最终结果；`A3_A4_Sol_results.json` 还包含汇总用量。
`*_Sol_submission.zip` 是原始冻结提交，`*_evaluation_runtime_sealed.zip` 是修复标题解析后的验收器。
`*_pre_model_executor_v2_sealed.zip` 保留模型运行前的执行器。

注意：证据包保留历史原路径。包内 `result_docfix_v3.json` 和 `final_evaluation_docfix_v3/` 才是最终验收；包内旧 `result.json` / `final_evaluation/` 是标题解析错误造成的原始误判记录，已作废，不能当作模型得分。
`*_infrastructure_invalid_attempt.zip` 是更早因Docker基础设施故障中止的尝试，分数为null。

所有被测调用均请求并报告 `gpt-6.1-sol`。题目仍属草案，合法满分参考解的全矩阵可行性证明尚未完成。
