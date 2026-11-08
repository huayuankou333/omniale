# 交付格式

## answers.json

复制 `answer-template.json` 后填写，保留全部 Q01—Q20，且每题恰好出现一次。`case_id` 保持不变。

- `question_id`：Q01—Q20。
- `work_id`：与题目对应的 A、B 或 C。
- `answer`：字符串或 null。按题目要求使用音名、术语、整数或 MM:SS；列表也作为逗号分隔的字符串填写。
- `explanation_zh`：中文依据说明。指出自己听到／看到的现象，并解释它为何支持答案。

## evidence.json

复制 `evidence-template.json`，每题记录一个条目。下面只展示结构，不提供任何本题答案或真实证据位置：

```json
{
  "case_id": "omniale-d6-musp-01-v1",
  "items": [
    {
      "question_id": "Q01",
      "work_id": "A",
      "audio": [
        {
          "path": "assets/example.wav",
          "start_sample": 441000,
          "end_sample": 882000,
          "description_zh": "说明此片段供学习者核查什么现象"
        }
      ],
      "score_regions": [
        {
          "page": 1,
          "bbox": [0.10, 0.20, 0.80, 0.35],
          "annotated_image": "assets/example.png",
          "description_zh": "说明图中标记了哪个位置及其作用"
        }
      ]
    }
  ]
}
```

音频的 `start_sample`、`end_sample` 是原录音中的采样帧编号：从 0 开始，起点包含、终点不包含；多声道中一帧包括所有声道的样本。起止秒数等于编号除以采样率。裁剪片段的 PCM 内容必须等于该区间原始 PCM 内容。

`page` 是原 PDF 的 1 起始页码。`bbox` 为在整张原 PDF 页面中的归一化矩形 `[x0,y0,x1,y1]`，坐标原点在左上角，范围 0—1。截图可以裁剪到该区域，但要保留辨认小节／声部所需的上下文，并在图片上实际画出标记；仅在 JSON 中填写矩形不算完成图上标注。

所有文件路径相对于 `submission/`。如一题需要多段音频或多张图，向数组继续添加。比较型问题需在说明中区分早先主题与后续再现，网页也应提供对应的独立播放入口。

正文与结构化清单中的片段、图片和答案应一致。允许复用确实支持多个问题的素材，但每题仍需有自己的条目与说明。
