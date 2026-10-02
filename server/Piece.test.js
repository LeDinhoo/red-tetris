import { describe, it, expect } from 'vitest';
import { Piece } from './Piece.js';

describe('Piece', () => {
  it('stores its type', () => {
    expect(new Piece(4).type).toBe(4);
  });

  it('has the 7 types, numbered 1 to 7', () => {
    expect(Piece.TYPES).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  describe('random', () => {
    it('returns a Piece', () => {
      expect(Piece.random()).toBeInstanceOf(Piece);
    });

    it('returns the first type when the random number is 0', () => {
      expect(Piece.random(() => 0).type).toBe(1);
    });

    it('returns the last type when the random number is close to 1', () => {
      expect(Piece.random(() => 0.999).type).toBe(7);
    });

    it('returns the type matching the random number', () => {
      expect(Piece.random(() => 0.5).type).toBe(4);
    });

    it('always returns a valid type with the default generator', () => {
      for (let i = 0; i < 200; i++) {
        expect(Piece.TYPES).toContain(Piece.random().type);
      }
    });
  });
});