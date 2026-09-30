// Definition of the 7 tetrominoes and their 4 rotations.
//
// Conventions (keep them everywhere in the project):
// - x goes to the right, y goes down, origin is the top-left corner.
// - A cell is written [column, row], i.e. [x, y].
// - But on the board, access is done with board[row][column].
// - Coordinates are relative to the top-left corner of the piece's matrix.

// An [x, y] offset relative to the top-left corner of the piece's matrix
export type Cell = readonly [number, number];

// One rotation = exactly 4 cells
export type Rotation = readonly [Cell, Cell, Cell, Cell];

// The 4 rotations of a piece (index 0 to 3, clockwise)
export type PieceShape = readonly [Rotation, Rotation, Rotation, Rotation];

// Piece type identifiers. They are also the values stored in the board
// (0 = empty, 8 = penalty line).
export const I = 1;
export const J = 2;
export const L = 3;
export const O = 4;
export const S = 5;
export const T = 6;
export const Z = 7;

export const PIECE_TYPES = [I, J, L, O, S, T, Z] as const;

// Special board values
export const EMPTY = 0;
export const PENALTY = 8;

// Size of each piece's matrix (needed to place its corner on the board)
export const MATRIX_SIZE: Readonly<Record<number, number>> = {
  [I]: 4,
  [J]: 3,
  [L]: 3,
  [O]: 2,
  [S]: 3,
  [T]: 3,
  [Z]: 3,
};

// Shape table: type -> 4 rotations -> 4 cells [x, y]
export const SHAPES: Readonly<Record<number, PieceShape>> = {
  // I (cyan), 4x4 matrix
  [I]: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],

  // J (blue), 3x3 matrix
  [J]: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],

  // L (orange), 3x3 matrix
  [L]: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],

  // O (yellow), 2x2 matrix: all 4 rotations are identical
  [O]: [
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
  ],

  // S (green), 3x3 matrix
  [S]: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],

  // T (purple), 3x3 matrix
  [T]: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],

  // Z (red), 3x3 matrix
  [Z]: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
};