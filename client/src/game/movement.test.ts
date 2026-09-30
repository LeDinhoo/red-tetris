import { describe, it, expect } from 'vitest';
import { createBoard, BOARD_HEIGHT, type Board, type Piece } from './board';
import {
  isValidPosition,
  moveLeft,
  moveRight,
  moveDown,
  canMoveDown,
  rotate,
  hardDrop,
} from './movement';
import { I, O, T } from './pieces';

const BLOCK = 1;

// Builds an empty board with a filled cell at each given [x, y].
const boardWith = (blocks: ReadonlyArray<readonly [number, number]>): Board =>
  createBoard().map((row, y) =>
    row.map((cell, x) => (blocks.some(([bx, by]) => bx === x && by === y) ? BLOCK : cell)),
  );

const empty = createBoard();

// O piece occupies (x, y), (x+1, y), (x, y+1), (x+1, y+1)
const oAt = (x: number, y: number): Piece => ({ type: O, rotation: 0, x, y });

describe('isValidPosition', () => {
  it('accepts a piece in the middle of an empty board', () => {
    expect(isValidPosition(empty, oAt(4, 0))).toBe(true);
  });

  it('accepts a piece touching the left wall', () => {
    expect(isValidPosition(empty, oAt(0, 0))).toBe(true);
  });

  it('refuses a piece crossing the left wall', () => {
    expect(isValidPosition(empty, oAt(-1, 0))).toBe(false);
  });

  it('accepts a piece touching the right wall', () => {
    expect(isValidPosition(empty, oAt(8, 0))).toBe(true);
  });

  it('refuses a piece crossing the right wall', () => {
    expect(isValidPosition(empty, oAt(9, 0))).toBe(false);
  });

  it('accepts a piece touching the floor', () => {
    expect(isValidPosition(empty, oAt(4, BOARD_HEIGHT - 2))).toBe(true);
  });

  it('refuses a piece crossing the floor', () => {
    expect(isValidPosition(empty, oAt(4, BOARD_HEIGHT - 1))).toBe(false);
  });

  it('accepts a piece partly above the board', () => {
    const vertical: Piece = { type: I, rotation: 1, x: 3, y: -2 };
    expect(isValidPosition(empty, vertical)).toBe(true);
  });

  it('still refuses a piece outside the board horizontally when it is above the board', () => {
    const tooLeft: Piece = { type: I, rotation: 1, x: -3, y: -2 };
    const tooRight: Piece = { type: I, rotation: 1, x: 8, y: -2 };
    expect(isValidPosition(empty, tooLeft)).toBe(false);
    expect(isValidPosition(empty, tooRight)).toBe(false);
  });

  it('refuses a piece overlapping a filled cell', () => {
    const board = boardWith([[5, 5]]);
    expect(isValidPosition(board, oAt(4, 4))).toBe(false);
  });

  it('accepts a piece right next to a filled cell', () => {
    const board = boardWith([[5, 5]]);
    expect(isValidPosition(board, oAt(6, 5))).toBe(true);
    expect(isValidPosition(board, oAt(3, 4))).toBe(true);
  });

  it('does not modify the board or the piece', () => {
    const board = boardWith([[5, 5]]);
    const piece = Object.freeze(oAt(4, 4));
    isValidPosition(board, piece);
    expect(board).toEqual(boardWith([[5, 5]]));
    expect(piece).toEqual(oAt(4, 4));
  });
});

describe('moveLeft', () => {
  it('moves the piece one column to the left', () => {
    expect(moveLeft(empty, oAt(4, 3))).toEqual(oAt(3, 3));
  });

  it('returns a new object and leaves the original untouched', () => {
    const piece = Object.freeze(oAt(4, 3));
    const moved = moveLeft(empty, piece);
    expect(moved).not.toBe(piece);
    expect(piece).toEqual(oAt(4, 3));
  });

  it('returns the same piece against the left wall', () => {
    const piece = oAt(0, 3);
    expect(moveLeft(empty, piece)).toBe(piece);
  });

  it('returns the same piece when a filled cell is in the way', () => {
    const board = boardWith([[3, 4]]);
    const piece = oAt(4, 3);
    expect(moveLeft(board, piece)).toBe(piece);
  });
});

describe('moveRight', () => {
  it('moves the piece one column to the right', () => {
    expect(moveRight(empty, oAt(4, 3))).toEqual(oAt(5, 3));
  });

  it('returns the same piece against the right wall', () => {
    const piece = oAt(8, 3);
    expect(moveRight(empty, piece)).toBe(piece);
  });

  it('returns the same piece when a filled cell is in the way', () => {
    const board = boardWith([[6, 4]]);
    const piece = oAt(4, 3);
    expect(moveRight(board, piece)).toBe(piece);
  });
});

describe('moveDown', () => {
  it('moves the piece one row down', () => {
    expect(moveDown(empty, oAt(4, 3))).toEqual(oAt(4, 4));
  });

  it('returns the same piece on the floor', () => {
    const piece = oAt(4, BOARD_HEIGHT - 2);
    expect(moveDown(empty, piece)).toBe(piece);
  });

  it('returns the same piece when it rests on the pile', () => {
    const board = boardWith([[4, 10]]);
    const piece = oAt(4, 8);
    expect(moveDown(board, piece)).toBe(piece);
  });
});

describe('canMoveDown', () => {
  it('is true in free space', () => {
    expect(canMoveDown(empty, oAt(4, 3))).toBe(true);
  });

  it('is false on the floor', () => {
    expect(canMoveDown(empty, oAt(4, BOARD_HEIGHT - 2))).toBe(false);
  });

  it('is false when resting on the pile', () => {
    const board = boardWith([[5, 10]]);
    expect(canMoveDown(board, oAt(4, 8))).toBe(false);
  });
});

describe('rotate', () => {
  it('goes to the next rotation', () => {
    const piece: Piece = { type: T, rotation: 0, x: 4, y: 4 };
    expect(rotate(empty, piece)).toEqual({ ...piece, rotation: 1 });
  });

  it('goes back to rotation 0 after rotation 3', () => {
    const piece: Piece = { type: T, rotation: 3, x: 4, y: 4 };
    expect(rotate(empty, piece).rotation).toBe(0);
  });

  it('refuses the rotation when it would cross a wall', () => {
    // Vertical I at x = -2 has its cells in column 0. Next rotation would reach x = -2.
    const piece: Piece = { type: I, rotation: 1, x: -2, y: 0 };
    expect(isValidPosition(empty, piece)).toBe(true);
    expect(rotate(empty, piece)).toBe(piece);
  });

  it('refuses the rotation when it would overlap a filled cell', () => {
    const board = boardWith([[5, 6]]);
    const piece: Piece = { type: T, rotation: 0, x: 4, y: 4 };
    expect(isValidPosition(board, piece)).toBe(true);
    expect(rotate(board, piece)).toBe(piece);
  });

  it('does not modify the piece it receives', () => {
    const piece: Piece = Object.freeze({ type: T, rotation: 0, x: 4, y: 4 });
    rotate(empty, piece);
    expect(piece).toEqual({ type: T, rotation: 0, x: 4, y: 4 });
  });
});

describe('hardDrop', () => {
  it('drops a piece to the floor on an empty board', () => {
    expect(hardDrop(empty, oAt(4, 0))).toEqual(oAt(4, BOARD_HEIGHT - 2));
  });

  it('takes the piece shape into account', () => {
    // Vertical I has 4 cells in height, so it stops at y = BOARD_HEIGHT - 4.
    const piece: Piece = { type: I, rotation: 1, x: 0, y: 0 };
    expect(hardDrop(empty, piece).y).toBe(BOARD_HEIGHT - 4);
  });

  it('stops on top of the pile', () => {
    const board = boardWith([[4, 10]]);
    expect(hardDrop(board, oAt(4, 0))).toEqual(oAt(4, 8));
  });

  it('keeps x and rotation unchanged', () => {
    const piece: Piece = { type: T, rotation: 2, x: 6, y: 0 };
    const dropped = hardDrop(empty, piece);
    expect(dropped.x).toBe(6);
    expect(dropped.rotation).toBe(2);
    expect(dropped.type).toBe(T);
  });

  it('returns the same piece when it cannot move down', () => {
    const piece = oAt(4, BOARD_HEIGHT - 2);
    expect(hardDrop(empty, piece)).toBe(piece);
  });

  it('does not modify the piece it receives', () => {
    const piece = Object.freeze(oAt(4, 0));
    hardDrop(empty, piece);
    expect(piece).toEqual(oAt(4, 0));
  });
});