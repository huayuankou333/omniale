# OmniALE · D1 Review Desk

静态案例站点：**https://huayuankou333.github.io/omniale/review/**

站点首页：https://huayuankou333.github.io/omniale/

## 发布方式

GitHub Pages 设置为 **Deploy from a branch → main → /docs**。
更新 `docs/` 并推送到 `main` 后，由 GitHub 自动构建和发布。不需要额外服务器、第三方部署服务或前端构建。

目录：

```text
docs/
  .nojekyll
  index.html                 # 站点入口
  review/
    index.html               # 任务、成绩、失败分析
    traces.html              # 可搜索与筛选的轨迹浏览器
    app.js / traces.js       # 展示逻辑
    analysis.js              # 有证据链接的案例分析
    data/                    # 分数、原始轨迹、持久化状态与审计
    media/                   # 会议视频、源素材、初始抽帧
    files/                   # SOP、真值、评分与历史失败记录
    reproduction/            # 重评分脚本及源码快照
scripts/check-site.mjs       # 无外部依赖的完整性检查
```

## 本地预览与维护

```sh
node docs/review/serve.mjs
# 打开 http://127.0.0.1:4186/

node scripts/check-site.mjs
node docs/review/reproduction/rescore.mjs
```

若替换一条模型结果，应一起更新 `data/report.json`、其对应的 `data/report.js`、模型轨迹 JSON/JS、评分、状态和审计；随后修改分析文字并运行检查。不得只改页面中的显示分数。

## 当前结果的解释

|模型|分数|来源与条件|
|---|---:|---|
|gpt-6-luna|43.60|已有完整输入基线|
|kimi-k3（API k3）|100.00|2026-10-20 本次完整输入新测|
|glm-5.3|64.73|本次仅转写与音频工具诊断，图片接口拒绝；完整输入 N/A|
|gpt-6.1-sol|100.00|已有历史运行；本次重测因服务器过载未完成|

不是四个模型同条件的新跑排行榜。输入路线是抽帧、独立 ASR 与信号工具，不是原生 Omni。合成素材、单次开发样本及接口限制均在页面显著标注。

模型调用使用的密钥与 GitHub 令牌不在此仓库中。公开真值与评分器仅用于评测后复核，不能加入被测模型输入。

布局参考：https://wang-jiahao.github.io/omniale/piano/
