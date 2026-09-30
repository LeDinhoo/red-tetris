// Spectrum: the height of the highest filled cell of each column.
//
// This is the only information about a board that is sent to the opponents.
// - An empty column has height 0.
// - A filled cell on the bottom row gives height 1, on the top row gives BOARD_HEIGHT.
// - Holes are ignored: only the highest filled cell of the column counts.
// - Penalty cells count as filled cells.
//
// The function is pure: it never modifies its argument.

import { BOARD_WIDTH, type Board } from './board';
import { EMPTY } from './pieces';

export const getSpectrum = (board: Board): ReadonlyArray<number> =>
  Array.from({ length: BOARD_WIDTH }, (_, x) => {
    const top = board.findIndex((row) => row[x] !== EMPTY);
    return top === -1 ? 0 : board.length - top;
  });