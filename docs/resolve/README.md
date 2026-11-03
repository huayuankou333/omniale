# 3A Resolve · 决策演变与争议保留

静态页面发布在 /omniale/resolve/。index.html包含完整题目要求、公开数据输入、两模型实际成片、运行轨迹入口及39项评分；traces.html按需加载真实工具记录，可按模型/工具/文本/错误筛选。

当前显示38.67/83.33，是原成片的v2.1回溯评分：内容50、Omni40、工程10；按用户明确裁决将O09/O10均记零，其余37项不变。原始启测题面为v1，均保留供审计。未再次运行模型。

records里的工具轨迹已替换本机路径、移除凭据样式字符串；没有编写隐藏内部思考。只复制AMI观察帧，官方教程视频/截图不再分发。DRP保持原始字节，公开JSON/README可能只替换本机根路径。

网页播放副本重编码画面并复制原AAC音频，原始交付哈希/网页哈希见files/media-manifest.json。评分针对原始MP4与原生工程，网页副本未用于重新判分。输入清单包不含大媒体，原音画从AMI官方URL获取；Fairlight教程从Blackmagic官方获取。

每模型预算90分钟、160工具/200API尝试。Sol显存崩溃后从同一工程/同一请求恢复，停机等待不计预算，未有编辑帮助。图像+离线ASR/PCM观察协议不等于原生音频理解。连续人耳听评、独立评委共识尚待完成。

验证：python scripts/check-resolve-site.py（结构/分数/轨迹/链接/凭据模式）；浏览器验收另记files/browser-validation.json。所有媒体为真实源/交付派生，非生成样品。AMI CC BY4.0，署名见files/ATTRIBUTION.md。
