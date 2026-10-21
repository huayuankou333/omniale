> 历史登记文档：以下正文保留设计/试测开始时的约定，部分状态已由后续修订取代。2026-10-21 已完成两份有效输出：Luna 67.00、Sol 93.56；GLM-5.3-Flash与Kimi因接口故障为N/A。最终judge为Sol+Luna；统一15轮，但不保证相同token。当前状态请看 [实际协议](../PROTOCOL_EFFECTIVE.json)、[本轮结果](../results.json) 和 [复现说明](../README.md)。独立参考认证及三次重复试验仍未完成。

# Native-image pilot, registered before candidate generation

- One trial each, order GLM-5.3-Flash, GPT-6-Luna, Kimi-K3 (gateway k3), GPT-6.1-Sol. No best/worst selection.
- Same 12 initial full-resolution frames; exact-frame extraction and own-page raw screenshots available to every candidate. 15 logical model turns, 120 tool calls, the original token/frame budgets.
- The original 100-point rubric and 43 assertions are unchanged. Judge models: gpt-6.1-sol and k3; independent blind calls. They are also two candidate families, a limitation disclosed in the report.
- A primary-agent operator replays the frozen S00–S10 via visible controls and screenshots, recording coordinates/actions/video. No candidate internals establish functional credit. Source may only diagnose failures after browser observations.
- Each judge sees the same anonymous evidence, original checklist, and reference images, with no target score or candidate identity. Judge raw outputs retained. Disagreements receive primary-agent evidence review, explicitly labelled agent adjudication rather than human review.
- This is an initial pilot, not the proposed three-trial calibration study. A separately built, independently human-verified full reference implementation is not available. Thus no claim that the entire benchmark has been independently certified or that mean model performance is below a threshold.
- Runner preflight checks image understanding and function-call round trip for all four exact gateway IDs. Browser smoke checks real clicks, offline Three.js modules, path rejection, and network blocking.
- Infrastructure failures are N/A. Candidate code failures may receive zero only with observed code/runtime failure evidence. Unresolved or missing evidence leaves the overall score N/A.
- No posterior rubric changes or substitutions of models. Correcting an evaluator transport defect is recorded and applied to every affected model equally.
