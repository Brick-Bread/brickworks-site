# brickworks.world

Website for the **BrickWorks Network** — home of BrickSMP.

Static site, no build step and no dependencies: `index.html` is the structure,
`assets/site.css` the design, `assets/site.js` the behaviour. Beside them sit
two self-hosted font subsets in `fonts/` and `og.png` (the link preview).
Nothing else is fetched except the live player count.

## The design

The page draws in the game's own UI language, taken seriously:

- **One dark look, painted explicitly.** Obsidian purple-black grounds
  (`--void`, `--obsidian`, `--slab`), warm bone text — never navy, never
  blue-white. There is no light variant to keep in sync. Every text tone
  clears 4.5:1 on every ground it sits on.
- **The accent gradient (`--ember` → `--kiln`) is taken from the server MOTD**
  so the site and the in-game server list match — change both together or
  neither. Heart-red (`--heart`) carries everything lifesteal; XP green
  (`--xp`) means "online" and nothing else.
- **Minecraft's two border treatments, and no others**: a raised bevel
  (`--bevel-up`) for things you press, a sunken slot (`--bevel-slot`) for
  things that hold something. Corners are square everywhere because the game
  has none. Headlines carry the game's hard one-step text shadow.
- **Section eyebrows are the in-game commands they correspond to**
  (`/features`, `/rules`, `/status`), set in the mono face.
- **The heart ledger** in the hero is the signature element: twenty slots, ten
  filled, and the server's three moves — land a kill, get killed, `/withdraw` —
  as working buttons. A short scripted beat plays on load until the visitor
  takes over; under `prefers-reduced-motion` it sits still.
- **The server-list row** under the hero CTA is the multiplayer screen entry,
  wired to the live player count. The kill feed below the hero is decorative,
  in the game's death-message grammar, with invented names.

## Fonts

Two subset variable fonts, self-hosted:

- `fonts/bw-display.woff2` — **Bricolage Grotesque**, weight axis clipped to
  400–800 with its optical axis kept, Latin-1 subset. Headlines at 800,
  sentence case.
- `fonts/bw-mono.woff2` — **JetBrains Mono**, 400–700, same subset. Carries
  everything the game itself would render: commands, the kill feed, counts,
  timestamps.

Rebuild either from the upstream variable font with fontTools:

```
python3 -c "from fontTools.ttLib import TTFont; from fontTools.varLib import \
  instancer; f = TTFont('BricolageGrotesque[opsz,wght].ttf'); \
  instancer.instantiateVariableFont(f, {'wght': (400, 800)}, inplace=True); \
  f.save('clipped.ttf')"
python3 -m fontTools.subset clipped.ttf \
  --unicodes='U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+00B7,U+00D7,U+2190,U+2192,U+2715' \
  --layout-features='kern,liga,ccmp,mark,mkmk,locl' \
  --flavor=woff2 --output-file=fonts/bw-display.woff2
```

Re-run `python3 tools/og.py` after any font change; the card uses the same file.

## Pixel icons

The hearts, the feature-tile icons, the favicon and `og.png` all come from one
set of 16x16 masks in `tools/icons.py`, which prints an SVG sprite. Edit a mask
as ASCII art, re-run it, and paste the sprite back into `index.html`. Icon
colours are set per context with the `--i-a`/`--i-b` custom properties —
selectors can't reach inside a `<use>` clone, but custom properties inherit
through it.

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

## Live player count

The server-list row and player heads come from `api.mcstatus.io` and
`mc-heads.net`, and degrade to a still picture of the row if those requests
fail.

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
