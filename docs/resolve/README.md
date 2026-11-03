# 3A Resolve · 决策演变与争议保留

当前页面使用24项v3回溯模块评分：内容13项50分、Omni8项40分、工程3项10分。Luna43.50、Sol79.50、Astra78.00。内容必要链条与三类归属采用0/半分/满分；其他项目按明确子分相加。减少条目数本身不降分，本版包含实质判分规则及子权重变化。

这是开发集上的回溯修订，原始题面、冻结输入、视频、DRP及实际工具记录未改，也未重新运行任何模型。连续人耳听评及独立评委共识未完成，相关音频分数仍暂定。原先Luna/Sol字幕归零裁决只作用于新O08前两个各2分子分；若恢复满分Sol为83.50，不声称同一字幕条件下两个强模型都低于80。

index.html包含题目、输入、视频、轨迹及24项评分，analysis.html包含逐事件证据与评分边界；traces.html保留231条真实工具调用。完整必要链条在files/rubric.v3.json，来源映射/唯一事件归属在files/scoring-changes.v3.json，当前评分在records/{model}/score.v3.json。

历史页面为index.v2.1.html及analysis.v2.1.html。data/report.v2.1.json、data/analysis.v2.1.json、files/scores.v2.1.all-models.json保留上一版三模型数据；records/{model}/score.json和files/scores.v2.1.json保持原字节。旧版ID与v3含义不同，跨版本按source_ids映射。

网页媒体副本重编码画面并复制原AAC，哈希见files/media-manifest.json。只公开AMI真实观察帧，官方Fairlight教程视频/截图不再分发。原始输入从AMI官方URL、教程从Blackmagic官方获取。AMI CC BY4.0，署名见files/ATTRIBUTION.md。输入清单包不含大媒体。

每模型90分钟、160工具/200API尝试。基础设施恢复沿用同工程/请求，未人工改剪辑；图像加离线ASR/PCM观察协议不等于端点原生音频理解。模型身份以代理返回名称为准。

验证：python scripts/check-resolve-site.py；浏览器CI执行scripts/check-resolve-browser.mjs，验证当前24项、历史39项、视频、轨迹、成片定位、真实证据图与手机布局。原素材、工程、视频及全部工具图像哈希均受检查。
