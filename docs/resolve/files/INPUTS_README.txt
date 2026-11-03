题面与输入清单包（不含大媒体）

task-at-run.md是两模型当时实际收到的公开题面，评分说明为v1的60/30/10。
task-current.md保留相同工作要求，评分改为50/40/10。
本次展示分数另按用户明确裁决，把O09/O10均置零；这不是未来实验自动置零的规则。

原始AMI视频/耳麦由source-manifest.json中的十个官方URL获取并校验SHA256。
五路AVI兼容转换：ffmpeg -i input.avi -map 0:v:0 -c:v libx264 -crf 18 -pix_fmt yuv420p -r 25 -an output.mp4
保留输入时间原点和原始352x288尺寸；完整派生文件规格见MEDIA_MANIFEST.json。
Fairlight教程请从清单中的Blackmagic官方URL获取；此包不再分发教程视频。
素材真实录制的研究情境会议，AMI素材许可CC BY4.0；完整署名与许可见随附文件。
评后答案、模型输出与评分记录不可作为新的受测输入。
