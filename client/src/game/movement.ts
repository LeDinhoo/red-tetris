// Movement rules: where a piece is allowed to be, and how it moves.
//
// Conventions (same as board.ts):
// - x goes to the right, y goes down, origin is the top-left corner.
// - A cell coordinate is written [x, y], but the board is read with board[y][x].
//
// Every function here is pure: it never modifies its arguments.
// When a move is not allowed, the functions return the SAME piece object they received,
// so callers can detect a blocked move with `result === piece`.

import { BOARD_HEIGHT, BOARD_WIDTH, getPieceCells, type Board, type Piece } from './board';
import { EMPTY } from './pieces';

// A position is valid if every cell of the piece:
// - is inside the board horizontally (0 <= x < BOARD_WIDTH),
// - is not below the bottom of the board (y < BOARD_HEIGHT),
// - is on an empty cell.
// A cell above the board (y < 0) is allowed, since a new piece may spawn partly above it.
export const isValidPosition = (board: Board, piece: Piece): boolean =>
  getPieceCells(piece).every(([x, y]) => {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return false;
    if (y < 0) return true;
    return board[y][x] === EMPTY;
  });

// Returns the moved piece if the new position is valid, otherwise the same piece.
const tryMove = (board: Board, piece: Piece, dx: number, dy: number): Piece => {
  const moved: Piece = { ...piece, x: piece.x + dx, y: piece.y + dy };
  return isValidPosition(board, moved) ? moved : piece;
};

export const moveLeft = (board: Board, piece: Piece): Piece => tryMove(board, piece, -1, 0);

export const moveRight = (board: Board, piece: Piece): Piece => tryMove(board, piece, 1, 0);

export const moveDown = (board: Board, piece: Piece): Piece => tryMove(board, piece, 0, 1);

// True if the piece can still go one row down (false once it touches the pile or the floor).
export const canMoveDown = (board: Board, piece: Piece): boolean =>
  moveDown(board, piece) !== piece;

// Rotates the piece by one step (rotation 3 goes back to 0).
// If the rotated piece does not fit, the rotation is simply refused.
export const rotate = (board: Board, piece: Piece): Piece => {
  const rotated: Piece = { ...piece, rotation: (piece.rotation + 1) % 4 };
  return isValidPosition(board, rotated) ? rotated : piece;
};

// Drops the piece as low as possible.
// Recursion depth is at most BOARD_HEIGHT, so this is safe.
export const hardDrop = (board: Board, piece: Piece): Piece => {
  const lower = moveDown(board, piece);
  return lower === piece ? piece : hardDrop(board, lower);
};