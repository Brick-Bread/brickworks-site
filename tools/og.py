"""Render og.png (1200x630) for link previews, in the site's own palette."""
"""Run from the repo root: python3 tools/og.py"""
import os, random, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from icons import G, rows  # noqa: E402

W, H = 1200, 630
VOID, HEART, BLOOD, EMBER, KILN, BONE, ASH = (
    (13, 8, 13), (255, 77, 87), (196, 43, 68), (255, 106, 61),
    (255, 200, 87), (244, 236, 226), (185, 169, 190))
SLAB, SEAM = (32, 22, 38), (58, 42, 68)

# PIL can't open woff2 or pick a weight off a variable font, so the shipped
# webfont is decompressed and pinned to one weight per size we need.
from fontTools.ttLib import TTFont  # noqa: E402
from fontTools.varLib import instancer  # noqa: E402

MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def display(px, weight):
    """One static instance of the webfont."""
    path = os.path.join(tempfile.gettempdir(), f"bw-display-{weight}.ttf")
    if not os.path.exists(path):
        f = TTFont("fonts/bw-display.woff2")
        instancer.instantiateVariableFont(f, {"wght": weight}, inplace=True)
        f.save(path)
    return ImageFont.truetype(path, px)


def cap_top(font, y):
    """PIL draws from the ascender; headline positions are given as the top
    of the capitals instead."""
    return y - font.getbbox("H")[1]


img = Image.new("RGB", (W, H), VOID)
d = ImageDraw.Draw(img)

# ember horizon glow, painted as horizontal bands from the bottom up
for y in range(H):
    t = max(0.0, (y - H * 0.45) / (H * 0.55)) ** 2
    if t:
        d.line([(0, y), (W, y)], fill=(
            int(VOID[0] + (72 - VOID[0]) * t * 0.55),
            int(VOID[1] + (24 - VOID[1]) * t * 0.55),
            int(VOID[2] + (22 - VOID[2]) * t * 0.55)))

random.seed(7)
for _ in range(200):
    x, y = random.random() * W, random.random() * H * 0.6
    v = random.random()
    c = KILN if v > 0.85 else BONE
    a = 0.12 + random.random() * 0.45
    s = 3 if v > 0.93 else 2
    d.rectangle([x, y, x + s, y + s],
                fill=tuple(int(VOID[i] + (c[i] - VOID[i]) * a) for i in range(3)))


def headline(xy, text, font, fill):
    """The site's hard one-step text shadow, then the text."""
    x, y = xy
    d.text((x + 5, y + 6), text, font=font, fill=(0, 0, 0))
    d.text((x, y), text, font=font, fill=fill)


def fit(text, weight, px, max_w):
    """Largest instance of the face, at most px, that keeps text inside max_w."""
    while px > 40:
        font = display(px, weight)
        if d.textlength(text, font=font) <= max_w:
            return font
        px -= 2
    return display(px, weight)


def heart(draw, x, y, cell, filled):
    """The same 16x16 mask the site's icons use, drawn as flat pixels."""
    main = HEART if filled else (36, 26, 41)
    shade = BLOOD if filled else (26, 18, 32)
    for gy, line in enumerate(rows(G["heart"])):
        for gx, ch in enumerate(line):
            if ch == ".":
                continue
            px, py = x + gx * cell, y + gy * cell
            draw.rectangle([px, py, px + cell - 1, py + cell - 1],
                           fill=main if ch == "#" else shade)


PAD = 80
mono = ImageFont.truetype(MONO, 30)
kicker = ImageFont.truetype(MONO, 28)

d.text((PAD, 52), "> brickworks.world", font=kicker, fill=KILN)

# sentence case, weight 800: the site's headline verbatim
head = fit("Take their heart.", 800, 108, W - 2 * PAD)
headline((PAD, cap_top(head, 136)), "Kill someone.", head, BONE)
headline((PAD, cap_top(head, 256)), "Take their heart.", head, HEART)

# ten hearts, six of them yours: the lifesteal ledger in one row
cell = 4
hw = 16 * cell
for i in range(10):
    heart(d, PAD + i * (hw + 18), 400, cell, i < 6)

d.text((PAD, 500), "Java lifesteal  ·  no claims  ·  griefing allowed",
       font=mono, fill=ASH)

chip = [PAD, 548, PAD + int(d.textlength("play.brickworks.world", font=mono)) + 44, 610]
d.rectangle(chip, fill=SLAB)
d.rectangle(chip, outline=SEAM, width=2)
d.text((PAD + 22, 562), "play.brickworks.world", font=mono, fill=BONE)

img.save("og.png", optimize=True)
print("wrote og.png", img.size)
