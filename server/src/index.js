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
