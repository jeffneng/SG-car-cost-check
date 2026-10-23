#!/usr/bin/env python3
"""Draw site/preview.png (1200x630), the image shown when the link is shared on WhatsApp etc."""
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
img = Image.new("RGB", (W, H), "#12233f")
d = ImageDraw.Draw(img)
F = "/System/Library/Fonts/Helvetica.ttc"
font = lambda size, idx=0: ImageFont.truetype(F, size, index=idx)   # idx 1 = bold

d.rectangle([0, 0, 14, H], fill="#e0b445")
d.text((70, 90), "SG Car Cost Check", font=font(84, 1), fill="#ffffff")
d.text((70, 205), "What does your car really cost?", font=font(46), fill="#cfd9ec")
d.text((70, 270), "Basic cost + COE = room to negotiate with the dealer", font=font(36), fill="#e0b445")

# cost-mix bar motif (OMV / excise+GST / ARF / COE)
x, y, bw, bh = 70, 380, 1060, 34
for share, col in [(0.16, "#7f9bc4"), (0.05, "#d6a742"), (0.17, "#6fb08f"), (0.62, "#c06a6a")]:
    w = int(bw * share); d.rectangle([x, y, x + w, y + bh], fill=col); x += w
for i, (t, col) in enumerate([("OMV", "#7f9bc4"), ("Excise + GST", "#d6a742"), ("ARF", "#6fb08f"), ("COE", "#c06a6a")]):
    lx = 70 + i * 230
    d.rectangle([lx, 440, lx + 18, 458], fill=col); d.text((lx + 28, 434), t, font=font(26), fill="#cfd9ec")

d.text((70, 530), "Compare up to 3 models  ·  Cat A & B  ·  For research and education only", font=font(28), fill="#9fb0cf")
img.save("site/preview.png", optimize=True)
print("wrote site/preview.png")
