#!/usr/bin/env python3
"""Build deterministic Stage 3C crowd and weather animation atlases.

The crowd frames are derived from the existing original festival characters.
The weather sheet is drawn as small hard-pixel rain ripples and spring petals;
no external source art is introduced.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

from prepare_stage3a_assets import (
    CELL_HEIGHT,
    CELL_WIDTH,
    FOOT_BASELINE,
    idle_breathe,
)


CROWD_COUNT = 5
WEATHER_CELL = 32
WEATHER_FRAMES = 4
RAIN_DARK = (73, 119, 139, 255)
RAIN_MID = (120, 164, 181, 255)
RAIN_LIGHT = (194, 218, 226, 255)
PETAL_PINK = (244, 163, 174, 255)
PETAL_PEACH = (247, 202, 176, 255)
PETAL_CREAM = (255, 232, 194, 255)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--crowd", required=True, type=Path)
    parser.add_argument("--crowd-output", required=True, type=Path)
    parser.add_argument("--weather-output", required=True, type=Path)
    return parser.parse_args()


def read_crowd(path: Path) -> Image.Image:
    with Image.open(path) as source_image:
        image = source_image.convert("RGBA")
    expected = (CELL_WIDTH * CROWD_COUNT, CELL_HEIGHT)
    if image.size != expected:
        raise ValueError(f"festival crowd size is {image.size}, expected {expected}.")
    alpha_values = {
        value for value, count in enumerate(image.getchannel("A").histogram()) if count
    }
    if not alpha_values.issubset({0, 255}):
        raise ValueError("festival crowd source must use hard alpha.")
    return image


def crowd_cell(image: Image.Image, column: int) -> Image.Image:
    left = column * CELL_WIDTH
    return image.crop((left, 0, left + CELL_WIDTH, CELL_HEIGHT))


def build_crowd_idle(crowd: Image.Image) -> Image.Image:
    atlas = Image.new(
        "RGBA",
        (CELL_WIDTH * CROWD_COUNT * 2, CELL_HEIGHT),
        (0, 0, 0, 0),
    )
    for person in range(CROWD_COUNT):
        base = crowd_cell(crowd, person)
        atlas.alpha_composite(base, (person * CELL_WIDTH * 2, 0))
        atlas.alpha_composite(
            idle_breathe(base),
            ((person * 2 + 1) * CELL_WIDTH, 0),
        )
    return atlas


def weather_cell(atlas: Image.Image, frame: int, row: int) -> Image.Image:
    left = frame * WEATHER_CELL
    top = row * WEATHER_CELL
    return atlas.crop((left, top, left + WEATHER_CELL, top + WEATHER_CELL))


def draw_rain_ripple(frame: int) -> Image.Image:
    cell = Image.new("RGBA", (WEATHER_CELL, WEATHER_CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(cell)
    widths = (4, 10, 16, 11)
    width = widths[frame]
    left = WEATHER_CELL // 2 - width // 2
    right = left + width - 1
    color = (RAIN_LIGHT, RAIN_LIGHT, RAIN_MID, RAIN_DARK)[frame]
    draw.line((left, 21, right, 21), fill=color, width=1)
    if frame >= 1:
        draw.line((left + 3, 23, right - 3, 23), fill=RAIN_MID, width=1)
    if frame == 1:
        draw.line((15, 12, 15, 18), fill=RAIN_LIGHT, width=1)
        draw.point((14, 19), fill=RAIN_LIGHT)
        draw.point((16, 19), fill=RAIN_LIGHT)
    if frame == 2:
        draw.point((left - 2, 21), fill=RAIN_MID)
        draw.point((right + 2, 21), fill=RAIN_MID)
    return cell


def draw_petals(frame: int) -> Image.Image:
    cell = Image.new("RGBA", (WEATHER_CELL, WEATHER_CELL), (0, 0, 0, 0))
    draw = ImageDraw.Draw(cell)
    points = (
        ((4, 5), (17, 13), (26, 23)),
        ((7, 8), (19, 16), (28, 26)),
        ((10, 12), (22, 19), (2, 29)),
        ((13, 15), (25, 22), (5, 1)),
    )[frame]
    colors = (PETAL_PINK, PETAL_PEACH, PETAL_CREAM)
    for index, (x, y) in enumerate(points):
        color = colors[index]
        draw.point((x, y), fill=color)
        draw.point((x + 1, y), fill=color)
        draw.point((x + (frame + index) % 2, y + 1), fill=color)
    return cell


def build_weather_fx() -> Image.Image:
    atlas = Image.new(
        "RGBA",
        (WEATHER_CELL * WEATHER_FRAMES, WEATHER_CELL * 2),
        (0, 0, 0, 0),
    )
    for frame in range(WEATHER_FRAMES):
        atlas.alpha_composite(draw_rain_ripple(frame), (frame * WEATHER_CELL, 0))
        atlas.alpha_composite(
            draw_petals(frame),
            (frame * WEATHER_CELL, WEATHER_CELL),
        )
    return atlas


def validate_crowd(path: Path) -> None:
    with Image.open(path) as saved_image:
        image = saved_image.convert("RGBA")
    expected = (CELL_WIDTH * CROWD_COUNT * 2, CELL_HEIGHT)
    if image.size != expected:
        raise ValueError(f"crowd idle size is {image.size}, expected {expected}.")
    alpha_values = {
        value for value, count in enumerate(image.getchannel("A").histogram()) if count
    }
    if not alpha_values.issubset({0, 255}):
        raise ValueError(f"crowd idle contains non-hard alpha values: {alpha_values}.")
    for column in range(CROWD_COUNT * 2):
        bounds = crowd_cell(image, column).getchannel("A").getbbox()
        if bounds is None or bounds[3] != FOOT_BASELINE:
            raise ValueError(f"crowd idle c{column} foot baseline is {bounds}.")
    print(
        f"Validated festival crowd idle: {image.width}×{image.height}, "
        f"foot baseline {FOOT_BASELINE}."
    )


def validate_weather(path: Path) -> None:
    with Image.open(path) as saved_image:
        image = saved_image.convert("RGBA")
    expected = (WEATHER_CELL * WEATHER_FRAMES, WEATHER_CELL * 2)
    if image.size != expected:
        raise ValueError(f"weather FX size is {image.size}, expected {expected}.")
    alpha_values = {
        value for value, count in enumerate(image.getchannel("A").histogram()) if count
    }
    if not alpha_values.issubset({0, 255}):
        raise ValueError(f"weather FX contains non-hard alpha values: {alpha_values}.")
    for row in range(2):
        for frame in range(WEATHER_FRAMES):
            if weather_cell(image, frame, row).getchannel("A").getbbox() is None:
                raise ValueError(f"weather FX r{row}c{frame} is empty.")
    print(f"Validated weather FX: {image.width}×{image.height}, hard alpha.")


def save(image: Image.Image, path: Path, label: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    print(f"Wrote {label}: {path} ({image.width}×{image.height})")


def main() -> None:
    args = parse_args()
    crowd = read_crowd(args.crowd)
    save(build_crowd_idle(crowd), args.crowd_output, "festival crowd idle")
    save(build_weather_fx(), args.weather_output, "weather FX")
    validate_crowd(args.crowd_output)
    validate_weather(args.weather_output)


if __name__ == "__main__":
    main()
