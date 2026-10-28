
import { Piece } from './Piece.js';
import { Player } from './Player.js';

export const STATUS = Object.freeze({
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
});

export const MAX_BATCH = 50;

export const MAX_SEQUENCE = 10000;

export class Game {
  constructor(name, rng = Math.random) {
    this.name = name;
    this.rng = rng;
    this.players = [];
    this.status = STATUS.WAITING;
    this.winner = null;
    this.solo = false;
    this.pieces = [];
  }

  get host() {
    return this.players[0] ?? null;
  }

  isEmpty() {
    return this.players.length === 0;
  }

  getPlayer(id) {
    return this.players.find((player) => player.id === id) ?? null;
  }

  addPlayer(player) {
    if (!Player.isValidName(player.name)) return { ok: false, error: 'INVALID_NAME' };
    if (this.status === STATUS.PLAYING) return { ok: false, error: 'GAME_IN_PROGRESS' };
    if (this.players.some((other) => other.name === player.name)) {
      return { ok: false, error: 'NAME_TAKEN' };
    }
    this.players.push(player);
    return { ok: true };
  }

  removePlayer(id) {
    this.players = this.players.filter((player) => player.id !== id);
    this.checkEnd();
  }

  start(id) {
    if (this.host?.id !== id) return { ok: false, error: 'NOT_HOST' };
    if (this.status === STATUS.PLAYING) return { ok: false, error: 'ALREADY_PLAYING' };
    this.players.forEach((player) => player.reset());
    this.pieces = [];
    this.winner = null;
    this.solo = this.players.length === 1;
    this.status = STATUS.PLAYING;
    return { ok: true };
  }

  getPieces(from, count) {
    if (this.status !== STATUS.PLAYING) return [];
    if (!Number.isInteger(from) || from < 0 || from > MAX_SEQUENCE) return [];
    if (!Number.isInteger(count) || count < 1) return [];
    const end = from + Math.min(count, MAX_BATCH);
    while (this.pieces.length < end) {
      this.pieces.push(Piece.random(this.rng));
    }
    return this.pieces.slice(from, end).map((piece) => piece.type);
  }

  setSpectrum(id, spectrum) {
    const player = this.getPlayer(id);
    if (!player || !player.alive || this.status !== STATUS.PLAYING) return false;
    return player.setSpectrum(spectrum);
  }

  reportLines(id, cleared) {
    const player = this.getPlayer(id);
    if (!player || !player.alive || this.status !== STATUS.PLAYING) return null;
    if (!Number.isInteger(cleared) || cleared < 1 || cleared > 4) return null;
    const count = cleared - 1;
    const recipients = this.players.filter((other) => other.alive && other.id !== id);
    if (count === 0 || recipients.length === 0) return null;
    return { count, recipients: recipients.map((other) => other.id) };
  }

  playerLost(id) {
    const player = this.getPlayer(id);
    if (!player || !player.alive || this.status !== STATUS.PLAYING) return false;
    player.alive = false;
    this.checkEnd();
    return true;
  }

  checkEnd() {
    if (this.status !== STATUS.PLAYING) return;
    const alive = this.players.filter((player) => player.alive);
    const over = this.solo ? alive.length === 0 : alive.length <= 1;
    if (!over) return;
    this.status = STATUS.FINISHED;
    this.winner = this.solo ? null : (alive[0]?.name ?? null);
  }

  getState() {
    return {
      name: this.name,
      status: this.status,
      winner: this.winner,
      players: this.players.map((player, index) => ({
        name: player.name,
        host: index === 0,
        alive: player.alive,
        spectrum: [...player.spectrum],
      })),
    };
  }
}
