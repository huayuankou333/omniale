# Flowboard v1 双模型试测

本轮仅 Luna / Sol，每模型一个试次，15 轮生成预算。`results.json` 为汇总；`runs/*/evaluation/final-score.json` 含逐项得分、证据和 judge 判定；`adjudication.json` 记录代理裁定。`trace.json` 为生成轨迹，`operator-records.json` 为浏览器验收日志。原始 WebM 在本地归档；网页保留全部逐动作 PNG 和动作记录；没有发布连续的候选操作视频。

任务、参考录屏、rubric、runner 的 46 个冻结文件哈希未改变。候选文件 hash 在验收前后核对一致。保留历史接口失败，不将它们计为零分。
