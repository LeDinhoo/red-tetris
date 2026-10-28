
import { EMPTY, SHAPES, type Cell } from './pieces';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type Board = ReadonlyArray<ReadonlyArray<number>>;

export type Piece = {
  readonly type: number;
  readonly rotation: number;
  readonly x: number;
  readonly y: number;
};

export const createBoard = (): Board =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => EMPTY),
  );

export const getPieceCells = (piece: Piece): ReadonlyArray<Cell> =>
  SHAPES[piece.type][piece.rotation].map(
    ([dx, dy]): Cell => [piece.x + dx, piece.y + dy],
  );