#!/usr/bin/env python3
"""Normalize the generated Stage 2A material sheet into a 32 px tile atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageEnhance, ImageStat


GRID_SIZE = 4
CELL_SIZE = 32
EDGE_BLEND_WEIGHTS = (1.0, 0.72, 0.42, 0.18)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def source_cell_bounds(
    width: int,
    height: int,
    column: int,
    row: int,
) -> tuple[int, int, int, int]:
    left = round(column * width / GRID_SIZE)
    top = round(row * height / GRID_SIZE)
    right = round((column + 1) * width / GRID_SIZE)
    bottom = round((row + 1) * height / GRID_SIZE)
    return (left, top, right, bottom)


def normalize_cell(source: Image.Image, bounds: tuple[int, int, int, int]) -> Image.Image:
    cell = source.crop(bounds)
    cell = ImageEnhance.Contrast(cell).enhance(1.06)
    cell = cell.resize((CELL_SIZE, CELL_SIZE), Image.Resampling.LANCZOS)
    return ImageEnhance.Sharpness(cell).enhance(1.35)


def match_row_statistics(tiles: list[Image.Image]) -> list[Image.Image]:
    """Keep variants distinct while removing large per-cell color/value jumps."""

    tile_stats = [ImageStat.Stat(tile) for tile in tiles]
    target_means = [
        sum(stats.mean[channel] for stats in tile_stats) / len(tile_stats)
        for channel in range(3)
    ]
    target_stddevs = [
        sum(stats.stddev[channel] for stats in tile_stats) / len(tile_stats)
        for channel in range(3)
    ]

    normalized: list[Image.Image] = []
    for tile, stats in zip(tiles, tile_stats, strict=True):
        channels: list[Image.Image] = []
        for channel, source_band in enumerate(tile.split()):
            source_mean = stats.mean[channel]
            source_stddev = max(stats.stddev[channel], 1.0)
            contrast_scale = max(
                0.88,
                min(1.12, target_stddevs[channel] / source_stddev),
            )
            lookup = [
                round(
                    max(
                        0,
                        min(
                            255,
                            target_means[channel]
                            + (value - source_mean) * contrast_scale,
                        ),
                    )
                )
                for value in range(256)
            ]
            channels.append(source_band.point(lookup))
        normalized.append(Image.merge("RGB", channels))
    return normalized


def blend_rgb(
    source: tuple[int, int, int],
    target: tuple[int, int, int],
    weight: float,
) -> tuple[int, int, int]:
    return tuple(
        round(source[channel] * (1 - weight) + target[channel] * weight)
        for channel in range(3)
    )


def harmonize_row_edges(tiles: list[Image.Image]) -> list[Image.Image]:
    """Give every variant shared wrap-safe borders with a short inward feather."""

    source_pixels = [tile.load() for tile in tiles]
    band_size = len(EDGE_BLEND_WEIGHTS)
    vertical_targets: list[list[tuple[int, int, int]]] = []
    horizontal_targets: list[list[tuple[int, int, int]]] = []

    for depth in range(band_size):
        vertical_targets.append(
            [
                tuple(
                    round(
                        sum(
                            pixels[x, y][channel]
                            for pixels in source_pixels
                            for x in (depth, CELL_SIZE - 1 - depth)
                        )
                        / (len(source_pixels) * 2)
                    )
                    for channel in range(3)
                )
                for y in range(CELL_SIZE)
            ]
        )
        horizontal_targets.append(
            [
                tuple(
                    round(
                        sum(
                            pixels[x, y][channel]
                            for pixels in source_pixels
                            for y in (depth, CELL_SIZE - 1 - depth)
                        )
                        / (len(source_pixels) * 2)
                    )
                    for channel in range(3)
                )
                for x in range(CELL_SIZE)
            ]
        )

    harmonized: list[Image.Image] = []
    for tile in tiles:
        result = tile.copy()
        pixels = result.load()
        for depth, weight in enumerate(EDGE_BLEND_WEIGHTS):
            opposite = CELL_SIZE - 1 - depth
            for y in range(CELL_SIZE):
                target = vertical_targets[depth][y]
                pixels[depth, y] = blend_rgb(pixels[depth, y], target, weight)
                pixels[opposite, y] = blend_rgb(pixels[opposite, y], target, weight)
            for x in range(CELL_SIZE):
                target = horizontal_targets[depth][x]
                pixels[x, depth] = blend_rgb(pixels[x, depth], target, weight)
                pixels[x, opposite] = blend_rgb(pixels[x, opposite], target, weight)

        for y in range(1, CELL_SIZE - 1):
            target = vertical_targets[0][y]
            pixels[0, y] = target
            pixels[CELL_SIZE - 1, y] = target
        for x in range(1, CELL_SIZE - 1):
            target = horizontal_targets[0][x]
            pixels[x, 0] = target
            pixels[x, CELL_SIZE - 1] = target

        corner_target = tuple(
            round(
                sum(
                    target[channel]
                    for target in (
                        vertical_targets[0][0],
                        vertical_targets[0][CELL_SIZE - 1],
                        horizontal_targets[0][0],
                        horizontal_targets[0][CELL_SIZE - 1],
                    )
                )
                / 4
            )
            for channel in range(3)
        )
        for x, y in (
            (0, 0),
            (CELL_SIZE - 1, 0),
            (0, CELL_SIZE - 1),
            (CELL_SIZE - 1, CELL_SIZE - 1),
        ):
            pixels[x, y] = corner_target
        harmonized.append(result)

    return harmonized


def prepare(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as image:
        source = image.convert("RGB")
        atlas = Image.new(
            "RGB",
            (CELL_SIZE * GRID_SIZE, CELL_SIZE * GRID_SIZE),
        )
        for row in range(GRID_SIZE):
            row_tiles = []
            for column in range(GRID_SIZE):
                bounds = source_cell_bounds(
                    source.width,
                    source.height,
                    column,
                    row,
                )
                row_tiles.append(normalize_cell(source, bounds))
            row_tiles = harmonize_row_edges(match_row_statistics(row_tiles))
            for column, tile in enumerate(row_tiles):
                atlas.paste(tile, (column * CELL_SIZE, row * CELL_SIZE))

    palette = atlas.quantize(
        colors=64,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    palette.save(output_path, format="PNG", optimize=True)
    print(f"Wrote {output_path} ({palette.width}×{palette.height})")


def main() -> None:
    args = parse_args()
    prepare(args.input, args.output)


if __name__ == "__main__":
    main()
