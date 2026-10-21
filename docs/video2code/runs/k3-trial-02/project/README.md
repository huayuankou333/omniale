# 3D Brick Studio

A Three.js recreation of the brick-building web app shown in the reference recording.

## Run

Requires Node.js 22 (dependencies are vendored; no install needed):

```
npm run dev -- --host 0.0.0.0 --port 3000
```

Open http://localhost:3000/ in a browser.

## Features

- Light-gray studded 16×16 baseplate in a soft marble-gray environment with shadows.
- **Build mode** (hammer, default): a translucent yellow ghost brick follows the pointer,
  snaps to the stud grid, previews stacking on top of existing bricks (top faces) and
  side-adjacent placement (side faces). Left-click places the brick. Invalid spots hide the ghost.
- **Move mode** (cross-arrows): drag to orbit, wheel to zoom. Bricks are never moved.
- **Erase mode** (eraser): hovered brick is highlighted; click deletes it.
- Bottom toolbar: 8 color swatches (keys `1`–`8`), width/depth selectors (1–6) with popup
  menus, swap button (`s`), play ▶, and trash (clear).
- **Play mode**: hides UI, auto-rotates the camera around the set; the pause button at
  the bottom center exits back to editing.
- **Clear Set dialog**: Cancel / ✕ / backdrop keeps the model; Clear removes all bricks
  and building can continue afterwards.
- Starts with one red 2×2 brick (initial seed is not significant; use Clear to start empty).

## Shortcuts

`b` build · `m` move view · `e` erase · `s` swap width/depth · `1`–`8` colors

## Known limitations

- Undo/redo, open/save, custom color wheel and mute icons are static decoration only.
- No persistence across reloads, no physics/support rules, bricks cannot be moved once placed.
