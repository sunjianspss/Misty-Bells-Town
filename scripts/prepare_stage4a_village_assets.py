#!/usr/bin/env python3
"""Build the Stage 4A south-street house atlas from an original keyed source."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

from prepare_stage2b_assets import alpha_crop, harden_and_quantize


HOUSE_CELL = 128
HOUSE_COLUMNS = 2
HOUSE_ROWS = 2
CONTENT_MARGIN = 4
FOREGROUND_CUTOFF = 82


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def remove_magenta_fringe(image: Image.Image) -> Image.Image:
    """Drop only residual near-magenta key pixels without harming cream walls."""

    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha and red >= 176 and blue >= 176 and green <= 92:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def prepare_house(source: Image.Image) -> Image.Image:
    content = alpha_crop(remove_magenta_fringe(source))
    max_size = HOUSE_CELL - CONTENT_MARGIN * 2
    scale = min(max_size / content.width, max_size / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)

    cell = Image.new("RGBA", (HOUSE_CELL, HOUSE_CELL), (0, 0, 0, 0))
    cell.alpha_composite(
        content,
        ((HOUSE_CELL - width) // 2, HOUSE_CELL - CONTENT_MARGIN - height),
    )
    return cell


def build_atlas(source: Image.Image) -> Image.Image:
    midpoint = source.width // 2
    houses = [
        prepare_house(source.crop((0, 0, midpoint, source.height))),
        prepare_house(source.crop((midpoint, 0, source.width, source.height))),
    ]
    atlas = Image.new(
        "RGBA",
        (HOUSE_CELL * HOUSE_COLUMNS, HOUSE_CELL * HOUSE_ROWS),
        (0, 0, 0, 0),
    )
    for column, house in enumerate(houses):
        atlas.alpha_composite(house, (column * HOUSE_CELL, 0))
        roof = house.crop((0, 0, HOUSE_CELL, FOREGROUND_CUTOFF))
        atlas.alpha_composite(
            roof,
            (column * HOUSE_CELL, HOUSE_CELL),
        )
    return harden_and_quantize(atlas, colors=72)


def validate_atlas(atlas: Image.Image) -> None:
    expected = (HOUSE_CELL * HOUSE_COLUMNS, HOUSE_CELL * HOUSE_ROWS)
    if atlas.size != expected:
        raise ValueError(f"Expected {expected}, got {atlas.size}")
    alpha_histogram = atlas.getchannel("A").histogram()
    if sum(alpha_histogram[1:255]):
        raise ValueError("House atlas alpha must be hard 0/255")
    for row in range(HOUSE_ROWS):
        for column in range(HOUSE_COLUMNS):
            cell = atlas.crop(
                (
                    column * HOUSE_CELL,
                    row * HOUSE_CELL,
                    (column + 1) * HOUSE_CELL,
                    (row + 1) * HOUSE_CELL,
                ),
            )
            if cell.getchannel("A").getbbox() is None:
                raise ValueError(f"House atlas cell r{row}c{column} is empty")
            corners = (
                cell.getpixel((0, 0))[3],
                cell.getpixel((HOUSE_CELL - 1, 0))[3],
                cell.getpixel((0, HOUSE_CELL - 1))[3],
                cell.getpixel((HOUSE_CELL - 1, HOUSE_CELL - 1))[3],
            )
            if any(corners):
                raise ValueError(f"House atlas cell r{row}c{column} lacks safe corners")


def main() -> None:
    args = parse_args()
    with Image.open(args.source) as source_image:
        atlas = build_atlas(source_image.convert("RGBA"))
    validate_atlas(atlas)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(args.output, format="PNG", optimize=True)
    print(f"Wrote {args.output} ({atlas.width}×{atlas.height})")


if __name__ == "__main__":
    main()
