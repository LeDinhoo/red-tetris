import { describe, it, expect } from 'vitest';
import { PIECE_TYPES, SHAPES, MATRIX_SIZE, I, J, L, O, S, T, Z, EMPTY, PENALTY } from './pieces';

const PIECE_NAMES: Readonly<Record<number, string>> = {
  [I]: 'I',
  [J]: 'J',
  [L]: 'L',
  [O]: 'O',
  [S]: 'S',
  [T]: 'T',
  [Z]: 'Z',
};

describe('piece identifiers', () => {
  it('has 7 distinct piece types numbered 1 to 7', () => {
    expect([...PIECE_TYPES].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('does not collide with the special board values', () => {
    for (const type of PIECE_TYPES) {
      expect(type).not.toBe(EMPTY);
      expect(type).not.toBe(PENALTY);
    }
  });
});

describe('SHAPES and MATRIX_SIZE tables', () => {
  it('SHAPES contains exactly the 7 piece types', () => {
    const keys = Object.keys(SHAPES).map(Number).sort();
    expect(keys).toEqual([...PIECE_TYPES].sort());
  });

  it('MATRIX_SIZE contains exactly the 7 piece types', () => {
    const keys = Object.keys(MATRIX_SIZE).map(Number).sort();
    expect(keys).toEqual([...PIECE_TYPES].sort());
  });

  it('uses the expected matrix sizes', () => {
    expect(MATRIX_SIZE[I]).toBe(4);
    expect(MATRIX_SIZE[O]).toBe(2);
    for (const type of [J, L, S, T, Z]) {
      expect(MATRIX_SIZE[type]).toBe(3);
    }
  });
});

for (const type of PIECE_TYPES) {
  describe(`piece ${PIECE_NAMES[type]}`, () => {
    const shape = SHAPES[type];
    const size = MATRIX_SIZE[type];

    it('has exactly 4 rotations', () => {
      expect(shape).toHaveLength(4);
    });

    for (let rotation = 0; rotation < 4; rotation++) {
      describe(`rotation ${rotation}`, () => {
        const cells = shape[rotation];

        it('has exactly 4 cells', () => {
          expect(cells).toHaveLength(4);
        });

        it('has no duplicate cell', () => {
          const unique = new Set(cells.map(([x, y]) => `${x},${y}`));
          expect(unique.size).toBe(4);
        });

        it('keeps every cell inside the piece matrix', () => {
          for (const [x, y] of cells) {
            expect(Number.isInteger(x)).toBe(true);
            expect(Number.isInteger(y)).toBe(true);
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThan(size);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThan(size);
          }
        });
      });
    }
  });
}

describe('piece O', () => {
  it('has 4 identical rotations', () => {
    const [first, ...others] = SHAPES[O];
    for (const rotation of others) {
      expect(rotation).toEqual(first);
    }
  });
});

describe('rotations of the other pieces', () => {
  it('are all different from one another, except for O', () => {
    for (const type of PIECE_TYPES) {
      if (type === O) continue;
      const serialized = SHAPES[type].map((cells) =>
        cells
          .map(([x, y]) => `${x},${y}`)
          .sort()
          .join('|'),
      );
      expect(new Set(serialized).size).toBe(4);
    }
  });
});