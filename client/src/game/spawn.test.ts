import { describe, it, expect } from 'vitest';
import { createBoard, getPieceCells, type Board } from './board';
import { createPiece, spawnPiece } from './spawn';
import { PIECE_TYPES, I, O } from './pieces';

type Filled = readonly [x: number, y: number, value: number];

const boardWith = (filled: ReadonlyArray<Filled>): Board =>
  createBoard().map((row, y) =>
    row.map((cell, x) => {
      const found = filled.find(([fx, fy]) => fx === x && fy === y);
      return found ? found[2] : cell;
    }),
  );

describe('createPiece', () => {
  it('starts every piece at rotation 0', () => {
    for (const type of PIECE_TYPES) {
      expect(createPiece(type).rotation).toBe(0);
      expect(createPiece(type).type).toBe(type);
    }
  });

  it('centers O in columns 4 and 5', () => {
    expect(createPiece(O).x).toBe(4);
  });

  it('centers I in columns 3 to 6', () => {
    expect(createPiece(I).x).toBe(3);
  });

  it('places the highest cell of every piece on row 0', () => {
    for (const type of PIECE_TYPES) {
      const rows = getPieceCells(createPiece(type)).map(([, y]) => y);
      expect(Math.min(...rows)).toBe(0);
    }
  });

  it('keeps every cell of every piece in the central columns', () => {
    for (const type of PIECE_TYPES) {
      for (const [x] of getPieceCells(createPiece(type))) {
        expect(x).toBeGreaterThanOrEqual(3);
        expect(x).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe('spawnPiece', () => {
  it('returns the starting piece on an empty board, for every type', () => {
    for (const type of PIECE_TYPES) {
      expect(spawnPiece(createBoard(), type)).toEqual(createPiece(type));
    }
  });

  it('returns the piece when the pile is far from the top', () => {
    expect(spawnPiece(boardWith([[0, 19, 1]]), O)).toEqual(createPiece(O));
  });

  it('returns null when the pile overlaps the starting cells', () => {
    expect(spawnPiece(boardWith([[5, 1, 1]]), O)).toBeNull();
    expect(spawnPiece(boardWith([[5, 0, 1]]), I)).toBeNull();
  });

  it('does not modify the board', () => {
    const board = boardWith([[5, 1, 1]]);
    spawnPiece(board, O);
    expect(board).toEqual(boardWith([[5, 1, 1]]));
  });
});