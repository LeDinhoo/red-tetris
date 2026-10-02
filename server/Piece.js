// A piece of the sequence of a game.
//
// The server only needs the type of a piece: its starting position and rotation are always
// the same, and the client computes them. Types are the same numbers as on the client:
// 1 = I, 2 = J, 3 = L, 4 = O, 5 = S, 6 = T, 7 = Z.

export class Piece {
  static TYPES = [1, 2, 3, 4, 5, 6, 7];

  constructor(type) {
    this.type = type;
  }

  // Creates a random piece. `rng` returns a number in [0, 1), like Math.random.
  // It can be replaced in tests to get a predictable sequence.
  static random(rng = Math.random) {
    return new Piece(Piece.TYPES[Math.floor(rng() * Piece.TYPES.length)]);
  }
}