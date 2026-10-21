# Video2Code — Flowboard / Release readiness

Recreate the working website demonstrated in `inputs/demo.mp4`. Deliver a runnable local frontend, not an explanation, screenshot sequence, or video player. The input video is the primary specification for appearance and behavior. The initial board contains Proposal → Review → Release and the heading “Release readiness / Q4”. The public timestamped chapter list is in `chapters.json`.

The 1440×900, approximately 133-second silent recording is an original workflow using an Excalidraw-based reference. Reimplement the demonstrated subset from the video; the reference code and editor package are not available to you. You may use HTML/CSS/JS, Canvas or SVG. A local Virgil font asset is supplied to all models at `/assets/Virgil-Regular.woff2`; Arial is available for UI text. An existing trusted static server is provided. Do not depend on outside networks or a hosted editor. Do not change package.json, server.mjs, assets, or vendor files. Frontend files are editable.

Required: select/move/resize rectangles and bound labels; edit two-line text; colors; marquee selection; grouping, duplication and ungrouping with independent connected objects; arrow endpoints following moved/resized nodes; create a background rectangle, send it behind, lock it; undo, redo and invalidation of a redo branch after a new edit; group deletion and atomic undo; zoom/pan with correct hit testing; snapshot save/restore; reset cancellation; editable JSON export/import; error handling; reload persistence; continued editing after recovery.

Public interaction conventions:
- V selection, R rectangle, Space-drag pans; double-click a node edits its label.
- Ctrl+G group; Ctrl+Shift+G ungroup; Ctrl+D duplicate; Delete removes selection.
- Ctrl+Z undo; Ctrl+Shift+Z redo; Ctrl+Shift+[ send behind; Ctrl+Shift+L lock/unlock.
- Dragging is one undoable action. A new edit after Undo discards the previous redo branch. Restore is undoable, as its dialog says. Cancel changes nothing.
- Invalid JSON syntax and invalid document structure must show an error and preserve the current document. Import replaces the board atomically; importing the same document twice must not duplicate it.
- Your export format may differ from the reference JSON, but your own Export → Import must preserve editable objects, text, groups, bindings, order, styles and lock state. A bitmap is insufficient. Saved snapshots are independent from current auto-saved edits and survive Reset, Import and Reload. Reload must preserve current content and viewport; selection/history need not survive reload.
- Pointer/keyboard focus inside dialogs must not modify the underlying board. Equivalent accessible controls may accompany shortcuts.

Only the demonstrated/publicly specified subset is graded. Other visible Excalidraw toolbar tools, Library, collaboration, external sharing and non-demonstrated menus are not required. The bottom RECORDER caption and purple pointer are recording aids and must not be reproduced. There is no audio task.

Evaluation: execution 8, editing 14, relationships 20, history 14, recovery 18, navigation 6, appearance 20. Function checks use real browser actions and repeat some demonstrated operations with different short labels, nodes, colors and drag distances. They test the same disclosed semantics. Appearance is judged at multiple intermediate states, not only the first screenshot. Both success paths and cancellation/recovery are tested.

Budget: 15 logical model turns, 120 tool calls, 256 reference frames and 120 own-page screenshots. The initial 12 reference frames count toward the frame budget. Request additional video frames at any valid timestamp. All four models receive the same assets, tools, frames and budgets. Build and test within that budget; finish with what you implemented and any known limitations.
