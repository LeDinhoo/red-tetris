// The state of one game and the rules that make it evolve.
//
// This file contains no rendering and no network: only pure functions.
// Every function takes a state and returns a new state, and never modifies its arguments.
//
// The game does not pick pieces by itself: it reads a sequence of piece types
// (`pieces`), which comes from the server in multiplayer, or is generated locally in solo.
// `nextIndex` is the position of the next piece to spawn in that sequence.
//
// Possible situations:
// - playing:  piece !== null
// - waiting:  piece === null and lost === false (the sequence is exhausted, see addPieces)
// - lost:     lost === true (and piece === null)

import { createBoard, type Board, type Piece } from './board';
import * as movement from './movement';
import { addPenaltyLines, clearLines, mergePiece } from './operations';
import { spawnPiece } from './spawn';

export type GameState = {
  readonly board: Board;
  readonly piece: Piece | null;
  readonly pieces: ReadonlyArray<number>;
  readonly nextIndex: number;
  readonly lost: boolean;
};

// Result of an action that can lock the piece: the new state, and the number of lines
// cleared by this lock (0 if the piece did not lock or cleared nothing).
export type StepResult = {
  readonly state: GameState;
  readonly cleared: number;
};

// Spawns the next piece of the sequence if there is no current piece.
// If the piece cannot enter the board, the game is lost.
const spawnNext = (state: GameState): GameState => {
  if (state.lost || state.piece !== null) return state;
  if (state.nextIndex >= state.pieces.length) return state;
  const piece = spawnPiece(state.board, state.pieces[state.nextIndex]);
  return { ...state, piece, nextIndex: state.nextIndex + 1, lost: piece === null };
};

// Creates a new game on an empty board and spawns the first piece if there is one.
export const createGame = (pieces: ReadonlyArray<number> = []): GameState =>
  spawnNext({ board: createBoard(), piece: null, pieces, nextIndex: 0, lost: false });

// Appends pieces to the sequence. If the game was waiting for a piece, it resumes.
export const addPieces = (state: GameState, more: ReadonlyArray<number>): GameState =>
  spawnNext({ ...state, pieces: [...state.pieces, ...more] });

// Merges the piece into the board, clears the complete lines and spawns the next piece.
const lockPiece = (state: GameState, piece: Piece): StepResult => {
  const { board, cleared } = clearLines(mergePiece(state.board, piece));
  return { state: spawnNext({ ...state, board, piece: null }), cleared };
};

// Applies a movement to the current piece. If nothing changes, the same state is returned.
const applyMovement = (
  state: GameState,
  move: (board: Board, piece: Piece) => Piece,
): GameState => {
  if (state.lost || state.piece === null) return state;
  const piece = move(state.board, state.piece);
  return piece === state.piece ? state : { ...state, piece };
};

export const moveLeft = (state: GameState): GameState => applyMovement(state, movement.moveLeft);

export const moveRight = (state: GameState): GameState =>
  applyMovement(state, movement.moveRight);

export const rotate = (state: GameState): GameState => applyMovement(state, movement.rotate);

// Soft drop: one row down. It never locks the piece, the next tick does.
export const softDrop = (state: GameState): GameState => applyMovement(state, movement.moveDown);

// Hard drop: the piece goes as low as possible and locks immediately.
export const hardDrop = (state: GameState): StepResult => {
  if (state.lost || state.piece === null) return { state, cleared: 0 };
  return lockPiece(state, movement.hardDrop(state.board, state.piece));
};

// Gravity tick, to be called at a constant interval.
// - If the piece can go down, it goes down.
// - Otherwise it locks. Since a piece that touches the pile stays in place until the next tick,
//   the player can still move it at the last moment, as required by the subject.
export const tick = (state: GameState): StepResult => {
  if (state.lost || state.piece === null) return { state, cleared: 0 };
  const lower = movement.moveDown(state.board, state.piece);
  if (lower !== state.piece) return { state: { ...state, piece: lower }, cleared: 0 };
  return lockPiece(state, state.piece);
};

// Receives penalty lines from an opponent.
// The pile goes up by `count` rows, and so does the current piece, so it keeps its place
// relative to the pile. If blocks are pushed out of the top of the board, the game is lost.
export const receivePenalty = (state: GameState, count: number): GameState => {
  if (state.lost || count <= 0) return state;
  const { board, overflow } = addPenaltyLines(state.board, count);
  if (overflow) return { ...state, board, piece: null, lost: true };
  const piece = state.piece === null ? null : { ...state.piece, y: state.piece.y - count };
  return { ...state, board, piece };
};