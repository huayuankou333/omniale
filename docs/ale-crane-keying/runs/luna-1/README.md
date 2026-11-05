# 白鹤绿幕抠像交付

## 文件
- `output.mp4`：Resolve 原生时间线完整渲染，1280×544、24 fps、241 帧（10.041667 秒），H.264。
- `project.drp`：本次 Resolve 工程，可继续调整 Fusion 合成与重渲染。

## 处理链路
媒体池导入 `input/media/input.mp4` 并完整放入时间线。片段 Fusion 图保留 MediaIn/MediaOut，并包含原生 LumaKeyer、ChromaKeyer、DeltaKeyer、Background 和 Merge 节点。当前输出链路为 MediaIn → LumaKeyer → Merge（前景），纯色 Background（背景）→ Merge → MediaOut。Background 四角均设为 RGB (0,1,0)，即 #00FF00。LumaKeyer 参数：Low 0.69、High 0.86、MatteGamma 0.85、MatteBlur 0.4、MatteContrast -0.02。参考 PNG 仅用于目标外观观察。

## 已知缺陷
输入主体与天空/云层没有干净的颜色或亮度分界；简单原生亮度键控不能达到精细逐帧主体分割。实际导出检查发现云层残留为偏绿、半透明区域；白鹤喙与暗色/运动模糊羽缘不完整，部分运动阶段翼部 matte 有明显缺失或硬边。当前版本是可编辑的原生基础抠像，不应视作无瑕成片。需人工逐帧或逐段精修 matte 才可满足严格的主体完整度与背景纯色要求。