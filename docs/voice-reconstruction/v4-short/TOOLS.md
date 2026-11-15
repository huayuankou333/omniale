# 工具与测试条件

离线容器提供 FFmpeg/ffprobe、Python、NumPy/SciPy、librosa、soundfile、pyworld、OpenCV、PyTorch、REAPER 和 Shotcut/MLT。GUI程序可用 `xvfb-run -a` 启动。

`view_images` 传入真实图片像素，可先从视频抽帧或裁切口部。接口无原生音频和视频输入，本次是图像视觉＋工具辅助音频测试，不能声称直接听过声音。

`/opt/models` 提供通用 OpenVoice V2 模型和源代码。`/opt/case-tools/openvoice_runtime.py`、`reaper_audio_project.py`、`reaper_project.py` 是中性工具，可以阅读或自行实现其他方案。没有任务适配状态、源视频映射或对齐答案。

网络关闭；4 CPU / 8 GB RAM。预算为7200秒有效工作时间、140次成功调用、131072输出tokens，每次输出最多8192。接口失败不消耗工作预算，API请求期间容器暂停。缓存目录可用 `/tmp`。提交写入 `/workspace/submission/`，输入位于只读 `/workspace/task/`。

中性REAPER音频helper支持 `create(clips, project, render_name=None, duration=None)`；默认导出名为工程名加 `_render`，避免覆盖同名输入音频；可自行设置文件名和渲染范围。真实工程独立重开验收；不要求额外转换服务或其他歌曲的推理脚本。
