# AnalogPortBench 高增益／高带宽运放：三次设计反馈实测

测试日期：2026-11-06（Asia/Shanghai）。任务：`T3__opamp_2stg__hard_1_gain_ugf`。

Case 保存位置：`D:\LINK\SimulationLE\case\D2\circuit_porting_opamp_gain78_ugf89`。本次实验：`D:\LINK\SimulationLE\case\D2\circuit_porting_opamp_gain78_ugf89\runs\20261106_013325`。

## 结果

| 模型 | 第1次 | 第2次 | 第3次 | 最终结论 |
|---|---|---|---|---|
| gpt-6-luna | F，3/8 项 | F，2/8 项 | F，5/8 项 | 未通过 |
| gpt-6.1-sol | F，4/8 项 | F，2/8 项 | F，2/8 项 | 未通过 |

P=全部通过；F=电路有正增益但至少一项规格失败；D=上游定义的不工作；I=无效回答。通过项数是诊断信息，不是论文官方部分分数。

### 最后一版的完整评分

| 指标 | 要求 | gpt-6-luna | gpt-6.1-sol |
|---|---:|---:|---:|
| 增益 / dB | ≥78.4 | 16.28 ✗ | 65.89 ✗ |
| UGF / MHz | ≥89 | 6.864e-05 ✗ | 66.24 ✗ |
| 相位裕度 / ° | ≥60 | 158.2 ✓ | 26.9 ✗ |
| 增益裕度 / dB | ≥10 | 18.1 ✓ | 9 ✗ |
| 功耗 / µW | ≤296.4 | 40.48 ✓ | 255.2 ✓ |
| 上升建立时间 / ns | ≤12.24 | 4.16 ✓ | 31.41 ✗ |
| 下降建立时间 / ns | ≤26.73 | 4.34 ✓ | 42.95 ✗ |
| 线性区晶体管数 | 0 | 3 ✗ | 0 ✓ |

### 每轮测量

| 模型 | 设计 | 增益 dB | UGF MHz | PM ° | GM dB | 功耗 µW | 上升 ns | 下降 ns | 线性区数 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt-6-luna | 1 | 37.14 | 8.669 | 90.7 | 45.8 | 221.7 | 48.63 | 48.24 | 4 |
| gpt-6-luna | 2 | 52.84 | 26.9 | 52 | 11 | 141.2 | 42.91 | 35.69 | 1 |
| gpt-6-luna | 3 | 16.28 | 6.864e-05 | 158.2 | 18.1 | 40.48 | 4.16 | 4.34 | 3 |
| gpt-6.1-sol | 1 | 62.61 | 139.6 | 未测得 | 未测得 | 252 | 20.91 | 0.05 | 0 |
| gpt-6.1-sol | 2 | 66.35 | 32.59 | -8.1 | -2.8 | 256.7 | 48.54 | 49.92 | 0 |
| gpt-6.1-sol | 3 | 65.89 | 66.24 | 26.9 | 9 | 255.2 | 31.41 | 42.95 | 0 |

## 解释与边界

本次六份设计全部为 F。Sol 最后一版保持全部晶体管饱和且功耗达标，但增益 65.89 dB、UGF 66.24 MHz、相位裕度 26.9° 以及双沿建立时间均未达要求。Luna 最后一版 UGF 仅 68.64 Hz，输入 0.8–1.0 V 时输出约 0.581–0.600 V，不能作为合格跟随器；其 5/8 项不表示优于 Sol。

本题同时约束高增益、高带宽、稳定裕度、功耗、瞬态建立和工作区。任何单项进步都可能使其他项恶化；单次实验不足以估计模型总体成功率，也不能推断更高模型必然失败。

本次采用论文的 medium、最多 3 次设计反馈协议；此前两个 case 使用 high 和较多工具迭代。跨 case 的结果同时受题目和预算协议影响，不能仅把失败率上升归因于题目本身。

原评分的建立时间是相对输出自身最终值测量，不能单独证明输出正确跟随输入。因此不能把通过项数直接当作设计质量排序。以下是冻结网表在原始瞬态波形后半段的实际范围，仅用于解释结果，未增加评分条件：

| 模型 | 输入范围 / V | 输出范围 / V |
|---|---:|---:|
| gpt-6-luna | 0.8–1 | 0.5812–0.6005 |
| gpt-6.1-sol | 0.8–1 | 0.7066–1.078 |

## 协议与复现程度

- 两模型各一次独立反馈实验，显式 medium 推理、默认采样、禁用工具。完整原题和系统消息逐字复制；不暴露参考解。
- 首次回答后最多两次电气修订，最多 3 次设计。无效网表按原模板另计语法重试，本地封顶 2 次；实际使用次数见下表。
- 每次只反馈八项测量、门槛、通过状态及各晶体管 DC 工作点。未给出失败分析或设计建议。
- 上游 Python 评分器、测试台、规格均固定原始字节。结果为原始 P/F/D/I；最终网表未作人工修改，冻结复测一致。
- 每次回答最多 32,768 输出 token（含 reasoning），为本地设定；原论文未披露同一参数。本次所有响应正常完成，未触发输出截断。
- 运行在 Windows ngspice47；上游说明公开结果使用42（environment.yml指定41）。已有 continuous SKY130 PDK 经复制和哈希冻结，未声称与原脚本 pin 为相同构建。
- 作者参考解在本地全部8项通过；作者已知失败解的8项评分指标与公开记录一致。非评分的过冲数值略有差异，详见 validation/READY.json。
- 原仓库部分记录反馈仅显示线性区器件；本次按论文及 README 描述给出完整工作点。公开 GPT 日志 effort=null，本次显式 medium。语法重试上限2是本地设定，而非已确认的原论文参数。
- API 沿用此前服务；已核对请求与 provider 返回的精确模型 ID，未独立验证服务端权重。

| 模型 | 设计次数 | 语法重试 | API响应 | 输入token | 输出token（含推理） | 推理token | 推理耗时 s |
|---|---:|---:|---:|---:|---:|---:|---:|
| gpt-6-luna | 3 | 0 | 3 | 11106 | 3682 | 2318 | 83.75 |
| gpt-6.1-sol | 3 | 0 | 3 | 10975 | 6056 | 4643 | 212.3 |

## 文件与运行

交付中包含 `TASK.md`、`SYSTEM.txt`、`engine.py`、`run_models.py`、原始 upstream 评测、PDK、来源/runtime哈希、参考校验和全部模型轨迹。每轮保存 request.json、response.json、流式事件、reply.txt、submitted_netlist.sp、原始仿真输出、score.json 和实际反馈。

本次运行目录：`D:\LINK\SimulationLE\case\D2\circuit_porting_opamp_gain78_ugf89\runs\20261106_013325`。详细运行命令见复现说明文档。

此前 Beta multiplier 与 gain-8 OTA 的 260 个已登记文件哈希核验一致，没有覆盖或删除既有实验。

## 来源

- 论文：`https://arxiv.org/html/2610.33088v1`
- 作者仓库：`https://github.com/saeidrajabii/AnalogPortBench`
- 固定 commit：`5dc16f1c01858664f1912a84abfc06fd4c69f6de`
- 原题：`prompts/T3__opamp_2stg__hard_1_gain_ugf.txt`
- 规格：`benchmark/circuits/opamp_2stg/profiles/hard_1_gain_ugf.yaml`
- 评分：`benchmark/llm/score_answer.py`、`benchmark/evaluate.py`、`benchmark/measure.py`
- 原始反馈：`benchmark/llm/feedback_template_v2.md`、`invalid_template.md`
- 本地详细证据见 `source_manifest.json`、`runtime_manifest.json`、`validation/READY.json`、本次 `protocol.json` 与 `audit.json`。
