#!/usr/bin/env python3
"""Build deterministic Stage 3A character animation atlases.

The source art is the existing v0.4 character work.  This pass only aligns
the player walk frames and derives small idle / speaking pose variants from
those original transparent pixels; it does not introduce any external art.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


CELL_WIDTH = 40
CELL_HEIGHT = 48
ROWS = 4
FOOT_BASELINE = 46  # Pillow's exclusive lower bound; visible pixels end at y=45.
OUTLINE = (86, 55, 45, 255)
SKIN = {
    "azhi": (242, 207, 176, 255),
    "linmai": (242, 209, 177, 255),
    "shenyan": (220, 183, 150, 255),
    "xuhuai": (227, 193, 157, 255),
    "qin": (238, 209, 184, 255),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--player", required=True, type=Path)
    parser.add_argument("--azhi", required=True, type=Path)
    parser.add_argument("--villagers", required=True, type=Path)
    parser.add_argument("--player-output", required=True, type=Path)
    parser.add_argument("--azhi-talk-output", required=True, type=Path)
    parser.add_argument("--villagers-idle-output", required=True, type=Path)
    parser.add_argument("--villagers-talk-output", required=True, type=Path)
    return parser.parse_args()


def read_atlas(path: Path, columns: int, label: str) -> Image.Image:
    with Image.open(path) as source_image:
        image = source_image.convert("RGBA")
    expected = (CELL_WIDTH * columns, CELL_HEIGHT * ROWS)
    if image.size != expected:
        raise ValueError(f"{label} size is {image.size}, expected {expected}.")
    alpha = image.getchannel("A")
    alpha_values = {value for value, count in enumerate(alpha.histogram()) if count}
    if alpha_values.issubset({0, 255}):
        return image

    # The original player walk sheet predates the v0.4 hard-alpha contract.
    # Normalize it here so every new Stage 3A cell is pixel-crisp and shares
    # the same validation rule as the NPC atlases.
    hardened = image.copy()
    hardened.putalpha(alpha.point(lambda value: 255 if value >= 96 else 0))
    print(f"Normalized {label} to hard alpha.")
    return hardened


def cell_at(image: Image.Image, column: int, row: int) -> Image.Image:
    left = column * CELL_WIDTH
    top = row * CELL_HEIGHT
    return image.crop((left, top, left + CELL_WIDTH, top + CELL_HEIGHT))


def align_to_foot(cell: Image.Image) -> Image.Image:
    alpha = cell.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("Character cell cannot be empty.")
    content = cell.crop(bounds)
    result = Image.new("RGBA", (CELL_WIDTH, CELL_HEIGHT), (0, 0, 0, 0))
    result.alpha_composite(content, (bounds[0], FOOT_BASELINE - content.height))
    return result


def idle_breathe(cell: Image.Image) -> Image.Image:
    """Lift the upper body one native pixel while keeping the feet planted."""

    result = Image.new("RGBA", (CELL_WIDTH, CELL_HEIGHT), (0, 0, 0, 0))
    split_y = FOOT_BASELINE - 7
    result.alpha_composite(cell.crop((0, 0, CELL_WIDTH, split_y)), (0, -1))
    result.alpha_composite(cell.crop((0, split_y, CELL_WIDTH, CELL_HEIGHT)), (0, split_y))
    return result


def set_pixel_if_in_bounds(image: Image.Image, x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if 0 <= x < CELL_WIDTH and 0 <= y < CELL_HEIGHT:
        image.putpixel((x, y), color)


def speaking_gesture(
    cell: Image.Image,
    facing: str,
    skin: tuple[int, int, int, int],
    phase: int,
) -> Image.Image:
    """Add a tiny, hard-pixel hand lift without changing the feet or silhouette scale."""

    result = idle_breathe(cell) if phase else cell.copy()
    bounds = result.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Character cell cannot be empty.")

    left, top, right, _bottom = bounds
    lift = 3 + phase
    if facing == "left":
        start_x, direction = left + 2, -1
    elif facing == "up":
        start_x, direction = left + 3, -1
    else:
        start_x, direction = right - 3, 1
    start_y = min(FOOT_BASELINE - 10, top + 22)

    for step in range(lift):
        x = start_x + direction * (step // 2)
        y = start_y - step
        set_pixel_if_in_bounds(result, x, y, OUTLINE)
        set_pixel_if_in_bounds(result, x + direction, y, skin)
    set_pixel_if_in_bounds(result, start_x + direction * 2, start_y - lift, skin)
    return result


def paste_cell(atlas: Image.Image, cell: Image.Image, column: int, row: int) -> None:
    atlas.alpha_composite(cell, (column * CELL_WIDTH, row * CELL_HEIGHT))


def build_player_walk(player: Image.Image) -> Image.Image:
    atlas = Image.new("RGBA", player.size, (0, 0, 0, 0))
    for row in range(ROWS):
        for column in range(4):
            paste_cell(atlas, align_to_foot(cell_at(player, column, row)), column, row)
    return atlas


def build_azhi_talk(azhi: Image.Image) -> Image.Image:
    # v0.2's row order is south / west / east / north.
    facings = ("down", "left", "right", "up")
    atlas = Image.new("RGBA", (CELL_WIDTH * 2, CELL_HEIGHT * ROWS), (0, 0, 0, 0))
    for row, facing in enumerate(facings):
        base = align_to_foot(cell_at(azhi, 0, row))
        for frame in range(2):
            paste_cell(atlas, speaking_gesture(base, facing, SKIN["azhi"], frame), frame, row)
    return atlas


def build_villager_atlas(villagers: Image.Image, *, action: str) -> Image.Image:
    # v0.2's columns are Linmai / Shenyan / Xuhuai / Qin and its rows are S/W/E/N.
    facings = ("down", "left", "right", "up")
    names = ("linmai", "shenyan", "xuhuai", "qin")
    atlas = Image.new("RGBA", (CELL_WIDTH * 8, CELL_HEIGHT * ROWS), (0, 0, 0, 0))
    for row, facing in enumerate(facings):
        for person, name in enumerate(names):
            base = align_to_foot(cell_at(villagers, person, row))
            destination = person * 2
            if action == "idle":
                frames = (base, idle_breathe(base))
            elif action == "talk":
                frames = tuple(
                    speaking_gesture(base, facing, SKIN[name], phase)
                    for phase in range(2)
                )
            else:
                raise ValueError(f"Unsupported action: {action}")
            for frame, image in enumerate(frames):
                paste_cell(atlas, image, destination + frame, row)
    return atlas


def validate(path: Path, columns: int, label: str) -> None:
    with Image.open(path) as saved_image:
        image = saved_image.convert("RGBA")
    expected = (CELL_WIDTH * columns, CELL_HEIGHT * ROWS)
    if image.size != expected:
        raise ValueError(f"{label} size is {image.size}, expected {expected}.")
    for row in range(ROWS):
        for column in range(columns):
            bounds = cell_at(image, column, row).getchannel("A").getbbox()
            if bounds is None or bounds[3] != FOOT_BASELINE:
                raise ValueError(f"{label} r{row}c{column} foot baseline is {bounds}.")
    print(f"Validated {label}: {image.width}×{image.height}, foot baseline {FOOT_BASELINE}.")


def save(image: Image.Image, path: Path, label: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    print(f"Wrote {label}: {path} ({image.width}×{image.height})")


def main() -> None:
    args = parse_args()
    player = read_atlas(args.player, 4, "player")
    azhi = read_atlas(args.azhi, 4, "Azhi")
    villagers = read_atlas(args.villagers, 4, "villagers")

    save(build_player_walk(player), args.player_output, "aligned player walk")
    save(build_azhi_talk(azhi), args.azhi_talk_output, "Azhi talk")
    save(build_villager_atlas(villagers, action="idle"), args.villagers_idle_output, "villager idle")
    save(build_villager_atlas(villagers, action="talk"), args.villagers_talk_output, "villager talk")

    validate(args.player_output, 4, "aligned player walk")
    validate(args.azhi_talk_output, 2, "Azhi talk")
    validate(args.villagers_idle_output, 8, "villager idle")
    validate(args.villagers_talk_output, 8, "villager talk")


if __name__ == "__main__":
    main()
