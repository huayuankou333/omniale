# AnalogPortBench：1.2 V 高增益、高带宽运放迁移

本目录复刻 `T3__opamp_2stg__hard_1_gain_ugf`，保留原题、原始评分器、测试台、模型答复、每轮网表、反馈和最终冻结复测。原始项目固定在 commit `5dc16f1c01858664f1912a84abfc06fd4c69f6de`。

任务是将题面给出的 TSMC 0.18 µm 电路迁移到 SKY130 LVT，并在 1.2 V 下重新设计尺寸、偏置或拓扑。模型需要提交完整晶体管级 SPICE 网表。测试使用 ngspice，无需 Cadence GUI。这里不要求复现 TSMC 原设计的仿真，因为其工艺模型未公开；题面已包含源电路和源电路指标，正式评分只仿真目标 SKY130 电路。

## 规格与评分

条件固定为 TT、27°C、VDD=1.2 V、VCM=0.9 V、Iref=20 µA、CL=1 pF。交流评测使用原始 Middlebrook 双注入测试台，瞬态输入为 0.8–1.0 V、10 ps 边沿。

| 指标 | 门槛 |
|---|---:|
| DC 增益 | ≥78.4 dB |
| UGF | ≥89 MHz |
| 相位裕度 | ≥60° |
| 增益裕度 | ≥10 dB |
| 静态功耗（含偏置） | ≤296.4 µW |
| 上升 1% 建立时间 | ≤12.24 ns |
| 下降 1% 建立时间 | ≤26.73 ns |
| DC 线性区晶体管数 | 0 |

评分直接调用上游 `score_answer.score`。P=全部通过，F=电路工作但有指标不达标，D=无增益等不工作情况，I=格式、规则或仿真无效。通过项数只用于诊断，不转换为论文不存在的百分制分数。

## 本次模型协议

- 精确模型 ID：`gpt-6-luna` 和 `gpt-6.1-sol`，每模型一个独立反馈实验。
- `reasoning.effort=medium`，默认采样，不显式设置 temperature/top_p。
- 首次设计加最多两次修订，总计最多 3 次可评测设计；一旦 P 即停止。
- 无工具权限。主机运行仿真后，只返回八项测量、门槛、通过状态和晶体管 DC 工作点；不返回设计建议或参考解。
- 无效网表按原仓库 `invalid_template.md` 单独计数。本地最多 2 次额外语法重试。公开日志中观察到最高 2 次，但原 runner 未公开，所以不能把此上限宣称为原论文明确参数。
- 每次回答输出上限为 32,768 token（包含 reasoning）；原论文没有披露该上限，这是本地执行参数。输出截断会记录 `incomplete_details`，不会隐藏补跑。
- 最终提交为最后一份模型原始回答，冻结后独立重跑；主机不调整器件参数。
- 请求 ID 与 provider 返回模型名都会保存；无法独立验证服务端权重身份。

## 可复现性差异

评测 Python、测试台、指标计算和数值门槛均保留原文件。适配层只设置模型库、ngspice 路径和独立输出目录，并在上游 checker 解析异常时返回 I。

本地为 Windows ngspice 47；上游 `environment.yml` 固定 41，并注明公开结果使用 42。上游安装脚本的 open_pdks pin 无法在所查 volare release endpoint 解析，因此使用已有环境的 continuous SKY130 模型，并复制、哈希冻结到本 case。没有声称 PDK 构建逐位一致。

运行前通过两项控制校验：作者参考解 P/8 项全部通过；作者已知失败解 F，八项评分指标与公开日志一致。非评分的上/下降过冲存在小幅数值差异，详见 `validation/READY.json`。此外验证空回答和不安全 `.control` 块在执行前被拒绝。

论文及 README 描述反馈包含每个晶体管工作点；公开的部分具体反馈仅列出线性区器件。本 runner 按论文描述提供完整工作点表。公开 GPT log 的 effort 字段为 null，目录名却标 medium；本次显式发送 medium，避免依赖 provider 默认值。

## 文件与运行

- `TASK.md`、`SYSTEM.txt`：逐字复制的题面和系统消息。
- `upstream/`：固定版本的评测源代码及测试台。
- `assets/`：本次冻结的 SKY130 模型文件。
- `engine.py`：本地评分入口和反馈生成器。
- `run_models.py`：3 次设计反馈协议、API 原始记录和冻结复测。
- `source_manifest.json`、`runtime_manifest.json`：来源与哈希。
- `validation/`：参考解、公开失败解及校验数据，不发送给被测模型。
- `runs/<时间戳>/`：每次实验的固定协议、逐轮原始请求/响应、网表、仿真波形、反馈、token 用量、冻结提交及结果。

PowerShell 评分已有回答：

```powershell
& 'D:\LINK\SimulationLE\runtime\python\Scripts\python.exe' -X utf8 .\engine.py .\answer.txt --out .\work\score
```

实际调用两个模型：

```powershell
& 'D:\LINK\SimulationLE\runtime\python\Scripts\python.exe' -X utf8 .\run_models.py
```

凭据通过 getpass 隐藏输入，仅在进程内存使用。重启恢复用 `--resume .\runs\<时间戳>`；已完成响应直接读取，不重新付费采样。脚本会检查冻结源文件、模型库和仿真器哈希。
