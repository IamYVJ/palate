"""Generate Palate's app icons (PNG) with no dependencies beyond the standard library.

The design matches icon.svg: a cream plate on a paprika tile, drawn in a 64-unit space.
Shapes are rendered with signed-distance antialiasing.

    python scripts/make-icons.py
"""

import math
import struct
import zlib
from pathlib import Path

PAPRIKA = (0xB4, 0x44, 0x2A)
CREAM = (0xFA, 0xF6, 0xF0)
OUT = Path(__file__).resolve().parent.parent / "icons"


def rounded_rect_sd(x, y, half, radius):
    # Signed distance to a square of half-size `half` centred on (32, 32) with rounded corners.
    qx = abs(x - 32) - (half - radius)
    qy = abs(y - 32) - (half - radius)
    outside = math.hypot(max(qx, 0), max(qy, 0))
    inside = min(max(qx, qy), 0)
    return outside + inside - radius


def coverage(sd_units, scale):
    return min(max(0.5 - sd_units * scale, 0.0), 1.0)


def render(size, full_bleed, plate_scale=1.0):
    scale = size / 64  # pixels per unit
    rows = []
    for py in range(size):
        row = bytearray([0])  # PNG filter: none
        for px in range(size):
            x = (px + 0.5) / scale
            y = (py + 0.5) / scale
            bg = 1.0 if full_bleed else coverage(rounded_rect_sd(x, y, 32, 15), scale)
            d = math.hypot(x - 32, y - 32) / plate_scale
            ring = coverage((abs(d - 19) - 1.75) * plate_scale, scale)
            disc = coverage((d - 11) * plate_scale, scale)
            fg = max(ring, disc)
            if bg == 0:
                row += b"\0\0\0\0"
                continue
            rgb = [round(p * (1 - fg) + c * fg) for p, c in zip(PAPRIKA, CREAM)]
            row += bytes(rgb) + bytes([round(bg * 255)])
        rows.append(bytes(row))
    return png(size, b"".join(rows))


def png(size, raw):
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def main():
    OUT.mkdir(exist_ok=True)
    icons = {
        "icon-192.png": render(192, full_bleed=False),
        "icon-512.png": render(512, full_bleed=False),
        # Maskable icons get cropped to a circle/squircle by the OS: full bleed, plate kept inside the safe zone.
        "icon-maskable-512.png": render(512, full_bleed=True, plate_scale=0.9),
        # iOS rounds the corners itself and turns transparency black, so this one is full bleed too.
        "apple-touch-icon.png": render(180, full_bleed=True),
    }
    for name, data in icons.items():
        (OUT / name).write_bytes(data)
        print(f"wrote icons/{name} ({len(data):,} bytes)")


if __name__ == "__main__":
    main()
