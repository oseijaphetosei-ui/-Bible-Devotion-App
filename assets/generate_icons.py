#!/usr/bin/env python3
"""
Generate all Daily Devotion app icon assets.
Run from the project root:  python3 assets/generate_icons.py
"""
from PIL import Image, ImageDraw, ImageFilter
import math, os

# ── Brand colours ─────────────────────────────────────────────────────────────
GOLD      = (201, 169, 107)       # #C9A96B  warm gold
BG_DARK   = ( 13,  10,   7)       # #0D0A07  deep warm black
BG_MID    = ( 26,  20,  14)       # #1A140E  slightly lighter warm centre
WHITE     = (255, 255, 255)

# ── Helpers ───────────────────────────────────────────────────────────────────

def radial_bg(size: int, centre: tuple, edge: tuple) -> Image.Image:
    """Smooth radial gradient, warm centre → dark edge."""
    img = Image.new("RGB", (size, size), edge)
    cx = cy = size // 2
    draw = ImageDraw.Draw(img)
    for r in range(cx, -1, -2):          # step=2 is fast enough
        t = r / cx                        # 1 at centre, 0 at edge
        c = tuple(int(centre[i]*t + edge[i]*(1-t)) for i in range(3))
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)
    return img

def draw_cross(draw: ImageDraw.ImageDraw,
               cx: int, cy: int,
               thick: int, h_len: int, v_len: int,
               color: tuple, alpha: int = 255) -> None:
    """Two rounded-rectangle arms forming a cross."""
    r = thick // 2
    fill = (*color, alpha)
    # horizontal
    draw.rounded_rectangle([cx - h_len//2, cy - thick//2,
                             cx + h_len//2, cy + thick//2], radius=r, fill=fill)
    # vertical
    draw.rounded_rectangle([cx - thick//2, cy - v_len//2,
                             cx + thick//2, cy + v_len//2], radius=r, fill=fill)

def glow_cross(size: int, cx: int, cy: int,
               thick: int, h_len: int, v_len: int,
               blur_r: int, alpha: int) -> Image.Image:
    """A blurred cross layer for ambient glow."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_cross(ImageDraw.Draw(layer), cx, cy, thick+20, h_len, v_len, GOLD, alpha)
    return layer.filter(ImageFilter.GaussianBlur(radius=blur_r))

# ── 1. icon.png  1024 × 1024  (iOS + main expo icon) ─────────────────────────

def make_icon_1024() -> Image.Image:
    SIZE = 1024
    cx = cy = SIZE // 2
    THICK = 62          # arm thickness
    H     = 570         # horizontal arm length
    V     = 710         # vertical arm length

    base = radial_bg(SIZE, BG_MID, BG_DARK).convert("RGBA")

    # Wide ambient glow
    g1 = glow_cross(SIZE, cx, cy, THICK, H, V, blur_r=48, alpha=130)
    # Tight secondary glow
    g2 = glow_cross(SIZE, cx, cy, THICK, H, V, blur_r=16, alpha=90)
    # Sharp cross
    sharp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_cross(ImageDraw.Draw(sharp), cx, cy, THICK, H, V, GOLD, 255)

    result = Image.alpha_composite(base, g1)
    result = Image.alpha_composite(result, g2)
    result = Image.alpha_composite(result, sharp)

    # iOS must be RGB (no transparency)
    out = Image.new("RGB", (SIZE, SIZE), BG_DARK)
    out.paste(result.convert("RGB"))
    return out

# ── 2. adaptive-icon.png  1024 × 1024  (Android foreground, transparent bg) ──

def make_adaptive_1024() -> Image.Image:
    SIZE = 1024
    cx = cy = SIZE // 2
    # Use a slightly smaller cross that sits inside the Android safe zone (810 px)
    THICK = 54
    H     = 480
    V     = 600

    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    # Glow
    glow = glow_cross(SIZE, cx, cy, THICK, H, V, blur_r=36, alpha=160)
    layer = Image.alpha_composite(layer, glow)
    # Sharp cross
    sharp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_cross(ImageDraw.Draw(sharp), cx, cy, THICK, H, V, GOLD, 255)
    layer = Image.alpha_composite(layer, sharp)
    return layer

# ── 3. notification-icon.png  96 × 96  (Android notification, white) ──────────

def make_notif_96() -> Image.Image:
    SIZE = 96
    cx = cy = SIZE // 2
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_cross(ImageDraw.Draw(layer), cx, cy,
               thick=8, h_len=68, v_len=84, color=WHITE, alpha=255)
    return layer

# ── 4. splash.png  1024 × 1024  (native static splash, shown while JS loads) ──
#    The animated JS splash handles the real experience; this is just a dark bg.

def make_splash_1024() -> Image.Image:
    SIZE = 1024
    cx = cy = SIZE // 2
    THICK = 42
    H, V  = 380, 480
    base = radial_bg(SIZE, BG_MID, BG_DARK)
    # Very subtle cross silhouette so the static → animated transition is seamless
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    glow = glow_cross(SIZE, cx, cy, THICK, H, V, blur_r=40, alpha=90)
    sharp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_cross(ImageDraw.Draw(sharp), cx, cy, THICK, H, V, GOLD, 200)
    layer = Image.alpha_composite(layer, glow)
    layer = Image.alpha_composite(layer, sharp)
    out = base.convert("RGBA")
    out = Image.alpha_composite(out, layer)
    return out.convert("RGB")

# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    print("Generating icon assets…")

    icon = make_icon_1024()
    icon.save("assets/icon.png", "PNG", optimize=True)
    print(f"  ✓ assets/icon.png  ({os.path.getsize('assets/icon.png')//1024} KB)")

    adaptive = make_adaptive_1024()
    adaptive.save("assets/adaptive-icon.png", "PNG", optimize=True)
    print(f"  ✓ assets/adaptive-icon.png  ({os.path.getsize('assets/adaptive-icon.png')//1024} KB)")

    notif = make_notif_96()
    notif.save("assets/notification-icon.png", "PNG", optimize=True)
    print(f"  ✓ assets/notification-icon.png  ({os.path.getsize('assets/notification-icon.png')//1024} KB)")

    splash = make_splash_1024()
    splash.save("assets/splash.png", "PNG", optimize=True)
    print(f"  ✓ assets/splash.png  ({os.path.getsize('assets/splash.png')//1024} KB)")

    print("\nAll assets generated.")
