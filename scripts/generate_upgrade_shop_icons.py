from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

FRAME = 16
TIERS = ["bronzium", "silverium", "goldium", "mithrium", "adamantium", "runite"]
UPGRADES = ["drill", "hull", "cargo_hold", "thrusters", "fuel_tank", "radiator"]

PALETTES = {
    "bronzium": {"base": (191, 118, 64, 255), "shadow": (118, 67, 32, 255), "light": (235, 182, 120, 255), "glow": (255, 218, 168, 255)},
    "silverium": {"base": (188, 204, 220, 255), "shadow": (103, 118, 136, 255), "light": (239, 245, 250, 255), "glow": (214, 235, 255, 255)},
    "goldium": {"base": (243, 194, 70, 255), "shadow": (155, 108, 26, 255), "light": (255, 233, 148, 255), "glow": (255, 246, 186, 255)},
    "mithrium": {"base": (108, 94, 193, 255), "shadow": (52, 39, 105, 255), "light": (177, 165, 244, 255), "glow": (205, 189, 255, 255)},
    "adamantium": {"base": (90, 170, 111, 255), "shadow": (42, 89, 53, 255), "light": (162, 230, 175, 255), "glow": (205, 255, 214, 255)},
    "runite": {"base": (86, 205, 243, 255), "shadow": (32, 101, 132, 255), "light": (189, 249, 255, 255), "glow": (220, 255, 255, 255)},
}


def put(img: Image.Image, x: int, y: int, color):
    if 0 <= x < FRAME and 0 <= y < FRAME:
        img.putpixel((x, y), color)


def fill_rect(img: Image.Image, x0: int, y0: int, x1: int, y1: int, color):
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            put(img, x, y, color)


def line(img: Image.Image, points: list[tuple[int, int]], color):
    draw = ImageDraw.Draw(img)
    draw.line(points, fill=color, width=1)


def draw_drill(img, palette, tier_index):
    fill_rect(img, 4, 2, 11, 4, palette["shadow"])
    fill_rect(img, 5, 3, 10, 6, palette["base"])
    fill_rect(img, 6, 2, 9, 3, palette["light"])
    fill_rect(img, 4, 5, 11, 6, palette["light"])
    fill_rect(img, 5, 7, 10, 8, palette["base"])
    fill_rect(img, 4, 9, 11, 9, palette["shadow"])
    fill_rect(img, 5, 10, 10, 10, palette["base"])
    fill_rect(img, 5, 11, 10, 11, palette["light"])
    fill_rect(img, 6, 12, 9, 12, palette["base"])
    fill_rect(img, 7, 13, 8, 13, palette["glow"])
    line(img, [(4, 8), (6, 10)], palette["shadow"])
    line(img, [(11, 8), (9, 10)], palette["shadow"])
    line(img, [(7, 4), (7, 12)], palette["glow"])
    line(img, [(8, 4), (8, 13)], palette["light"])
    if tier_index >= 1:
        fill_rect(img, 2, 4, 3, 6, palette["base"])
        fill_rect(img, 12, 4, 13, 6, palette["base"])
    if tier_index >= 3:
        line(img, [(3, 3), (5, 5)], palette["glow"])
        line(img, [(12, 3), (10, 5)], palette["glow"])
    if tier_index >= 5:
        put(img, 6, 13, palette["glow"])
        put(img, 9, 13, palette["glow"])


def draw_hull(img, palette, tier_index):
    line(img, [(5, 3), (10, 3), (12, 5), (12, 10), (10, 12), (5, 12), (3, 10), (3, 5), (5, 3)], palette["shadow"])
    fill_rect(img, 5, 4, 10, 5, palette["light"])
    fill_rect(img, 4, 6, 11, 10, palette["base"])
    fill_rect(img, 5, 11, 10, 11, palette["shadow"])
    fill_rect(img, 2, 8, 3, 10, palette["shadow"])
    fill_rect(img, 12, 8, 13, 10, palette["shadow"])
    fill_rect(img, 6, 6, 9, 7, palette["glow"])
    line(img, [(4, 11), (11, 11)], palette["shadow"])
    line(img, [(5, 8), (10, 8)], palette["light"])
    if tier_index >= 1:
        line(img, [(6, 4), (6, 10)], palette["light"])
        line(img, [(9, 4), (9, 10)], palette["light"])
    if tier_index >= 3:
        fill_rect(img, 1, 7, 2, 10, palette["base"])
        fill_rect(img, 13, 7, 14, 10, palette["base"])
    if tier_index >= 5:
        put(img, 7, 9, palette["glow"])
        put(img, 8, 9, palette["glow"])


def draw_cargo_hold(img, palette, tier_index):
    fill_rect(img, 3, 4, 12, 11, palette["shadow"])
    fill_rect(img, 4, 3, 13, 10, palette["base"])
    line(img, [(4, 6), (13, 6)], palette["light"])
    line(img, [(7, 3), (7, 10)], palette["light"])
    if tier_index >= 2:
      line(img, [(10, 3), (10, 10)], palette["light"])
    if tier_index >= 4:
      fill_rect(img, 5, 1, 12, 2, palette["glow"])


def draw_thrusters(img, palette, tier_index):
    fill_rect(img, 2, 4, 5, 10, palette["base"])
    fill_rect(img, 10, 4, 13, 10, palette["base"])
    fill_rect(img, 3, 10, 4, 13, palette["shadow"])
    fill_rect(img, 11, 10, 12, 13, palette["shadow"])
    fill_rect(img, 6, 6, 9, 8, palette["light"])
    line(img, [(3, 3), (4, 1)], palette["glow"])
    line(img, [(12, 3), (11, 1)], palette["glow"])
    if tier_index >= 2:
        fill_rect(img, 6, 4, 9, 5, palette["glow"])
    if tier_index >= 4:
        line(img, [(2, 12), (5, 14)], palette["light"])
        line(img, [(10, 14), (13, 12)], palette["light"])


def draw_fuel_tank(img, palette, tier_index):
    fill_rect(img, 4, 2, 11, 13, palette["base"])
    fill_rect(img, 5, 1, 10, 2, palette["light"])
    fill_rect(img, 5, 13, 10, 14, palette["shadow"])
    line(img, [(6, 5), (9, 5)], palette["shadow"])
    line(img, [(6, 8), (9, 8)], palette["shadow"])
    if tier_index >= 1:
        line(img, [(7, 3), (7, 12)], palette["glow"])
    if tier_index >= 3:
        fill_rect(img, 2, 6, 3, 10, palette["light"])
        fill_rect(img, 12, 6, 13, 10, palette["light"])
    if tier_index >= 5:
        put(img, 8, 7, palette["glow"])


def draw_radiator(img, palette, tier_index):
    fill_rect(img, 3, 3, 12, 12, palette["shadow"])
    fill_rect(img, 4, 4, 11, 11, palette["base"])
    for x in (5, 7, 9):
        line(img, [(x, 4), (x, 11)], palette["light"])
    line(img, [(4, 7), (11, 7)], palette["light"])
    if tier_index >= 2:
        put(img, 6, 2, palette["glow"])
        put(img, 9, 2, palette["glow"])
    if tier_index >= 4:
        line(img, [(2, 5), (4, 5)], palette["glow"])
        line(img, [(11, 10), (13, 10)], palette["glow"])


DRAWERS = {
    "drill": draw_drill,
    "hull": draw_hull,
    "cargo_hold": draw_cargo_hold,
    "thrusters": draw_thrusters,
    "fuel_tank": draw_fuel_tank,
    "radiator": draw_radiator,
}


def build_frame(upgrade: str, tier: str, tier_index: int) -> Image.Image:
    img = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    DRAWERS[upgrade](img, PALETTES[tier], tier_index)
    return img


def build_sheet() -> Image.Image:
    sheet = Image.new("RGBA", (FRAME * len(TIERS), FRAME * len(UPGRADES)), (0, 0, 0, 0))
    for row, upgrade in enumerate(UPGRADES):
        for col, tier in enumerate(TIERS):
            frame = build_frame(upgrade, tier, col)
            sheet.paste(frame, (col * FRAME, row * FRAME))
    return sheet


def build_contact_sheet(sheet: Image.Image) -> Image.Image:
    scale = 4
    pad_left = 128
    pad_top = 96
    cell_w = FRAME * scale + 22
    cell_h = FRAME * scale + 22
    width = pad_left + len(TIERS) * cell_w + 32
    height = pad_top + len(UPGRADES) * cell_h + 32
    out = Image.new("RGBA", (width, height), (9, 14, 24, 255))
    draw = ImageDraw.Draw(out)
    font = ImageFont.load_default()

    draw.text((24, 18), "Diggr Upgrade Sprite Approval Sheet", fill=(255, 226, 125, 255), font=font)
    draw.text((24, 40), "Rows: upgrade type  |  Columns: quality tier  |  16x16 source sprites", fill=(215, 214, 233, 255), font=font)

    for col, tier in enumerate(TIERS):
        label_x = pad_left + col * cell_w + 8
        draw.text((label_x, 70), tier.replace("_", " ").title(), fill=(255, 216, 121, 255), font=font)

    for row, upgrade in enumerate(UPGRADES):
        label_y = pad_top + row * cell_h + 24
        draw.text((22, label_y), upgrade.replace("_", " ").title(), fill=(255, 216, 121, 255), font=font)
        for col, _tier in enumerate(TIERS):
            frame = sheet.crop((col * FRAME, row * FRAME, (col + 1) * FRAME, (row + 1) * FRAME))
            scaled = frame.resize((FRAME * scale, FRAME * scale), Image.Resampling.NEAREST)
            x = pad_left + col * cell_w
            y = pad_top + row * cell_h
            draw.rounded_rectangle((x - 6, y - 6, x + FRAME * scale + 6, y + FRAME * scale + 6), radius=4, fill=(21, 33, 57, 255), outline=(246, 235, 201, 255), width=2)
            out.alpha_composite(scaled, (x, y))

    return out


def main():
    repo = Path(__file__).resolve().parents[1]
    sprite_path = repo / "src" / "assets" / "sprites" / "upgrade-shop-icons.png"
    contact_path = repo / "docs" / "upgrade-shop-sprite-contact-sheet.png"
    contact_path.parent.mkdir(parents=True, exist_ok=True)

    sheet = build_sheet()
    sheet.save(sprite_path)
    contact = build_contact_sheet(sheet)
    contact.save(contact_path)

    print(sprite_path)
    print(contact_path)


if __name__ == "__main__":
    main()
