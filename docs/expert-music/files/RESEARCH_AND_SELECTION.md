# 专家题来源和选择理由

本题不再沿用URMP自编基础定位题。所有20题均从已发布数据中的真实问题迁移，并使用这些问题本身的原始录音、谱面和作者答案。

- MuSP-Bench（bryel-labs/MuSP-Bench，固定revision ebb8fdc0d0f49d427e48b15f257fa39056b5e525；论文 https://arxiv.org/html/2608.28212v3 ，数据 https://huggingface.co/datasets/bryel-labs/MuSP-Bench ）：12道原生S&P题，5部钢琴作品。问题要求区分谱面符号与实际演奏，涵盖真实断奏、和弦音发声顺序、弱音踏板、音色转变、渐强、rubato。没有官方逐题Hard标签，不能冒称12题全是官方Hard。
- HumMusQA（Weck et al., 2026；论文 https://aclanthology.org/2026.nlp4musa-1.9/ ，官方数据 https://zenodo.org/records/18462524 ，DOI 10.5281/zenodo.18462524）：选8道官方Difficulty=High的人工原题，涵盖metric modulation、调外音、和声音程、Phrygian、ii–V–I、C6、终止式与outside playing。保留全部原始干扰项，固定重排字母。

逐题来源、原题ID、记录行、音轨、标签、作者正确答案及许可证分别在question-map.json、answer-key.json与source-manifest.json中，可逐项人工核对。对本20题子集没有已发表的逐模型得分，不能用原论文全量结果替代难度证据。

选择已有专家题并不自动证明特定模型必然低分。仍需真实听音工具验收、同模型同预算基线、文本/谱面/音频消融和音乐从业者抽查。中文为辅助翻译，所有核心音乐问答均为作者原题；本次未新增AI编造的音乐真值。
