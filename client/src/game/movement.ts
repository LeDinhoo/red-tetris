
import { BOARD_HEIGHT, BOARD_WIDTH, getPieceCells, type Board, type Piece } from './board';
import { EMPTY } from './pieces';

export const isValidPosition = (board: Board, piece: Piece): boolean =>
  getPieceCells(piece).every(([x, y]) => {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return false;
    if (y < 0) return true;
    return board[y][x] === EMPTY;
  });

const tryMove = (board: Board, piece: Piece, dx: number, dy: number): Piece => {
  const moved: Piece = { ...piece, x: piece.x + dx, y: piece.y + dy };
  return isValidPosition(board, moved) ? moved : piece;
};

export const moveLeft = (board: Board, piece: Piece): Piece => tryMove(board, piece, -1, 0);

export const moveRight = (board: Board, piece: Piece): Piece => tryMove(board, piece, 1, 0);

export const moveDown = (board: Board, piece: Piece): Piece => tryMove(board, piece, 0, 1);

export const canMoveDown = (board: Board, piece: Piece): boolean =>
  moveDown(board, piece) !== piece;

export const rotate = (board: Board, piece: Piece): Piece => {
  const rotated: Piece = { ...piece, rotation: (piece.rotation + 1) % 4 };
  return isValidPosition(board, rotated) ? rotated : piece;
};

export const hardDrop = (board: Board, piece: Piece): Piece => {
  const lower = moveDown(board, piece);
  return lower === piece ? piece : hardDrop(board, lower);
};