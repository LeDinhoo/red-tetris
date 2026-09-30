// Operations that transform a board: merge a piece, clear lines, add penalty lines.
//
// Conventions (same as board.ts):
// - x goes to the right, y goes down, origin is the top-left corner.
// - A cell coordinate is written [x, y], but the board is read with board[y][x].
//
// Every function here is pure: it never modifies its arguments.

import { BOARD_WIDTH, getPieceCells, type Board, type Piece } from './board';
import { EMPTY, PENALTY } from './pieces';

const createEmptyRow = (): ReadonlyArray<number> =>
  Array.from({ length: BOARD_WIDTH }, () => EMPTY);

const createPenaltyRow = (): ReadonlyArray<number> =>
  Array.from({ length: BOARD_WIDTH }, () => PENALTY);

// Returns a new board where the cells of the piece are filled with the piece type.
// Cells outside the board (for example above it) are ignored.
export const mergePiece = (board: Board, piece: Piece): Board => {
  const cells = getPieceCells(piece);
  return board.map((row, y) =>
    row.map((cell, x) => (cells.some(([cx, cy]) => cx === x && cy === y) ? piece.type : cell)),
  );
};

// A row is complete when it has no empty cell.
// Penalty rows are indestructible, so a row containing a penalty cell is never complete.
const isComplete = (row: ReadonlyArray<number>): boolean =>
  row.every((cell) => cell !== EMPTY && cell !== PENALTY);

// Removes the complete rows and adds the same number of empty rows at the top.
// Returns the new board and the number of rows that were removed.
export const clearLines = (board: Board): { board: Board; cleared: number } => {
  const kept = board.filter((row) => !isComplete(row));
  const cleared = board.length - kept.length;
  const newRows = Array.from({ length: cleared }, createEmptyRow);
  return { board: [...newRows, ...kept], cleared };
};

// Pushes the pile up by `count` rows and adds `count` penalty rows at the bottom.
// The board height never changes: the top rows are pushed out of the board.
// `overflow` is true if some filled cells were pushed out of the top,
// which means the player has lost.
export const addPenaltyLines = (
  board: Board,
  count: number,
): { board: Board; overflow: boolean } => {
  const n = Math.max(0, Math.min(count, board.length));
  const overflow = board.slice(0, n).some((row) => row.some((cell) => cell !== EMPTY));
  const penaltyRows = Array.from({ length: n }, createPenaltyRow);
  return { board: [...board.slice(n), ...penaltyRows], overflow };
};