# 白鹤绿幕抠像

- `output.mp4` 是从 Resolve 时间线原生渲染的 H.264 成片：1280×544，24 fps，241 帧（10.041667 秒），无音频。白鹤的形态与运动逐帧来自 `input/media/input.mp4`；`input.png` 仅作视觉外观参考。
- `project.drp` 是可编辑 Resolve 工程。时间线 `Crane green` 使用原始视频；若导入后媒体离线，请将其重新链接到本次输入中的 `media/input.mp4`。

## 方法和关键参数

Fusion 的 `Key_Colour_And_Regions` 使用原始 RGB 的亮度、近中性色和暖色差组合生成主体 matte，并用静态的身体/翼、腿和颈部区域限制天空。`Matte_Close_Grow` / `Matte_Close_Shrink`（±0.004）修补小孔，`Matte_Open_Shrink` / `Matte_Open_Grow`（±0.007）抑制孤立碎片；`Composite_Protect_FineDetail` 将处理后的 matte 与未处理 matte 结合，保护暗色羽尖、细腿、上翼和颈部，并将原片像素直接合成到 RGB (0,1,0)。`Green_00FF00` 和 `Green_Canvas_Merge` 提供绿色画布。

源视频媒体被 Resolve 识别为 PAR 0.9917；时间线素材水平 Zoom 1.00837、垂直 Zoom 1.0 用于抵消该像素宽高比解释，避免左右黑边并对应原始像素坐标。没有冻结、替换或裁切原片帧。

## 已知限制

这是一种针对该镜头的颜色和空间约束抠像，而非原始前景 alpha。少数羽毛交叠及细边可能仍有轻微绿染、细节损失或时间变化；近色云层可能在个别帧留下很小的残点。H.264 的色度抽样和编码会使绿色与边缘像素产生小幅数值误差。已检查最终导出的多个时刻，并根据检查修正了羽尖、颈部和中间调区域。
