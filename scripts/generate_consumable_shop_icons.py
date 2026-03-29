from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

FRAME = 16
COLUMNS = 4
CONSUMABLES = [
    "repair_nanobot",
    "repair_microbot",
    "small_fuel_tank",
    "large_fuel_tank",
    "small_tnt",
    "large_tnt",
    "matter_transporter",
    "quantum_fissurizer",
]

LABELS = {
    "repair_nanobot": "Repair Nanobot",
    "repair_microbot": "Repair Microbot",
    "small_fuel_tank": "Small Fuel Tank",
    "large_fuel_tank": "Large Fuel Tank",
    "small_tnt": "Small TNT",
    "large_tnt": "Large TNT",
    "matter_transporter": "Matter Transporter",
    "quantum_fissurizer": "Quantum Fissurizer",
}

PALETTES = {
    "repair_nanobot": {"base": (190, 88, 88, 255), "shadow": (111, 39, 42, 255), "light": (255, 184, 184, 255), "glow": (255, 232, 206, 255)},
    "repair_microbot": {"base": (218, 120, 120, 255), "shadow": (122, 57, 59, 255), "light": (255, 212, 214, 255), "glow": (255, 246, 216, 255)},
    "small_fuel_tank": {"base": (84, 167, 216, 255), "shadow": (34, 91, 123, 255), "light": (181, 225, 248, 255), "glow": (225, 250, 255, 255)},
    "large_fuel_tank": {"base": (77, 196, 181, 255), "shadow": (22, 103, 89, 255), "light": (183, 244, 234, 255), "glow": (225, 255, 246, 255)},
    "small_tnt": {"base": (205, 96, 63, 255), "shadow": (105, 42, 25, 255), "light": (255, 176, 138, 255), "glow": (255, 220, 188, 255)},
    "large_tnt": {"base": (235, 133, 78, 255), "shadow": (130, 62, 33, 255), "light": (255, 204, 152, 255), "glow": (255, 238, 192, 255)},
    "matter_transporter": {"base": (128, 116, 231, 255), "shadow": (58, 45, 124, 255), "light": (204, 195, 255, 255), "glow": (231, 223, 255, 255)},
    "quantum_fissurizer": {"base": (104, 224, 235, 255), "shadow": (26, 111, 124, 255), "light": (196, 251, 255, 255), "glow": (233, 255, 255, 255)},
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


def draw_repair_nanobot(img, palette):
    fill_rect(img, 5, 3, 10, 5, palette["base"])
    fill_rect(img, 4, 6, 11, 10, palette["light"])
    fill_rect(img, 3, 7, 4, 9, palette["base"])
    fill_rect(img, 11, 7, 12, 9, palette["base"])
    fill_rect(img, 5, 11, 6, 13, palette["shadow"])
    fill_rect(img, 9, 11, 10, 13, palette["shadow"])
    fill_rect(img, 7, 7, 8, 9, palette["glow"])
    fill_rect(img, 6, 8, 9, 8, palette["glow"])
    put(img, 6, 4, palette["glow"])
    put(img, 9, 4, palette["glow"])


def draw_repair_microbot(img, palette):
    fill_rect(img, 5, 2, 10, 4, palette["base"])
    fill_rect(img, 4, 5, 11, 10, palette["light"])
    fill_rect(img, 2, 6, 4, 10, palette["base"])
    fill_rect(img, 11, 6, 13, 10, palette["base"])
    fill_rect(img, 4, 11, 5, 13, palette["shadow"])
    fill_rect(img, 10, 11, 11, 13, palette["shadow"])
    fill_rect(img, 7, 6, 8, 10, palette["glow"])
    fill_rect(img, 6, 7, 9, 9, palette["glow"])
    line(img, [(3, 5), (2, 3)], palette["glow"])
    line(img, [(12, 5), (13, 3)], palette["glow"])


def draw_small_fuel_tank(img, palette):
    fill_rect(img, 5, 2, 10, 13, palette["base"])
    fill_rect(img, 6, 1, 9, 2, palette["light"])
    fill_rect(img, 6, 13, 9, 14, palette["shadow"])
    fill_rect(img, 7, 5, 8, 10, palette["light"])
    line(img, [(6, 4), (9, 4)], palette["shadow"])
    line(img, [(6, 11), (9, 11)], palette["shadow"])


def draw_large_fuel_tank(img, palette):
    fill_rect(img, 4, 1, 11, 13, palette["base"])
    fill_rect(img, 5, 0, 10, 2, palette["light"])
    fill_rect(img, 5, 13, 10, 14, palette["shadow"])
    fill_rect(img, 2, 5, 3, 11, palette["base"])
    fill_rect(img, 12, 5, 13, 11, palette["base"])
    fill_rect(img, 7, 3, 8, 11, palette["light"])
    line(img, [(6, 5), (9, 5)], palette["shadow"])
    line(img, [(6, 9), (9, 9)], palette["shadow"])


def draw_small_tnt(img, palette):
    fill_rect(img, 5, 5, 7, 12, palette["base"])
    fill_rect(img, 8, 5, 10, 12, palette["light"])
    line(img, [(6, 4), (6, 1)], palette["glow"])
    line(img, [(9, 4), (11, 2)], palette["glow"])
    line(img, [(4, 7), (11, 7)], palette["shadow"])
    line(img, [(4, 10), (11, 10)], palette["shadow"])


def draw_large_tnt(img, palette):
    fill_rect(img, 3, 5, 12, 11, palette["base"])
    fill_rect(img, 4, 6, 11, 10, palette["light"])
    line(img, [(6, 5), (6, 11)], palette["shadow"])
    line(img, [(9, 5), (9, 11)], palette["shadow"])
    line(img, [(3, 8), (12, 8)], palette["shadow"])
    line(img, [(8, 4), (8, 1)], palette["glow"])
    line(img, [(8, 1), (11, 2)], palette["glow"])


def draw_matter_transporter(img, palette):
    line(img, [(8, 1), (12, 4), (12, 10), (8, 13), (4, 10), (4, 4), (8, 1)], palette["base"])
    line(img, [(8, 3), (10, 5), (10, 9), (8, 11), (6, 9), (6, 5), (8, 3)], palette["light"])
    fill_rect(img, 7, 5, 8, 9, palette["glow"])
    put(img, 8, 0, palette["glow"])
    put(img, 3, 4, palette["glow"])
    put(img, 13, 4, palette["glow"])
    put(img, 3, 10, palette["glow"])
    put(img, 13, 10, palette["glow"])


def draw_quantum_fissurizer(img, palette):
    line(img, [(8, 1), (11, 4), (10, 9), (8, 13), (5, 9), (4, 4), (8, 1)], palette["base"])
    line(img, [(7, 3), (9, 5), (8, 9), (7, 12)], palette["light"])
    line(img, [(9, 4), (7, 7), (10, 11)], palette["glow"])
    line(img, [(5, 4), (3, 6)], palette["glow"])
    line(img, [(11, 4), (13, 6)], palette["glow"])
    put(img, 8, 0, palette["glow"])
    put(img, 6, 13, palette["glow"])
    put(img, 10, 13, palette["glow"])


DRAWERS = {
    "repair_nanobot": draw_repair_nanobot,
    "repair_microbot": draw_repair_microbot,
    "small_fuel_tank": draw_small_fuel_tank,
    "large_fuel_tank": draw_large_fuel_tank,
    "small_tnt": draw_small_tnt,
    "large_tnt": draw_large_tnt,
    "matter_transporter": draw_matter_transporter,
    "quantum_fissurizer": draw_quantum_fissurizer,
}


def build_frame(consumable: str) -> Image.Image:
    img = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    DRAWERS[consumable](img, PALETTES[consumable])
    return img


def build_sheet() -> Image.Image:
    rows = (len(CONSUMABLES) + COLUMNS - 1) // COLUMNS
    sheet = Image.new("RGBA", (FRAME * COLUMNS, FRAME * rows), (0, 0, 0, 0))
    for index, consumable in enumerate(CONSUMABLES):
        col = index % COLUMNS
        row = index // COLUMNS
        frame = build_frame(consumable)
        sheet.paste(frame, (col * FRAME, row * FRAME))
    return sheet


def build_contact_sheet(sheet: Image.Image) -> Image.Image:
    scale = 4
    rows = (len(CONSUMABLES) + COLUMNS - 1) // COLUMNS
    pad_left = 42
    pad_top = 86
    cell_w = FRAME * scale + 112
    cell_h = FRAME * scale + 48
    width = pad_left + COLUMNS * cell_w + 30
    height = pad_top + rows * cell_h + 34
    out = Image.new("RGBA", (width, height), (9, 14, 24, 255))
    draw = ImageDraw.Draw(out)
    font = ImageFont.load_default()

    draw.text((24, 18), "Diggr Consumable Sprite Approval Sheet", fill=(255, 226, 125, 255), font=font)
    draw.text((24, 40), "Icon-only shop buttons with hotkey badges in UI. Review silhouette readability here.", fill=(215, 214, 233, 255), font=font)

    for index, consumable in enumerate(CONSUMABLES):
        col = index % COLUMNS
        row = index // COLUMNS
        frame = sheet.crop((col * FRAME, row * FRAME, (col + 1) * FRAME, (row + 1) * FRAME))
        scaled = frame.resize((FRAME * scale, FRAME * scale), Image.Resampling.NEAREST)
        x = pad_left + col * cell_w
        y = pad_top + row * cell_h
        draw.rounded_rectangle((x - 6, y - 6, x + FRAME * scale + 6, y + FRAME * scale + 6), radius=4, fill=(21, 33, 57, 255), outline=(246, 235, 201, 255), width=2)
        out.alpha_composite(scaled, (x, y))
        draw.text((x, y + FRAME * scale + 10), LABELS[consumable], fill=(255, 216, 121, 255), font=font)

    return out


def main():
    repo = Path(__file__).resolve().parents[1]
    sprite_path = repo / "src" / "assets" / "sprites" / "consumable-shop-icons.png"
    contact_path = repo / "docs" / "consumable-shop-sprite-contact-sheet.png"
    contact_path.parent.mkdir(parents=True, exist_ok=True)

    sheet = build_sheet()
    sheet.save(sprite_path)
    contact = build_contact_sheet(sheet)
    contact.save(contact_path)

    print(sprite_path)
    print(contact_path)


if __name__ == "__main__":
    main()
