#!/usr/bin/env python3
"""Prepare the Stage 1B bridge scene background and foreground occlusion layer."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


TARGET_SIZE = (576, 448)


def fill_with_mirrored_texture(
    image: Image.Image,
    box: tuple[int, int, int, int],
    texture: Image.Image,
) -> None:
    """Fill a map-aligned rectangle without introducing stretched pixels."""

    left, top, right, bottom = box
    tile_width, tile_height = texture.size
    row = 0
    for y in range(top, bottom, tile_height):
        column = 0
        for x in range(left, right, tile_width):
            tile = texture
            if column % 2:
                tile = ImageOps.mirror(tile)
            if row % 2:
                tile = ImageOps.flip(tile)
            crop_width = min(tile_width, right - x)
            crop_height = min(tile_height, bottom - y)
            image.paste(tile.crop((0, 0, crop_width, crop_height)), (x, y))
            column += 1
        row += 1


def draw_aligned_landmarks(background: Image.Image) -> Image.Image:
    """Snap visible Stage 1B landmarks to the unchanged 18×14 collision map."""

    aligned = background.copy()

    # Samples are taken before any replacement so the corrected regions keep
    # the same palette and texture language as the generated source.
    grass = background.crop((326, 104, 382, 160))
    water = background.crop((464, 384, 528, 448))
    path = background.crop((100, 324, 124, 348))
    plaza = background.crop((150, 112, 314, 242))
    bridge = background.crop((360, 280, 520, 380))
    bakery = background.crop((4, 28, 180, 164))
    tree = background.crop((0, 230, 90, 380))

    # Remove water, the large decorative tree, and the closed upper cottage
    # from walkable cells. The river then starts exactly at column 12 / row 8.
    fill_with_mirrored_texture(aligned, (0, 24, 192, 176), grass)
    fill_with_mirrored_texture(aligned, (384, 0, 576, 256), grass)
    fill_with_mirrored_texture(aligned, (320, 256, 384, 288), grass)
    fill_with_mirrored_texture(aligned, (256, 288, 384, 448), grass)
    fill_with_mirrored_texture(aligned, (264, 16, 366, 116), grass)
    fill_with_mirrored_texture(aligned, (384, 256, 576, 448), water)

    bakery_mask = Image.new("L", bakery.size, 0)
    bakery_mask_draw = ImageDraw.Draw(bakery_mask)
    bakery_mask_draw.polygon(
        (
            (10, 7),
            (171, 7),
            (175, 58),
            (171, 58),
            (171, 122),
            (158, 122),
            (158, 135),
            (28, 135),
            (28, 125),
            (5, 125),
            (5, 68),
            (14, 68),
            (14, 24),
        ),
        fill=255,
    )
    bakery = bakery.resize((144, 136), Image.Resampling.LANCZOS)
    bakery_mask = bakery_mask.resize((144, 136), Image.Resampling.LANCZOS)
    aligned.paste(bakery, (24, 28), bakery_mask)

    # Reinforce the original path and plaza cells. Extra ground decoration can
    # remain organic, but the route used by the story reads unambiguously.
    path_tiles = {
        *((2, y) for y in range(8, 14)),
        *((x, 8) for x in range(2, 12)),
        *((11, y) for y in range(8, 11)),
        *((x, 6) for x in range(4, 7)),
        *((7, y) for y in range(4, 6)),
    }
    for index, (tile_x, tile_y) in enumerate(sorted(path_tiles)):
        tile = ImageOps.fit(
            path,
            (32, 32),
            method=Image.Resampling.NEAREST,
            centering=((index % 3) / 2, ((index // 3) % 3) / 2),
        )
        if index % 2:
            tile = ImageOps.mirror(tile)
        aligned.paste(tile, (tile_x * 32, tile_y * 32))

    aligned.paste(
        ImageOps.fit(
            plaza,
            (128, 96),
            method=Image.Resampling.LANCZOS,
            centering=(0.55, 0.6),
        ),
        (192, 160),
    )

    # The original tree collision covers columns 0–1 / rows 9–10. Lift the
    # source tree slightly from the dark grass so those solid cells remain
    # unmistakably occupied without changing their collision.
    tree_mask = Image.new("L", tree.size, 0)
    tree_mask_draw = ImageDraw.Draw(tree_mask)
    tree_mask_draw.polygon(
        (
            (0, 23),
            (14, 12),
            (45, 10),
            (61, 28),
            (61, 73),
            (49, 94),
            (40, 122),
            (23, 122),
            (18, 94),
            (0, 82),
        ),
        fill=255,
    )
    tree = ImageEnhance.Contrast(tree).enhance(1.12)
    tree = ImageEnhance.Brightness(tree).enhance(1.07)
    aligned.paste(tree, (0, 230), tree_mask)

    draw = ImageDraw.Draw(aligned)

    # Give the path and plaza irregular pixel edges while keeping every
    # walkable corridor inside its authoritative logical cells.
    edge_colors = ("#7f8052", "#70774a", "#8b8b58")
    for index, (x, y) in enumerate(
        (
            (64, 259),
            (93, 276),
            (126, 258),
            (159, 284),
            (222, 258),
            (287, 284),
            (350, 259),
            (68, 319),
            (92, 351),
            (68, 415),
            (222, 130),
            (252, 181),
            (194, 162),
            (316, 221),
        ),
    ):
        draw.rectangle((x, y, x + 3 + index % 4, y + 1), fill=edge_colors[index % 3])

    # The bridge is extracted from the source art, narrowed to the old four
    # logical cells, and placed so its deck is exactly on row 10.
    bridge_mask = Image.new("L", bridge.size, 0)
    bridge_mask_draw = ImageDraw.Draw(bridge_mask)
    bridge_mask_draw.polygon(
        (
            (5, 4),
            (157, 4),
            (157, 99),
            (5, 99),
            (5, 68),
            (10, 68),
            (10, 28),
            (5, 28),
        ),
        fill=255,
    )
    bridge = bridge.resize((140, 96), Image.Resampling.LANCZOS)
    bridge_mask = bridge_mask.resize((140, 96), Image.Resampling.LANCZOS)
    aligned.paste(bridge, (346, 282), bridge_mask)

    # A hard visual stop at the right edge prevents the bridge from suggesting
    # a fifth walkable tile.
    draw = ImageDraw.Draw(aligned)
    draw.rectangle((478, 313, 483, 367), fill="#352828")
    draw.rectangle((480, 315, 481, 365), fill="#9b6845")
    draw.rectangle((475, 309, 486, 316), fill="#442e2b")
    draw.rectangle((476, 310, 484, 312), fill="#b27a4c")

    # Collision landmarks that were abstract rectangles in v0.3 become small
    # readable props, anchored inside the same occupied logical tiles.
    # Notice board: tile 8,4.
    draw.rectangle((260, 132, 284, 137), fill="#49322d")
    draw.rectangle((258, 136, 286, 154), fill="#765038")
    draw.rectangle((261, 139, 283, 151), fill="#c89e65")
    draw.rectangle((264, 141, 280, 149), fill="#e8d3a5")
    draw.rectangle((266, 143, 277, 144), fill="#a77c58")
    draw.rectangle((278, 141, 280, 143), fill="#bd6359")
    draw.rectangle((261, 153, 264, 160), fill="#49322d")
    draw.rectangle((280, 153, 283, 160), fill="#49322d")
    draw.rectangle((257, 130, 287, 134), fill="#382b2b")
    draw.rectangle((260, 130, 284, 131), fill="#a36f48")

    # Outdoor preparation table: tile 9,7.
    draw.rectangle((290, 232, 317, 248), fill="#3f2d2a")
    draw.rectangle((292, 229, 315, 242), fill="#805439")
    draw.rectangle((294, 231, 313, 238), fill="#b37b4d")
    draw.rectangle((296, 226, 304, 232), fill="#d4a25d")
    draw.rectangle((305, 227, 313, 232), fill="#98704c")
    draw.rectangle((294, 241, 298, 255), fill="#49312b")
    draw.rectangle((309, 241, 313, 255), fill="#49312b")
    draw.rectangle((296, 242, 311, 244), fill="#6a4433")

    # Village gate marker: tile 1,12. It closes the solid tile while the
    # adjacent path remains visibly open.
    draw.rectangle((36, 386, 43, 416), fill="#3b2c2b")
    draw.rectangle((53, 386, 60, 416), fill="#3b2c2b")
    draw.rectangle((33, 384, 63, 391), fill="#432f2d")
    draw.rectangle((36, 382, 60, 386), fill="#9d6c47")
    draw.rectangle((39, 389, 42, 412), fill="#a9754d")
    draw.rectangle((54, 389, 57, 412), fill="#a9754d")
    draw.rectangle((43, 390, 53, 401), fill="#6f4936")
    draw.rectangle((45, 392, 51, 399), fill="#d0ac6e")

    # Pixel-scale shoreline stones make the water collision boundary explicit.
    stone_palette = ("#303746", "#414655", "#5c5968", "#222a36")
    for index, y in enumerate(range(258, 448, 18)):
        if 302 <= y <= 374:
            continue
        width = 12 + (index % 3) * 3
        left = 382 - (index % 2) * 3
        draw.rectangle((left, y + 3, left + width, y + 11), fill=stone_palette[0])
        draw.rectangle((left + 2, y, left + width - 2, y + 8), fill=stone_palette[1])
        draw.rectangle((left + 4, y + 1, left + width - 4, y + 3), fill=stone_palette[2])
        draw.rectangle((left + width - 2, y + 7, left + width + 1, y + 11), fill=stone_palette[3])

    for index, x in enumerate((490, 508, 529, 549, 568)):
        width = (19, 23, 20, 22, 18)[index]
        top = 248 + index % 3
        right = min(575, x + width)
        draw.polygon(
            (
                (x, 263),
                (x + 2, top + 5),
                (x + 7, top),
                (right - 5, top + 1),
                (right, top + 7),
                (right - 2, 264),
            ),
            fill=stone_palette[3],
        )
        draw.polygon(
            (
                (x + 2, 259),
                (x + 5, top + 4),
                (x + 9, top + 2),
                (right - 6, top + 3),
                (right - 2, 258),
            ),
            fill=stone_palette[1],
        )
        draw.line((x + 8, top + 3, right - 7, top + 4), fill=stone_palette[2], width=2)
        if index % 2 == 0:
            draw.line((x + 4, top, x + 1, top - 10), fill="#526f55", width=2)
            draw.line((x + 7, top + 1, x + 10, top - 8), fill="#6f8b5d", width=2)

    # Restore small, crisp water highlights after the texture tiling.
    for index, (x, y, width) in enumerate(
        (
            (410, 274, 18),
            (505, 288, 28),
            (522, 314, 16),
            (498, 350, 24),
            (420, 386, 22),
            (530, 416, 26),
        ),
    ):
        draw.rectangle((x, y, x + width, y + 1), fill="#39799a")
        if index % 2:
            draw.rectangle((x + 6, y + 4, x + width - 5, y + 5), fill="#d0956e")

    return aligned


def build_foreground(background: Image.Image) -> Image.Image:
    """Extract scene pieces that must render over characters."""

    mask = Image.new("L", TARGET_SIZE, 0)
    draw = ImageDraw.Draw(mask)

    # Row 1 stays walkable in the original map. Repainting the bakery roof in
    # the foreground makes characters on that row read as passing behind the
    # building instead of walking over its tiles.
    draw.polygon(
        (
            (35, 34),
            (158, 34),
            (165, 43),
            (165, 98),
            (33, 98),
            (33, 44),
        ),
        fill=255,
    )

    # The crown overhangs row 8; characters may pass behind it, while its
    # trunk remains protected by the unchanged row 9–10 solid cells.
    draw.polygon(
        (
            (0, 248),
            (14, 240),
            (46, 240),
            (62, 258),
            (62, 317),
            (48, 326),
            (20, 322),
            (0, 311),
        ),
        fill=255,
    )

    # The horizontal front rail crosses the player's feet on logical row 10.
    draw.rectangle((348, 345, 480, 368), fill=255)

    # Preserve the four principal foreground posts without making the whole
    # bridge deck opaque above characters.
    for box in (
        (352, 332, 367, 378),
        (380, 334, 394, 378),
        (418, 334, 432, 378),
        (456, 332, 472, 378),
        (475, 309, 486, 370),
    ):
        draw.rectangle(box, fill=255)

    foreground = Image.new("RGBA", TARGET_SIZE, (0, 0, 0, 0))
    foreground.paste(background.convert("RGBA"), (0, 0), mask)
    return foreground


def prepare(source: Path, background_out: Path, foreground_out: Path) -> None:
    with Image.open(source) as image:
        prepared = ImageOps.fit(
            image.convert("RGB"),
            TARGET_SIZE,
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        prepared = prepared.filter(
            ImageFilter.UnsharpMask(radius=0.7, percent=85, threshold=2),
        )
        prepared = draw_aligned_landmarks(prepared)

    background_out.parent.mkdir(parents=True, exist_ok=True)
    foreground_out.parent.mkdir(parents=True, exist_ok=True)
    prepared.save(background_out, format="PNG", optimize=True)
    build_foreground(prepared).save(foreground_out, format="PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("background_out", type=Path)
    parser.add_argument("foreground_out", type=Path)
    args = parser.parse_args()
    prepare(args.source, args.background_out, args.foreground_out)


if __name__ == "__main__":
    main()
