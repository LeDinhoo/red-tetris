
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

  static isValidName(name) {
    return typeof name === 'string' && name.trim().length > 0 && name.length <= MAX_NAME_LENGTH;
  }

  setSpectrum(spectrum) {
    const valid =
      Array.isArray(spectrum) &&
      spectrum.length === SPECTRUM_WIDTH &&
      spectrum.every((h) => Number.isInteger(h) && h >= 0 && h <= SPECTRUM_MAX);
    if (!valid) return false;
    this.spectrum = [...spectrum];
    return true;
  }

  reset() {
    this.alive = true;
    this.spectrum = Player.emptySpectrum();
  }
}