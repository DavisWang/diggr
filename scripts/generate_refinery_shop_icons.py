from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

FRAME = 16
COLUMNS = 3
MATERIALS = [
    "tinnite",
    "bronzium_ore",
    "silverium",
    "goldium_ore",
    "mithrium",
    "adamantium_ore",
    "runite_ore",
    "alien_skeleton",
    "alien_artifact",
]

LABELS = {
    "tinnite": "Tinnite",
    "bronzium_ore": "Bronzium Ore",
    "silverium": "Silverium",
    "goldium_ore": "Goldium",
    "mithrium": "Mithrium",
    "adamantium_ore": "Adamantium",
    "runite_ore": "Runite",
    "alien_skeleton": "Alien Skeleton",
    "alien_artifact": "Alien Artifact",
}

PALETTES = {
    "tinnite": {"base": (119, 128, 145, 255), "shadow": (67, 76, 91, 255), "light": (194, 202, 214, 255), "glow": (232, 236, 244, 255)},
    "bronzium_ore": {"base": (189, 118, 61, 255), "shadow": (103, 59, 27, 255), "light": (228, 170, 111, 255), "glow": (255, 219, 171, 255)},
    "silverium": {"base": (198, 208, 219, 255), "shadow": (105, 119, 135, 255), "light": (241, 246, 251, 255), "glow": (255, 255, 255, 255)},
    "goldium_ore": {"base": (242, 193, 71, 255), "shadow": (146, 103, 28, 255), "light": (255, 229, 142, 255), "glow": (255, 247, 196, 255)},
    "mithrium": {"base": (112, 96, 197, 255), "shadow": (54, 42, 111, 255), "light": (181, 170, 247, 255), "glow": (220, 210, 255, 255)},
    "adamantium_ore": {"base": (96, 171, 106, 255), "shadow": (43, 89, 50, 255), "light": (173, 234, 180, 255), "glow": (220, 255, 226, 255)},
    "runite_ore": {"base": (96, 205, 242, 255), "shadow": (36, 102, 131, 255), "light": (197, 250, 255, 255), "glow": (230, 255, 255, 255)},
    "alien_skeleton": {"base": (189, 212, 173, 255), "shadow": (96, 119, 90, 255), "light": (236, 247, 226, 255), "glow": (255, 255, 239, 255)},
    "alien_artifact": {"base": (244, 119, 255, 255), "shadow": (118, 55, 131, 255), "light": (131, 216, 255, 255), "glow": (255, 212, 255, 255)},
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


def draw_tinnite(img, palette):
    line(img, [(4, 12), (6, 4), (8, 2), (10, 5), (11, 11), (7, 13), (4, 12)], palette["shadow"])
    fill_rect(img, 6, 5, 8, 10, palette["base"])
    fill_rect(img, 7, 3, 8, 5, palette["light"])
    put(img, 7, 7, palette["glow"])
    put(img, 8, 10, palette["glow"])


def draw_bronzium(img, palette):
    fill_rect(img, 4, 4, 11, 11, palette["base"])
    fill_rect(img, 5, 5, 10, 10, palette["light"])
    line(img, [(4, 6), (11, 6)], palette["shadow"])
    line(img, [(4, 9), (11, 9)], palette["shadow"])
    line(img, [(6, 4), (6, 11)], palette["shadow"])
    line(img, [(9, 4), (9, 11)], palette["glow"])


def draw_silverium(img, palette):
    line(img, [(8, 2), (11, 5), (10, 11), (8, 13), (5, 11), (4, 5), (8, 2)], palette["shadow"])
    fill_rect(img, 6, 4, 9, 10, palette["base"])
    fill_rect(img, 7, 3, 8, 6, palette["light"])
    line(img, [(6, 10), (9, 10)], palette["glow"])


def draw_goldium(img, palette):
    fill_rect(img, 4, 4, 11, 11, palette["base"])
    fill_rect(img, 6, 2, 9, 4, palette["light"])
    fill_rect(img, 6, 11, 9, 13, palette["light"])
    line(img, [(4, 7), (11, 7)], palette["shadow"])
    line(img, [(7, 4), (7, 11)], palette["shadow"])
    put(img, 8, 7, palette["glow"])


def draw_mithrium(img, palette):
    line(img, [(4, 12), (6, 4), (8, 2), (10, 4), (12, 12)], palette["base"])
    line(img, [(6, 12), (8, 5), (10, 12)], palette["light"])
    line(img, [(5, 9), (11, 9)], palette["shadow"])
    fill_rect(img, 7, 7, 8, 9, palette["glow"])


def draw_adamantium(img, palette):
    line(img, [(3, 8), (5, 4), (10, 3), (12, 7), (10, 12), (5, 12), (3, 8)], palette["shadow"])
    fill_rect(img, 5, 5, 9, 10, palette["base"])
    fill_rect(img, 6, 4, 9, 6, palette["light"])
    line(img, [(5, 8), (10, 8)], palette["glow"])
    put(img, 7, 11, palette["glow"])


def draw_runite(img, palette):
    line(img, [(8, 2), (11, 5), (10, 10), (8, 13), (5, 10), (4, 5), (8, 2)], palette["base"])
    line(img, [(8, 3), (9, 6), (8, 9), (7, 12)], palette["light"])
    line(img, [(6, 6), (10, 6)], palette["glow"])
    put(img, 8, 1, palette["glow"])
    put(img, 5, 10, palette["glow"])
    put(img, 11, 10, palette["glow"])


def draw_skeleton(img, palette):
    fill_rect(img, 7, 2, 8, 4, palette["light"])
    fill_rect(img, 5, 5, 10, 6, palette["base"])
    fill_rect(img, 6, 7, 9, 8, palette["light"])
    fill_rect(img, 7, 9, 8, 13, palette["base"])
    fill_rect(img, 4, 7, 5, 8, palette["base"])
    fill_rect(img, 10, 7, 11, 8, palette["base"])
    fill_rect(img, 6, 12, 6, 14, palette["shadow"])
    fill_rect(img, 9, 12, 9, 14, palette["shadow"])
    put(img, 6, 3, palette["shadow"])
    put(img, 9, 3, palette["shadow"])


def draw_artifact(img, palette):
    line(img, [(8, 1), (12, 4), (11, 10), (8, 13), (4, 10), (3, 4), (8, 1)], palette["base"])
    line(img, [(8, 3), (10, 5), (9, 9), (8, 11), (6, 9), (5, 5), (8, 3)], palette["light"])
    line(img, [(6, 6), (10, 6)], palette["glow"])
    line(img, [(8, 3), (8, 10)], palette["shadow"])
    put(img, 8, 0, palette["glow"])
    put(img, 4, 10, palette["glow"])
    put(img, 12, 10, palette["glow"])


DRAWERS = {
    "tinnite": draw_tinnite,
    "bronzium_ore": draw_bronzium,
    "silverium": draw_silverium,
    "goldium_ore": draw_goldium,
    "mithrium": draw_mithrium,
    "adamantium_ore": draw_adamantium,
    "runite_ore": draw_runite,
    "alien_skeleton": draw_skeleton,
    "alien_artifact": draw_artifact,
}


def build_frame(material: str) -> Image.Image:
    img = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    DRAWERS[material](img, PALETTES[material])
    return img


def build_sheet() -> Image.Image:
    rows = (len(MATERIALS) + COLUMNS - 1) // COLUMNS
    sheet = Image.new("RGBA", (FRAME * COLUMNS, FRAME * rows), (0, 0, 0, 0))
    for index, material in enumerate(MATERIALS):
        col = index % COLUMNS
        row = index // COLUMNS
        frame = build_frame(material)
        sheet.paste(frame, (col * FRAME, row * FRAME))
    return sheet


def build_contact_sheet(sheet: Image.Image) -> Image.Image:
    scale = 4
    rows = (len(MATERIALS) + COLUMNS - 1) // COLUMNS
    pad_left = 42
    pad_top = 86
    cell_w = FRAME * scale + 132
    cell_h = FRAME * scale + 48
    width = pad_left + COLUMNS * cell_w + 30
    height = pad_top + rows * cell_h + 34
    out = Image.new("RGBA", (width, height), (9, 14, 24, 255))
    draw = ImageDraw.Draw(out)
    font = ImageFont.load_default()

    draw.text((24, 18), "Diggr Refinery Sprite Approval Sheet", fill=(255, 226, 125, 255), font=font)
    draw.text((24, 40), "Refinery cargo cards use these icons. Review ore readability and treasure distinction here.", fill=(215, 214, 233, 255), font=font)

    for index, material in enumerate(MATERIALS):
        col = index % COLUMNS
        row = index // COLUMNS
        frame = sheet.crop((col * FRAME, row * FRAME, (col + 1) * FRAME, (row + 1) * FRAME))
        scaled = frame.resize((FRAME * scale, FRAME * scale), Image.Resampling.NEAREST)
        x = pad_left + col * cell_w
        y = pad_top + row * cell_h
        draw.rounded_rectangle((x - 6, y - 6, x + FRAME * scale + 6, y + FRAME * scale + 6), radius=4, fill=(21, 33, 57, 255), outline=(246, 235, 201, 255), width=2)
        out.alpha_composite(scaled, (x, y))
        draw.text((x, y + FRAME * scale + 10), LABELS[material], fill=(255, 216, 121, 255), font=font)

    return out


def main():
    repo = Path(__file__).resolve().parents[1]
    sprite_path = repo / "src" / "assets" / "sprites" / "refinery-shop-icons.png"
    contact_path = repo / "docs" / "refinery-shop-sprite-contact-sheet.png"
    contact_path.parent.mkdir(parents=True, exist_ok=True)

    sheet = build_sheet()
    sheet.save(sprite_path)
    contact = build_contact_sheet(sheet)
    contact.save(contact_path)

    print(sprite_path)
    print(contact_path)


if __name__ == "__main__":
    main()
