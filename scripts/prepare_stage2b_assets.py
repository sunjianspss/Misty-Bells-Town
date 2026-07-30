#!/usr/bin/env python3
"""Normalize generated Stage 2B drafts into pixel-aligned runtime atlases."""

from __future__ import annotations

import argparse
from pathlib import Path
from statistics import median

from PIL import Image, ImageEnhance


LANDMARK_CELL = (192, 160)
HERB_SHED_CELL = (96, 80)
STORY_PROP_CELL = (64, 64)
RIVERBANK_CELL = (32, 32)
ALPHA_THRESHOLD = 96
KEY_TRANSPARENT_THRESHOLD = 12.0
KEY_OPAQUE_THRESHOLD = 220.0
KEY_DOMINANCE_THRESHOLD = 16.0
ALPHA_NOISE_FLOOR = 8


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--landmarks", required=True, type=Path)
    parser.add_argument("--herb-shed", required=True, type=Path)
    parser.add_argument("--story-props", required=True, type=Path)
    parser.add_argument("--riverbank", required=True, type=Path)
    parser.add_argument("--landmark-output", required=True, type=Path)
    parser.add_argument("--herb-output", required=True, type=Path)
    parser.add_argument("--story-output", required=True, type=Path)
    parser.add_argument("--riverbank-output", required=True, type=Path)
    return parser.parse_args()


def clamp_channel(value: float) -> int:
    return max(0, min(255, int(round(value))))


def smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def channel_distance(
    first: tuple[int, int, int],
    second: tuple[int, int, int],
) -> int:
    return max(abs(first[index] - second[index]) for index in range(3))


def spill_channels(key: tuple[int, int, int]) -> list[int]:
    key_max = max(key)
    if key_max < 128:
        return []
    return [
        index
        for index, value in enumerate(key)
        if value >= key_max - 16 and value >= 128
    ]


def key_channel_dominance(
    rgb: tuple[int, int, int],
    key: tuple[int, int, int],
) -> float:
    spill = spill_channels(key)
    if not spill:
        return 0.0
    channels = [float(value) for value in rgb]
    non_spill = [index for index in range(3) if index not in spill]
    key_strength = (
        min(channels[index] for index in spill)
        if len(spill) > 1
        else channels[spill[0]]
    )
    non_key_strength = max(
        (channels[index] for index in non_spill),
        default=0.0,
    )
    return key_strength - non_key_strength


def soft_alpha(distance: int) -> int:
    if distance <= KEY_TRANSPARENT_THRESHOLD:
        return 0
    if distance >= KEY_OPAQUE_THRESHOLD:
        return 255
    ratio = (distance - KEY_TRANSPARENT_THRESHOLD) / (
        KEY_OPAQUE_THRESHOLD - KEY_TRANSPARENT_THRESHOLD
    )
    return clamp_channel(255.0 * smoothstep(ratio))


def dominance_alpha(
    rgb: tuple[int, int, int],
    key: tuple[int, int, int],
) -> int:
    spill = spill_channels(key)
    if not spill:
        return 255
    channels = [float(value) for value in rgb]
    non_spill = [index for index in range(3) if index not in spill]
    key_strength = (
        min(channels[index] for index in spill)
        if len(spill) > 1
        else channels[spill[0]]
    )
    non_key_strength = max(
        (channels[index] for index in non_spill),
        default=0.0,
    )
    dominance = key_strength - non_key_strength
    if dominance <= 0:
        return 255
    denominator = max(1.0, float(max(key)) - non_key_strength)
    alpha = 1.0 - min(1.0, dominance / denominator)
    return clamp_channel(alpha * 255.0)


def cleanup_spill(
    rgb: tuple[int, int, int],
    key: tuple[int, int, int],
    alpha: int,
) -> tuple[int, int, int]:
    if alpha >= 252:
        return rgb
    spill = spill_channels(key)
    if not spill:
        return rgb
    channels = [float(value) for value in rgb]
    non_spill = [index for index in range(3) if index not in spill]
    if non_spill:
        cap = max(0.0, max(channels[index] for index in non_spill) - 1.0)
        for index in spill:
            channels[index] = min(channels[index], cap)
    return tuple(clamp_channel(channel) for channel in channels)


def sample_border_key(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    pixels = image.load()
    samples: list[tuple[int, int, int]] = []
    band = max(1, min(width, height, 6))
    step = max(1, min(width, height) // 256)
    for x in range(0, width, step):
        for y in range(band):
            samples.append(pixels[x, y][:3])
            samples.append(pixels[x, height - 1 - y][:3])
    for y in range(0, height, step):
        for x in range(band):
            samples.append(pixels[x, y][:3])
            samples.append(pixels[width - 1 - x, y][:3])
    return tuple(
        int(round(median(sample[channel] for sample in samples)))
        for channel in range(3)
    )


def remove_chroma_key(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    key = sample_border_key(rgba)
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, source_alpha = pixels[x, y]
            rgb = (red, green, blue)
            distance = channel_distance(rgb, key)
            key_like = (
                distance <= 32
                or key_channel_dominance(rgb, key) >= KEY_DOMINANCE_THRESHOLD
            )
            output_alpha = (
                min(soft_alpha(distance), dominance_alpha(rgb, key))
                if key_like
                else 255
            )
            output_alpha = int(round(output_alpha * (source_alpha / 255.0)))
            if 0 < output_alpha <= ALPHA_NOISE_FLOOR:
                output_alpha = 0
            if output_alpha == 0:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            if key_like:
                red, green, blue = cleanup_spill(rgb, key, output_alpha)
            pixels[x, y] = (red, green, blue, output_alpha)
    return rgba


def split_grid(
    source: Image.Image,
    columns: int,
    rows: int,
) -> list[list[Image.Image]]:
    if source.width < columns or source.height < rows:
        raise ValueError(
            f"Source {source.width}×{source.height} is too small for "
            f"a {columns}×{rows} grid.",
        )
    cells: list[list[Image.Image]] = []
    for row in range(rows):
        row_cells: list[Image.Image] = []
        top = round(row * source.height / rows)
        bottom = round((row + 1) * source.height / rows)
        for column in range(columns):
            left = round(column * source.width / columns)
            right = round((column + 1) * source.width / columns)
            row_cells.append(source.crop((left, top, right, bottom)))
        cells.append(row_cells)
    return cells


def require_nonempty_cells(
    cells: list[list[Image.Image]],
    label: str,
) -> None:
    empty = [
        f"r{row}c{column}"
        for row, row_cells in enumerate(cells)
        for column, cell in enumerate(row_cells)
        if cell.getchannel("A").getbbox() is None
    ]
    if empty:
        raise ValueError(f"{label} has empty source cells: {', '.join(empty)}")


def alpha_crop(image: Image.Image) -> Image.Image:
    bounds = image.getchannel("A").getbbox()
    if bounds is None:
        return Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    return image.crop(bounds)


def resize_content(
    image: Image.Image,
    max_width: int,
    max_height: int,
) -> Image.Image:
    content = alpha_crop(image)
    scale = min(max_width / content.width, max_height / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = ImageEnhance.Contrast(content).enhance(1.04)
    content = content.resize((width, height), Image.Resampling.LANCZOS)
    return ImageEnhance.Sharpness(content).enhance(1.35)


def paste_bottom_center(
    cell: Image.Image,
    content: Image.Image,
    *,
    bottom_margin: int,
) -> None:
    x = (cell.width - content.width) // 2
    y = cell.height - bottom_margin - content.height
    cell.alpha_composite(content, (x, y))


def harden_and_quantize(image: Image.Image, colors: int) -> Image.Image:
    alpha = image.getchannel("A").point(
        lambda value: 255 if value >= ALPHA_THRESHOLD else 0,
    )
    rgb = Image.new("RGB", image.size, (46, 41, 43))
    rgb.paste(image.convert("RGB"), mask=alpha)
    reduced = rgb.quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGBA")
    reduced.putalpha(alpha)
    return reduced


def save_runtime(image: Image.Image, output: Path, colors: int) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    runtime = harden_and_quantize(image, colors)
    runtime.save(output, format="PNG", optimize=True)
    print(f"Wrote {output} ({runtime.width}×{runtime.height})")


def prepare_landmarks(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        cells = split_grid(remove_chroma_key(source_image), 2, 1)
    require_nonempty_cells(cells, "landmarks")

    atlas = Image.new(
        "RGBA",
        (LANDMARK_CELL[0] * 2, LANDMARK_CELL[1] * 2),
        (0, 0, 0, 0),
    )

    bakery_cell = Image.new("RGBA", LANDMARK_CELL, (0, 0, 0, 0))
    bakery_source = cells[0][0].crop(
        (0, 0, round(cells[0][0].width * 0.9), cells[0][0].height),
    )
    bakery = alpha_crop(bakery_source)
    bakery = ImageEnhance.Contrast(bakery).enhance(1.04)
    bakery = bakery.resize((152, 124), Image.Resampling.LANCZOS)
    bakery = ImageEnhance.Sharpness(bakery).enhance(1.35)
    paste_bottom_center(bakery_cell, bakery, bottom_margin=2)
    atlas.alpha_composite(bakery_cell, (0, 0))
    bakery_foreground = Image.new("RGBA", LANDMARK_CELL, (0, 0, 0, 0))
    bakery_foreground.alpha_composite(
        bakery_cell.crop((0, 0, LANDMARK_CELL[0], 104)),
        (0, 0),
    )
    atlas.alpha_composite(bakery_foreground, (LANDMARK_CELL[0], 0))

    bridge_cell = Image.new("RGBA", LANDMARK_CELL, (0, 0, 0, 0))
    bridge = resize_content(cells[0][1], 128, 96)
    bridge_x = 32
    bridge_y = 50
    bridge_cell.alpha_composite(bridge, (bridge_x, bridge_y))
    atlas.alpha_composite(bridge_cell, (0, LANDMARK_CELL[1]))

    bridge_front = Image.new("RGBA", LANDMARK_CELL, (0, 0, 0, 0))
    bridge_front_region = bridge_cell.crop(
        (0, 104, LANDMARK_CELL[0], LANDMARK_CELL[1]),
    )
    bridge_front.alpha_composite(bridge_front_region, (0, 104))
    atlas.alpha_composite(
        bridge_front,
        (LANDMARK_CELL[0], LANDMARK_CELL[1]),
    )

    save_runtime(atlas, output_path, colors=112)


def prepare_herb_shed(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        cells = split_grid(remove_chroma_key(source_image), 2, 1)
    require_nonempty_cells(cells, "herb shed")

    atlas = Image.new(
        "RGBA",
        (HERB_SHED_CELL[0] * 2, HERB_SHED_CELL[1] * 2),
        (0, 0, 0, 0),
    )
    for column, source_cell in enumerate(cells[0]):
        base_cell = Image.new("RGBA", HERB_SHED_CELL, (0, 0, 0, 0))
        content = resize_content(source_cell, 90, 70)
        paste_bottom_center(base_cell, content, bottom_margin=2)
        atlas.alpha_composite(base_cell, (column * HERB_SHED_CELL[0], 0))

        foreground_cell = Image.new(
            "RGBA",
            HERB_SHED_CELL,
            (0, 0, 0, 0),
        )
        foreground_cell.alpha_composite(
            base_cell.crop((0, 0, HERB_SHED_CELL[0], 50)),
            (0, 0),
        )
        atlas.alpha_composite(
            foreground_cell,
            (column * HERB_SHED_CELL[0], HERB_SHED_CELL[1]),
        )

    save_runtime(atlas, output_path, colors=96)


def row_scale(
    cells: list[Image.Image],
    max_width: int,
    max_height: int,
) -> float:
    cropped = [alpha_crop(cell) for cell in cells]
    widest = max(cell.width for cell in cropped)
    tallest = max(cell.height for cell in cropped)
    return min(max_width / widest, max_height / tallest)


def prepare_story_props(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        cells = split_grid(remove_chroma_key(source_image), 4, 3)
    require_nonempty_cells(cells, "story props")

    atlas = Image.new(
        "RGBA",
        (STORY_PROP_CELL[0] * 4, STORY_PROP_CELL[1] * 3),
        (0, 0, 0, 0),
    )
    bottom_margins = (2, 2, 1)
    row_scales = (
        row_scale(cells[0], 48, 50),
        row_scale(cells[1], 38, 40),
    )
    festival_table_scale = row_scale(cells[2][:2], 40, 42)
    gate_scale = row_scale(cells[2][2:], 36, 50)

    for row, row_cells in enumerate(cells):
        for column, source_cell in enumerate(row_cells):
            if row < 2:
                scale = row_scales[row]
            elif column < 2:
                scale = festival_table_scale
            else:
                scale = gate_scale
            content = alpha_crop(source_cell)
            width = max(1, round(content.width * scale))
            height = max(1, round(content.height * scale))
            content = ImageEnhance.Contrast(content).enhance(1.04)
            content = content.resize((width, height), Image.Resampling.LANCZOS)
            content = ImageEnhance.Sharpness(content).enhance(1.35)
            runtime_cell = Image.new("RGBA", STORY_PROP_CELL, (0, 0, 0, 0))
            paste_bottom_center(
                runtime_cell,
                content,
                bottom_margin=bottom_margins[row],
            )
            atlas.alpha_composite(
                runtime_cell,
                (
                    column * STORY_PROP_CELL[0],
                    row * STORY_PROP_CELL[1],
                ),
            )

    save_runtime(atlas, output_path, colors=112)


def place_riverbank_cell(
    source: Image.Image,
    *,
    max_width: int,
    max_height: int,
    anchor_x: str,
    anchor_y: str,
) -> Image.Image:
    content = resize_content(source, max_width, max_height)
    cell = Image.new("RGBA", RIVERBANK_CELL, (0, 0, 0, 0))
    x = 0 if anchor_x == "left" else (cell.width - content.width) // 2
    y = 0 if anchor_y == "top" else (cell.height - content.height) // 2
    cell.alpha_composite(content, (x, y))
    return cell


def prepare_riverbank(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        cells = split_grid(remove_chroma_key(source_image), 4, 2)
    require_nonempty_cells(cells, "riverbank")

    atlas = Image.new(
        "RGBA",
        (RIVERBANK_CELL[0] * 4, RIVERBANK_CELL[1] * 2),
        (0, 0, 0, 0),
    )
    placements = (
        ((32, 11, "center", "top"), (32, 10, "center", "top")),
        ((13, 32, "left", "center"), (12, 32, "left", "center")),
        ((31, 31, "left", "top"), (14, 32, "left", "center")),
        ((19, 32, "left", "center"), (20, 32, "left", "center")),
    )
    flattened = [cell for row in cells for cell in row]
    flattened_placements = [
        placements[0][0],
        placements[0][1],
        placements[1][0],
        placements[1][1],
        placements[2][0],
        placements[2][1],
        placements[3][0],
        placements[3][1],
    ]

    for index, (source_cell, placement) in enumerate(
        zip(flattened, flattened_placements, strict=True),
    ):
        runtime_cell = place_riverbank_cell(
            source_cell,
            max_width=placement[0],
            max_height=placement[1],
            anchor_x=placement[2],
            anchor_y=placement[3],
        )
        column = index % 4
        row = index // 4
        atlas.alpha_composite(
            runtime_cell,
            (column * RIVERBANK_CELL[0], row * RIVERBANK_CELL[1]),
        )

    save_runtime(atlas, output_path, colors=72)


def main() -> None:
    args = parse_args()
    prepare_landmarks(args.landmarks, args.landmark_output)
    prepare_herb_shed(args.herb_shed, args.herb_output)
    prepare_story_props(args.story_props, args.story_output)
    prepare_riverbank(args.riverbank, args.riverbank_output)


if __name__ == "__main__":
    main()
