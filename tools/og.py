"""Render og.png (1200x630) for link previews, in the site's own palette."""
"""Run from the repo root: python3 tools/og.py"""
import os, random, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from icons import G, rows  # noqa: E402

W, H = 1200, 630
NIGHT, EMBER, BRICK, KILN, WHITE, DIM = (
    (10, 11, 20), (255, 106, 61), (194, 80, 58), (255, 200, 87),
    (255, 255, 255), (154, 160, 192))

# PIL can't open woff2 or pick a weight off a variable font, so the shipped
# webfont is decompressed and pinned to one weight per size we need.
from fontTools.ttLib import TTFont  # noqa: E402
from fontTools.varLib import instancer  # noqa: E402

MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
# The page renders this face at size-adjust:105%; match it here.
ADJUST = 1.05


def display(px, weight):
    """One static instance of the webfont, at the page's adjusted size."""
    path = os.path.join(tempfile.gettempdir(), f"bw-display-{weight}.ttf")
    if not os.path.exists(path):
        f = TTFont("fonts/bw-display.woff2")
        instancer.instantiateVariableFont(f, {"wght": weight}, inplace=True)
        f.save(path)
    return ImageFont.truetype(path, round(px * ADJUST))


def cap_top(font, y):
    """PIL draws from the ascender and this face has a very tall one, so
    headline positions are given as the top of the capitals instead."""
    return y - font.getbbox("H")[1]

img = Image.new("RGB", (W, H), NIGHT)
d = ImageDraw.Draw(img)

# warm horizon glow, painted as horizontal bands from the bottom up
for y in range(H):
    t = max(0.0, (y - H * 0.45) / (H * 0.55)) ** 2
    if t:
        d.line([(0, y), (W, y)], fill=(
            int(NIGHT[0] + (60 - NIGHT[0]) * t * 0.55),
            int(NIGHT[1] + (26 - NIGHT[1]) * t * 0.55),
            int(NIGHT[2] + (30 - NIGHT[2]) * t * 0.55)))

random.seed(7)
for _ in range(220):
    x, y = random.random() * W, random.random() * H * 0.6
    v = random.random()
    c = KILN if v > 0.85 else (232, 234, 245)
    a = 0.15 + random.random() * 0.5
    s = 3 if v > 0.93 else 2
    d.rectangle([x, y, x + s, y + s],
                fill=tuple(int(NIGHT[i] + (c[i] - NIGHT[i]) * a) for i in range(3)))


def tracked(draw, xy, text, font, fill, track=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + track
    return x


def heart(draw, x, y, cell, filled):
    """The same 16x16 mask the site's icons use, drawn as flat pixels."""
    main = EMBER if filled else (28, 32, 51)
    shade = BRICK if filled else (20, 23, 38)
    for gy, line in enumerate(rows(G["heart"])):
        for gx, ch in enumerate(line):
            if ch == ".":
                continue
            px, py = x + gx * cell, y + gy * cell
            draw.rectangle([px, py, px + cell - 1, py + cell - 1],
                           fill=main if ch == "#" else shade)


kicker = display(30, 500)
head = display(104, 700)
mono = ImageFont.truetype(MONO, 30)

PAD = 80
tracked(d, (PAD, cap_top(kicker, 74)), "BRICKWORKS NETWORK", kicker, KILN, track=9)
d.text((PAD, cap_top(head, 140)), "KILL SOMEONE.", font=head, fill=WHITE)
d.text((PAD, cap_top(head, 253)), "TAKE THEIR HEART.", font=head, fill=EMBER)

# ten hearts, six of them yours: the lifesteal ledger in one row
cell = 4
hw = 16 * cell
for i in range(10):
    heart(d, PAD + i * (hw + 18), 400, cell, i < 6)

d.text((PAD, 500), "Java lifesteal  ·  no claims  ·  griefing allowed",
       font=mono, fill=DIM)

chip = [PAD, 548, PAD + int(d.textlength("play.brickworks.world", font=mono)) + 44, 610]
d.rectangle(chip, fill=(22, 26, 43))
d.rectangle(chip, outline=(39, 45, 69), width=2)
d.text((PAD + 22, 562), "play.brickworks.world", font=mono, fill=WHITE)

img.save("og.png", optimize=True)
print("wrote og.png", img.size)
