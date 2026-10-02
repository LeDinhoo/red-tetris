import { describe, it, expect } from 'vitest';
import { Game, STATUS, MAX_BATCH, MAX_SEQUENCE } from './Game.js';
import { Player } from './Player.js';

// A predictable generator: the piece types come out as 1, 2, 3, 4, 5, 6, 7, 1, 2, ...
const makeRng = () => {
  let i = 0;
  return () => ((i++ % 7) + 0.5) / 7;
};

// Creates a game with one player per name. The id of each player is its name.
const makeGame = (names = ['alice', 'bob']) => {
  const game = new Game('room', makeRng());
  names.forEach((name) => game.addPlayer(new Player(name, name)));
  return game;
};

// Creates a game and starts it (as the first player, who is the host).
const makeStartedGame = (names) => {
  const game = makeGame(names);
  game.start(game.host.id);
  return game;
};

const validSpectrum = () => Array.from({ length: 10 }, (_, i) => i);

describe('new game', () => {
  it('is waiting, empty, and has no winner', () => {
    const game = new Game('room');
    expect(game.name).toBe('room');
    expect(game.status).toBe(STATUS.WAITING);
    expect(game.winner).toBeNull();
    expect(game.isEmpty()).toBe(true);
    expect(game.host).toBeNull();
  });
});

describe('addPlayer', () => {
  it('adds a player, and the first one is the host', () => {
    const game = makeGame(['alice', 'bob']);
    expect(game.players).toHaveLength(2);
    expect(game.host.name).toBe('alice');
    expect(game.isEmpty()).toBe(false);
  });

  it('finds a player by id', () => {
    const game = makeGame();
    expect(game.getPlayer('bob').name).toBe('bob');
    expect(game.getPlayer('nobody')).toBeNull();
  });

  it('refuses an invalid name', () => {
    const game = makeGame(['alice']);
    expect(game.addPlayer(new Player('x', ''))).toEqual({ ok: false, error: 'INVALID_NAME' });
    expect(game.players).toHaveLength(1);
  });

  it('refuses a name that is already taken', () => {
    const game = makeGame(['alice']);
    expect(game.addPlayer(new Player('other', 'alice'))).toEqual({
      ok: false,
      error: 'NAME_TAKEN',
    });
    expect(game.players).toHaveLength(1);
  });

  it('refuses a player while the game is running', () => {
    const game = makeStartedGame(['alice', 'bob']);
    expect(game.addPlayer(new Player('carol', 'carol'))).toEqual({
      ok: false,
      error: 'GAME_IN_PROGRESS',
    });
    expect(game.players).toHaveLength(2);
  });

  it('accepts a player once the game is finished', () => {
    const game = makeStartedGame(['alice', 'bob']);
    game.playerLost('bob');
    expect(game.status).toBe(STATUS.FINISHED);
    expect(game.addPlayer(new Player('carol', 'carol'))).toEqual({ ok: true });
    expect(game.players).toHaveLength(3);
  });
});

describe('removePlayer', () => {
  it('gives the host role to the next player when the host leaves', () => {
    const game = makeGame(['alice', 'bob', 'carol']);
    game.removePlayer('alice');
    expect(game.host.name).toBe('bob');
    expect(game.start('bob')).toEqual({ ok: true });
  });

  it('keeps the host when another player leaves', () => {
    const game = makeGame(['alice', 'bob', 'carol']);
    game.removePlayer('bob');
    expect(game.host.name).toBe('alice');
  });

  it('becomes empty when everybody left', () => {
    const game = makeGame(['alice', 'bob']);
    game.removePlayer('alice');
    game.removePlayer('bob');
    expect(game.isEmpty()).toBe(true);
  });

  it('ignores an unknown id', () => {
    const game = makeGame(['alice', 'bob']);
    game.removePlayer('nobody');
    expect(game.players).toHaveLength(2);
  });

  it('keeps the game running while two players or more are alive', () => {
    const game = makeStartedGame(['alice', 'bob', 'carol']);
    game.removePlayer('carol');
    expect(game.status).toBe(STATUS.PLAYING);
  });

  it('ends the game and gives the win to the last player who stays', () => {
    const game = makeStartedGame(['alice', 'bob', 'carol']);
    game.removePlayer('carol');
    game.removePlayer('bob');
    expect(game.status).toBe(STATUS.FINISHED);
    expect(game.winner).toBe('alice');
  });

  it('ends a solo game when the player leaves', () => {
    const game = makeStartedGame(['alice']);
    game.removePlayer('alice');
    expect(game.status).toBe(STATUS.FINISHED);
    expect(game.winner).toBeNull();
  });

  it('does not change a game that is not running', () => {
    const game = makeGame(['alice', 'bob']);
    game.removePlayer('bob');
    expect(game.status).toBe(STATUS.WAITING);
  });
});

describe('start', () => {
  it('starts the game when the host asks', () => {
    const game = makeGame();
    expect(game.start('alice')).toEqual({ ok: true });
    expect(game.status).toBe(STATUS.PLAYING);
  });

  it('refuses a player who is not the host', () => {
    const game = makeGame();
    expect(game.start('bob')).toEqual({ ok: false, error: 'NOT_HOST' });
    expect(game.status).toBe(STATUS.WAITING);
  });

  it('refuses when there is nobody in the room', () => {
    const game = new Game('room');
    expect(game.start('alice')).toEqual({ ok: false, error: 'NOT_HOST' });
  });

  it('refuses to start a game that is already running', () => {
    const game = makeStartedGame();
    expect(game.start('alice')).toEqual({ ok: false, error: 'ALREADY_PLAYING' });
  });

  it('remembers whether the round is solo', () => {
    expect(makeStartedGame(['alice']).solo).toBe(true);
    expect(makeStartedGame(['alice', 'bob']).solo).toBe(false);
  });

  it('restarts a finished game with everybody alive and a clean state', () => {
    const game = makeStartedGame(['alice', 'bob']);
    game.setSpectrum('bob', validSpectrum());
    game.playerLost('bob');
    expect(game.status).toBe(STATUS.FINISHED);
    expect(game.winner).toBe('alice');

    expect(game.start('alice')).toEqual({ ok: true });
    expect(game.status).toBe(STATUS.PLAYING);
    expect(game.winner).toBeNull();
    expect(game.getPlayer('bob').alive).toBe(true);
    expect(game.getPlayer('bob').spectrum).toEqual(Player.emptySpectrum());
    expect(game.pieces).toEqual([]);
  });
});

describe('getPieces', () => {
  it('returns nothing when the game is not running', () => {
    expect(makeGame().getPieces(0, 5)).toEqual([]);
  });

  it('returns the requested number of piece types', () => {
    const game = makeStartedGame();
    expect(game.getPieces(0, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('gives the same pieces every time they are asked', () => {
    const game = makeStartedGame();
    const first = game.getPieces(0, 10);
    const second = game.getPieces(0, 10);
    expect(second).toEqual(first);
  });

  it('keeps overlapping requests consistent', () => {
    const game = makeStartedGame();
    const start = game.getPieces(0, 5);
    const middle = game.getPieces(3, 5);
    expect(middle.slice(0, 2)).toEqual(start.slice(3));
  });

  it('extends the sequence when asked further', () => {
    const game = makeStartedGame();
    game.getPieces(0, 3);
    expect(game.getPieces(3, 3)).toEqual([4, 5, 6]);
    expect(game.pieces).toHaveLength(6);
  });

  it('only returns valid piece types', () => {
    const game = makeStartedGame();
    for (const type of game.getPieces(0, MAX_BATCH)) {
      expect(type).toBeGreaterThanOrEqual(1);
      expect(type).toBeLessThanOrEqual(7);
    }
  });

  it('limits the size of a batch', () => {
    const game = makeStartedGame();
    expect(game.getPieces(0, 1000)).toHaveLength(MAX_BATCH);
  });

  it('refuses invalid requests', () => {
    const game = makeStartedGame();
    expect(game.getPieces(-1, 5)).toEqual([]);
    expect(game.getPieces(1.5, 5)).toEqual([]);
    expect(game.getPieces('0', 5)).toEqual([]);
    expect(game.getPieces(0, 0)).toEqual([]);
    expect(game.getPieces(0, 2.5)).toEqual([]);
    expect(game.getPieces(MAX_SEQUENCE + 1, 5)).toEqual([]);
  });
});

describe('setSpectrum', () => {
  it('stores the spectrum of a living player', () => {
    const game = makeStartedGame();
    expect(game.setSpectrum('bob', validSpectrum())).toBe(true);
    expect(game.getPlayer('bob').spectrum).toEqual(validSpectrum());
  });

  it('refuses it when the game is not running', () => {
    const game = makeGame();
    expect(game.setSpectrum('bob', validSpectrum())).toBe(false);
  });

  it('refuses it for an unknown player', () => {
    const game = makeStartedGame();
    expect(game.setSpectrum('nobody', validSpectrum())).toBe(false);
  });

  it('refuses it for a player who lost', () => {
    const game = makeStartedGame(['alice', 'bob', 'carol']);
    game.playerLost('carol');
    expect(game.setSpectrum('carol', validSpectrum())).toBe(false);
  });

  it('refuses an invalid spectrum', () => {
    const game = makeStartedGame();
    expect(game.setSpectrum('bob', [1, 2, 3])).toBe(false);
  });
});

describe('reportLines', () => {
  it('gives cleared - 1 penalty lines to every other living player', () => {
    const game = makeStartedGame(['alice', 'bob', 'carol']);
    expect(game.reportLines('alice', 3)).toEqual({ count: 2, recipients: ['bob', 'carol'] });
  });

  it('does not send penalty lines to players who lost', () => {
    const game = makeStartedGame(['alice', 'bob', 'carol']);
    game.playerLost('carol');
    expect(game.reportLines('alice', 4)).toEqual({ count: 3, recipients: ['bob'] });
  });

  it('sends nothing for a single line', () => {
    const game = makeStartedGame();
    expect(game.reportLines('alice', 1)).toBeNull();
  });

  it('sends nothing when there is no opponent', () => {
    const game = makeStartedGame(['alice']);
    expect(game.reportLines('alice', 4)).toBeNull();
  });

  it('refuses an invalid number of lines', () => {
    const game = makeStartedGame();
    expect(game.reportLines('alice', 0)).toBeNull();
    expect(game.reportLines('alice', 5)).toBeNull();
    expect(game.reportLines('alice', 1.5)).toBeNull();
    expect(game.reportLines('alice', '2')).toBeNull();
  });

  it('refuses it when the game is not running', () => {
    const game = makeGame();
    expect(game.reportLines('alice', 3)).toBeNull();
  });

  it('refuses it for an unknown player', () => {
    const game = makeStartedGame();
    expect(game.reportLines('nobody', 3)).toBeNull();
  });

  it('refuses it for a player who lost', () => {
    const game = makeStartedGame(['alice', 'bob', 'carol']);
    game.playerLost('alice');
    expect(game.reportLines('alice', 3)).toBeNull();
  });
});

describe('playerLost', () => {
  it('ends a two-player game and gives the win to the other player', () => {
    const game = makeStartedGame(['alice', 'bob']);
    expect(game.playerLost('bob')).toBe(true);
    expect(game.status).toBe(STATUS.FINISHED);
    expect(game.winner).toBe('alice');
  });

  it('keeps the game running while two players or more are alive', () => {
    const game = makeStartedGame(['alice', 'bob', 'carol']);
    game.playerLost('carol');
    expect(game.status).toBe(STATUS.PLAYING);
    expect(game.winner).toBeNull();
    game.playerLost('bob');
    expect(game.status).toBe(STATUS.FINISHED);
    expect(game.winner).toBe('alice');
  });

  it('ends a solo game without a winner', () => {
    const game = makeStartedGame(['alice']);
    game.playerLost('alice');
    expect(game.status).toBe(STATUS.FINISHED);
    expect(game.winner).toBeNull();
  });

  it('does not count the same loss twice', () => {
    const game = makeStartedGame(['alice', 'bob', 'carol']);
    expect(game.playerLost('carol')).toBe(true);
    expect(game.playerLost('carol')).toBe(false);
  });

  it('is ignored when the game is not running or the player is unknown', () => {
    const waiting = makeGame();
    expect(waiting.playerLost('alice')).toBe(false);
    expect(makeStartedGame().playerLost('nobody')).toBe(false);
  });
});

describe('getState', () => {
  it('describes the room for the clients', () => {
    const game = makeStartedGame(['alice', 'bob']);
    expect(game.getState()).toEqual({
      name: 'room',
      status: STATUS.PLAYING,
      winner: null,
      players: [
        { name: 'alice', host: true, alive: true },
        { name: 'bob', host: false, alive: true },
      ],
    });
  });

  it('shows the winner and the players who lost', () => {
    const game = makeStartedGame(['alice', 'bob']);
    game.playerLost('bob');
    const state = game.getState();
    expect(state.status).toBe(STATUS.FINISHED);
    expect(state.winner).toBe('alice');
    expect(state.players[1].alive).toBe(false);
  });
});