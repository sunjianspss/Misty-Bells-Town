#!/usr/bin/env python3
"""Build deterministic Stage 3B character-specific action atlases.

This pass derives the poses from the original v0.4 character sheets and adds
small, hard-pixel props only: Azhi's cloth strips, Linmai's bread basket,
Shenyan's bell rope, Xuhuai's mallet, and Qin's herb bundle.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

from prepare_stage3a_assets import (
    CELL_HEIGHT,
    CELL_WIDTH,
    FOOT_BASELINE,
    OUTLINE,
    ROWS,
    SKIN,
    align_to_foot,
    cell_at,
    paste_cell,
    read_atlas,
    speaking_gesture,
    validate,
)


WOOD = (149, 96, 62, 255)
GOLD = (244, 196, 103, 255)
CREAM = (233, 226, 206, 255)
SAGE = (120, 146, 94, 255)
LEAF_LIGHT = (173, 194, 116, 255)
CORAL = (222, 148, 113, 255)
BLUE = (106, 168, 211, 255)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--azhi", required=True, type=Path)
    parser.add_argument("--villagers", required=True, type=Path)
    parser.add_argument("--azhi-output", required=True, type=Path)
    parser.add_argument("--villagers-output", required=True, type=Path)
    return parser.parse_args()


def pixel(image: Image.Image, x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if 0 <= x < CELL_WIDTH and 0 <= y < CELL_HEIGHT:
        image.putpixel((x, y), color)


def rect(
    image: Image.Image,
    x: int,
    y: int,
    width: int,
    height: int,
    color: tuple[int, int, int, int],
) -> None:
    for yy in range(y, y + height):
        for xx in range(x, x + width):
            pixel(image, xx, yy, color)


def action_anchor(cell: Image.Image, facing: str) -> tuple[int, int, int]:
    bounds = cell.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Character cell cannot be empty.")
    left, top, right, _bottom = bounds
    y = min(FOOT_BASELINE - 11, top + 23)
    if facing == "left":
        return left + 1, y, -1
    if facing == "up":
        return left + 4, y, -1
    return right - 2, y, 1


def azhi_ribbons(cell: Image.Image, facing: str, phase: int) -> Image.Image:
    result = speaking_gesture(cell, facing, SKIN["azhi"], phase)
    x, y, direction = action_anchor(result, facing)
    for index, color in enumerate((BLUE, CORAL, GOLD)):
        start_x = x + direction * (index + 1)
        length = 5 + index + phase
        for step in range(length):
            sway = direction if step >= 3 + phase and index != 1 else 0
            pixel(result, start_x + sway, y + step, color)
    return result


def linmai_basket(cell: Image.Image, facing: str, phase: int) -> Image.Image:
    result = speaking_gesture(cell, facing, SKIN["linmai"], phase)
    x, y, direction = action_anchor(result, facing)
    lift = phase * 2
    left = x - 3 if direction > 0 else x - 4
    top = y - 2 - lift
    rect(result, left, top, 7, 1, OUTLINE)
    rect(result, left, top + 1, 1, 4, OUTLINE)
    rect(result, left + 6, top + 1, 1, 4, OUTLINE)
    rect(result, left + 1, top + 3, 5, 2, WOOD)
    rect(result, left + 1, top + 2, 2, 1, GOLD)
    rect(result, left + 4, top + 2, 2, 1, CREAM)
    pixel(result, left + 3, top + 1, GOLD)
    return result


def shenyan_rope(cell: Image.Image, facing: str, phase: int) -> Image.Image:
    result = speaking_gesture(cell, facing, SKIN["shenyan"], phase)
    x, y, direction = action_anchor(result, facing)
    rope_x = x + direction
    length = 6 - phase
    for step in range(length):
        pixel(result, rope_x, y - step, WOOD)
    rect(result, rope_x - 1, y - length - 1, 3, 2, OUTLINE)
    pixel(result, rope_x, y - length, GOLD)
    pixel(result, rope_x + 1, y - length, GOLD)
    return result


def xuhuai_mallet(cell: Image.Image, facing: str, phase: int) -> Image.Image:
    result = speaking_gesture(cell, facing, SKIN["xuhuai"], phase)
    x, y, direction = action_anchor(result, facing)
    for step in range(5):
        pixel(result, x + direction * step, y - step - phase, WOOD)
    head_x = x + direction * 4
    head_y = y - 5 - phase
    rect(result, head_x - 1, head_y, 3, 2, OUTLINE)
    pixel(result, head_x, head_y, GOLD)
    return result


def qin_herbs(cell: Image.Image, facing: str, phase: int) -> Image.Image:
    result = speaking_gesture(cell, facing, SKIN["qin"], phase)
    x, y, direction = action_anchor(result, facing)
    left = x - 2 if direction > 0 else x - 3
    top = y - 1 - phase
    rect(result, left, top + 3, 5, 2, OUTLINE)
    rect(result, left + 1, top + 3, 3, 2, WOOD)
    for index in range(3):
        stem_x = left + 1 + index
        pixel(result, stem_x, top + 2, SAGE)
        pixel(result, stem_x, top + 1, LEAF_LIGHT)
        pixel(result, stem_x + (1 if index != 1 else 0), top, SAGE)
    return result


def build_azhi_atlas(azhi: Image.Image) -> Image.Image:
    facings = ("down", "left", "right", "up")
    atlas = Image.new("RGBA", (CELL_WIDTH * 2, CELL_HEIGHT * ROWS), (0, 0, 0, 0))
    for row, facing in enumerate(facings):
        base = align_to_foot(cell_at(azhi, 0, row))
        for frame in range(2):
            paste_cell(atlas, azhi_ribbons(base, facing, frame), frame, row)
    return atlas


def build_villager_atlas(villagers: Image.Image) -> Image.Image:
    facings = ("down", "left", "right", "up")
    actions = (linmai_basket, shenyan_rope, xuhuai_mallet, qin_herbs)
    names = ("linmai", "shenyan", "xuhuai", "qin")
    atlas = Image.new("RGBA", (CELL_WIDTH * 8, CELL_HEIGHT * ROWS), (0, 0, 0, 0))
    for row, facing in enumerate(facings):
        for person, (name, action) in enumerate(zip(names, actions, strict=True)):
            base = align_to_foot(cell_at(villagers, person, row))
            for frame in range(2):
                pose = action(base, facing, frame)
                paste_cell(atlas, pose, person * 2 + frame, row)
    return atlas


def save(image: Image.Image, path: Path, label: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    print(f"Wrote {label}: {path} ({image.width}×{image.height})")


def main() -> None:
    args = parse_args()
    azhi = read_atlas(args.azhi, 4, "Azhi")
    villagers = read_atlas(args.villagers, 4, "villagers")
    save(build_azhi_atlas(azhi), args.azhi_output, "Azhi ribbon action")
    save(build_villager_atlas(villagers), args.villagers_output, "villager action")
    validate(args.azhi_output, 2, "Azhi ribbon action")
    validate(args.villagers_output, 8, "villager action")


if __name__ == "__main__":
    main()
