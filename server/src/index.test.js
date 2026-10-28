import { afterAll, beforeAll, expect, it } from 'vitest';
import { io as createClient } from 'socket.io-client';

const previousPort = process.env.PORT;
const clients = [];
let io;
let games;
let alice;
let bob;

const once = (socket, event) => new Promise((resolve) => socket.once(event, resolve));
const emitAck = (socket, event, ...args) => new Promise((resolve) => socket.emit(event, ...args, resolve));
const connect = (socket) => new Promise((resolve, reject) => {
  socket.once('connect', resolve);
  socket.once('connect_error', reject);
  socket.connect();
});

beforeAll(async () => {
  process.env.PORT = String(30000 + (process.pid % 30000));
  ({ io, games } = await import('./index.js'));
  const url = `http://127.0.0.1:${process.env.PORT}`;
  alice = createClient(url, { autoConnect: false });
  bob = createClient(url, { autoConnect: false });
  clients.push(alice, bob);
  await Promise.all([connect(alice), connect(bob)]);
}, 10000);

afterAll(async () => {
  clients.forEach((client) => client.disconnect());
  if (io) await new Promise((resolve) => io.close(resolve));
  games?.clear();
  if (previousPort === undefined) delete process.env.PORT;
  else process.env.PORT = previousPort;
});

it('joins, starts, and disconnects clients through Socket.IO', async () => {
  const aliceOnJoin = once(alice, 'state');
  const aliceJoin = await emitAck(alice, 'join', { room: 's1-room', name: 'alice' });
  expect(aliceJoin.ok).toBe(true);
  await aliceOnJoin;

  const aliceOnBobJoin = once(alice, 'state');
  const bobOnJoin = once(bob, 'state');
  const bobJoin = await emitAck(bob, 'join', { room: 's1-room', name: 'bob' });
  const [aliceState, bobState] = await Promise.all([aliceOnBobJoin, bobOnJoin]);

  expect(bobJoin.ok).toBe(true);
  for (const state of [bobJoin.state, aliceState, bobState]) {
    expect(state.players.map((player) => player.name)).toEqual(['alice', 'bob']);
    expect(state.players.map((player) => player.host)).toEqual([true, false]);
  }

  const startedState = once(alice, 'state');
  expect(await emitAck(alice, 'start')).toEqual({ ok: true });
  expect(await startedState).toMatchObject({ status: 'playing' });

  const remainingState = once(alice, 'state');
  bob.disconnect();
  expect((await remainingState).players.map((player) => player.name)).toEqual(['alice']);
});
