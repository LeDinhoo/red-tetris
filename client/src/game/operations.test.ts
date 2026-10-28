import { describe, it, expect } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, createBoard, type Board, type Piece } from './board';
import { mergePiece, clearLines, addPenaltyLines } from './operations';
import { EMPTY, PENALTY, I, O, T } from './pieces';

type Filled = readonly [x: number, y: number, value: number];

const boardWith = (filled: ReadonlyArray<Filled>): Board =>
  createBoard().map((row, y) =>
    row.map((cell, x) => {
      const found = filled.find(([fx, fy]) => fx === x && fy === y);
      return found ? found[2] : cell;
    }),
  );

const rowCells = (y: number, value: number): Filled[] =>
  Array.from({ length: BOARD_WIDTH }, (_, x): Filled => [x, y, value]);

const rowOf = (value: number): number[] => Array.from({ length: BOARD_WIDTH }, () => value);

const countFilled = (board: Board): number =>
  board.flat().filter((cell) => cell !== EMPTY).length;

const empty = createBoard();

describe('mergePiece', () => {
  it('fills the 4 cells of the piece with the piece type', () => {
    const piece: Piece = { type: O, rotation: 0, x: 4, y: 0 };
    const merged = mergePiece(empty, piece);
    expect(merged[0][4]).toBe(O);
    expect(merged[0][5]).toBe(O);
    expect(merged[1][4]).toBe(O);
    expect(merged[1][5]).toBe(O);
    expect(countFilled(merged)).toBe(4);
  });

  it('uses the type of the piece as cell value', () => {
    const piece: Piece = { type: T, rotation: 0, x: 0, y: 0 };
    const merged = mergePiece(empty, piece);
    expect(merged.flat().filter((cell) => cell === T)).toHaveLength(4);
  });

  it('keeps the cells that were already filled', () => {
    const board = boardWith([[0, 19, 3]]);
    const merged = mergePiece(board, { type: O, rotation: 0, x: 4, y: 0 });
    expect(merged[19][0]).toBe(3);
    expect(countFilled(merged)).toBe(5);
  });

  it('ignores the cells that are above the board', () => {
    const piece: Piece = { type: I, rotation: 1, x: 3, y: -2 };
    const merged = mergePiece(empty, piece);
    expect(merged[0][5]).toBe(I);
    expect(merged[1][5]).toBe(I);
    expect(countFilled(merged)).toBe(2);
  });

  it('returns a new board and leaves the original untouched', () => {
    const merged = mergePiece(empty, { type: O, rotation: 0, x: 4, y: 0 });
    expect(merged).not.toBe(empty);
    expect(countFilled(empty)).toBe(0);
  });
});

describe('clearLines', () => {
  it('does nothing on an empty board', () => {
    const result = clearLines(empty);
    expect(result.cleared).toBe(0);
    expect(result.board).toEqual(empty);
  });

  it('removes a complete row', () => {
    const result = clearLines(boardWith(rowCells(19, 1)));
    expect(result.cleared).toBe(1);
    expect(result.board).toEqual(empty);
  });

  it('keeps the board height', () => {
    const result = clearLines(boardWith(rowCells(19, 1)));
    expect(result.board).toHaveLength(BOARD_HEIGHT);
  });

  it('moves the rows above down', () => {
    const board = boardWith([[3, 18, 2], ...rowCells(19, 1)]);
    const result = clearLines(board);
    expect(result.cleared).toBe(1);
    expect(result.board[19][3]).toBe(2);
    expect(result.board[18]).toEqual(rowOf(EMPTY));
    expect(countFilled(result.board)).toBe(1);
  });

  it('removes several rows that are not next to each other', () => {
    const board = boardWith([...rowCells(17, 1), [0, 18, 2], ...rowCells(19, 1)]);
    const result = clearLines(board);
    expect(result.cleared).toBe(2);
    expect(result.board[19][0]).toBe(2);
    expect(countFilled(result.board)).toBe(1);
  });

  it('removes four rows at once', () => {
    const board = boardWith([
      ...rowCells(16, 1),
      ...rowCells(17, 1),
      ...rowCells(18, 1),
      ...rowCells(19, 1),
    ]);
    const result = clearLines(board);
    expect(result.cleared).toBe(4);
    expect(result.board).toEqual(empty);
  });

  it('keeps a row that has an empty cell', () => {
    const almost = rowCells(19, 1).filter(([x]) => x !== 4);
    const result = clearLines(boardWith(almost));
    expect(result.cleared).toBe(0);
    expect(countFilled(result.board)).toBe(BOARD_WIDTH - 1);
  });

  it('never removes a penalty row', () => {
    const board = boardWith(rowCells(19, PENALTY));
    const result = clearLines(board);
    expect(result.cleared).toBe(0);
    expect(result.board).toEqual(board);
  });

  it('removes a complete row that sits above a penalty row', () => {
    const board = boardWith([...rowCells(18, 1), ...rowCells(19, PENALTY)]);
    const result = clearLines(board);
    expect(result.cleared).toBe(1);
    expect(result.board[19]).toEqual(rowOf(PENALTY));
    expect(result.board[18]).toEqual(rowOf(EMPTY));
  });

  it('does not modify the board it receives', () => {
    const board = boardWith(rowCells(19, 1));
    clearLines(board);
    expect(board).toEqual(boardWith(rowCells(19, 1)));
  });
});

describe('addPenaltyLines', () => {
  it('adds penalty rows at the bottom', () => {
    const { board } = addPenaltyLines(empty, 2);
    expect(board[19]).toEqual(rowOf(PENALTY));
    expect(board[18]).toEqual(rowOf(PENALTY));
    expect(board[17]).toEqual(rowOf(EMPTY));
  });

  it('keeps the board height', () => {
    const { board } = addPenaltyLines(empty, 3);
    expect(board).toHaveLength(BOARD_HEIGHT);
    for (const row of board) {
      expect(row).toHaveLength(BOARD_WIDTH);
    }
  });

  it('pushes the existing cells up', () => {
    const board = boardWith([[2, 19, 5]]);
    const result = addPenaltyLines(board, 2);
    expect(result.board[17][2]).toBe(5);
    expect(result.board[19]).toEqual(rowOf(PENALTY));
    expect(result.overflow).toBe(false);
  });

  it('does nothing when count is 0', () => {
    const board = boardWith([[2, 19, 5]]);
    const result = addPenaltyLines(board, 0);
    expect(result.board).toEqual(board);
    expect(result.overflow).toBe(false);
  });

  it('treats a negative count as 0', () => {
    const result = addPenaltyLines(empty, -3);
    expect(result.board).toEqual(empty);
    expect(result.overflow).toBe(false);
  });

  it('does not report an overflow when only empty rows are pushed out', () => {
    const board = boardWith([[0, 1, 3]]);
    const result = addPenaltyLines(board, 1);
    expect(result.board[0][0]).toBe(3);
    expect(result.overflow).toBe(false);
  });

  it('reports an overflow when filled cells are pushed out of the top', () => {
    const board = boardWith([[0, 0, 3]]);
    const result = addPenaltyLines(board, 1);
    expect(result.overflow).toBe(true);
    expect(result.board).toHaveLength(BOARD_HEIGHT);
  });

  it('caps the count to the board height', () => {
    const { board } = addPenaltyLines(empty, 50);
    expect(board).toHaveLength(BOARD_HEIGHT);
    for (const row of board) {
      expect(row).toEqual(rowOf(PENALTY));
    }
  });

  it('creates rows that clearLines never removes', () => {
    const { board } = addPenaltyLines(empty, 3);
    expect(clearLines(board).cleared).toBe(0);
  });

  it('does not modify the board it receives', () => {
    const board = boardWith([[2, 19, 5]]);
    addPenaltyLines(board, 2);
    expect(board).toEqual(boardWith([[2, 19, 5]]));
  });
});