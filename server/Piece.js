
export class Piece {
  static TYPES = [1, 2, 3, 4, 5, 6, 7];

  constructor(type) {
    this.type = type;
  }

  static random(rng = Math.random) {
    return new Piece(Piece.TYPES[Math.floor(rng() * Piece.TYPES.length)]);
  }
}