#!/usr/bin/env python3
"""Normalize a transparent 4×4 art draft into a pixel-aligned game atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


GRID_SIZE = 4


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--cell-width", required=True, type=int)
    parser.add_argument("--cell-height", required=True, type=int)
    parser.add_argument("--content-width", required=True, type=int)
    parser.add_argument("--content-height", required=True, type=int)
    parser.add_argument("--scale-group", choices=("all", "row"), default="all")
    return parser.parse_args()


def split_cells(source: Image.Image) -> list[list[Image.Image]]:
    width, height = source.size
    cells: list[list[Image.Image]] = []
    for row in range(GRID_SIZE):
        row_cells: list[Image.Image] = []
        y0 = round(row * height / GRID_SIZE)
        y1 = round((row + 1) * height / GRID_SIZE)
        for column in range(GRID_SIZE):
            x0 = round(column * width / GRID_SIZE)
            x1 = round((column + 1) * width / GRID_SIZE)
            row_cells.append(source.crop((x0, y0, x1, y1)))
        cells.append(row_cells)
    return cells


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return (0, 0, 1, 1)
    return bbox


def group_scale(
    cells: list[Image.Image],
    content_width: int,
    content_height: int,
) -> float:
    boxes = [alpha_bbox(cell) for cell in cells]
    max_width = max(box[2] - box[0] for box in boxes)
    max_height = max(box[3] - box[1] for box in boxes)
    return min(content_width / max_width, content_height / max_height)


def render_group(
    atlas: Image.Image,
    cells: list[Image.Image],
    positions: list[tuple[int, int]],
    *,
    scale: float,
    cell_width: int,
    cell_height: int,
) -> None:
    for cell, (column, row) in zip(cells, positions, strict=True):
        cropped = cell.crop(alpha_bbox(cell))
        target_width = max(1, round(cropped.width * scale))
        target_height = max(1, round(cropped.height * scale))
        normalized = cropped.resize(
            (target_width, target_height),
            resample=Image.Resampling.NEAREST,
        )
        paste_x = column * cell_width + (cell_width - target_width) // 2
        paste_y = row * cell_height + cell_height - target_height - 2
        atlas.alpha_composite(normalized, (paste_x, paste_y))


def main() -> None:
    args = parse_args()
    source = Image.open(args.input).convert("RGBA")
    cells = split_cells(source)
    atlas = Image.new(
        "RGBA",
        (args.cell_width * GRID_SIZE, args.cell_height * GRID_SIZE),
        (0, 0, 0, 0),
    )

    if args.scale_group == "all":
        flattened = [cell for row in cells for cell in row]
        positions = [
            (column, row)
            for row in range(GRID_SIZE)
            for column in range(GRID_SIZE)
        ]
        scale = group_scale(flattened, args.content_width, args.content_height)
        render_group(
            atlas,
            flattened,
            positions,
            scale=scale,
            cell_width=args.cell_width,
            cell_height=args.cell_height,
        )
    else:
        for row, row_cells in enumerate(cells):
            scale = group_scale(
                row_cells,
                args.content_width,
                args.content_height,
            )
            render_group(
                atlas,
                row_cells,
                [(column, row) for column in range(GRID_SIZE)],
                scale=scale,
                cell_width=args.cell_width,
                cell_height=args.cell_height,
            )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(args.output, format="PNG", optimize=True)
    print(f"Wrote {args.output} ({atlas.width}×{atlas.height})")


if __name__ == "__main__":
    main()
