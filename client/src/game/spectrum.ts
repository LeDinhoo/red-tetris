
import { BOARD_WIDTH, type Board } from './board';
import { EMPTY } from './pieces';

export const getSpectrum = (board: Board): ReadonlyArray<number> =>
  Array.from({ length: BOARD_WIDTH }, (_, x) => {
    const top = board.findIndex((row) => row[x] !== EMPTY);
    return top === -1 ? 0 : board.length - top;
  });