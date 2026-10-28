
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

export type StepResult = {
  readonly state: GameState;
  readonly cleared: number;
};

const spawnNext = (state: GameState): GameState => {
  if (state.lost || state.piece !== null) return state;
  if (state.nextIndex >= state.pieces.length) return state;
  const piece = spawnPiece(state.board, state.pieces[state.nextIndex]);
  return { ...state, piece, nextIndex: state.nextIndex + 1, lost: piece === null };
};

export const createGame = (pieces: ReadonlyArray<number> = []): GameState =>
  spawnNext({ board: createBoard(), piece: null, pieces, nextIndex: 0, lost: false });

export const addPieces = (state: GameState, more: ReadonlyArray<number>): GameState =>
  spawnNext({ ...state, pieces: [...state.pieces, ...more] });

const lockPiece = (state: GameState, piece: Piece): StepResult => {
  const { board, cleared } = clearLines(mergePiece(state.board, piece));
  return { state: spawnNext({ ...state, board, piece: null }), cleared };
};

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

export const softDrop = (state: GameState): GameState => applyMovement(state, movement.moveDown);

export const hardDrop = (state: GameState): StepResult => {
  if (state.lost || state.piece === null) return { state, cleared: 0 };
  return lockPiece(state, movement.hardDrop(state.board, state.piece));
};

export const tick = (state: GameState): StepResult => {
  if (state.lost || state.piece === null) return { state, cleared: 0 };
  const lower = movement.moveDown(state.board, state.piece);
  if (lower !== state.piece) return { state: { ...state, piece: lower }, cleared: 0 };
  return lockPiece(state, state.piece);
};

export const receivePenalty = (state: GameState, count: number): GameState => {
  if (state.lost || count <= 0) return state;
  const { board, overflow } = addPenaltyLines(state.board, count);
  if (overflow) return { ...state, board, piece: null, lost: true };
  const piece = state.piece === null ? null : { ...state.piece, y: state.piece.y - count };
  return { ...state, board, piece };
};