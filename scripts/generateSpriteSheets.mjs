import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const OUTPUT_DIR = path.resolve('src/assets/sprites');

const palette = {
  transparent: [0, 0, 0, 0],
  outline: '#20160f',
  dirtDark: '#5b351c',
  dirtMid: '#7d4e25',
  dirtLight: '#a86b33',
  rockDark: '#434b5c',
  rockMid: '#6a7185',
  rockLight: '#9da5b7',
  steelDark: '#43505f',
  steelMid: '#6c7c8e',
  cream: '#f6e7b8',
  lavaDeep: '#c63b18',
  lavaHot: '#ff6f2d',
  gold: '#f0c94a',
  goldBright: '#ffd84d',
  mint: '#5dd3b3',
  rose: '#d65a72',
  violet: '#8b64d9',
  silverDark: '#66707e',
  silverMid: '#9099a6',
  silverBright: '#cfd6de',
  bronzeDark: '#7e4928',
  bronzeMid: '#b66c3d',
  bronzeBright: '#d89c67',
  mithriumDark: '#2d2b56',
  mithriumMid: '#4c478d',
  mithriumBright: '#8e84d6',
  adamantiumDark: '#29402d',
  adamantiumMid: '#3d6e45',
  adamantiumBright: '#72a67a',
  runiteDark: '#3d7fa0',
  runiteMid: '#66b9e7',
  runiteBright: '#8edcff',
  artifactPink: '#f677ff',
  artifactCyan: '#59d4ff',
  artifactAmber: '#ffb347',
};

const terrainFrames = [
  drawDirt(),
  drawRock(),
  drawLava(),
  drawOreVein('silver'),
  drawOreVein('bronze'),
  drawOreVein('silverBright'),
  drawOreVein('gold'),
  drawOreVein('mithrium'),
  drawOreVein('adamantium'),
  drawOreVein('runite'),
  drawSkeleton(),
  drawArtifactCore(),
  drawArtifactTablet(),
  drawArtifactRelic(),
];

const diggerFrames = [
  drawDigger({ antenna: true, treads: 0 }),
  drawDigger({ antenna: true, treads: 1 }),
  drawDigger({ treads: 0 }),
  drawDigger({ treads: 1 }),
  drawDigger({ treads: 2, motion: true }),
  drawDigger({ treads: 3, motion: true }),
  drawDigger({ drill: 'left', treads: 2 }),
  drawDigger({ drill: 'left', treads: 3, sparks: true }),
  drawDigger({ drill: 'down', treads: 0 }),
  drawDigger({ drill: 'down', treads: 1, sparks: true }),
  drawDigger({ flame: 'up', lift: true }),
  drawDigger({ flame: 'up', lift: true, sparks: true }),
  drawDigger({ flame: 'left', lift: true }),
  drawDigger({ flame: 'left', lift: true, sparks: true }),
  drawDigger({ falling: true }),
  drawDigger({ damaged: true }),
  drawDigger({ destroyed: true }),
];

const shopFrames = [
  drawShop('gold', 'U'),
  drawShop('mint', 'C'),
  drawShop('violet', 'R'),
  drawShop('rose', 'S'),
];

function drawDirt() {
  const canvas = createFrame();
  fillRect(canvas, 0, 0, 16, 16, 'dirtMid');
  frameRect(canvas, 0, 0, 16, 16, 'outline');
  scatter(canvas, [
    [2, 2, 'dirtDark'],
    [5, 4, 'dirtLight'],
    [9, 2, 'dirtDark'],
    [12, 5, 'dirtLight'],
    [3, 8, 'dirtLight'],
    [7, 7, 'dirtDark'],
    [11, 10, 'dirtDark'],
    [5, 12, 'dirtLight'],
    [13, 12, 'dirtDark'],
  ]);
  line(canvas, 4, 5, 7, 8, 'dirtDark');
  line(canvas, 9, 9, 12, 12, 'dirtDark');
  return canvas;
}

function drawRock() {
  const canvas = createFrame();
  fillRect(canvas, 0, 0, 16, 16, 'rockMid');
  frameRect(canvas, 0, 0, 16, 16, 'outline');
  fillRect(canvas, 1, 1, 14, 3, 'rockLight');
  scatter(canvas, [
    [3, 5, 'rockDark'],
    [6, 7, 'rockDark'],
    [10, 6, 'rockLight'],
    [12, 8, 'rockDark'],
    [4, 11, 'rockLight'],
    [8, 12, 'rockDark'],
    [12, 12, 'rockLight'],
  ]);
  line(canvas, 2, 9, 6, 13, 'rockDark');
  line(canvas, 10, 4, 13, 7, 'rockDark');
  return canvas;
}

function drawLava() {
  const canvas = createFrame();
  fillRect(canvas, 0, 0, 16, 16, 'lavaDeep');
  frameRect(canvas, 0, 0, 16, 16, 'outline');
  fillRect(canvas, 2, 2, 12, 3, 'lavaHot');
  fillRect(canvas, 4, 7, 8, 3, 'lavaHot');
  fillRect(canvas, 3, 12, 10, 2, 'lavaHot');
  scatter(canvas, [
    [5, 3, 'cream'],
    [9, 4, 'gold'],
    [6, 8, 'cream'],
    [10, 8, 'gold'],
    [7, 13, 'cream'],
  ]);
  line(canvas, 1, 5, 4, 8, 'lavaHot');
  line(canvas, 11, 5, 14, 8, 'lavaHot');
  return canvas;
}

function drawOreVein(kind) {
  const canvas = drawDirt();
  const colors = getOrePalette(kind);
  paintOreBed(canvas);

  switch (kind) {
    case 'silver':
      fillRect(canvas, 3, 3, 3, 10, colors.mid);
      fillRect(canvas, 9, 4, 2, 8, colors.mid);
      line(canvas, 5, 4, 8, 2, colors.dark);
      line(canvas, 10, 6, 12, 3, colors.dark);
      scatter(canvas, [
        [4, 4, colors.bright],
        [4, 7, colors.bright],
        [4, 10, colors.bright],
        [9, 5, colors.bright],
        [9, 9, colors.bright],
      ]);
      break;
    case 'bronze':
      fillRect(canvas, 2, 4, 4, 4, colors.mid);
      fillRect(canvas, 7, 3, 5, 5, colors.mid);
      fillRect(canvas, 6, 9, 6, 4, colors.mid);
      frameRect(canvas, 7, 3, 5, 5, colors.dark);
      scatter(canvas, [
        [3, 5, colors.bright],
        [5, 6, colors.bright],
        [8, 4, colors.bright],
        [10, 6, colors.bright],
        [7, 10, colors.bright],
        [10, 11, colors.bright],
      ]);
      break;
    case 'silverBright':
      fillRect(canvas, 4, 2, 3, 11, colors.mid);
      fillRect(canvas, 8, 3, 4, 10, colors.mid);
      line(canvas, 3, 4, 5, 2, colors.dark);
      line(canvas, 11, 4, 13, 2, colors.dark);
      line(canvas, 5, 13, 7, 15, colors.dark);
      scatter(canvas, [
        [5, 3, colors.bright],
        [5, 7, colors.bright],
        [5, 11, colors.bright],
        [9, 4, colors.bright],
        [10, 8, colors.bright],
        [9, 12, colors.bright],
      ]);
      break;
    case 'gold':
      fillRect(canvas, 3, 4, 3, 3, colors.mid);
      fillRect(canvas, 8, 3, 4, 4, colors.mid);
      fillRect(canvas, 5, 9, 5, 4, colors.mid);
      scatter(canvas, [
        [4, 5, colors.bright],
        [9, 4, colors.bright],
        [10, 6, colors.bright],
        [6, 10, colors.bright],
        [8, 11, colors.bright],
        [11, 9, colors.bright],
        [12, 6, 'cream'],
        [3, 9, 'cream'],
      ]);
      line(canvas, 2, 7, 5, 9, colors.dark);
      line(canvas, 9, 7, 12, 9, colors.dark);
      break;
    case 'mithrium':
      line(canvas, 4, 13, 7, 2, colors.mid);
      line(canvas, 7, 2, 10, 13, colors.mid);
      line(canvas, 10, 13, 12, 5, colors.mid);
      line(canvas, 5, 11, 11, 11, colors.dark);
      fillRect(canvas, 6, 5, 2, 5, colors.mid);
      fillRect(canvas, 9, 6, 2, 4, colors.mid);
      scatter(canvas, [
        [7, 4, colors.bright],
        [7, 8, colors.bright],
        [10, 7, colors.bright],
        [9, 11, colors.bright],
      ]);
      break;
    case 'adamantium':
      fillRect(canvas, 3, 5, 3, 6, colors.mid);
      fillRect(canvas, 7, 4, 3, 8, colors.mid);
      fillRect(canvas, 11, 5, 2, 6, colors.mid);
      fillRect(canvas, 5, 7, 6, 2, colors.mid);
      line(canvas, 3, 5, 5, 3, colors.dark);
      line(canvas, 10, 3, 12, 5, colors.dark);
      scatter(canvas, [
        [4, 6, colors.bright],
        [8, 5, colors.bright],
        [8, 10, colors.bright],
        [11, 6, colors.bright],
        [6, 8, colors.bright],
      ]);
      break;
    case 'runite':
      line(canvas, 3, 12, 6, 3, colors.mid);
      line(canvas, 6, 3, 9, 12, colors.mid);
      line(canvas, 9, 12, 12, 4, colors.mid);
      fillRect(canvas, 5, 6, 2, 4, colors.mid);
      fillRect(canvas, 8, 7, 2, 3, colors.mid);
      scatter(canvas, [
        [6, 4, colors.bright],
        [6, 8, colors.bright],
        [9, 6, colors.bright],
        [10, 10, colors.bright],
        [11, 5, 'cream'],
      ]);
      break;
    default:
      break;
  }
  return canvas;
}

function drawSkeleton() {
  const canvas = drawDirt();
  fillRect(canvas, 2, 6, 4, 4, 'cream');
  frameRect(canvas, 2, 6, 4, 4, 'outline');
  setPixel(canvas, 3, 7, 'outline');
  setPixel(canvas, 4, 7, 'outline');
  line(canvas, 5, 8, 9, 8, 'cream');
  line(canvas, 6, 7, 9, 5, 'cream');
  line(canvas, 6, 9, 9, 11, 'cream');
  line(canvas, 9, 8, 13, 6, 'cream');
  line(canvas, 9, 8, 13, 10, 'cream');
  line(canvas, 8, 8, 12, 4, 'outline');
  line(canvas, 8, 8, 12, 12, 'outline');
  return canvas;
}

function drawArtifactCore() {
  const canvas = drawDirt();
  fillRect(canvas, 4, 3, 8, 10, 'artifactPink');
  frameRect(canvas, 4, 3, 8, 10, 'outline');
  fillRect(canvas, 6, 5, 4, 6, 'artifactCyan');
  frameRect(canvas, 6, 5, 4, 6, 'outline');
  scatter(canvas, [
    [5, 4, 'goldBright'],
    [10, 4, 'goldBright'],
    [5, 11, 'goldBright'],
    [10, 11, 'goldBright'],
    [7, 7, 'cream'],
    [8, 8, 'cream'],
  ]);
  return canvas;
}

function drawArtifactTablet() {
  const canvas = drawDirt();
  fillRect(canvas, 3, 2, 10, 12, 'artifactAmber');
  frameRect(canvas, 3, 2, 10, 12, 'outline');
  fillRect(canvas, 5, 4, 6, 1, 'artifactCyan');
  fillRect(canvas, 5, 7, 5, 1, 'artifactPink');
  fillRect(canvas, 5, 10, 6, 1, 'artifactCyan');
  scatter(canvas, [
    [4, 3, 'goldBright'],
    [11, 3, 'goldBright'],
    [4, 12, 'goldBright'],
    [11, 12, 'goldBright'],
    [7, 6, 'cream'],
    [8, 9, 'cream'],
  ]);
  return canvas;
}

function drawArtifactRelic() {
  const canvas = drawDirt();
  fillRect(canvas, 6, 1, 4, 14, 'artifactCyan');
  frameRect(canvas, 6, 1, 4, 14, 'outline');
  fillRect(canvas, 3, 4, 10, 3, 'artifactAmber');
  fillRect(canvas, 3, 10, 10, 3, 'artifactPink');
  frameRect(canvas, 3, 4, 10, 3, 'outline');
  frameRect(canvas, 3, 10, 10, 3, 'outline');
  scatter(canvas, [
    [7, 2, 'goldBright'],
    [8, 13, 'goldBright'],
    [4, 5, 'cream'],
    [11, 5, 'cream'],
    [4, 11, 'cream'],
    [11, 11, 'cream'],
  ]);
  return canvas;
}

function getOrePalette(kind) {
  const palettes = {
    silver: { dark: 'silverDark', mid: 'silverMid', bright: 'silverBright' },
    bronze: { dark: 'bronzeDark', mid: 'bronzeMid', bright: 'bronzeBright' },
    silverBright: { dark: 'silverMid', mid: 'silverBright', bright: 'cream' },
    gold: { dark: 'bronzeMid', mid: 'gold', bright: 'goldBright' },
    mithrium: { dark: 'mithriumDark', mid: 'mithriumMid', bright: 'mithriumBright' },
    adamantium: { dark: 'adamantiumDark', mid: 'adamantiumMid', bright: 'adamantiumBright' },
    runite: { dark: 'runiteDark', mid: 'runiteMid', bright: 'runiteBright' },
  };
  return palettes[kind];
}

function paintOreBed(canvas) {
  scatter(canvas, [
    [2, 2, 'outline'],
    [12, 3, 'outline'],
    [3, 12, 'outline'],
    [13, 11, 'outline'],
    [5, 6, 'dirtLight'],
    [10, 5, 'dirtDark'],
    [7, 13, 'dirtDark'],
  ]);
}

function drawShop(accent, letter) {
  const canvas = createFrame();
  fillRect(canvas, 2, 8, 12, 6, 'steelMid');
  frameRect(canvas, 2, 8, 12, 6, 'outline');
  fillRect(canvas, 1, 6, 14, 3, accent);
  fillRect(canvas, 3, 5, 10, 2, accent);
  fillRect(canvas, 6, 10, 4, 4, 'outline');
  fillRect(canvas, 7, 10, 2, 4, 'cream');
  fillRect(canvas, 3, 10, 2, 2, 'cream');
  fillRect(canvas, 11, 10, 2, 2, 'cream');
  drawLetter(canvas, 6, 1, letter, 'cream');
  setPixel(canvas, 5, 15, 'dirtDark');
  setPixel(canvas, 10, 15, 'dirtDark');
  return canvas;
}

function drawDigger(options) {
  const canvas = createFrame();

  if (options.destroyed) {
    fillRect(canvas, 3, 8, 5, 4, 'steelDark');
    fillRect(canvas, 9, 9, 4, 3, 'steelMid');
    scatter(canvas, [
      [2, 13, 'rose'],
      [5, 6, 'rose'],
      [8, 13, 'cream'],
      [12, 6, 'rose'],
    ]);
    line(canvas, 8, 7, 12, 4, 'outline');
    frameRect(canvas, 3, 8, 5, 4, 'outline');
    return canvas;
  }

  const bodyY = options.lift ? 5 : 6;
  fillRect(canvas, 3, bodyY, 10, 4, 'steelMid');
  frameRect(canvas, 3, bodyY, 10, 4, 'outline');
  fillRect(canvas, 5, bodyY - 2, 5, 3, 'cream');
  frameRect(canvas, 5, bodyY - 2, 5, 3, 'outline');
  setPixel(canvas, 6, bodyY - 1, 'steelDark');
  setPixel(canvas, 8, bodyY - 1, 'steelDark');
  setPixel(canvas, 10, bodyY - 1, 'steelDark');

  if (options.antenna) {
    line(canvas, 9, bodyY - 4, 10, bodyY - 2, 'outline');
    setPixel(canvas, 9, bodyY - 4, 'gold');
  }

  if (options.falling) {
    line(canvas, 2, 10, 5, 12, 'steelDark');
    line(canvas, 10, 10, 13, 12, 'steelDark');
  } else {
    drawTreads(canvas, bodyY + 4, options.treads ?? 0);
  }

  if (options.drill === 'left') {
    line(canvas, 3, bodyY + 1, 0, bodyY + 3, 'steelDark');
    setPixel(canvas, 0, bodyY + 3, 'gold');
    setPixel(canvas, 1, bodyY + 2, 'gold');
  }

  if (options.drill === 'down') {
    line(canvas, 8, bodyY + 4, 8, 15, 'steelDark');
    setPixel(canvas, 8, 15, 'gold');
    setPixel(canvas, 7, 14, 'gold');
    setPixel(canvas, 9, 14, 'gold');
  }

  if (options.flame === 'up') {
    fillRect(canvas, 5, bodyY + 8, 2, 3, 'lavaHot');
    fillRect(canvas, 9, bodyY + 8, 2, 3, 'lavaHot');
    setPixel(canvas, 5, bodyY + 11, 'lavaDeep');
    setPixel(canvas, 10, bodyY + 11, 'lavaDeep');
  }

  if (options.flame === 'left') {
    fillRect(canvas, 10, bodyY + 7, 3, 2, 'lavaHot');
    fillRect(canvas, 4, bodyY + 8, 2, 2, 'lavaHot');
    setPixel(canvas, 13, bodyY + 7, 'lavaDeep');
    setPixel(canvas, 5, bodyY + 10, 'lavaDeep');
  }

  if (options.motion) {
    setPixel(canvas, 2, bodyY + 5, 'dirtLight');
    setPixel(canvas, 1, bodyY + 6, 'dirtDark');
  }

  if (options.damaged) {
    line(canvas, 4, bodyY, 11, bodyY + 3, 'rose');
    scatter(canvas, [
      [2, bodyY + 1, 'rose'],
      [13, bodyY + 2, 'rose'],
      [8, bodyY + 6, 'cream'],
    ]);
  }

  if (options.sparks) {
    scatter(canvas, [
      [1, bodyY + 2, 'cream'],
      [12, bodyY + 5, 'gold'],
      [14, bodyY + 3, 'cream'],
    ]);
  }

  return canvas;
}

function drawTreads(canvas, y, frame) {
  fillRect(canvas, 2, y, 12, 2, 'outline');
  fillRect(canvas, 3, y, 10, 2, 'steelDark');
  const offsets = frame % 2 === 0 ? [4, 7, 10] : [5, 8, 11];
  for (const x of offsets) {
    setPixel(canvas, x, y, 'cream');
    setPixel(canvas, x - 1, y + 1, 'cream');
  }
}

function drawLetter(canvas, x, y, letter, color) {
  const glyphs = {
    U: ['1001', '1001', '1001', '1111'],
    C: ['1111', '1000', '1000', '1111'],
    R: ['1110', '1001', '1110', '1001'],
    S: ['1111', '1000', '0110', '1111'],
  };
  const glyph = glyphs[letter];
  for (let row = 0; row < glyph.length; row += 1) {
    for (let col = 0; col < glyph[row].length; col += 1) {
      if (glyph[row][col] === '1') {
        setPixel(canvas, x + col, y + row, color);
      }
    }
  }
}

function createFrame() {
  return createCanvas(16, 16);
}

function createCanvas(width, height) {
  return {
    width,
    height,
    pixels: new Uint8Array(width * height * 4),
  };
}

function buildSheet(frames, columns) {
  const rows = Math.ceil(frames.length / columns);
  const sheet = createCanvas(columns * 16, rows * 16);

  frames.forEach((frame, index) => {
    const offsetX = (index % columns) * 16;
    const offsetY = Math.floor(index / columns) * 16;
    blit(sheet, frame, offsetX, offsetY);
  });

  return sheet;
}

function blit(target, source, offsetX, offsetY) {
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceIndex = (y * source.width + x) * 4;
      const alpha = source.pixels[sourceIndex + 3];
      if (alpha === 0) {
        continue;
      }

      const targetIndex = ((offsetY + y) * target.width + (offsetX + x)) * 4;
      target.pixels[targetIndex] = source.pixels[sourceIndex];
      target.pixels[targetIndex + 1] = source.pixels[sourceIndex + 1];
      target.pixels[targetIndex + 2] = source.pixels[sourceIndex + 2];
      target.pixels[targetIndex + 3] = alpha;
    }
  }
}

function scatter(canvas, points) {
  for (const [x, y, color] of points) {
    setPixel(canvas, x, y, color);
  }
}

function fillRect(canvas, x, y, width, height, color) {
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      setPixel(canvas, col, row, color);
    }
  }
}

function frameRect(canvas, x, y, width, height, color) {
  for (let col = x; col < x + width; col += 1) {
    setPixel(canvas, col, y, color);
    setPixel(canvas, col, y + height - 1, color);
  }

  for (let row = y; row < y + height; row += 1) {
    setPixel(canvas, x, row, color);
    setPixel(canvas, x + width - 1, row, color);
  }
}

function line(canvas, x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  let currentX = x0;
  let currentY = y0;

  while (true) {
    setPixel(canvas, currentX, currentY, color);
    if (currentX === x1 && currentY === y1) {
      break;
    }

    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      currentX += sx;
    }
    if (doubled <= dx) {
      error += dx;
      currentY += sy;
    }
  }
}

function setPixel(canvas, x, y, colorName) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return;
  }

  const color = palette[colorName] ?? palette.transparent;
  const rgba = Array.isArray(color) ? color : hexToRgba(color);
  const index = (y * canvas.width + x) * 4;
  canvas.pixels[index] = rgba[0];
  canvas.pixels[index + 1] = rgba[1];
  canvas.pixels[index + 2] = rgba[2];
  canvas.pixels[index + 3] = rgba[3] ?? 255;
}

function writePng(filePath, canvas) {
  const pixelBytes = Buffer.from(canvas.pixels);
  const rows = [];
  for (let y = 0; y < canvas.height; y += 1) {
    const row = Buffer.alloc(1 + canvas.width * 4);
    row[0] = 0;
    pixelBytes.copy(row, 1, y * canvas.width * 4, (y + 1) * canvas.width * 4);
    rows.push(row);
  }

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', Buffer.concat([u32(canvas.width), u32(canvas.height), Buffer.from([8, 6, 0, 0, 0])])),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filePath, png);
}

function chunk(type, data) {
  const name = Buffer.from(type);
  return Buffer.concat([u32(data.length), name, data, u32(crc32(Buffer.concat([name, data])))]);
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0, 0);
  return buffer;
}

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function hexToRgba(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255,
  ];
}

const CRC_TABLE = new Uint32Array(
  Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  }),
);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
writePng(path.join(OUTPUT_DIR, 'terrain-sheet.png'), buildSheet(terrainFrames, 4));
writePng(path.join(OUTPUT_DIR, 'digger-sheet.png'), buildSheet(diggerFrames, 5));
writePng(path.join(OUTPUT_DIR, 'surface-shops.png'), buildSheet(shopFrames, 4));
