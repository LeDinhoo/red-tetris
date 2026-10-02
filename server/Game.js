// A game (a room): its players, its status and its sequence of pieces.
//
// This class knows nothing about socket.io: it only holds the rules, so it can be tested alone.
// Methods that can be refused return `{ ok: false, error }`, `false` or `null`
// instead of throwing, because their input comes from the network.

import { Piece } from './Piece.js';
import { Player } from './Player.js';

export const STATUS = Object.freeze({
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
});

// Maximum number of pieces returned by one request
export const MAX_BATCH = 50;

// Highest starting index accepted in a request (protects the memory of the server)
export const MAX_SEQUENCE = 10000;

export class Game {
  // `rng` returns a number in [0, 1) and can be replaced in tests.
  constructor(name, rng = Math.random) {
    this.name = name;
    this.rng = rng;
    this.players = []; // in join order: the first one is the host
    this.status = STATUS.WAITING;
    this.winner = null; // name of the winner, multiplayer only
    this.solo = false; // true if the current round was started with a single player
    this.pieces = []; // the sequence of the current round, shared by all players
  }

  // The host is always the first player of the list, so it changes by itself when it leaves.
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

  // Starts or restarts the game. Host only.
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

  // Returns the types of the pieces `from` to `from + count - 1` of the sequence.
  // The sequence is extended on demand and never changes once generated, so every player
  // gets the same pieces in the same order, whenever they ask for them.
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

  // Stores the spectrum of a living player. Returns true if it was accepted.
  setSpectrum(id, spectrum) {
    const player = this.getPlayer(id);
    if (!player || !player.alive || this.status !== STATUS.PLAYING) return false;
    return player.setSpectrum(spectrum);
  }

  // A player cleared `cleared` lines. Returns the penalty to send, or null if there is none:
  // `{ count, recipients }` where count = cleared - 1 and recipients are the ids of the
  // other living players.
  reportLines(id, cleared) {
    const player = this.getPlayer(id);
    if (!player || !player.alive || this.status !== STATUS.PLAYING) return null;
    if (!Number.isInteger(cleared) || cleared < 1 || cleared > 4) return null;
    const count = cleared - 1;
    const recipients = this.players.filter((other) => other.alive && other.id !== id);
    if (count === 0 || recipients.length === 0) return null;
    return { count, recipients: recipients.map((other) => other.id) };
  }

  // A player lost. Returns true if it was taken into account.
  playerLost(id) {
    const player = this.getPlayer(id);
    if (!player || !player.alive || this.status !== STATUS.PLAYING) return false;
    player.alive = false;
    this.checkEnd();
    return true;
  }

  // Ends the round when needed:
  // - solo: when the player is no longer alive (no winner),
  // - multiplayer: when one player or less is alive (the last one wins).
  checkEnd() {
    if (this.status !== STATUS.PLAYING) return;
    const alive = this.players.filter((player) => player.alive);
    const over = this.solo ? alive.length === 0 : alive.length <= 1;
    if (!over) return;
    this.status = STATUS.FINISHED;
    this.winner = this.solo ? null : (alive[0]?.name ?? null);
  }

  // The state sent to the clients (see PROTOCOL.md).
  getState() {
    return {
      name: this.name,
      status: this.status,
      winner: this.winner,
      players: this.players.map((player, index) => ({
        name: player.name,
        host: index === 0,
        alive: player.alive,
      })),
    };
  }
}