#!/usr/bin/env python
"""Pack the generated 256x256 PNG into a multi-size Windows .ico.

Pillow cannot emit multi-resolution icons from separate files directly, so the
256px PNG is downscaled with LANCZOS for every size Windows Explorer uses.

Usage: python scripts/app/gen-ico.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BRANDING = ROOT / "apps" / "shared" / "branding"
SOURCE = BRANDING / "icon-256.png"
TARGET = BRANDING / "icon.ico"
SIZES = [16, 24, 32, 48, 64, 128, 256]


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    frames = [source.resize((size, size), Image.LANCZOS) for size in SIZES]
    # Pillow writes a multi-frame ICO when `append_images` is supplied for ICO.
    frames[-1].save(TARGET, format="ICO", sizes=[(s, s) for s in SIZES], append_images=frames[:-1])
    print(f"[branding] wrote {TARGET.relative_to(ROOT)} ({TARGET.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
