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
- **Themes** are token-level. Light is redefined in both a
  `prefers-color-scheme` query and a `[data-theme="light"]` block; never set a
  colour anywhere else, or one theme will render on the other's background.
- **Live player count** is fetched from `api.mcstatus.io` and degrades to the
  plain server address if that request fails.

## Deploying

GitHub Pages serves `main` from the repository root. Pushing to `main` is the
deploy.

## Note

Do not advertise a direct server address here. BrickSMP is an external server on
a lobby network, and pointing players at a direct address breaks the network's
external-server rules. `play.brickworks.world` is the only address that belongs
on this page.
