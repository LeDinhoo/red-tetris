import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Game } from '../Game.js';
import { Player } from '../Player.js';

const app = express();
const server = createServer(app);
const io = new Server(server);

export const games = new Map();

export const getGame = (name) => {
  let game = games.get(name);
  if (!game) {
    game = new Game(name);
    games.set(name, game);
  }
  return game;
};

io.on('connection', (socket) => {
  socket.on('join', (payload, acknowledge) => {
    const room = payload?.room;
    if (typeof room !== 'string' || room.trim().length === 0) {
      if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'INVALID_ROOM' });
      return;
    }
    if (socket.data.room) {
      if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'ALREADY_JOINED' });
      return;
    }

    const game = getGame(room);
    const result = game.addPlayer(new Player(socket.id, payload?.name));
    if (!result.ok) {
      if (game.isEmpty()) games.delete(room);
      if (typeof acknowledge === 'function') acknowledge(result);
      return;
    }

    socket.data.room = room;
    socket.join(room);
    const state = game.getState();
    if (typeof acknowledge === 'function') acknowledge({ ok: true, state });
    io.to(room).emit('state', state);
  });

  socket.on('start', (acknowledge) => {
    if (typeof acknowledge !== 'function') return;

    const room = socket.data.room;
    const game = room ? games.get(room) : null;
    if (!game) return acknowledge({ ok: false, error: 'NOT_JOINED' });

    const result = game.start(socket.id);
    acknowledge(result);
    if (result.ok) io.to(room).emit('state', game.getState());
  });

  socket.on('lines', (cleared) => {
    const room = socket.data.room;
    const game = room ? games.get(room) : null;
    if (!game) return;

    const penalty = game.reportLines(socket.id, cleared);
    if (!penalty) return;
    penalty.recipients.forEach((id) => io.to(id).emit('penalty', penalty.count));
  });

  socket.on('spectrum', (spectrum) => {
    const room = socket.data.room;
    const game = room ? games.get(room) : null;
    if (!game) return;

    if (game.setSpectrum(socket.id, spectrum)) io.to(room).emit('state', game.getState());
  });

  socket.on('pieces', (payload, acknowledge) => {
    if (typeof acknowledge !== 'function') return;

    const room = socket.data.room;
    const game = room ? games.get(room) : null;
    acknowledge(game ? game.getPieces(payload?.from, payload?.count) : []);
  });

  socket.on('disconnect', () => {
    const room = socket.data.room;
    if (!room) return;
    const game = games.get(room);
    if (!game) return;

    game.removePlayer(socket.id);
    if (game.isEmpty()) {
      games.delete(room);
      return;
    }
    io.to(room).emit('state', game.getState());
  });
});

const port = Number(process.env.PORT) || 3000;
server.listen(port);
