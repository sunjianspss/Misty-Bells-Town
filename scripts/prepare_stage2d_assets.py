#!/usr/bin/env python3
"""Build the Stage 2D modular grass atlases from existing original v0.4 art."""

from __future__ import annotations

import argparse
from pathlib import Path
from statistics import median

from PIL import Image, ImageEnhance

from prepare_stage2b_assets import alpha_crop, harden_and_quantize, split_grid


LOGICAL_CELL = 16
RUNTIME_SCALE = 2
RUNTIME_CELL = LOGICAL_CELL * RUNTIME_SCALE
GRASS_COLUMNS = 4
GRASS_ROWS = 2
DETAIL_COLUMNS = 4
DETAIL_ROWS = 4
PATCH_CELL = 64
PATCH_COLUMNS = 4
PATCH_ROWS = 2
SAFE_MARGIN = 2

# Eight grass-only regions in the Stage 1B original dusk scene. The processor
# uses their value structure for subtle all-day macro variation.
GRASS_PATCHES = (
    (320, 0, 384, 64),
    (384, 0, 448, 64),
    (448, 0, 512, 64),
    (512, 0, 576, 64),
    (320, 64, 384, 128),
    (384, 64, 448, 128),
    (448, 64, 512, 128),
    (512, 64, 576, 128),
)

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scene", required=True, type=Path)
    parser.add_argument("--flora", required=True, type=Path)
    parser.add_argument("--terrain", required=True, type=Path)
    parser.add_argument("--grass-output", required=True, type=Path)
    parser.add_argument("--patches-output", required=True, type=Path)
    parser.add_argument("--details-output", required=True, type=Path)
    return parser.parse_args()


def rgb(hex_color: str) -> tuple[int, int, int]:
    value = hex_color.removeprefix("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def luminance(pixel: tuple[int, ...]) -> float:
    red, green, blue = pixel[:3]
    return red * 0.2126 + green * 0.7152 + blue * 0.0722


def blend_color(
    source: tuple[int, int, int],
    target: tuple[int, int, int],
    weight: float,
) -> tuple[int, int, int]:
    return tuple(
        round(source[channel] * (1 - weight) + target[channel] * weight)
        for channel in range(3)
    )


def make_wrap_template(tile: Image.Image, band: int) -> Image.Image:
    source = tile.convert("RGB")
    result = source.copy()
    cell_size = source.width
    visited: set[tuple[int, int]] = set()
    for y in range(cell_size):
        for x in range(cell_size):
            if (x, y) in visited:
                continue
            x_values = (
                {x, cell_size - 1 - x}
                if x < band or x >= cell_size - band
                else {x}
            )
            y_values = (
                {y, cell_size - 1 - y}
                if y < band or y >= cell_size - band
                else {y}
            )
            coordinates = {
                (group_x, group_y)
                for group_x in x_values
                for group_y in y_values
            }
            if len(coordinates) == 1:
                continue
            target = tuple(
                round(
                    sum(source.getpixel(coordinate)[channel] for coordinate in coordinates)
                    / len(coordinates)
                )
                for channel in range(3)
            )
            for coordinate in coordinates:
                result.putpixel(coordinate, target)
            visited.update(coordinates)
    return result


def harmonize_edges(tiles: list[Image.Image]) -> list[Image.Image]:
    """Reuse one textured wrap edge instead of averaging borders into a frame."""

    cell_size = tiles[0].width
    template = make_wrap_template(tiles[0], band=4)
    output: list[Image.Image] = []
    for tile in tiles:
        result = tile.copy()
        result_pixels = result.load()
        for depth, weight in enumerate((1.0, 0.76, 0.42, 0.16)):
            opposite = cell_size - 1 - depth
            for y in range(cell_size):
                result_pixels[depth, y] = blend_color(
                    result_pixels[depth, y],
                    template.getpixel((depth, y)),
                    weight,
                )
                result_pixels[opposite, y] = blend_color(
                    result_pixels[opposite, y],
                    template.getpixel((opposite, y)),
                    weight,
                )
            for x in range(cell_size):
                result_pixels[x, depth] = blend_color(
                    result_pixels[x, depth],
                    template.getpixel((x, depth)),
                    weight,
                )
                result_pixels[x, opposite] = blend_color(
                    result_pixels[x, opposite],
                    template.getpixel((x, opposite)),
                    weight,
                )
        output.append(result)
    return output


def build_grass_tiles(
    scene: Image.Image,
    terrain: Image.Image,
) -> list[Image.Image]:
    tiles: list[Image.Image] = []
    family_order = (0, 0, 1, 1, 2, 2, 3, 3)
    family_centers = (
        (78, 96, 70),
        (75, 93, 69),
        (82, 98, 68),
        (72, 90, 68),
    )
    grass_sources = split_grid(terrain.convert("RGB"), 4, 4)[0]
    source_order = (0, 2, 1, 3, 2, 0, 3, 1)
    for bounds, family, source_index in zip(
        GRASS_PATCHES,
        family_order,
        source_order,
        strict=True,
    ):
        micro = grass_sources[source_index].convert("RGB")
        macro = scene.crop(bounds).convert("RGB").resize(
            (RUNTIME_CELL, RUNTIME_CELL),
            Image.Resampling.LANCZOS,
        )
        micro_means = tuple(
            sum(
                micro.getpixel((x, y))[channel]
                for y in range(RUNTIME_CELL)
                for x in range(RUNTIME_CELL)
            )
            / (RUNTIME_CELL * RUNTIME_CELL)
            for channel in range(3)
        )
        macro_values = [
            luminance(macro.getpixel((x, y)))
            for y in range(RUNTIME_CELL)
            for x in range(RUNTIME_CELL)
        ]
        macro_mid = median(macro_values)
        combined = Image.new("RGB", (RUNTIME_CELL, RUNTIME_CELL))
        center = family_centers[family]
        for y in range(RUNTIME_CELL):
            for x in range(RUNTIME_CELL):
                macro_delta = (
                    luminance(macro.getpixel((x, y))) - macro_mid
                ) * 0.035
                source_pixel = micro.getpixel((x, y))
                output_pixel = tuple(
                    max(
                        0,
                        min(
                            255,
                            round(
                                center[channel]
                                + (source_pixel[channel] - micro_means[channel])
                                * 1.02
                                + macro_delta,
                            ),
                        ),
                    )
                    for channel in range(3)
                )
                combined.putpixel((x, y), output_pixel)
        tiles.append(combined)
    return harmonize_edges(tiles)


def upscale_pixel_art(image: Image.Image) -> Image.Image:
    return image.resize(
        (image.width * RUNTIME_SCALE, image.height * RUNTIME_SCALE),
        Image.Resampling.NEAREST,
    )


def build_grass_atlas(
    scene: Image.Image,
    terrain: Image.Image,
) -> tuple[Image.Image, list[Image.Image]]:
    logical_tiles = build_grass_tiles(scene, terrain)
    atlas = Image.new(
        "RGB",
        (RUNTIME_CELL * GRASS_COLUMNS, RUNTIME_CELL * GRASS_ROWS),
    )
    for index, tile in enumerate(logical_tiles):
        row, column = divmod(index, GRASS_COLUMNS)
        atlas.paste(
            tile,
            (column * RUNTIME_CELL, row * RUNTIME_CELL),
        )
    atlas = atlas.quantize(
        colors=48,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    detail_tiles = [
        tile.resize(
            (LOGICAL_CELL, LOGICAL_CELL),
            Image.Resampling.BOX,
        )
        for tile in logical_tiles
    ]
    return atlas, detail_tiles


def build_patch_cell(
    scene: Image.Image,
    bounds: tuple[int, int, int, int],
    center: tuple[int, int, int],
    variant: int,
) -> Image.Image:
    logical_size = PATCH_CELL // RUNTIME_SCALE
    texture = scene.crop(bounds).convert("RGB").resize(
        (logical_size, logical_size),
        Image.Resampling.LANCZOS,
    )
    means = tuple(
        sum(
            texture.getpixel((x, y))[channel]
            for y in range(logical_size)
            for x in range(logical_size)
        )
        / (logical_size * logical_size)
        for channel in range(3)
    )
    rgba = Image.new(
        "RGBA",
        (logical_size, logical_size),
        (0, 0, 0, 0),
    )
    centers = (
        ((13, 14, 10, 8), (19, 15, 9, 10), (16, 20, 11, 7)),
        ((12, 16, 9, 11), (19, 12, 11, 8), (20, 20, 8, 8)),
        ((14, 12, 11, 8), (18, 18, 10, 10), (10, 21, 7, 7)),
        ((11, 13, 8, 9), (19, 15, 11, 8), (15, 21, 10, 7)),
    )
    ellipses = centers[variant % len(centers)]
    texture_values = [
        luminance(texture.getpixel((x, y)))
        for y in range(logical_size)
        for x in range(logical_size)
    ]
    texture_mid = median(texture_values)
    pixels = rgba.load()
    for y in range(SAFE_MARGIN, logical_size - SAFE_MARGIN):
        for x in range(SAFE_MARGIN, logical_size - SAFE_MARGIN):
            distance = min(
                ((x - center_x) / radius_x) ** 2
                + ((y - center_y) / radius_y) ** 2
                for center_x, center_y, radius_x, radius_y in ellipses
            )
            noise = (
                luminance(texture.getpixel((x, y))) - texture_mid
            ) / 255
            edge_noise = (((x * 17 + y * 29 + variant * 13) % 11) - 5) / 40
            if distance + edge_noise - noise * 0.22 > 1:
                continue
            source = texture.getpixel((x, y))
            pixels[x, y] = (
                *(
                    max(
                        0,
                        min(
                            255,
                            round(
                                center[channel]
                                + (source[channel] - means[channel]) * 0.16,
                            ),
                        ),
                    )
                    for channel in range(3)
                ),
                255,
            )
    return upscale_pixel_art(rgba)


def build_grass_patches(scene: Image.Image) -> Image.Image:
    centers = (
        (71, 89, 67),
        (73, 91, 68),
        (74, 92, 70),
        (70, 88, 67),
        (84, 99, 69),
        (82, 98, 68),
        (68, 86, 66),
        (70, 88, 67),
    )
    atlas = Image.new(
        "RGBA",
        (PATCH_CELL * PATCH_COLUMNS, PATCH_CELL * PATCH_ROWS),
        (0, 0, 0, 0),
    )
    for index, (bounds, center) in enumerate(
        zip(GRASS_PATCHES, centers, strict=True),
    ):
        row, column = divmod(index, PATCH_COLUMNS)
        atlas.alpha_composite(
            build_patch_cell(scene, bounds, center, index),
            (column * PATCH_CELL, row * PATCH_CELL),
        )
    return harden_and_quantize(atlas, colors=64)


def hard_alpha(image: Image.Image) -> Image.Image:
    result = image.convert("RGBA")
    alpha = result.getchannel("A").point(
        lambda value: 255 if value >= 96 else 0,
    )
    result.putalpha(alpha)
    return result


def mini_sprite(
    image: Image.Image,
    max_width: int,
    max_height: int,
) -> Image.Image:
    content = alpha_crop(image.convert("RGBA"))
    scale = min(max_width / content.width, max_height / content.height)
    size = (
        max(1, round(content.width * scale)),
        max(1, round(content.height * scale)),
    )
    content = content.resize(size, Image.Resampling.LANCZOS)
    return hard_alpha(ImageEnhance.Sharpness(content).enhance(1.4))


def tint_foliage(
    image: Image.Image,
    flower_color: str | None = None,
    *,
    dry: bool = False,
) -> Image.Image:
    result = image.convert("RGBA")
    pixels = result.load()
    flower = rgb(flower_color) if flower_color else None
    for y in range(result.height):
        for x in range(result.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0:
                continue
            value = luminance((red, green, blue))
            foliage_like = (
                green >= red * 0.72
                and green >= blue * 0.86
                and value < 190
            )
            if dry:
                target = (
                    (121, 111, 65)
                    if value >= 100
                    else (68, 79, 50)
                )
            elif foliage_like or flower is None:
                target = (
                    (90, 111, 69)
                    if value >= 120
                    else (53, 79, 58)
                )
            else:
                factor = 1.08 if value >= 150 else 0.82
                target = tuple(
                    max(0, min(255, round(channel * factor)))
                    for channel in flower
                )
            pixels[x, y] = (*target, 255)
    return result


def composite(
    destination: Image.Image,
    sprite: Image.Image,
    position: tuple[int, int],
) -> None:
    destination.alpha_composite(sprite, position)


def moss_detail(
    grass_tile: Image.Image,
    *,
    light: bool,
) -> Image.Image:
    cell = Image.new(
        "RGBA",
        (LOGICAL_CELL, LOGICAL_CELL),
        (0, 0, 0, 0),
    )
    values = [
        luminance(grass_tile.getpixel((x, y)))
        for y in range(SAFE_MARGIN, LOGICAL_CELL - SAFE_MARGIN)
        for x in range(SAFE_MARGIN, LOGICAL_CELL - SAFE_MARGIN)
    ]
    threshold = sorted(values)[round(len(values) * (0.68 if light else 0.36))]
    target = (116, 132, 87, 255) if light else (39, 62, 49, 255)
    for y in range(5, 11):
        for x in range(4, 12):
            value = luminance(grass_tile.getpixel((x, y)))
            selected = value >= threshold if light else value <= threshold
            if selected and (x * 3 + y * 5) % 7 in (2, 4, 5):
                cell.putpixel((x, y), target)
    return cell


def soil_detail(terrain: Image.Image) -> Image.Image:
    path_cell = split_grid(terrain.convert("RGB"), 4, 4)[1][0]
    patch = path_cell.resize((4, 3), Image.Resampling.LANCZOS)
    patch = patch.quantize(
        colors=12,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGBA")
    mask = Image.new("L", patch.size, 0)
    mask_pixels = mask.load()
    for y in range(patch.height):
        for x in range(patch.width):
            dx = (x - 1.5) / 2.0
            dy = (y - 1) / 1.5
            irregularity = ((x * 11 + y * 7) % 9) / 30
            if dx * dx + dy * dy + irregularity <= 1:
                mask_pixels[x, y] = 255
    patch.putalpha(mask)
    return patch


def paste_center_bottom(
    cell: Image.Image,
    sprite: Image.Image,
    *,
    bottom: int = SAFE_MARGIN,
) -> None:
    x = (LOGICAL_CELL - sprite.width) // 2
    y = LOGICAL_CELL - bottom - sprite.height
    composite(cell, sprite, (x, y))


def build_detail_cells(
    flora: Image.Image,
    terrain: Image.Image,
    grass_tiles: list[Image.Image],
) -> list[list[Image.Image]]:
    flora_cells = split_grid(flora.convert("RGBA"), 4, 2)
    flower_colors = ("#9a739e", "#c17f89", "#c89b4e", "#d2c58f")
    flowers = [
        tint_foliage(
            mini_sprite(flora_cells[0][index], 4, 4),
            flower_colors[index],
        )
        for index in range(4)
    ]
    weeds = [
        tint_foliage(
            mini_sprite(flora_cells[1][index], 4, 6),
            dry=index == 2,
        )
        for index in range(4)
    ]
    soil = soil_detail(terrain)

    cells = [
        [
            moss_detail(grass_tiles[6], light=False),
            moss_detail(grass_tiles[1], light=True),
            Image.new("RGBA", (LOGICAL_CELL, LOGICAL_CELL), (0, 0, 0, 0)),
            Image.new("RGBA", (LOGICAL_CELL, LOGICAL_CELL), (0, 0, 0, 0)),
        ],
        [
            Image.new("RGBA", (LOGICAL_CELL, LOGICAL_CELL), (0, 0, 0, 0))
            for _ in range(DETAIL_COLUMNS)
        ],
        [
            Image.new("RGBA", (LOGICAL_CELL, LOGICAL_CELL), (0, 0, 0, 0))
            for _ in range(DETAIL_COLUMNS)
        ],
        [
            Image.new("RGBA", (LOGICAL_CELL, LOGICAL_CELL), (0, 0, 0, 0))
            for _ in range(DETAIL_COLUMNS)
        ],
    ]

    paste_center_bottom(cells[0][2], weeds[2], bottom=2)
    composite(cells[0][3], soil, (6, 9))
    cells[0][3].putpixel((11, 7), (113, 112, 92, 255))

    for column, weed in enumerate(weeds):
        paste_center_bottom(cells[1][column], weed, bottom=2)

    for column, flower in enumerate(flowers):
        paste_center_bottom(cells[2][column], flower, bottom=3)

    composite(cells[3][0], flowers[0], (3, 8))
    composite(cells[3][0], flowers[2], (8, 6))
    composite(cells[3][1], flowers[1], (3, 7))
    composite(cells[3][1], flowers[3], (8, 8))
    composite(cells[3][2], soil, (3, 9))
    composite(cells[3][2], weeds[1], (8, 6))
    cells[3][3].alpha_composite(moss_detail(grass_tiles[7], light=False))
    composite(
        cells[3][3],
        mini_sprite(flowers[0], 4, 4),
        (3, 7),
    )
    composite(
        cells[3][3],
        mini_sprite(flowers[2], 4, 4),
        (9, 5),
    )
    return [[hard_alpha(cell) for cell in row] for row in cells]


def build_details_atlas(
    flora: Image.Image,
    terrain: Image.Image,
    grass_tiles: list[Image.Image],
) -> Image.Image:
    cells = build_detail_cells(flora, terrain, grass_tiles)
    logical_atlas = Image.new(
        "RGBA",
        (
            LOGICAL_CELL * DETAIL_COLUMNS,
            LOGICAL_CELL * DETAIL_ROWS,
        ),
        (0, 0, 0, 0),
    )
    for row, row_cells in enumerate(cells):
        for column, cell in enumerate(row_cells):
            logical_atlas.alpha_composite(
                cell,
                (column * LOGICAL_CELL, row * LOGICAL_CELL),
            )
    runtime = upscale_pixel_art(logical_atlas)
    return harden_and_quantize(runtime, colors=56)


def validate_grass(atlas: Image.Image) -> None:
    expected = (
        RUNTIME_CELL * GRASS_COLUMNS,
        RUNTIME_CELL * GRASS_ROWS,
    )
    if atlas.size != expected:
        raise ValueError(f"Grass atlas is {atlas.size}, expected {expected}.")
    rgba = atlas.convert("RGBA")
    if rgba.getchannel("A").getextrema() != (255, 255):
        raise ValueError("Grass atlas must be fully opaque.")
    cells = split_grid(rgba, GRASS_COLUMNS, GRASS_ROWS)
    all_cells = [cell for row in cells for cell in row]
    reference = all_cells[0]
    for cell_index, cell in enumerate(all_cells[1:], start=1):
        for depth in range(1):
            if [
                cell.getpixel((depth, y))
                for y in range(RUNTIME_CELL)
            ] != [
                reference.getpixel((depth, y))
                for y in range(RUNTIME_CELL)
            ]:
                raise ValueError("Grass atlas left wrap bands are inconsistent.")
            if [
                cell.getpixel((x, depth))
                for x in range(RUNTIME_CELL)
            ] != [
                reference.getpixel((x, depth))
                for x in range(RUNTIME_CELL)
            ]:
                raise ValueError("Grass atlas top wrap bands are inconsistent.")
            opposite = RUNTIME_CELL - 1 - depth
            if [
                cell.getpixel((depth, y))
                for y in range(RUNTIME_CELL)
            ] != [
                cell.getpixel((opposite, y))
                for y in range(RUNTIME_CELL)
            ]:
                mismatch_y = next(
                    y
                    for y in range(RUNTIME_CELL)
                    if cell.getpixel((depth, y))
                    != cell.getpixel((opposite, y))
                )
                raise ValueError(
                    "Grass atlas left/right edges do not wrap: "
                    f"cell={cell_index}, depth={depth}, y={mismatch_y}, "
                    f"left={cell.getpixel((depth, mismatch_y))}, "
                    f"right={cell.getpixel((opposite, mismatch_y))}.",
                )
            if [
                cell.getpixel((x, depth))
                for x in range(RUNTIME_CELL)
            ] != [
                cell.getpixel((x, opposite))
                for x in range(RUNTIME_CELL)
            ]:
                mismatch_x = next(
                    x
                    for x in range(RUNTIME_CELL)
                    if cell.getpixel((x, depth))
                    != cell.getpixel((x, opposite))
                )
                raise ValueError(
                    "Grass atlas top/bottom edges do not wrap: "
                    f"cell={cell_index}, depth={depth}, x={mismatch_x}.",
                )


def validate_details(atlas: Image.Image) -> None:
    expected = (
        RUNTIME_CELL * DETAIL_COLUMNS,
        RUNTIME_CELL * DETAIL_ROWS,
    )
    if atlas.size != expected:
        raise ValueError(f"Detail atlas is {atlas.size}, expected {expected}.")
    rgba = atlas.convert("RGBA")
    alpha_values = {
        value
        for value, count in enumerate(rgba.getchannel("A").histogram())
        if count
    }
    if not alpha_values.issubset({0, 255}):
        raise ValueError(f"Details have soft alpha: {sorted(alpha_values)}")
    cells = split_grid(rgba, DETAIL_COLUMNS, DETAIL_ROWS)
    for row, row_cells in enumerate(cells):
        for column, cell in enumerate(row_cells):
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"Detail r{row}c{column} is empty.")
            left, top, right, bottom = bounds
            if (
                left < SAFE_MARGIN * RUNTIME_SCALE
                or top < SAFE_MARGIN * RUNTIME_SCALE
                or right > RUNTIME_CELL - SAFE_MARGIN * RUNTIME_SCALE
                or bottom > RUNTIME_CELL - SAFE_MARGIN * RUNTIME_SCALE
            ):
                raise ValueError(
                    f"Detail r{row}c{column} exceeds safe margin: {bounds}.",
                )


def validate_patches(atlas: Image.Image) -> None:
    expected = (
        PATCH_CELL * PATCH_COLUMNS,
        PATCH_CELL * PATCH_ROWS,
    )
    if atlas.size != expected:
        raise ValueError(f"Patch atlas is {atlas.size}, expected {expected}.")
    rgba = atlas.convert("RGBA")
    alpha_values = {
        value
        for value, count in enumerate(rgba.getchannel("A").histogram())
        if count
    }
    if not alpha_values.issubset({0, 255}):
        raise ValueError(f"Patches have soft alpha: {sorted(alpha_values)}")
    cells = split_grid(rgba, PATCH_COLUMNS, PATCH_ROWS)
    for row, row_cells in enumerate(cells):
        for column, cell in enumerate(row_cells):
            bounds = cell.getchannel("A").getbbox()
            if bounds is None:
                raise ValueError(f"Patch r{row}c{column} is empty.")
            left, top, right, bottom = bounds
            if (
                left < SAFE_MARGIN * RUNTIME_SCALE
                or top < SAFE_MARGIN * RUNTIME_SCALE
                or right > PATCH_CELL - SAFE_MARGIN * RUNTIME_SCALE
                or bottom > PATCH_CELL - SAFE_MARGIN * RUNTIME_SCALE
            ):
                raise ValueError(
                    f"Patch r{row}c{column} exceeds safe margin: {bounds}.",
                )


def save_png(image: Image.Image, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, format="PNG", optimize=True)
    print(f"Wrote {output} ({image.width}×{image.height})")


def prepare(args: argparse.Namespace) -> None:
    with Image.open(args.scene) as image:
        scene = image.convert("RGB")
    with Image.open(args.flora) as image:
        flora = image.convert("RGBA")
    with Image.open(args.terrain) as image:
        terrain = image.convert("RGB")

    grass, logical_tiles = build_grass_atlas(scene, terrain)
    patches = build_grass_patches(scene)
    details = build_details_atlas(flora, terrain, logical_tiles)
    validate_grass(grass)
    validate_patches(patches)
    validate_details(details)
    save_png(grass, args.grass_output)
    save_png(patches, args.patches_output)
    save_png(details, args.details_output)


def main() -> None:
    prepare(parse_args())


if __name__ == "__main__":
    main()
