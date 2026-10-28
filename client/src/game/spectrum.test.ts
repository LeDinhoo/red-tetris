import { describe, it, expect } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, createBoard, type Board } from './board';
import { addPenaltyLines } from './operations';
import { getSpectrum } from './spectrum';

type Filled = readonly [x: number, y: number, value: number];

const boardWith = (filled: ReadonlyArray<Filled>): Board =>
  createBoard().map((row, y) =>
    row.map((cell, x) => {
      const found = filled.find(([fx, fy]) => fx === x && fy === y);
      return found ? found[2] : cell;
    }),
  );

describe('getSpectrum', () => {
  it('has one value per column', () => {
    expect(getSpectrum(createBoard())).toHaveLength(BOARD_WIDTH);
  });

  it('is all zeros on an empty board', () => {
    expect(getSpectrum(createBoard())).toEqual(Array.from({ length: BOARD_WIDTH }, () => 0));
  });

  it('gives 1 for a cell on the bottom row', () => {
    const spectrum = getSpectrum(boardWith([[3, BOARD_HEIGHT - 1, 1]]));
    expect(spectrum[3]).toBe(1);
    expect(spectrum.filter((height) => height !== 0)).toHaveLength(1);
  });

  it('gives BOARD_HEIGHT for a cell on the top row', () => {
    expect(getSpectrum(boardWith([[7, 0, 1]]))[7]).toBe(BOARD_HEIGHT);
  });

  it('uses the highest cell of each column', () => {
    const board = boardWith([
      [0, 19, 1],
      [0, 18, 1],
      [0, 17, 1],
      [1, 19, 2],
      [2, 15, 3],
    ]);
    const spectrum = getSpectrum(board);
    expect(spectrum[0]).toBe(3);
    expect(spectrum[1]).toBe(1);
    expect(spectrum[2]).toBe(5);
    expect(spectrum[3]).toBe(0);
  });

  it('ignores holes under the highest cell', () => {
    const board = boardWith([
      [2, 10, 1],
      [2, 19, 1],
    ]);
    expect(getSpectrum(board)[2]).toBe(BOARD_HEIGHT - 10);
  });

  it('counts penalty cells', () => {
    const { board } = addPenaltyLines(createBoard(), 2);
    expect(getSpectrum(board)).toEqual(Array.from({ length: BOARD_WIDTH }, () => 2));
  });

  it('does not modify the board it receives', () => {
    const board = boardWith([[2, 10, 1]]);
    getSpectrum(board);
    expect(board).toEqual(boardWith([[2, 10, 1]]));
  });
});