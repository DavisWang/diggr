import {
  BLOCK_DEFS,
  DEPTH_BANDS,
  ENTRY_COLUMN,
  ENTRY_SHAFT_DEPTH,
  WORLD_CHUNK_SIZE,
  WORLD_WIDTH,
  getTierIndex,
} from '../config/content';
import { hashSeed, mulberry32, randomInt } from '../lib/random';
import type { BlockCell, BlockType, DepthBandConfig, EquipmentTier, WorldChunk, WorldState } from '../types';

export type DrillMiningMode = 'native' | 'overclocked' | 'blocked';

export function createWorld(seed: number): WorldState {
  return {
    seed,
    width: WORLD_WIDTH,
    chunkSize: WORLD_CHUNK_SIZE,
    chunks: {},
    destroyedCells: {},
    discoveredCells: {},
  };
}

export function cellKey(x: number, row: number): string {
  return `${x},${row}`;
}

export function isSolidType(type: BlockType): boolean {
  return BLOCK_DEFS[type].hardness !== 'empty';
}

export function isDestructibleType(type: BlockType): boolean {
  return type !== 'air' && type !== 'rock';
}

export function canDrillTierMine(required: EquipmentTier | undefined, current: EquipmentTier): boolean {
  return getDrillMiningMode(required, current) !== 'blocked';
}

export function getDrillMiningMode(required: EquipmentTier | undefined, current: EquipmentTier): DrillMiningMode {
  if (!required) {
    return 'native';
  }

  const tierDelta = getTierIndex(current) - getTierIndex(required);
  if (tierDelta >= 0) {
    return 'native';
  }

  if (tierDelta === -1) {
    return 'overclocked';
  }

  return 'blocked';
}

export function getDepthBand(depth: number): DepthBandConfig {
  return DEPTH_BANDS.find((band) => depth <= band.maxDepth) ?? DEPTH_BANDS[DEPTH_BANDS.length - 1];
}

export function ensureChunk(world: WorldState, chunkIndex: number): WorldChunk {
  const existing = world.chunks[String(chunkIndex)];

  if (existing) {
    return existing;
  }

  const chunk = buildChunk(world, chunkIndex);
  world.chunks[String(chunkIndex)] = chunk;
  return chunk;
}

export function ensureRows(world: WorldState, minRow: number, maxRow: number): void {
  const safeMin = Math.max(0, Math.floor(minRow));
  const safeMax = Math.max(safeMin, Math.floor(maxRow));

  for (let row = safeMin; row <= safeMax; row += 1) {
    const chunkIndex = Math.floor(row / world.chunkSize);
    ensureChunk(world, chunkIndex);
  }
}

export function getCell(world: WorldState, x: number, row: number): BlockCell {
  if (row < 0 || x < 0 || x >= world.width) {
    return { type: 'air', discovered: true };
  }

  const chunkIndex = Math.floor(row / world.chunkSize);
  const chunk = ensureChunk(world, chunkIndex);
  const cells = chunk.rows[String(row)];

  if (!cells) {
    throw new Error(`Missing row ${row}`);
  }

  return cells[x];
}

export function setCell(world: WorldState, x: number, row: number, type: BlockType, discovered = true): void {
  if (row < 0 || x < 0 || x >= world.width) {
    return;
  }

  const chunk = ensureChunk(world, Math.floor(row / world.chunkSize));
  const cells = chunk.rows[String(row)];
  cells[x] = { type, discovered };

  const key = cellKey(x, row);
  if (type === 'air') {
    world.destroyedCells[key] = true;
  } else {
    delete world.destroyedCells[key];
  }

  if (discovered) {
    world.discoveredCells[key] = true;
  } else {
    delete world.discoveredCells[key];
  }
}

export function discoverCell(world: WorldState, x: number, row: number): void {
  if (row < 0 || x < 0 || x >= world.width) {
    return;
  }

  const key = cellKey(x, row);
  world.discoveredCells[key] = true;
  const cell = getCell(world, x, row);
  cell.discovered = true;
}

export function regenerateWorldBelowRow(world: WorldState, startRow: number): void {
  const safeStartRow = Math.max(1, Math.floor(startRow));
  pruneKeysFromRow(world.destroyedCells, safeStartRow);
  pruneKeysFromRow(world.discoveredCells, safeStartRow);

  for (const [chunkKey, existingChunk] of Object.entries(world.chunks)) {
    const chunkIndex = Number(chunkKey);
    const chunkStartRow = chunkIndex * world.chunkSize;
    const chunkEndRow = chunkStartRow + world.chunkSize - 1;
    if (chunkEndRow < safeStartRow) {
      continue;
    }

    const rebuiltChunk = buildChunk(world, chunkIndex);
    if (chunkStartRow >= safeStartRow) {
      world.chunks[chunkKey] = rebuiltChunk;
      continue;
    }

    for (let row = safeStartRow; row <= chunkEndRow; row += 1) {
      existingChunk.rows[String(row)] = rebuiltChunk.rows[String(row)];
    }
  }
}

function buildChunk(world: WorldState, chunkIndex: number): WorldChunk {
  const startRow = chunkIndex * world.chunkSize;
  const chunkSeed = hashSeed(world.seed, chunkIndex + 1013);
  const random = mulberry32(chunkSeed);
  const rows: Record<string, BlockCell[]> = {};

  for (let offset = 0; offset < world.chunkSize; offset += 1) {
    const rowIndex = startRow + offset;
    rows[String(rowIndex)] = Array.from({ length: world.width }, (_, x) => ({
      type: generateBlockType(random, rowIndex, x),
      discovered: Boolean(world.discoveredCells[cellKey(x, rowIndex)]),
    }));
  }

  carveCaverns(rows, startRow, world.width, world.chunkSize, random);

  const chunk: WorldChunk = {
    index: chunkIndex,
    seed: chunkSeed,
    rows,
  };

  applyOverrides(world, chunk);
  return chunk;
}

function generateBlockType(random: () => number, row: number, x: number): BlockType {
  if (x === ENTRY_COLUMN && row >= 0 && row < ENTRY_SHAFT_DEPTH) {
    return 'air';
  }

  if (row === 0) {
    return 'dirt';
  }

  const band = getDepthBand(row);
  const roll = random() * sumWeights(band.weights);
  let cursor = 0;

  for (const [type, weight] of Object.entries(band.weights) as [BlockType, number][]) {
    cursor += weight;
    if (roll <= cursor) {
      return type;
    }
  }

  return 'dirt';
}

function carveCaverns(
  rows: Record<string, BlockCell[]>,
  startRow: number,
  width: number,
  chunkSize: number,
  random: () => number,
): void {
  const band = getDepthBand(startRow + Math.floor(chunkSize / 2));
  const cavernAttempts = Math.max(1, Math.floor(chunkSize * band.cavernChance));

  for (let index = 0; index < cavernAttempts; index += 1) {
    if (random() > band.cavernChance) {
      continue;
    }

    const centerX = randomInt(random, 1, width - 2);
    const centerRow = randomInt(random, startRow + 2, startRow + chunkSize - 1);
    const radiusX = randomInt(random, 1, 2);
    const radiusY = randomInt(random, 1, 2);

    for (let row = centerRow - radiusY; row <= centerRow + radiusY; row += 1) {
      const rowCells = rows[String(row)];
      if (!rowCells) {
        continue;
      }

      for (let x = centerX - radiusX; x <= centerX + radiusX; x += 1) {
        if (x < 0 || x >= width || row <= 1) {
          continue;
        }

        const normalizedX = (x - centerX) / (radiusX + 0.25);
        const normalizedY = (row - centerRow) / (radiusY + 0.25);
        if (normalizedX * normalizedX + normalizedY * normalizedY <= 1.1) {
          rowCells[x] = { type: 'air', discovered: false };
        }
      }
    }
  }
}

function sumWeights(weights: DepthBandConfig['weights']): number {
  return Object.values(weights).reduce((total, value) => total + value, 0);
}

function pruneKeysFromRow(record: Record<string, true>, startRow: number): void {
  for (const key of Object.keys(record)) {
    const [, rowText] = key.split(',');
    if (Number(rowText) >= startRow) {
      delete record[key];
    }
  }
}

function applyOverrides(world: WorldState, chunk: WorldChunk): void {
  for (const key of Object.keys(world.destroyedCells)) {
    const [xText, rowText] = key.split(',');
    const row = Number(rowText);
    const x = Number(xText);
    const chunkIndex = Math.floor(row / world.chunkSize);
    if (chunkIndex !== chunk.index) {
      continue;
    }

    const rowCells = chunk.rows[String(row)];
    if (rowCells?.[x]) {
      rowCells[x] = { type: 'air', discovered: true };
    }
  }

  for (const key of Object.keys(world.discoveredCells)) {
    const [xText, rowText] = key.split(',');
    const row = Number(rowText);
    const x = Number(xText);
    const chunkIndex = Math.floor(row / world.chunkSize);
    if (chunkIndex !== chunk.index) {
      continue;
    }

    const rowCells = chunk.rows[String(row)];
    if (rowCells?.[x]) {
      rowCells[x].discovered = true;
    }
  }
}
