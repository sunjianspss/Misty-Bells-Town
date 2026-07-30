#!/usr/bin/env python3
"""Normalize generated Stage 2C sources into pixel-aligned runtime atlases."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageEnhance

from prepare_stage2b_assets import (
    alpha_crop,
    harden_and_quantize,
    remove_chroma_key,
    require_nonempty_cells,
    split_grid,
)


TREE_CELL = (96, 96)
FLORA_CELL = (32, 32)
FESTIVAL_CELL = (64, 64)
CHARACTER_CELL = (40, 48)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tree", required=True, type=Path)
    parser.add_argument("--flora", required=True, type=Path)
    parser.add_argument("--festival-accents", required=True, type=Path)
    parser.add_argument("--festival-crowd", required=True, type=Path)
    parser.add_argument("--villagers", required=True, type=Path)
    parser.add_argument("--azhi", required=True, type=Path)
    parser.add_argument("--tree-output", required=True, type=Path)
    parser.add_argument("--flora-output", required=True, type=Path)
    parser.add_argument("--festival-output", required=True, type=Path)
    parser.add_argument("--crowd-output", required=True, type=Path)
    parser.add_argument("--villagers-output", required=True, type=Path)
    parser.add_argument("--azhi-output", required=True, type=Path)
    return parser.parse_args()


def resize_content(
    image: Image.Image,
    max_width: int,
    max_height: int,
    *,
    scale: float | None = None,
    alpha_threshold: int | None = None,
) -> Image.Image:
    if alpha_threshold is None:
        content = alpha_crop(image)
    else:
        alpha = image.getchannel("A")
        visible_alpha = alpha.point(
            lambda value: 255 if value >= alpha_threshold else 0,
        )
        bounds = visible_alpha.getbbox()
        if bounds is None:
            raise ValueError("Image has no visible pixels above alpha threshold.")
        content = image.crop(bounds)
        content.putalpha(visible_alpha.crop(bounds))
    if scale is None:
        scale = min(max_width / content.width, max_height / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = ImageEnhance.Contrast(content).enhance(1.04)
    content = content.resize((width, height), Image.Resampling.LANCZOS)
    return ImageEnhance.Sharpness(content).enhance(1.4)


def paste_bottom_center(
    cell: Image.Image,
    content: Image.Image,
    *,
    bottom_margin: int,
) -> None:
    x = (cell.width - content.width) // 2
    y = cell.height - bottom_margin - content.height
    cell.alpha_composite(content, (x, y))


def save_runtime(image: Image.Image, output: Path, colors: int) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    runtime = harden_and_quantize(image, colors)
    runtime.save(output, format="PNG", optimize=True)
    print(f"Wrote {output} ({runtime.width}×{runtime.height})")


def validate_runtime(
    path: Path,
    expected_size: tuple[int, int],
    columns: int,
    rows: int,
    label: str,
    *,
    foot_baseline: int | None = None,
) -> None:
    with Image.open(path) as image:
        runtime = image.convert("RGBA")
    if runtime.size != expected_size:
        raise ValueError(
            f"{label} size is {runtime.size}, expected {expected_size}.",
        )

    alpha_values = {
        value
        for value, count in enumerate(runtime.getchannel("A").histogram())
        if count
    }
    if not alpha_values.issubset({0, 255}):
        raise ValueError(f"{label} has soft alpha values: {sorted(alpha_values)}")

    visible_magenta = [
        (x, y)
        for y in range(runtime.height)
        for x in range(runtime.width)
        if (
            runtime.getpixel((x, y))[3] > 0
            and runtime.getpixel((x, y))[0] >= 235
            and runtime.getpixel((x, y))[1] <= 40
            and runtime.getpixel((x, y))[2] >= 235
        )
    ]
    if visible_magenta:
        raise ValueError(
            f"{label} retains visible chroma key near {visible_magenta[0]}.",
        )

    cells = split_grid(runtime, columns, rows)
    require_nonempty_cells(cells, label)
    if foot_baseline is not None:
        misaligned = [
            f"r{row}c{column}:{cell.getchannel('A').getbbox()}"
            for row, row_cells in enumerate(cells)
            for column, cell in enumerate(row_cells)
            if cell.getchannel("A").getbbox()[3] != foot_baseline
        ]
        if misaligned:
            raise ValueError(
                f"{label} foot baseline mismatch: {', '.join(misaligned)}",
            )
    print(f"Validated {label}: {runtime.width}×{runtime.height}")


def projection_runs(image: Image.Image, axis: str) -> list[tuple[int, int]]:
    alpha = image.getchannel("A")
    length = image.width if axis == "x" else image.height
    occupied: list[bool] = []
    for index in range(length):
        strip = (
            alpha.crop((index, 0, index + 1, image.height))
            if axis == "x"
            else alpha.crop((0, index, image.width, index + 1))
        )
        occupied.append(strip.getbbox() is not None)

    runs: list[tuple[int, int]] = []
    start: int | None = None
    for index, has_content in enumerate([*occupied, False]):
        if has_content and start is None:
            start = index
        elif not has_content and start is not None:
            runs.append((start, index))
            start = None
    return runs


def content_grid(
    source: Image.Image,
    columns: int,
    rows: int,
    label: str,
) -> list[list[Image.Image]]:
    x_runs = projection_runs(source, "x")
    y_runs = projection_runs(source, "y")
    if len(x_runs) != columns or len(y_runs) != rows:
        raise ValueError(
            f"{label} content bands do not match {columns}×{rows}: "
            f"x={x_runs}, y={y_runs}",
        )
    cells = [
        [
            source.crop((x0, y0, x1, y1))
            for x0, x1 in x_runs
        ]
        for y0, y1 in y_runs
    ]
    require_nonempty_cells(cells, label)
    return cells


def remove_green_key(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, source_alpha = pixels[x, y]
            is_green_screen = (
                green > 80
                and green > red * 1.18
                and green > blue * 1.18
            )
            pixels[x, y] = (
                (0, 0, 0, 0)
                if is_green_screen or source_alpha < 96
                else (red, green, blue, 255)
            )
    return rgba


def prepare_tree(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        source = remove_chroma_key(source_image)
    tree = resize_content(source, 92, 92)

    base = Image.new("RGBA", TREE_CELL, (0, 0, 0, 0))
    paste_bottom_center(base, tree, bottom_margin=2)

    foreground = Image.new("RGBA", TREE_CELL, (0, 0, 0, 0))
    canopy_cutoff = 64
    foreground.alpha_composite(
        base.crop((0, 0, TREE_CELL[0], canopy_cutoff)),
        (0, 0),
    )

    atlas = Image.new(
        "RGBA",
        (TREE_CELL[0], TREE_CELL[1] * 2),
        (0, 0, 0, 0),
    )
    atlas.alpha_composite(base, (0, 0))
    atlas.alpha_composite(foreground, (0, TREE_CELL[1]))
    save_runtime(atlas, output_path, colors=96)


def prepare_flora(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        cells = split_grid(remove_chroma_key(source_image), 4, 2)
    require_nonempty_cells(cells, "flora")

    atlas = Image.new(
        "RGBA",
        (FLORA_CELL[0] * 4, FLORA_CELL[1] * 2),
        (0, 0, 0, 0),
    )
    for row, row_cells in enumerate(cells):
        for column, source_cell in enumerate(row_cells):
            cell = Image.new("RGBA", FLORA_CELL, (0, 0, 0, 0))
            if row == 0:
                content = resize_content(source_cell, 27, 20)
                bottom_margin = 4
            else:
                content = resize_content(source_cell, 25, 28)
                bottom_margin = 2
            paste_bottom_center(cell, content, bottom_margin=bottom_margin)
            atlas.alpha_composite(
                cell,
                (column * FLORA_CELL[0], row * FLORA_CELL[1]),
            )
    save_runtime(atlas, output_path, colors=64)


def prepare_festival(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        cells = split_grid(remove_chroma_key(source_image), 4, 2)
    require_nonempty_cells(cells, "festival accents")

    atlas = Image.new(
        "RGBA",
        (FESTIVAL_CELL[0] * 4, FESTIVAL_CELL[1] * 2),
        (0, 0, 0, 0),
    )
    for row, row_cells in enumerate(cells):
        for column, source_cell in enumerate(row_cells):
            cell = Image.new("RGBA", FESTIVAL_CELL, (0, 0, 0, 0))
            if row == 0 and column < 3:
                content = resize_content(source_cell, 58, 34)
                bottom_margin = 5
            elif row == 0:
                content = resize_content(source_cell, 28, 34)
                bottom_margin = 5
            else:
                content = resize_content(source_cell, 60, 58)
                bottom_margin = 3
            paste_bottom_center(cell, content, bottom_margin=bottom_margin)
            atlas.alpha_composite(
                cell,
                (column * FESTIVAL_CELL[0], row * FESTIVAL_CELL[1]),
            )
    save_runtime(atlas, output_path, colors=96)


def prepare_crowd(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        cells = split_grid(remove_chroma_key(source_image), 5, 1)
    require_nonempty_cells(cells, "festival crowd")

    atlas = Image.new(
        "RGBA",
        (CHARACTER_CELL[0] * 5, CHARACTER_CELL[1]),
        (0, 0, 0, 0),
    )
    for column, source_cell in enumerate(cells[0]):
        cell = Image.new("RGBA", CHARACTER_CELL, (0, 0, 0, 0))
        content = resize_content(
            source_cell,
            34,
            43,
            alpha_threshold=96,
        )
        paste_bottom_center(cell, content, bottom_margin=2)
        atlas.alpha_composite(cell, (column * CHARACTER_CELL[0], 0))
    save_runtime(atlas, output_path, colors=96)


def common_character_scale(
    cells: list[list[Image.Image]],
    columns: int,
    *,
    max_width: int,
    max_height: int,
) -> list[float]:
    scales: list[float] = []
    for column in range(columns):
        bounds = [
            alpha_crop(row_cells[column]).size
            for row_cells in cells
        ]
        widest = max(width for width, _height in bounds)
        tallest = max(height for _width, height in bounds)
        scales.append(min(max_width / widest, max_height / tallest))
    return scales


def prepare_villagers(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        cells = content_grid(
            source_image.convert("RGBA"),
            4,
            4,
            "villagers",
        )
    scales = common_character_scale(
        cells,
        4,
        max_width=32,
        max_height=42,
    )

    atlas = Image.new(
        "RGBA",
        (CHARACTER_CELL[0] * 4, CHARACTER_CELL[1] * 4),
        (0, 0, 0, 0),
    )
    for row, row_cells in enumerate(cells):
        for column, source_cell in enumerate(row_cells):
            cell = Image.new("RGBA", CHARACTER_CELL, (0, 0, 0, 0))
            content = resize_content(
                source_cell,
                32,
                42,
                scale=scales[column],
            )
            paste_bottom_center(cell, content, bottom_margin=2)
            atlas.alpha_composite(
                cell,
                (column * CHARACTER_CELL[0], row * CHARACTER_CELL[1]),
            )
    save_runtime(atlas, output_path, colors=128)


def prepare_azhi(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        cells = content_grid(
            remove_green_key(source_image),
            4,
            4,
            "Azhi",
        )
    bounds = [
        alpha_crop(cell).size
        for row_cells in cells
        for cell in row_cells
    ]
    widest = max(width for width, _height in bounds)
    tallest = max(height for _width, height in bounds)
    scale = min(34 / widest, 44 / tallest)

    atlas = Image.new(
        "RGBA",
        (CHARACTER_CELL[0] * 4, CHARACTER_CELL[1] * 4),
        (0, 0, 0, 0),
    )
    for row, row_cells in enumerate(cells):
        for column, source_cell in enumerate(row_cells):
            cell = Image.new("RGBA", CHARACTER_CELL, (0, 0, 0, 0))
            content = resize_content(
                source_cell,
                34,
                44,
                scale=scale,
            )
            paste_bottom_center(cell, content, bottom_margin=2)
            atlas.alpha_composite(
                cell,
                (column * CHARACTER_CELL[0], row * CHARACTER_CELL[1]),
            )
    save_runtime(atlas, output_path, colors=128)


def main() -> None:
    args = parse_args()
    prepare_tree(args.tree, args.tree_output)
    prepare_flora(args.flora, args.flora_output)
    prepare_festival(args.festival_accents, args.festival_output)
    prepare_crowd(args.festival_crowd, args.crowd_output)
    prepare_villagers(args.villagers, args.villagers_output)
    prepare_azhi(args.azhi, args.azhi_output)
    validate_runtime(
        args.tree_output,
        (TREE_CELL[0], TREE_CELL[1] * 2),
        1,
        2,
        "tree layers",
    )
    validate_runtime(
        args.flora_output,
        (FLORA_CELL[0] * 4, FLORA_CELL[1] * 2),
        4,
        2,
        "flora",
    )
    validate_runtime(
        args.festival_output,
        (FESTIVAL_CELL[0] * 4, FESTIVAL_CELL[1] * 2),
        4,
        2,
        "festival accents",
    )
    validate_runtime(
        args.crowd_output,
        (CHARACTER_CELL[0] * 5, CHARACTER_CELL[1]),
        5,
        1,
        "festival crowd",
        foot_baseline=46,
    )
    validate_runtime(
        args.villagers_output,
        (CHARACTER_CELL[0] * 4, CHARACTER_CELL[1] * 4),
        4,
        4,
        "villagers",
        foot_baseline=46,
    )
    validate_runtime(
        args.azhi_output,
        (CHARACTER_CELL[0] * 4, CHARACTER_CELL[1] * 4),
        4,
        4,
        "Azhi",
        foot_baseline=46,
    )


if __name__ == "__main__":
    main()
