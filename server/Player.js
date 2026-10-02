// A player of a game.
//
// `id` identifies the connection (the socket id). `name` comes from the URL.
// `spectrum` is the last spectrum sent by the player: 10 heights from 0 to 20.

export const SPECTRUM_WIDTH = 10;
export const SPECTRUM_MAX = 20;
export const MAX_NAME_LENGTH = 20;

export class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.alive = true;
    this.spectrum = Player.emptySpectrum();
  }

  static emptySpectrum() {
    return Array.from({ length: SPECTRUM_WIDTH }, () => 0);
  }

  // A name must be a non-blank string of at most MAX_NAME_LENGTH characters.
  static isValidName(name) {
    return typeof name === 'string' && name.trim().length > 0 && name.length <= MAX_NAME_LENGTH;
  }

  // Stores a copy of the spectrum if it is valid and returns true, otherwise returns false
  // and keeps the previous spectrum. The data comes from the network, so it is checked.
  setSpectrum(spectrum) {
    const valid =
      Array.isArray(spectrum) &&
      spectrum.length === SPECTRUM_WIDTH &&
      spectrum.every((h) => Number.isInteger(h) && h >= 0 && h <= SPECTRUM_MAX);
    if (!valid) return false;
    this.spectrum = [...spectrum];
    return true;
  }

  // Prepares the player for a new round.
  reset() {
    this.alive = true;
    this.spectrum = Player.emptySpectrum();
  }
}