# URMP v2：主动取证与语义排练卡评测

日期2026-10-30。按修改1、2、4组合构建新版；每模型一次运行、一次最终交付。完整候选原样封存。

|网关别名|总分 /100|内容与决策|实际执行|模型请求|取证调用|视频帧|详细音频轨秒|端到端耗时|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|gpt-6-luna|40.00|34.00 /60|6.00 /40|3|9|20|64.0|129.3秒|
|gpt-6.1-sol|97.00|57.00 /60|40.00 /40|3|12|26|93.0|363.0秒|

耗时含网关、传输、工具与生成，不当作纯模型速度。多次请求仅用于交付前只读取证；没有模型运行代码、预览网页、自检、接收验收反馈或返修。

## 本次改进

- 修改1：从展示全曲音符改为三条有明确判定条件的排练请求，模型需找到正确片段、绑定目标声部、设置混音，再交付可执行的排练卡。没有在题面直接给时间戳或匿名轨道ID。
- 修改2：使用90秒真实演奏，包含重复句式、同类乐器和不同休止/进入。五幅演奏者画面固定重排，五条音轨另行匿名，避免沿用原始舞台顺序。
- 修改4：初始只给4帧和2秒粒度粗概览；详细音频每次最多8秒、2轨，合计96轨秒；视频每次最多4秒、8帧，合计32帧。最多两批自适应取证、12次工具调用，模型需选择有用的窗口。

保持从空白网页一次性交付；没有加入失同步修复，也没有采用预制播放器骨架。实际英文题面public/TASK.md，中文说明TASK.zh-CN.md，固定协议protocol.json。

## 来源、任务与真值

URMP K515真实表演，源时间5–95秒，派生视频1280×600、10fps、静音；五条独立声部24kHz PCM16。URMP作者分别录制再同步合成，题包又裁切重排画面，因此不是同场合奏实录。原始音乐与演奏动作没有重新生成。来源DOI:10.5061/dryad.ng3r749，保存的Dryad元数据许可CC0-1.0。已有完整目标曲目，本次未重新下载大压缩包。

|请求|精确定义摘要|真值起止秒|目标匿名轨|
|---|---|---|---|
|q1|红衫中提琴第二次长休止内的灰衫进入→红衫回归；移除灰衫|53.791–57.508|c|
|q2|后半段印花衫小提琴长休止后首次回归的四音；仅该小提琴+大提琴|56.167–57.496|d|
|q3|两小提琴共同休止后首次错开≥0.7秒的进入；移除较早者|39.153–41.289|a|

隐藏边界由官方音符标注和确定性条件选择得到；画面对应已人工核对，允许0.4秒边界误差。音频工具的候选片段可能把同音连续音合并；例如q2附近只给出3个候选片段，不直接给正确的四音结果。具体歧义、选段条件和图像核对记录在audit/task-validation.json。

## 固定评分与完整性

内容与决策60分：每轨位置2分、乐器1分，共15；每请求开始3、结束3、目标3、正确增益/主音量3，共36；有效相关的音频、视频和时段链接引用每请求3分，共9。证据分只衡量可核实的相关观察来源，不把文字流畅当作推理正确。

实际执行40分：普通媒体/混音/传输10、三个排练卡每张8分、卡片切换及手动控件4、布局来源2。内容分检查计划是否回答请求；执行分检查网页是否正确执行自己提交的计划。这样错选片段与播放器实现错误能够区分。WebAudio输出以五路独立扫频探针测量真实PCM，检查增益和时钟；原始真实录音另行检查确实可播放。

正式运行前正确参考100分，故障参考38分。故障参考包含错误映射/片段/目标、忽略增益和音画错位；其自身错误计划仍可能被网页正确执行，所以执行分不会等同内容分。冻结时间2026-10-30T05:38:04.140Z；清单SHA256 fb4dc449c2f86f55f110797d61c051e6e86565ae3313b55269532ea9240541de，共43项。最终已复核冻结文件及双方封存提交哈希。

## 本轮结果说明

本版在内容层面出现了可定位的差异：Luna为34/60，Sol为57/60。Luna把a、c、d三轨绑定到错误画面；q2错选到74.54秒附近，q3漏掉39秒附近的首次事件，改选74秒附近的重复段。q1仍正确。Luna第一批四次取证中三次超出单次窗口限制被拒绝，后续的局部窗口没有覆盖q3真值；这属于取证规划与事件定位问题。

Sol正确绑定全部五个声部，q1、q3的时间与目标均正确；q2起点和声部正确，但把前两个连续同音合为一个音，最终将第四音结束预测为60.17秒，真值57.496秒，超出2.674秒。其新增查询追到了更后的音，未解决同音重奏的计数歧义。这个失败与共享信号工具合并同音有关，不能直接归为原生听觉失败。Sol最终仍达97/100，所以本版已观察到内容差异，但对Sol仍接近饱和，尚未达到强模型也有充分余量的难度。

Luna的执行6/40必须单独解读：loop、loop-start、loop-end有HTML id，却缺少题面要求的data-testid，导致依赖统一重置操作的六项测试无法继续，共34分记0。这个结果不能用来声称所有混音和排练功能都失效。双方原始代码均未修改；补充只读诊断还确认Luna存在独立时钟错误：每帧把累积位置写回position，又叠加从固定anchor开始的全段时间，导致0.414秒内视频前进4.775秒；Sol同一诊断0.428秒内前进0.428秒。记录见audit/postrun-diagnostic.json，补充诊断不参与正式评分。两者均无抛出脚本异常，但无异常不代表行为正确。

评分器的证据refs[].accepted字段只表示该条引用是否满足当前目标轨/目标画面的加分条件；某些真实的比较轨引用也会显示No matching observation，不能把所有false都解释成捏造引用。原始观察仍可在trace和evidence文件核对。本轮没有修改冻结后的评分器，也没有将分数或上述诊断回传给受测模型。

## gpt-6-luna

内容分：对应/乐器9/15，请求计划20/36，证据5/9。运行异常：未记录到脚本异常。

|请求|提交起止|真值起止|提交/真实目标|计划 /12|证据 /3|
|---|---|---|---|---:|---:|
|q1|53.870–57.440|53.791–57.508|c/c|12|3|
|q2|74.540–76.430|56.167–57.496|a/d|2|1|
|q3|74.540–76.730|39.153–41.289|a/a|6|1|

|轨|提交位置/乐器|真值位置/乐器|
|---|---|---|
|a|4/violin|2/violin|
|b|3/cello|3/cello|
|c|2/viola|1/viola|
|d|1/violin|4/violin|
|e|5/viola|5/viola|

|执行检查|得分|
|---|---:|
|real_media_no_autoplay|4.00 /4|
|responsive_source_evidence|2.00 /2|
|ordinary_mixer|0.00 /3|
|ordinary_transport|0.00 /3|
|rehearsal_q1|0.00 /8|
|rehearsal_q2|0.00 /8|
|rehearsal_q3|0.00 /8|
|switching_and_manual_control|0.00 /4|

|取证批次|调用ID|工具|参数|
|---|---|---|---|
|1|E01|audio_window|{"start":18,"end":26,"tracks":["a","d"]}|
|1|E02（拒绝）|audio_window|{"start":16,"end":25,"tracks":["c","e"]}；Invalid audio window/track IDs or96track-second budget exceeded|
|1|E03（拒绝）|video_probe|{"start":18,"end":26,"count":8,"slots":[1,2,4,5]}；Invalid window/count/slots or frame budget exceeded|
|1|E04（拒绝）|audio_window|{"start":54,"end":64,"tracks":["a","d"]}；Invalid audio window/track IDs or96track-second budget exceeded|
|2|E05|audio_window|{"start":50,"end":58,"tracks":["c","e"]}|
|2|E06|audio_window|{"start":56,"end":64,"tracks":["a","d"]}|
|2|E07|audio_window|{"start":72,"end":80,"tracks":["a","d"]}|
|2|E08|video_probe|{"start":53,"end":57,"count":8,"slots":[1,2,4,5]}|
|2|E09|video_probe|{"start":58,"end":62,"count":8,"slots":[1,2,4]}|

原始API响应、工具结果和提交文件见runs/gpt-6-luna-single-delivery-01/；测量数据、截图、每项失败原因见同目录evaluation/result.json。返回模型字段：gpt-6-luna。

## gpt-6.1-sol

内容分：对应/乐器15/15，请求计划33/36，证据9/9。运行异常：未记录到脚本异常。

|请求|提交起止|真值起止|提交/真实目标|计划 /12|证据 /3|
|---|---|---|---|---:|---:|
|q1|53.870–57.440|53.791–57.508|c/c|12|3|
|q2|56.180–60.170|56.167–57.496|d/d|9|3|
|q3|39.120–41.300|39.153–41.289|a/a|12|3|

|轨|提交位置/乐器|真值位置/乐器|
|---|---|---|
|a|2/violin|2/violin|
|b|3/cello|3/cello|
|c|1/viola|1/viola|
|d|4/violin|4/violin|
|e|5/viola|5/viola|

|执行检查|得分|
|---|---:|
|real_media_no_autoplay|4.00 /4|
|responsive_source_evidence|2.00 /2|
|ordinary_mixer|3.00 /3|
|ordinary_transport|3.00 /3|
|rehearsal_q1|8.00 /8|
|rehearsal_q2|8.00 /8|
|rehearsal_q3|8.00 /8|
|switching_and_manual_control|4.00 /4|

|取证批次|调用ID|工具|参数|
|---|---|---|---|
|1|E01|audio_window|{"start":16,"end":24,"tracks":["a","d"]}|
|1|E02|audio_window|{"start":52,"end":60,"tracks":["a","d"]}|
|1|E03|audio_window|{"start":51,"end":59,"tracks":["c","e"]}|
|1|E04|audio_window|{"start":35,"end":43,"tracks":["a","d"]}|
|1|E05|video_probe|{"start":53,"end":57,"count":8,"slots":[1,2,4,5]}|
|1|E06|video_probe|{"start":37,"end":41,"count":6,"slots":[2,4]}|
|2|E07|audio_window|{"start":0,"end":8,"tracks":["e"]}|
|2|E08|audio_window|{"start":8,"end":16,"tracks":["e"]}|
|2|E09|audio_window|{"start":16,"end":23,"tracks":["e"]}|
|2|E10|audio_window|{"start":59.5,"end":62.5,"tracks":["d"]}|
|2|E11|audio_window|{"start":53,"end":56,"tracks":["c"]}|
|2|E12|video_probe|{"start":39,"end":41.1,"count":8,"slots":[2,4]}|

原始API响应、工具结果和提交文件见runs/gpt-6.1-sol-single-delivery-01/；测量数据、截图、每项失败原因见同目录evaluation/result.json。返回模型字段：gpt-6.1-sol。

## 解读边界

这是两个用户网关别名在单个公开片段上的一次结果，不能验证底层模型身份或训练数据未见。当前网关无原生音频输入，两者只使用相同的匿名WAV信号分析器；它不读官方标注、原始轨名或隐藏映射，也不输出请求答案。成绩属于工具辅助的多模态agent交付，不是原生听觉排名。

本轮没有进行额外模型消融调用。画面随机重排使传统舞台顺序不再适用，局部工具限制使一次读取全曲精确音符表不可行；这些设计针对已有捷径，但“必须联合两模态”仍需要正式消融验证，不能仅凭总分降低认定。取证时间窗数量本身也不直接代表能力。

v1曾为Luna39.44、Sol96.66，但Luna主要因未替换代码占位符失分。v2改变了时长、请求类型、评分权重与证据预算，不能直接把两版总分差解释为严格配对能力变化。请优先看本轮每条请求的边界、目标、增益决策以及实际执行。

## 复现与目录

本版在D:/omniale/case/case9-urmp-v2-single-delivery，旧URMP与STARSS23继续保留。public含派生输入；private含隐藏真值（不可直接给受测模型）；runner/tools含隔离交付和局部取证实现；audit含校准及冻结清单；runs含原始交付和全部证据；showcase为展示页。密钥不随包分发。

Node22，Playwright从D:/omniale/package.json解析；Python本机F:/annconda/python.exe，可用OMNIALE_PYTHON覆盖；Chromium可用OMNIALE_CHROMIUM覆盖。运行node authoring/freeze.mjs --verify校验；运行START.ps1或node showcase/serve.mjs打开展示；运行node evaluator/evaluate.mjs runs/<模型>-single-delivery-01/project audit/<新目录>可复核评分，不再调用模型。原始长视频位于D:/omniale/case9-source-preservation。
