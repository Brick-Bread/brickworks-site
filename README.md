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

## Updates

`updates.json` drives the Updates section. Newest first is handled for you, so
just add an object and push:

```json
{ "date": "2026-08-09", "title": "Short headline", "body": "A sentence or two." }
```

## Status

`tools/status.py` runs **on the box**, pings the proxy, the limbo and BrickSMP,
reads the host's own CPU/memory/disk, and writes `status.json` into the web
root. A systemd timer runs it every minute.

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
  Pushing to `main` deploys it. No live status there.

## Note

Do not advertise a direct server address here. BrickSMP is an external server on
a lobby network, and pointing players at a direct address breaks the network's
external-server rules. `play.brickworks.world` is the only address that belongs
on this page.
