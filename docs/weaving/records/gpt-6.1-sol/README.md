# gpt-6.1-sol · Case 6B 2.1.0

tutorial.pdf 与 evidence_map.json 为模型原始提交，字节哈希未变。pages/ 为最终PDF的网页阅读派生图。
trajectory.json 保留全部实际工具调用、公开动作说明、参数、结果与错误。observations/ 仅含仍留存且写入时间与最后一次观察相符的工具图片；thumbnails/ 仅用于网页。请求日志省略base64，被覆盖的中间渲染图明确标为available=false，不以最终图代替。
initial_prompt.txt 仅对本机路径作替换，其余公开题目和工具说明对应实际首请求。
不包含模型内部推理、原始API响应、认证信息或私有评审材料。结果和工具轨迹是评后记录，不能作为再次评测的候选输入。
