import { describe, it, expect } from 'vitest';
import { Player, SPECTRUM_WIDTH, SPECTRUM_MAX, MAX_NAME_LENGTH } from './Player.js';

const validSpectrum = () => Array.from({ length: SPECTRUM_WIDTH }, (_, i) => i);

describe('Player', () => {
  it('stores its id and its name', () => {
    const player = new Player('socket-1', 'alice');
    expect(player.id).toBe('socket-1');
    expect(player.name).toBe('alice');
  });

  it('starts alive with an empty spectrum', () => {
    const player = new Player('1', 'alice');
    expect(player.alive).toBe(true);
    expect(player.spectrum).toEqual(Array.from({ length: SPECTRUM_WIDTH }, () => 0));
  });

  it('does not share its spectrum with other players', () => {
    const first = new Player('1', 'alice');
    const second = new Player('2', 'bob');
    first.setSpectrum(validSpectrum());
    expect(second.spectrum).toEqual(Player.emptySpectrum());
  });

  describe('isValidName', () => {
    it('accepts a normal name', () => {
      expect(Player.isValidName('alice')).toBe(true);
    });

    it('accepts a name of the maximum length', () => {
      expect(Player.isValidName('a'.repeat(MAX_NAME_LENGTH))).toBe(true);
    });

    it('refuses a name that is too long', () => {
      expect(Player.isValidName('a'.repeat(MAX_NAME_LENGTH + 1))).toBe(false);
    });

    it('refuses an empty or blank name', () => {
      expect(Player.isValidName('')).toBe(false);
      expect(Player.isValidName('   ')).toBe(false);
    });

    it('refuses what is not a string', () => {
      expect(Player.isValidName(42)).toBe(false);
      expect(Player.isValidName(null)).toBe(false);
      expect(Player.isValidName(undefined)).toBe(false);
      expect(Player.isValidName({})).toBe(false);
    });
  });

  describe('setSpectrum', () => {
    it('stores a valid spectrum', () => {
      const player = new Player('1', 'alice');
      expect(player.setSpectrum(validSpectrum())).toBe(true);
      expect(player.spectrum).toEqual(validSpectrum());
    });

    it('accepts the limits 0 and SPECTRUM_MAX', () => {
      const player = new Player('1', 'alice');
      const limits = [0, SPECTRUM_MAX, 0, SPECTRUM_MAX, 0, SPECTRUM_MAX, 0, SPECTRUM_MAX, 0, SPECTRUM_MAX];
      expect(player.setSpectrum(limits)).toBe(true);
    });

    it('stores a copy, not the array it received', () => {
      const player = new Player('1', 'alice');
      const input = validSpectrum();
      player.setSpectrum(input);
      input[0] = 99;
      expect(player.spectrum[0]).toBe(0);
    });

    it('refuses what is not an array', () => {
      const player = new Player('1', 'alice');
      expect(player.setSpectrum('0123456789')).toBe(false);
      expect(player.setSpectrum(null)).toBe(false);
      expect(player.setSpectrum({})).toBe(false);
    });

    it('refuses a wrong length', () => {
      const player = new Player('1', 'alice');
      expect(player.setSpectrum([1, 2, 3])).toBe(false);
      expect(player.setSpectrum([...validSpectrum(), 1])).toBe(false);
    });

    it('refuses values out of range', () => {
      const player = new Player('1', 'alice');
      const tooHigh = validSpectrum();
      tooHigh[3] = SPECTRUM_MAX + 1;
      const negative = validSpectrum();
      negative[3] = -1;
      expect(player.setSpectrum(tooHigh)).toBe(false);
      expect(player.setSpectrum(negative)).toBe(false);
    });

    it('refuses values that are not integers', () => {
      const player = new Player('1', 'alice');
      const decimal = validSpectrum();
      decimal[2] = 1.5;
      const text = validSpectrum();
      text[2] = '3';
      expect(player.setSpectrum(decimal)).toBe(false);
      expect(player.setSpectrum(text)).toBe(false);
      expect(player.setSpectrum([NaN, ...validSpectrum().slice(1)])).toBe(false);
    });

    it('keeps the previous spectrum when the new one is refused', () => {
      const player = new Player('1', 'alice');
      player.setSpectrum(validSpectrum());
      player.setSpectrum([1, 2, 3]);
      expect(player.spectrum).toEqual(validSpectrum());
    });
  });

  describe('reset', () => {
    it('makes the player alive again with an empty spectrum', () => {
      const player = new Player('1', 'alice');
      player.alive = false;
      player.setSpectrum(validSpectrum());
      player.reset();
      expect(player.alive).toBe(true);
      expect(player.spectrum).toEqual(Player.emptySpectrum());
    });
  });
});