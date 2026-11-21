# dpsk4.1flash v5 测试报告

模型：`deepseek-v4.1-flash-1017`，reasoning=`high`；运行ID：`deepseek-music-v5-reedit`。

有效工作73.30分钟；成功调用122/140；输出131072/131072 tokens；终止原因`budget_exhausted`。

题目、160段匿名音乐素材、工具和预算与sol v5相同；仅按供应商要求转换API传输。候选模型没有直接音频/视频输入，使用图片观察及音频数值分析。制作、工程复现、评分处理及打包全部在服务器Docker完成。

**本轮未完成交付。** 模型在第122次成功调用耗尽131072输出tokens，未提供规定的两版MP4、根目录WAV、assembly.json、edit-notes.md和CREDITS.txt。已有两份RPP及中间WAV，但工程依赖仍使用原工作区绝对路径。提交门槛失败，正式总分为null。

以下音乐诊断使用主办方将原样中间WAV与锁画同步生成的预览；未改动音乐，未补写模型的工程或交付文件。诊断分不代表完成任务。

**中间音乐诊断辅助小计：58.06/95、58.91/95。** 提交不合格；该数值仅诊断现有音乐。

## 门槛

|项目|结果|
|---|---|
|锁画与技术格式|未通过|
|WAV/MP4混音一致|未通过|
|REAPER工程迁移复现|未通过|
|素材及剪辑清单追溯|未通过|
|署名及改编说明|未通过|
|预算、离线及冻结完整性|通过|

## 内容分

冻结评分：音画音乐回应35、结构与剪辑连续性25、主题与配器20、短版适配10、混音10。工程仅设门槛。正式总分保持null，辅助小计不换算为百分制总分。

|维度|满分|辅助评阅一|辅助评阅二|
|---|---:|---:|---:|
|音画音乐回应|35|22.31|22.66|
|音乐结构与剪辑连续性|25|14.00|15.00|
|主题、配器及素材适配|20|12.00|12.00|
|短版适配|10|5.50|5.00|
|混音|10|4.25|4.25|

未评项：review-R74：E3, E5；review-K29：E3, E5。

两次调用来自同一个辅助模型，使用同步4fps无声视频和显式320kbps音轨；未提供模型名称、作者说明或参考成品。此前同接口的粗略有声/静音控制核验通过，本次沿用并保留来源记录。该核验不能证明艺术判断或精确时序可靠。

相差超过1级的项目：无。

逐项等级、可听证据及扣分理由见报告包中的judge/review-*-observations.json；原始响应均保留。

本轮两次均未评E3（剪口/尾音技术质量，3分）和E5（声像/单声道兼容，2分），所以小计满分为95。两次对局部配器的描述也存在分歧，例如暗色幻想转折附近的管弦乐/吉他判断；相近的小计不能证明这些描述准确，需人工复听。

### review-R74整体观察

Both versions contain audible music throughout. The long version uses several clearly different musical materials across the 72 seconds: light pizzicato/woodwind comedy writing in the opening fantasy, darker storm-like orchestral material in the second fantasy, a more driving rhythmic section during the multi-frame escalation, then softer acoustic-guitar-led passages for reunion and ending. The short version reuses many of those same blocks but compresses them into six picture selections with internal cuts at 4, 8, 13, 17, and 21 seconds. In both versions, some transitions are musically coherent and some land as hard jumps between unrelated styles. The strongest recurring problem is that several major visual pivots occur without equally clear musical preparation or release; instead, the edit often changes cue exactly on the cut or leaves a new image under stale accompaniment.

### review-K29整体观察

Both versions contain audible music throughout. The long version uses several clearly different musical materials across the 72 seconds, including pizzicato strings, a bright synth-pop/electronic cue, acoustic guitar-led passages, and later orchestral/woodwind textures. Some transitions are hard-cut rather than musically prepared, but there are also moments where texture changes align with major visual shifts such as the move into dark storm imagery, the return to reality, the reunion fantasy, and the final exterior-to-interior ending. The short version compresses these same materials into 24 seconds with more abrupt juxtapositions; it still forms a recognizable arc from light fantasy to darker conflict, then back to brighter reunion material and an exterior-ending gesture, but many internal joins sound like direct splices with limited phrase-level smoothing.

## 中间WAV与主办方诊断预览核验

|版本|综合响度LUFS|真峰值dBTP|WAV/MP4相关系数|原生重渲染相对RMS误差|
|---|---:|---:|---:|---:|
|long|-14.74|-1.79|0.9999476584959476|—|
|short|-15.49|-1.96|0.9999807200426173|—|

未提交assembly.json；不能逐条核对清单。原始RPP文本中实际item数量：long=27、short=11。工程包含实际编辑，但依赖绝对路径妨碍离线迁移；详细依赖hash见INCOMPLETE-DELIVERY-AUDIT.json。

errors：
- assembly.json: [Errno 2] No such file or directory: '/submission/assembly.json'
- project/long.RPP: absolute FILE references
- project/short.RPP: absolute FILE references
- No source assembly rows
- No native source music dependencies

## 文件

`deepseek-original-delivery-v5.zip`保存全部原始残留产物。`deepseek-diagnostic-*.mp4`由主办方仅封装锁画和原样中间WAV生成，供试听诊断，属于额外预览。`deepseek-intermediate-*.wav`为模型已有WAV的逐字节副本。提交门槛仍为失败。 报告包包含冻结规则、逐项审计、运行记录和辅助评阅证据。

BUILD-FROZEN SHA256：`eb43c8f79d2d0ce6486bea103ecd88a362edce52a6174ef768aef33748f7b063`。DPSK-FROZEN SHA256：`44525f88b5d7cfa436f1e2bdbb8bc804084b4b156991aa45e47adab13f7c58fe`。

正式分需满足交付门槛并按冻结规则完成独立试听及人工最终复核。网页未更新。
