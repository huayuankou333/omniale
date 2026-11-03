# 来源索引格式

提供下面结构的JSON。时间用原视频秒数，PDF页码从1开始；填写实际位置和来源。示例值仅说明格式。

```json
{
  "source": "input/tutorial.mp4",
  "steps": [{
    "id": "step-a",
    "title": "实际步骤标题",
    "pdf_pages": [1],
    "source_intervals": [[0.0, 1.0]],
    "figures": [{
      "id": "figure-a",
      "pdf_page": 1,
      "kind": "annotated_frame",
      "source_times": [0.5],
      "edits": ["实际编辑说明"]
    }],
    "author_additions": []
  }],
  "state_tracking": {
    "pdf_pages": [1],
    "stable_worker_ids": ["自定标识"],
    "checkpoints": [{
      "id": "state-a",
      "label": "实际状态说明",
      "pdf_page": 1,
      "source_times": [0.5],
      "basis": "observed",
      "figure_ids": ["figure-a"]
    }]
  },
  "resume_cards": [{
    "id": "清单中的卡号",
    "pdf_pages": [1],
    "figure_ids": ["在steps中定义的图号"],
    "source_intervals": [[0.0, 1.0]],
    "assessment": "insufficient_evidence",
    "first_action": "实际第一行动",
    "uncertainties": []
  }]
}
```

`state_tracking`记录PDF中实际采用的对象标识和状态说明，不要求固定标识名或状态数量。每组输入照片都要有对应的`resume_cards`条目。

`kind`可为`frame`、`annotated_frame`、`schematic`、`learner_frame`。视频截图的`source_times`填写实际抽帧时间；后两类可为空。练习照片引用须使用`learner_frame`及`input_asset`，值为清单中的相对路径，例如`input/learner_cards/RC01_1.png`。图号在`steps[].figures`定义，供状态与续作条目引用。

`basis`可为`observed`、`before_after_supported`、`teaching_addition`，分别用于直接观察、前后状态支持和教学补充。`assessment`可为`normal_in_progress`、`finish_pending`、`error_visible`、`insufficient_evidence`，按自己的观察填写。上述枚举不暗示任何输入照片的判断。

提供来源索引便于核对，格式检查不验证教学内容。
