# 白鹤天空背景分离 — Resolve/Fusion 原生交付

## 正式交付
- `output.mp4`：Resolve 原生渲染的 H.264 成片，1280×544、24 fps、241 帧、10.041667 秒，无音频。
- `project.drp`：本次独立工程的原生导出。主时间线为 `Crane_Green_24fps`，一个完整源片段、一个 Fusion 合成。
- `Crane_Key.comp`：最终 Fusion 图的补充原生备份；主要编辑入口仍为 DRP 中该片段的 Fusion 页面。

`test*.mp4`、`raster_check.mp4`、`green_calibration.mp4` 和 `node_inspection.comp` 是保留的制作/试渲染检查记录，**不是正式成片**。正式视频以 `output.mp4` 为准。

## 素材与运动
唯一视频源是本次输入 `input/media/input.mp4`，工程内 `MediaIn1` 可追溯至其完整原始路径。官方 `input.png` 只用于观看外观，没有被导入为主体、动画或替代帧。没有生成替代白鹤，没有冻结、剪短、重定时、稳定、裁切或重定位主体。

源视频在 Resolve 中报告 PAR≈0.991667；`SquareRaster_NoReposition` 使用原生 Custom 双图像通道采样，将原始像素复制到 1280×544 方形像素画布，避免合成时自动横向压缩。

## 原生节点链路
1. **Subject_Travel_GarbageMask**：手工观察原片后设计的原生 PolylineMask，圈定完整运动范围；不是精细轮廓，也不代替逐帧抠像。可在查看器直接调整顶点。
2. **Crane_ChromaLuma_Matte**：Custom 数学色差键。以 `B-min(R,G)` 区分蓝灰天空与中性羽毛，同时合并黑羽、白羽亮度保护。远端细腿使用独立暗部键；薄前翼/翼根有局部浅色保护。
3. **Interior_Holdout_Erode / Wing_Adaptive_Garbage_Grow**：仅处理 alpha 的 Box 形态学链，按每一帧实际 matte 形成动态主体引导，去除孤立云片和编码宏块。收缩量 -0.009，扩张量 +0.0105；引导与原 matte 相交，而非把扩张形状直接画成主体。
4. **Core_Close_Expand / Core_Close_Contract**：+0.003 / -0.006 的内部保护链，限制于翼根区域，减轻色度压缩导致的灰羽小孔，避免填平腿间和羽尖真实空隙。
5. **Cloud_Clean_Protected_Feathers**：结合原视频 RGB、原 matte 与形态学引导，单次预乘。
6. **PureGreen_00FF00 → Crane_Over_PureGreen → MediaOut1**：在不透明 RGB `(0,1,0)` 纯绿背景上合成。没有外部抠像模型或外部生成素材。

### 可调关键参数
`Crane_ChromaLuma_Matte` 的 Numbers 页已暴露并命名：

| 控件 | 值 |
|---|---:|
| Blue excess cutoff / Chroma softness | 0.032 / 0.022 |
| Dark feather ceiling / softness | 0.44 / 0.13 |
| White feather floor / softness | 0.88 / 0.06 |
| Thin wing white floor / softness | 0.82 / 0.05 |

局部保护区域及最终组合公式位于相应 Custom 的 Intermediates/Channels 页面。节点有处理注释；时间线在首帧、薄翼检查帧和末帧有标记。

## 实际导出检查与局限
进行了多轮完整原生试渲染，查看了各秒及大量非整秒拍翼过渡帧，并检查了正式 `output.mp4` 的首帧、末帧、细腿、羽尖、浅灰薄翼与原云斑位置。确认正式文件保留全部 241 帧。

已清理可见天空、云片及孤立宏块。原素材本身为有损压缩且主体已与天空合成，极细羽丝、喙尖和低透明度运动模糊不能保证完全恢复；少数边缘可能有约 1–2 像素的细节收缩、局部绿色混合或轻微抖动，不宣称像素级完美分离。

Fusion 背景设定严格为 #00FF00。正式 H.264 的远离主体背景抽样解码为 RGB `(0,252,0)`，包括画面角落和原云斑位置；这是实际输出的轻微编码/色阶偏差，而不是保留天空。主体交界处还受抗锯齿、半透明合成和 H.264 色度采样影响。

## 继续编辑 / 重渲染
导入 `project.drp`，打开 `Crane_Green_24fps`，进入唯一视频片段的 Fusion 页面。若换机器后素材离线，将其重新链接到本次原始 `media/input.mp4`，不要链接任何试片。保持 24 fps、1280×544 和全时间线范围 0–240 帧渲染。工程不依赖试渲染视频或参考 PNG。
