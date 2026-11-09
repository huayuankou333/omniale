# OmniALE 3C · Charge 跨软件电影拟音

公开页面：https://huayuankou333.github.io/omniale/charge-foley/

真实90秒无声开放电影，自主在线声音检索，经REAPER与Shotcut/MLT完成首版和固定返修。三个模型各一次有效运行；六份真实成片播放副本、440条实际工具轨迹、30个声音事件及24项评分。

2026-11-09回溯权重：P10/C50/T30/M10。Luna39.41、Sol69.16、DeepSeek52.75。仅缩放旧维度内相对配分，不重新生成或调用judge；原有0/0.5/1感知判断、客观核验与首版30%/返修70%保持。旧15/40/25/20结果保留。

Judge为qwen3.8-omni-flash，静音/错配校准失败。全部数字均为待人工核对的自动试评分，不能作为正式已校准benchmark结论。T01–T03使用感知时序等级，未实现原先逐帧起音/F1/IoU测量；T04/M05为源位置和增益代理。单声道judge输入不验证立体声声像。研究借鉴不是ALE/FoleyBench/AgenticVBench官方原题或成绩。

index.html：题目、双版输入、三模型成果、评测策略、逐项证据与问题边界。
traces.html：实际440条工具参数/理由/返回与真实观察图；本地路径和凭据已处理，不含隐藏推理。
review.html：独立人工改分页，当前浏览器保存编辑，可导出JSON，保留原始自动分。
files/ATTRIBUTION.md：电影和所有实际使用声音署名。Charge © Blender Foundation/Blender Studio，CC BY4.0；Freesound素材遵循各自CC0/CC BY版本。

候选成片网页副本仅缩放重编码画面，AAC音频流原包复制，逐个核对音频包SHA256。工程下载包是原生工程和JSON文件，不含全部音频、分轨及画面媒体，不能独立重放。

验证：python scripts/check-charge-site.py。浏览器验证：CHARGE_PLAYWRIGHT_MODULE指定playwright模块，CHROME_PATH指定Chrome，然后node scripts/check-charge-browser.mjs。检查覆盖六个模型视频、两版输入、证据定位、24项、440条轨迹、人工改分和390px布局。
