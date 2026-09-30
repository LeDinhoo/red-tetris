import { describe, it, expect } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, createBoard, type Board } from './board';
import {
  createGame,
  addPieces,
  tick,
  hardDrop,
  moveLeft,
  moveRight,
  rotate,
  softDrop,
  receivePenalty,
  type GameState,
} from './game';
import { EMPTY, PENALTY, O, T } from './pieces';

type Filled = readonly [x: number, y: number, value: number];

// Builds an empty board with the given cells filled.
const boardWith = (filled: ReadonlyArray<Filled>): Board =>
  createBoard().map((row, y) =>
    row.map((cell, x) => {
      const found = filled.find(([fx, fy]) => fx === x && fy === y);
      return found ? found[2] : cell;
    }),
  );

const countFilled = (board: Board): number =>
  board.flat().filter((cell) => cell !== EMPTY).length;

const rowOf = (value: number): number[] => Array.from({ length: BOARD_WIDTH }, () => value);

// Applies `step` n times.
const repeat = (n: number, step: (state: GameState) => GameState, state: GameState): GameState =>
  Array.from({ length: n }).reduce<GameState>((current) => step(current), state);

const repeatTick = (n: number, state: GameState): GameState =>
  repeat(n, (current) => tick(current).state, state);

// Row index of the floor for a 2-row-high piece such as O
const FLOOR_Y = BOARD_HEIGHT - 2;

// A game that is lost
const lostState = (): GameState => ({ ...createGame([O]), piece: null, lost: true });

// A game waiting for pieces: the sequence is exhausted and nobody is playing
const waitingState = (): GameState => createGame();

describe('createGame', () => {
  it('starts on an empty board with the first piece of the sequence', () => {
    const state = createGame([O, T]);
    expect(state.board).toEqual(createBoard());
    expect(state.piece).toEqual({ type: O, rotation: 0, x: 4, y: 0 });
    expect(state.nextIndex).toBe(1);
    expect(state.lost).toBe(false);
  });

  it('waits for pieces when the sequence is empty', () => {
    const state = createGame();
    expect(state.piece).toBeNull();
    expect(state.nextIndex).toBe(0);
    expect(state.lost).toBe(false);
  });
});

describe('addPieces', () => {
  it('resumes a game that was waiting', () => {
    const state = addPieces(waitingState(), [T]);
    expect(state.piece?.type).toBe(T);
    expect(state.nextIndex).toBe(1);
  });

  it('keeps the current piece when the game is running', () => {
    const state = addPieces(createGame([O]), [T]);
    expect(state.piece?.type).toBe(O);
    expect(state.pieces).toEqual([O, T]);
    expect(state.nextIndex).toBe(1);
  });

  it('does nothing on a lost game', () => {
    const state = lostState();
    expect(addPieces(state, [T]).piece).toBeNull();
  });

  it('does not modify the state it receives', () => {
    const state = createGame([O]);
    const copy = structuredClone(state);
    addPieces(state, [T]);
    expect(state).toEqual(copy);
  });
});

describe('tick', () => {
  it('moves the piece one row down', () => {
    const result = tick(createGame([O, T]));
    expect(result.state.piece?.y).toBe(1);
    expect(result.cleared).toBe(0);
  });

  it('does not lock a piece that just touched the floor', () => {
    const state = repeatTick(FLOOR_Y, createGame([O, T]));
    expect(state.piece?.y).toBe(FLOOR_Y);
    expect(countFilled(state.board)).toBe(0);
  });

  it('locks the piece on the tick after it touched the floor', () => {
    const state = repeatTick(FLOOR_Y + 1, createGame([O, T]));
    expect(state.board[FLOOR_Y][4]).toBe(O);
    expect(state.board[FLOOR_Y][5]).toBe(O);
    expect(state.board[FLOOR_Y + 1][4]).toBe(O);
    expect(state.board[FLOOR_Y + 1][5]).toBe(O);
    expect(countFilled(state.board)).toBe(4);
  });

  it('spawns the next piece of the sequence after a lock', () => {
    const state = repeatTick(FLOOR_Y + 1, createGame([O, T]));
    expect(state.piece).toEqual({ type: T, rotation: 0, x: 3, y: 0 });
    expect(state.nextIndex).toBe(2);
  });

  it('lets the player move a piece that touched the pile before it locks', () => {
    const touching = repeatTick(FLOOR_Y, createGame([O, T]));
    const moved = moveLeft(touching);
    expect(moved.piece?.x).toBe(3);
    expect(countFilled(moved.board)).toBe(0);
  });

  it('does nothing on a lost game', () => {
    const state = lostState();
    const result = tick(state);
    expect(result.state).toBe(state);
    expect(result.cleared).toBe(0);
  });

  it('does nothing while waiting for pieces', () => {
    const state = waitingState();
    const result = tick(state);
    expect(result.state).toBe(state);
    expect(result.cleared).toBe(0);
  });

  it('does not modify the state it receives', () => {
    const state = createGame([O, T]);
    const copy = structuredClone(state);
    tick(state);
    expect(state).toEqual(copy);
  });
});

describe('hardDrop', () => {
  it('drops the piece to the floor and locks it immediately', () => {
    const { state, cleared } = hardDrop(createGame([O, T]));
    expect(state.board[FLOOR_Y][4]).toBe(O);
    expect(state.board[FLOOR_Y + 1][5]).toBe(O);
    expect(countFilled(state.board)).toBe(4);
    expect(state.piece?.type).toBe(T);
    expect(cleared).toBe(0);
  });

  it('clears a completed line and reports it', () => {
    const almostFull = Array.from({ length: BOARD_WIDTH }, (_, x): Filled => [x, BOARD_HEIGHT - 1, 1])
      .filter(([x]) => x !== 4 && x !== 5);
    const state: GameState = { ...createGame([O, T]), board: boardWith(almostFull) };
    const result = hardDrop(state);
    expect(result.cleared).toBe(1);
    // The upper half of the O is now on the bottom row
    expect(result.state.board[BOARD_HEIGHT - 1][4]).toBe(O);
    expect(result.state.board[BOARD_HEIGHT - 1][5]).toBe(O);
    expect(countFilled(result.state.board)).toBe(2);
  });

  it('loses the game when the next piece cannot enter the board', () => {
    const state: GameState = { ...createGame([O, O]), board: boardWith([[4, 3, 1]]) };
    const result = hardDrop(state);
    expect(result.state.lost).toBe(true);
    expect(result.state.piece).toBeNull();
  });

  it('waits for pieces when the sequence is exhausted', () => {
    const { state } = hardDrop(createGame([O]));
    expect(state.piece).toBeNull();
    expect(state.lost).toBe(false);
    expect(tick(state).state).toBe(state);
    expect(addPieces(state, [T]).piece?.type).toBe(T);
  });

  it('does nothing on a lost game', () => {
    const state = lostState();
    expect(hardDrop(state).state).toBe(state);
    expect(hardDrop(state).cleared).toBe(0);
  });

  it('does nothing while waiting for pieces', () => {
    const state = waitingState();
    expect(hardDrop(state).state).toBe(state);
  });

  it('does not modify the state it receives', () => {
    const state = createGame([O, T]);
    const copy = structuredClone(state);
    hardDrop(state);
    expect(state).toEqual(copy);
  });
});

describe('player actions', () => {
  it('moves the piece left and right', () => {
    const state = createGame([O]);
    expect(moveLeft(state).piece?.x).toBe(3);
    expect(moveRight(state).piece?.x).toBe(5);
  });

  it('returns the same state when the piece is against a wall', () => {
    const atLeft = repeat(4, moveLeft, createGame([O]));
    expect(atLeft.piece?.x).toBe(0);
    expect(moveLeft(atLeft)).toBe(atLeft);

    const atRight = repeat(4, moveRight, createGame([O]));
    expect(atRight.piece?.x).toBe(8);
    expect(moveRight(atRight)).toBe(atRight);
  });

  it('rotates the piece', () => {
    const state = rotate(createGame([T]));
    expect(state.piece?.rotation).toBe(1);
  });

  it('makes the piece go down by one row with a soft drop', () => {
    expect(softDrop(createGame([O])).piece?.y).toBe(1);
  });

  it('never locks the piece with a soft drop', () => {
    const atFloor = repeatTick(FLOOR_Y, createGame([O, T]));
    expect(softDrop(atFloor)).toBe(atFloor);
    expect(countFilled(atFloor.board)).toBe(0);
  });

  it('does nothing on a lost game or while waiting', () => {
    for (const state of [lostState(), waitingState()]) {
      expect(moveLeft(state)).toBe(state);
      expect(moveRight(state)).toBe(state);
      expect(rotate(state)).toBe(state);
      expect(softDrop(state)).toBe(state);
    }
  });

  it('does not modify the state it receives', () => {
    const state = createGame([T]);
    const copy = structuredClone(state);
    moveLeft(state);
    rotate(state);
    softDrop(state);
    expect(state).toEqual(copy);
  });
});

describe('receivePenalty', () => {
  it('adds penalty rows at the bottom of the board', () => {
    const state = receivePenalty(createGame([O]), 2);
    expect(state.board[BOARD_HEIGHT - 1]).toEqual(rowOf(PENALTY));
    expect(state.board[BOARD_HEIGHT - 2]).toEqual(rowOf(PENALTY));
    expect(state.board[BOARD_HEIGHT - 3]).toEqual(rowOf(EMPTY));
    expect(state.lost).toBe(false);
  });

  it('moves the current piece up with the pile', () => {
    const falling = repeatTick(3, createGame([O]));
    expect(falling.piece?.y).toBe(3);
    expect(receivePenalty(falling, 2).piece?.y).toBe(1);
  });

  it('keeps waiting when there is no current piece', () => {
    const state = receivePenalty(waitingState(), 1);
    expect(state.piece).toBeNull();
    expect(state.lost).toBe(false);
    expect(state.board[BOARD_HEIGHT - 1]).toEqual(rowOf(PENALTY));
  });

  it('loses the game when blocks are pushed out of the top', () => {
    const state: GameState = { ...createGame([O]), board: boardWith([[0, 0, 1]]) };
    const result = receivePenalty(state, 1);
    expect(result.lost).toBe(true);
    expect(result.piece).toBeNull();
  });

  it('does nothing when the count is 0 or negative', () => {
    const state = createGame([O]);
    expect(receivePenalty(state, 0)).toBe(state);
    expect(receivePenalty(state, -2)).toBe(state);
  });

  it('does nothing on a lost game', () => {
    const state = lostState();
    expect(receivePenalty(state, 2)).toBe(state);
  });

  it('does not modify the state it receives', () => {
    const state = createGame([O]);
    const copy = structuredClone(state);
    receivePenalty(state, 2);
    expect(state).toEqual(copy);
  });
});