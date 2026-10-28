
import { BOARD_WIDTH, type Board, type Piece } from './board';
import { isValidPosition } from './movement';
import { I, MATRIX_SIZE } from './pieces';

export const createPiece = (type: number): Piece => ({
  type,
  rotation: 0,
  x: Math.floor((BOARD_WIDTH - MATRIX_SIZE[type]) / 2),
  y: type === I ? -1 : 0,
});

export const spawnPiece = (board: Board, type: number): Piece | null => {
  const piece = createPiece(type);
  return isValidPosition(board, piece) ? piece : null;
};