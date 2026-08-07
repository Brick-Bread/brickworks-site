# brickworks.world

Website for the **BrickWorks Network** — home of BrickSMP.

`index.html` is the site: hand-written HTML with the CSS and JS inline, no build
step and no dependencies. Two files sit beside it — `fonts/bw-display.woff2`
(the display face, subset to the glyphs the page uses) and `og.png` (the link
preview). Nothing else is fetched except the live player count.

## Editing

Open `index.html` and edit it. That's the workflow.

- **Colours** are CSS custom properties at the top of the `<style>` block. The
  accent gradient (`--ember` → `--kiln`) is taken from the server MOTD so the
  site and the in-game server list match — change both together or neither.
- **The page commits to one dark look** rather than following the viewer's
  theme. Every colour is painted explicitly, so there is no light variant to
  keep in sync; a washed-out light rendering is what the first version got
  wrong.
- **The heart ledger** in the hero is the page's one signature element: twenty
  slots, ten filled, and a single scripted pass on load showing a kill adding a
  heart and a death taking it back. It sits still under `prefers-reduced-motion`.
- **The pixel icons** (hearts, feature tiles, `og.png`) all come from one set of
  16x16 masks in `tools/icons.py`, which prints an SVG sprite. Edit a mask as
  ASCII art, re-run it, and paste the sprite back into `index.html`.
- **The block art** on the server card is drawn on canvas by `voxels()`, a small
  painter's-algorithm renderer. A scene is a list of `{x, y, z, colour}` cubes
  run through `order()` so nearer cubes paint last.
- **Live player count and player heads** come from `api.mcstatus.io` and
  degrade to the plain server address if that request fails.

## Updates

`updates.json` drives the Updates section. Newest first is handled for you, so
just add an object and push:

```json
{ "date": "2026-08-09", "title": "Short headline", "body": "A sentence or two." }
```

## Status

`tools/status.py` runs **on the box**, pings the proxy, the limbo and BrickSMP,
reads the host's uptime, and writes `status.json` into the web root. A systemd
timer runs it every minute.

It deliberately runs server-side rather than from the visitor's browser: the
servers only listen on the box's own address, and BrickSMP is an external server
on a lobby network whose rules forbid advertising a direct join address. Nothing
in the JSON names a host or a port.

The proxy check sends a **PROXY protocol v1 header** first. Velocity has
`haproxy-protocol = true`, so a plain connection is dropped with no response and
the proxy would always look down.

Anywhere `status.json` is missing (the GitHub Pages mirror, a local checkout)
the section says so instead of breaking.

## Deploying

Two places serve this:

- **brickworks.world** — the real one. nginx serves `/var/www/brickworks`. The
  apex vhost lives in `/etc/nginx/conf.d/matrix.conf` and also answers
  `/.well-known/matrix/*` for the Matrix homeserver; those are exact-match
  locations so they outrank the site's `location /`. Don't remove them.
- **GitHub Pages** — a mirror at `brick-bread.github.io/brickworks-site`.
  Pushing to `main` deploys it. No live status there. Asset paths are relative so
  the subpath works; only the `og:image` is absolute, and it deliberately points
  at brickworks.world so shared links preview the real site.

## Note

Do not advertise a direct server address here. BrickSMP is an external server on
a lobby network, and pointing players at a direct address breaks the network's
external-server rules. `play.brickworks.world` is the only address that belongs
on this page.
