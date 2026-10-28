
import { BOARD_WIDTH, getPieceCells, type Board, type Piece } from './board';
import { EMPTY, PENALTY } from './pieces';

const createEmptyRow = (): ReadonlyArray<number> =>
  Array.from({ length: BOARD_WIDTH }, () => EMPTY);

const createPenaltyRow = (): ReadonlyArray<number> =>
  Array.from({ length: BOARD_WIDTH }, () => PENALTY);

export const mergePiece = (board: Board, piece: Piece): Board => {
  const cells = getPieceCells(piece);
  return board.map((row, y) =>
    row.map((cell, x) => (cells.some(([cx, cy]) => cx === x && cy === y) ? piece.type : cell)),
  );
};

const isComplete = (row: ReadonlyArray<number>): boolean =>
  row.every((cell) => cell !== EMPTY && cell !== PENALTY);

export const clearLines = (board: Board): { board: Board; cleared: number } => {
  const kept = board.filter((row) => !isComplete(row));
  const cleared = board.length - kept.length;
  const newRows = Array.from({ length: cleared }, createEmptyRow);
  return { board: [...newRows, ...kept], cleared };
};

export const addPenaltyLines = (
  board: Board,
  count: number,
): { board: Board; overflow: boolean } => {
  const n = Math.max(0, Math.min(count, board.length));
  const overflow = board.slice(0, n).some((row) => row.some((cell) => cell !== EMPTY));
  const penaltyRows = Array.from({ length: n }, createPenaltyRow);
  return { board: [...board.slice(n), ...penaltyRows], overflow };
};