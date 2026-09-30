// Where a new piece appears, and whether it can appear at all.
//
// Conventions (same as board.ts): x goes to the right, y goes down, origin is the top-left corner.
//
// Every function here is pure: it never modifies its arguments.

import { BOARD_WIDTH, type Board, type Piece } from './board';
import { isValidPosition } from './movement';
import { I, MATRIX_SIZE } from './pieces';

// Creates a piece at its starting position:
// - rotation 0,
// - horizontally centered (I is in column 3 to 6, O in column 4 to 5, the others in column 3 to 5),
// - vertically flush with the top of the board: the highest cell of the piece is on row 0.
//   The I piece has its cells on the 2nd row of its matrix, hence y = -1 for it.
export const createPiece = (type: number): Piece => ({
  type,
  rotation: 0,
  x: Math.floor((BOARD_WIDTH - MATRIX_SIZE[type]) / 2),
  y: type === I ? -1 : 0,
});

// Returns the new piece at its starting position, or null if it cannot enter the board
// (its starting cells overlap the pile). This is the defeat condition of the game.
export const spawnPiece = (board: Board, type: number): Piece | null => {
  const piece = createPiece(type);
  return isValidPosition(board, piece) ? piece : null;
};