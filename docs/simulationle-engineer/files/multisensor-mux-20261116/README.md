# MUX 网页公开证据说明（2026-11-16）

本目录用于展示已冻结的一次 Sol 试验及同一提交的重新验收，未重新调用模型或原生求解。

- acceptance-result.json 为带来源及限制的重新验收结案；evaluator-result.json 为封存检查器原始输出。均为60分，原题5/5、新增3/5。
- previous-no-score-result.json 为旧基础设施异常结案，继续保留。
- protocol/、scenarios/、added-measurements.json、原题CTRF与审计文件保持原导出字节。
- light-evidence.zip 包含题面、合同、预算、封印、网表、封存测量代码、55次原生求解的夹具/日志/测量（不含大型波形），以及开发反馈问题审计。归档内 run_added.py 保留已知混版缺陷，仅供审计，不能直接用于新一轮公平测试。
- 网页未发布40份完整gzip波形及全部开发API轨迹。完整本地包为 D2-II-01_MUX_reaccept_20261116T112320Z_complete.zip，525167953字节，SHA256 fc70af1f9a33d6da690f70df4c29731ce5708d128be2e17546e008e4f4985ed9；本页不声称该大包可在线下载。
- 原始报告中的“本次未推送GitHub”描述重新验收结束时的历史状态；网页发布是之后的独立操作。原始报告未改写。
- 最终电气60分有效；开发工具错误反馈可能影响搜索，公平难度认证仍暂缓。
- 许可文件来自同一上游固定提交的既有保留副本，原署名与改编说明见 protocol/PROVENANCE.json、protocol/NOTICE.md。
