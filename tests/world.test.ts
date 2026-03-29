import { createWorld, ensureRows, getCell } from '../src/game/world';
import { BLOCK_DEFS } from '../src/config/content';

function snapshotRows(seed: number, fromRow: number, toRow: number): string {
  const world = createWorld(seed);
  ensureRows(world, fromRow, toRow);

  const rows: string[] = [];
  for (let row = fromRow; row <= toRow; row += 1) {
    const cells: string[] = [];
    for (let x = 0; x < world.width; x += 1) {
      cells.push(getCell(world, x, row).type);
    }
    rows.push(cells.join('|'));
  }
  return rows.join('\n');
}

function summarizeBand(seed: number, fromRow: number, toRow: number): { averageValue: number; hazardRate: number } {
  const world = createWorld(seed);
  ensureRows(world, fromRow, toRow);

  let totalValue = 0;
  let totalCells = 0;
  let hazards = 0;

  for (let row = fromRow; row <= toRow; row += 1) {
    for (let x = 0; x < world.width; x += 1) {
      const type = getCell(world, x, row).type;
      totalValue += BLOCK_DEFS[type].value;
      totalCells += 1;
      if (type === 'lava' || type === 'hidden_lava' || type === 'rock') {
        hazards += 1;
      }
    }
  }

  return {
    averageValue: totalValue / totalCells,
    hazardRate: hazards / totalCells,
  };
}

describe('world generation', () => {
  test('is deterministic for a fixed seed', () => {
    expect(snapshotRows(4242, 0, 40)).toEqual(snapshotRows(4242, 0, 40));
  });

  test('starts with a two-block entry shaft in the center column', () => {
    const world = createWorld(5151);
    ensureRows(world, 0, 2);

    expect(getCell(world, 6, 0).type).toBe('air');
    expect(getCell(world, 6, 1).type).toBe('air');
  });

  test('deep bands trend higher value and hazard than shallow bands', () => {
    const shallow = summarizeBand(8080, 4, 26);
    const deep = summarizeBand(8080, 135, 165);

    expect(deep.averageValue).toBeGreaterThan(shallow.averageValue);
    expect(deep.hazardRate).toBeGreaterThan(shallow.hazardRate);
  });
});
