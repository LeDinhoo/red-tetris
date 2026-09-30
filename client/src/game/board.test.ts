import { describe, it, expect } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, createBoard, getPieceCells, type Piece } from './board';
import { EMPTY, PIECE_TYPES, SHAPES, I, O, T } from './pieces';

describe('board dimensions', () => {
  it('is 10 columns wide and 20 rows tall', () => {
    expect(BOARD_WIDTH).toBe(10);
    expect(BOARD_HEIGHT).toBe(20);
  });
});

describe('createBoard', () => {
  it('has BOARD_HEIGHT rows', () => {
    expect(createBoard()).toHaveLength(BOARD_HEIGHT);
  });

  it('has BOARD_WIDTH columns in every row', () => {
    for (const row of createBoard()) {
      expect(row).toHaveLength(BOARD_WIDTH);
    }
  });

  it('contains only empty cells', () => {
    for (const row of createBoard()) {
      for (const cell of row) {
        expect(cell).toBe(EMPTY);
      }
    }
  });

  it('gives each row its own array', () => {
    const board = createBoard();
    expect(board[0]).not.toBe(board[1]);
    expect(board[0]).not.toBe(board[BOARD_HEIGHT - 1]);
  });

  it('gives two calls two independent boards with the same content', () => {
    const first = createBoard();
    const second = createBoard();
    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
    expect(first).toEqual(second);
  });
});

describe('getPieceCells', () => {
  it('returns exactly 4 cells for every type and every rotation', () => {
    for (const type of PIECE_TYPES) {
      for (let rotation = 0; rotation < 4; rotation++) {
        expect(getPieceCells({ type, rotation, x: 3, y: 5 })).toHaveLength(4);
      }
    }
  });

  it('returns the shape offsets when the piece is at (0, 0)', () => {
    const piece: Piece = { type: T, rotation: 0, x: 0, y: 0 };
    expect(getPieceCells(piece)).toEqual(SHAPES[T][0]);
  });

  it('adds the piece position to every offset', () => {
    const piece: Piece = { type: O, rotation: 0, x: 4, y: 7 };
    expect(getPieceCells(piece)).toEqual([
      [4, 7],
      [5, 7],
      [4, 8],
      [5, 8],
    ]);
  });

  it('uses the requested rotation', () => {
    const horizontal = getPieceCells({ type: I, rotation: 0, x: 0, y: 0 });
    const vertical = getPieceCells({ type: I, rotation: 1, x: 0, y: 0 });
    expect(horizontal).toEqual([
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ]);
    expect(vertical).toEqual([
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ]);
    expect(horizontal).not.toEqual(vertical);
  });

  it('returns coordinates outside the board without throwing', () => {
    const left = getPieceCells({ type: I, rotation: 1, x: -5, y: 0 });
    const bottom = getPieceCells({ type: I, rotation: 1, x: 0, y: BOARD_HEIGHT });
    expect(left.some(([x]) => x < 0)).toBe(true);
    expect(bottom.some(([, y]) => y >= BOARD_HEIGHT)).toBe(true);
  });

  it('does not modify the piece it receives', () => {
    const piece: Piece = Object.freeze({ type: T, rotation: 2, x: 3, y: 4 });
    const copy = { ...piece };
    getPieceCells(piece);
    expect(piece).toEqual(copy);
  });

  it('does not modify the shape table', () => {
    const before = structuredClone(SHAPES);
    getPieceCells({ type: T, rotation: 1, x: 2, y: 2 });
    expect(SHAPES).toEqual(before);
  });
});