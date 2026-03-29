# Diggr TODO

## Plan

- [x] Generate a refinery sprite sheet and approval contact sheet for all sellable materials.
- [x] Convert the refinery modal from text-heavy rows to icon-first cargo cards plus a summary panel.
- [x] Replace the flat surface strip with tiled ground sprites in the terrain rendering path.
- [x] Add sprite/config/UI/rendering regressions and rerun verification.

## Review

- Added a reproducible refinery sprite generator in [generate_refinery_shop_icons.py](/Users/davis.wang/Documents/diggr/scripts/generate_refinery_shop_icons.py) that emits both the runtime icon sheet and a labeled approval contact sheet for all `9` sellable cargo types.
- Added refinery sprite metadata helpers in [content.ts](/Users/davis.wang/Documents/diggr/src/config/content.ts), including `REFINERY_TYPES` and `getRefinerySpriteFrame()`.
- Converted the refinery modal in [renderers.ts](/Users/davis.wang/Documents/diggr/src/ui/renderers.ts) from text-heavy lines into icon-first cargo cards with quantity and subtotal badges, while keeping the summary panel and `Sell All` action.
- Added supporting refinery card/icon styles in [styles.css](/Users/davis.wang/Documents/diggr/src/styles.css).
- Replaced the flat surface strip with tiled terrain art by adding decorative surface-cap frames to [generateSpriteSheets.mjs](/Users/davis.wang/Documents/diggr/scripts/generateSpriteSheets.mjs), exposing the frame helper in [rendering.ts](/Users/davis.wang/Documents/diggr/src/phaser/rendering.ts), and rendering those tiles in [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts).
- Regenerated sprite outputs:
  - [refinery-shop-icons.png](/Users/davis.wang/Documents/diggr/src/assets/sprites/refinery-shop-icons.png)
  - [refinery-shop-sprite-contact-sheet.png](/Users/davis.wang/Documents/diggr/docs/refinery-shop-sprite-contact-sheet.png)
  - [terrain-sheet.png](/Users/davis.wang/Documents/diggr/src/assets/sprites/terrain-sheet.png)
- Added regressions in [ui.test.ts](/Users/davis.wang/Documents/diggr/tests/ui.test.ts) and [rendering.test.ts](/Users/davis.wang/Documents/diggr/tests/rendering.test.ts) for refinery sprite coverage/card rendering and surface-ground frame cycling.
- Verification:
  - `python3 scripts/generate_refinery_shop_icons.py`
  - `node scripts/generateSpriteSheets.mjs`
  - `npm test`
  - `npm run build`
- Residual note: the refinery contact sheet is the approval artifact for the cargo icon family, while the live refinery UI and surface terrain already use the new art.
