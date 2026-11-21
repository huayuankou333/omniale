# 制作环境与边界

Linux Docker，4 CPU、8 GB，离线。可使用Python/NumPy/SciPy/SoundFile/librosa、FFmpeg/ffprobe、OpenCV、REAPER、Shotcut/MLT及xvfb；以实际工具库存为准。REAPER是交付要求，其他工具按需要选择。音画理解可以通过运行环境提供的多模态观察工具，也可自行生成图片、短音频试听片段、波形等辅助材料。

候选容器仅挂载`candidate/`到`/workspace/task:ro`，另挂载空白可写工作目录到`/workspace`；`/workspace/submission/`为交付目录。不要挂载主办方目录、历史case、主办方参考工程或完整源电影。评测容器另外挂载待评交付和冻结评分文件。

网络关闭；不调用外部模型；不读取其他参试模型或历史case的交付。不要把API密钥放入工程、清单、报告或交付。仅在受控模型运行器中配置被测模型的路由；该路由由运行器访问，候选shell容器仍保持无网络。

源音乐已经统一转为PCM WAV，文件没有原作品名和原时间码。可通过媒体检查获得技术参数；没有隐藏的正确顺序字段。素材之间存在有意义的重叠，识别源音乐关联可以辅助工作，但最终仍需按新画面完成音乐剪辑。
