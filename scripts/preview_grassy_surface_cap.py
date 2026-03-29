from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

FRAME = 16
WORLD_WIDTH = 13
SCALE = 4

PALETTE = {
    "bg": (9, 14, 24, 255),
    "panel": (21, 33, 57, 255),
    "outline": (32, 22, 15, 255),
    "dirt_dark": (91, 53, 28, 255),
    "dirt_mid": (125, 78, 37, 255),
    "dirt_light": (168, 107, 51, 255),
    "grass_dark": (52, 99, 46, 255),
    "grass_mid": (92, 160, 74, 255),
    "grass_light": (168, 215, 98, 255),
    "shop_gold": (240, 201, 74, 255),
    "shop_mint": (93, 211, 179, 255),
    "shop_violet": (139, 100, 217, 255),
    "shop_rose": (214, 90, 114, 255),
    "label": (255, 216, 121, 255),
    "copy": (215, 214, 233, 255),
    "cream": (246, 231, 184, 255),
}


def put(img: Image.Image, x: int, y: int, color):
    if 0 <= x < FRAME and 0 <= y < FRAME:
        img.putpixel((x, y), color)


def fill_rect(img: Image.Image, x0: int, y0: int, x1: int, y1: int, color):
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            put(img, x, y, color)


def line(img: Image.Image, points: list[tuple[int, int]], color):
    ImageDraw.Draw(img).line(points, fill=color, width=1)


def draw_current_cap(kind: str) -> Image.Image:
    img = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    fill_rect(img, 0, 6, 15, 15, PALETTE["dirt_mid"])
    fill_rect(img, 0, 7, 15, 8, PALETTE["dirt_light"])
    fill_rect(img, 0, 14, 15, 15, PALETTE["dirt_dark"])
    line(img, [(0, 6), (15, 6)], PALETTE["outline"])
    line(img, [(0, 7), (15, 7)], PALETTE["cream"])

    if kind == "left":
        line(img, [(1, 5), (5, 2)], PALETTE["dirt_light"])
    elif kind == "right":
        line(img, [(14, 5), (10, 2)], PALETTE["dirt_light"])
    else:
        line(img, [(3, 4), (7, 2)], PALETTE["dirt_light"])
        line(img, [(12, 4), (8, 2)], PALETTE["dirt_light"])

    return img


def draw_grassy_cap(kind: str) -> Image.Image:
    img = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    fill_rect(img, 0, 7, 15, 15, PALETTE["dirt_mid"])
    fill_rect(img, 0, 8, 15, 9, PALETTE["dirt_light"])
    fill_rect(img, 0, 14, 15, 15, PALETTE["dirt_dark"])
    line(img, [(0, 7), (15, 7)], PALETTE["outline"])
    line(img, [(0, 8), (15, 8)], PALETTE["grass_dark"])
    line(img, [(0, 9), (15, 9)], PALETTE["grass_mid"])

    for x in (1, 4, 7, 10, 13):
        put(img, x, 6, PALETTE["grass_light"])
        put(img, x + (1 if x < 15 else 0), 7, PALETTE["grass_mid"])
    if kind == "left":
        line(img, [(1, 6), (4, 4)], PALETTE["grass_light"])
        line(img, [(5, 6), (7, 5)], PALETTE["grass_mid"])
    elif kind == "right":
        line(img, [(14, 6), (11, 4)], PALETTE["grass_light"])
        line(img, [(10, 6), (8, 5)], PALETTE["grass_mid"])
    else:
        line(img, [(3, 6), (5, 4)], PALETTE["grass_light"])
        line(img, [(12, 6), (10, 4)], PALETTE["grass_light"])
        put(img, 8, 5, PALETTE["grass_light"])

    return img


def make_strip(frames: list[Image.Image]) -> Image.Image:
    strip = Image.new("RGBA", (WORLD_WIDTH * FRAME, FRAME * 5), PALETTE["bg"])
    sky_end = FRAME * 3
    draw = ImageDraw.Draw(strip)
    draw.rectangle((0, 0, strip.width, sky_end), fill=(19, 34, 59, 255))

    for x in range(WORLD_WIDTH):
      frame = frames[x % len(frames)]
      strip.alpha_composite(frame, (x * FRAME, sky_end - FRAME // 2))

    shop_colors = [PALETTE["shop_gold"], PALETTE["shop_mint"], PALETTE["shop_violet"], PALETTE["shop_rose"]]
    shop_positions = [2, 5, 8, 11]
    for index, column in enumerate(shop_positions):
        center_x = column * FRAME + FRAME // 2
        base_y = sky_end - 6
        draw.rectangle((center_x - 9, base_y - 20, center_x + 9, base_y), fill=shop_colors[index], outline=PALETTE["outline"])
        draw.rectangle((center_x - 5, base_y - 28, center_x + 5, base_y - 20), fill=shop_colors[index], outline=PALETTE["outline"])

    return strip


def build_preview() -> Image.Image:
    current_frames = [draw_current_cap("left"), draw_current_cap("mid"), draw_current_cap("right")]
    grassy_frames = [draw_grassy_cap("left"), draw_grassy_cap("mid"), draw_grassy_cap("right")]
    current_strip = make_strip(current_frames).resize((WORLD_WIDTH * FRAME * SCALE, FRAME * 5 * SCALE), Image.Resampling.NEAREST)
    grassy_strip = make_strip(grassy_frames).resize((WORLD_WIDTH * FRAME * SCALE, FRAME * 5 * SCALE), Image.Resampling.NEAREST)

    width = current_strip.width + 60
    height = current_strip.height * 2 + 120
    out = Image.new("RGBA", (width, height), PALETTE["bg"])
    draw = ImageDraw.Draw(out)
    font = ImageFont.load_default()

    draw.text((24, 18), "Diggr Ground Sprite Preview", fill=PALETTE["label"], font=font)
    draw.text((24, 40), "Preview only. Proposed grass stays shallow so shop sprites keep clear separation.", fill=PALETTE["copy"], font=font)

    current_y = 74
    draw.text((24, current_y - 18), "Current integrated cap", fill=PALETTE["label"], font=font)
    draw.rounded_rectangle((20, current_y - 6, 20 + current_strip.width + 12, current_y + current_strip.height + 6), radius=4, fill=PALETTE["panel"], outline=PALETTE["cream"], width=2)
    out.alpha_composite(current_strip, (26, current_y))

    grassy_y = current_y + current_strip.height + 44
    draw.text((24, grassy_y - 18), "Proposed grassy cap", fill=PALETTE["label"], font=font)
    draw.rounded_rectangle((20, grassy_y - 6, 20 + grassy_strip.width + 12, grassy_y + grassy_strip.height + 6), radius=4, fill=PALETTE["panel"], outline=PALETTE["cream"], width=2)
    out.alpha_composite(grassy_strip, (26, grassy_y))

    return out


def main():
    repo = Path(__file__).resolve().parents[1]
    output_path = repo / "docs" / "grassy-ground-preview.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    build_preview().save(output_path)
    print(output_path)


if __name__ == "__main__":
    main()
