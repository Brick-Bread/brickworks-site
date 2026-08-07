# brickworks.world

Website for the **BrickWorks Network** — home of BrickSMP.

`index.html` is the whole site: one self-contained file, no build step, no
dependencies, no external requests. The display face is inlined as a data URI
and the hero wall is drawn on a canvas, so the page renders identically offline.

## Editing

Open `index.html` and edit it. That's the workflow.

- **Colours** are CSS custom properties at the top of the `<style>` block. The
  accent gradient (`--ember` → `--kiln`) is taken from the server MOTD so the
  site and the in-game server list match — change both together or neither.
- **The page commits to one dark look** rather than following the viewer's
  theme. Every colour is painted explicitly, so there is no light variant to
  keep in sync; a washed-out light rendering is what the first version got
  wrong.
- **The block art** is drawn on canvas by `voxels()`, a small painter's-
  algorithm renderer. A scene is just a list of `{x, y, z, colour}` cubes run
  through `order()` so nearer cubes paint last. Two scenes use it: the hero
  island and the build plot on the server card.
- **Live player count and player heads** come from `api.mcstatus.io` and
  degrade to the plain server address if that request fails.

## Deploying

GitHub Pages serves `main` from the repository root. Pushing to `main` is the
deploy.

## Note

Do not advertise a direct server address here. BrickSMP is an external server on
a lobby network, and pointing players at a direct address breaks the network's
external-server rules. `play.brickworks.world` is the only address that belongs
on this page.
