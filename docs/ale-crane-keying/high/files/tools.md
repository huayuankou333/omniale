# 本地 Resolve/Fusion API 工具

所有路径限定在本次 `INPUT_ROOT` 和 `OUTPUT_ROOT`。相对路径从本次运行目录起，如 `input/media/input.mp4`、`submission/output.mp4`。不提供任意 shell、网络、外部抠像模型、隐藏参考视频、其他工程。图像来自实际解码，不是文字猜测。工具 `act` 参数为 `action, params, reason`。

- `list_files`：`{"path":"input"}`。
- `read_file`：`{"path":"input/reference/DaVinciResolveScript.pyi","offset":0,"length":16000}`。按字符范围读取，每次最多24000字符。
- `write_file`：`{"path":"submission/README.md","content":"..."}`，可写自己的文档、Lua、JSON、.comp/.setting。
- `probe`：`{"path":"input/media/input.mp4"}`，真实尺寸、fps、帧数、时长。
- `image`：`{"path":"input/media/input.png"}`，实际发送PNG解码图像。
- `frames`：`{"path":"input/media/input.mp4","times":[0,2.5,5,7.5,10],"width":1280}`；每次1–12帧，可选 `crop:[x,y,width,height]` 像素裁切，坐标以原帧为准。也可查看自己的渲染。
- `pixels`：`{"path":"input/media/input.mp4","time":2,"points":[[100,100],[600,250]]}`，返回1–100个实际RGB像素，无自动分割。
- `resolve_lua`：`{"code":"return {name=project:GetName()}"}`，在隔离工程内执行受限Lua 5.1；45秒/100000循环入口，单次回传约12KB。
- `fusion_paste`：`{"timeline_index":1,"video_track":1,"clip_index":1,"settings":"{Tools=ordered(){...}}"}`，把你设计的节点追加到指定片段的原生Fusion图。内部使用 ExportFusionComp → 合并字面 Tools 数据 → ImportFusionComp → 激活合成，保留原有节点；须另行连接 MediaOut。仅接受Lua字面数据与原生构造类型；不接受可执行语句、脚本钩子、Loader/Saver或外部路径。可用于原生Polyline和BezierSpline动画，节点与参数由你决定。
- `render_video`：`{"output":"submission/output.mp4","timeline_index":1}`，固定使用当前时间线的完整范围，由Resolve渲染1280×544、24fps、H.264、无音频。可另给 `start_frame,end_frame`（零起点、闭区间）导出测试片段；正式output.mp4应为完整原片。
- `export_project`：`{"output":"submission/project.drp"}`，导出实际本次原生工程。
- `finish`：`{}`，保存工程并结束。

Lua环境提供 `resolve,project,media_pool,timeline,INPUT_ROOT,OUTPUT_ROOT,PROJECT_NAME`；每次变量重置，工程状态保留。可用math/string/table、函数、循环、assert/pcall、print和return。没有io/os/bmd、任意代码加载、反射。不能切换或重命名本次工程。可用Resolve方法集合见 `reference/ALLOWED_API.json`，Fusion节点集合也在该文件中；免费版不保证所有Studio节点功能。

基础API示例（仅说明接口，不是抠像方案）：

```lua
local mp=project:GetMediaPool()
local item=assert(mp:ImportMedia({INPUT_ROOT..'/media/input.mp4'})[1])
local t=assert(mp:CreateEmptyTimeline('Main'))
assert(t:SetStartTimecode('00:00:00:00'))
-- 全片追加避免源出点包含方式的差异；用实际GetDuration核对241帧。
local c=assert(mp:AppendToTimeline({item})[1])
return {start=c:GetStart(),finish=c:GetEnd(),duration=c:GetDuration()}
```

工程初始帧率已设24，尺寸1280×544。`timeline`可能为nil；创建后用 `project:GetCurrentTimeline()`。若API查询返回过多，请仅返回所需字段或分段。

访问片段原生Fusion：

```lua
local t=assert(project:GetCurrentTimeline())
local c=assert(t:GetItemListInTrack('video',1)[1])
local comp=c:GetFusionCompByIndex(1) or c:AddFusionComp()
local info={}
for _,node in pairs(comp:GetToolList(false)) do
  local a=node:GetAttrs()
  info[#info+1]={name=a.TOOLS_Name,id=a.TOOLS_RegID}
end
return info
```

支持 `comp:AddTool(id,x,y)`、`FindTool(name)`、`GetToolList(false)`、`Lock()/Unlock()`、`StartUndo/EndUndo`；删除节点用 `node:Delete()`（本机没有 `comp:DeleteTool`）。节点通过 `SetInput(id,value[,time])`、`GetInput(id[,time])`、`ConnectInput(id,otherNode)` 读写与连接。也可 `FindMainOutput(1)`、`FindMainInput(1)`、`ConnectTo(output)`。动画可使用原生 `AddModifier(inputId,'BezierSpline')`、`SetInput(id,value,time)` 或自己编写字面Fusion设置后fusion_paste。

控件查询：遍历 `node:GetInputList()`，对每项调用 `GetAttrs()`，选取 `INPS_ID,INPS_Name,INPS_DataType,INPN_MinScale,INPN_MaxScale`。每次最多返回约20–30个控件。查看原生设置格式可用时间线片段 `clip:ExportFusionComp(OUTPUT_ROOT..'/inspection.comp',1)` 后read_file读取。本机没有 `node:SaveSettings()`。`SetAttrs`仅允许节点名、旁路/显示/锁定和当前合成时间等有限属性；脚本、执行命令和Lua表达式钩子不可用。CustomTool原生通道数学公式支持。不要访问属性式对象字段；通过公开方法查询与连接。

实际节点 ID 为 `Custom`（UI名称Custom Tool）、`ChannelBoolean`（UI名称Channel Booleans）。`fusion_paste`可导入Background、Merge、Keyer、Mask、Spline等图。导入后查询实际节点名，并用 `resolve_lua` 将输入/输出与现有MediaIn、MediaOut连接。不要删除或替换源媒体来伪造原始输入；参考PNG只用于观察目标外观。
