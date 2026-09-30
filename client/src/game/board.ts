// Board definition and the two most basic operations on it.
//
// Conventions (same as pieces.ts):
// - x goes to the right, y goes down, origin is the top-left corner.
// - A cell coordinate is written [x, y] (column, row).
// - But a board is accessed with board[row][column], i.e. board[y][x].
//
// Every function here is pure: it never modifies its arguments.

import { EMPTY, SHAPES, type Cell } from './pieces';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// A board is a list of rows, each row being a list of numbers:
// 0 = empty, 1 to 7 = piece type, 8 = penalty line.
export type Board = ReadonlyArray<ReadonlyArray<number>>;

// A piece being played. (x, y) is the position of the top-left corner
// of the piece's matrix on the board. The cells are not stored here:
// they are computed from type + rotation (see getPieceCells).
export type Piece = {
  readonly type: number;
  readonly rotation: number; // 0 to 3
  readonly x: number;
  readonly y: number;
};

// Returns a new empty board (BOARD_HEIGHT rows of BOARD_WIDTH empty cells).
// Every row is a distinct array, so boards never share data.
export const createBoard = (): Board =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => EMPTY),
  );

// Returns the 4 cells of a piece in board coordinates.
// It does not check anything: cells may be outside the board.
// Deciding whether the position is allowed is the job of the position validation.
export const getPieceCells = (piece: Piece): ReadonlyArray<Cell> =>
  SHAPES[piece.type][piece.rotation].map(
    ([dx, dy]): Cell => [piece.x + dx, piece.y + dy],
  );