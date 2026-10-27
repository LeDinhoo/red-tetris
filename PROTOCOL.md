# Socket.IO protocol

Socket.IO uses the same HTTP server and origin as the SPA. A socket can join at most one game room. After joining, the server identifies the player by `socket.id`; later actions do not accept a client-supplied player ID. The server's room state controls multiplayer status and winner. Invalid gameplay reports are rejected or ignored by the existing domain validation.

## Client to server

### `join`

Payload:

```js
{ room: string, name: string }
```

Acknowledges `{ ok: true, state }` or `{ ok: false, error }`. Current error names are `INVALID_ROOM`, `ALREADY_JOINED`, `INVALID_NAME`, `GAME_IN_PROGRESS` and `NAME_TAKEN`. A successful join also broadcasts `state` to the room.

### `start`

No payload. The host uses this to start or restart a round. The acknowledgement is `{ ok: true }` or `{ ok: false, error }`; current errors are `NOT_JOINED`, `NOT_HOST` and `ALREADY_PLAYING`. A successful start broadcasts `state`.

### `pieces`

Payload:

```js
{ from: number, count: number }
```

The acknowledgement is an array of piece type numbers from `1` through `7` (or an empty array when unavailable or invalid). Requests need a non-negative integer `from` no greater than `10000` and a positive integer `count`; at most 50 pieces are returned. The room's `Game` generates and stores one sequence per round, shared by all players.

### `lines`

Payload is the number of lines cleared, an integer from `1` through `4`. The server validates it and calculates `cleared - 1` penalty lines for every other living player. Clearing one line sends no penalty.

### `spectrum`

Payload is an array of 10 integers from `0` through `20`, each the highest occupied height in one board column. The server validates and stores it, then broadcasts updated `state` to the room.

### `lost`

No payload. The server uses `socket.id` to report the player's loss and broadcasts `state` only when the loss is accepted.

## Server to client

### `penalty`

Sent to each targeted living opponent with a number from `1` through `3`. The client applies its existing penalty mechanic.

### `state`

Broadcast to the room after a successful join or start, an accepted loss, a valid spectrum update, or a disconnect while players remain.

```js
{
  name: string,
  status: "waiting" | "playing" | "finished",
  winner: string | null,
  players: [
    {
      name: string,
      host: boolean,
      alive: boolean,
      spectrum: number[10]
    }
  ]
}
```

`winner` is null unless a multiplayer round has finished with a survivor; a solo finish has no winner. `host` is true for the first remaining player. Each spectrum is that player's latest validated spectrum.

## Disconnect

On Socket.IO's built-in `disconnect`, the player is removed. The next remaining player becomes host, and the room state is broadcast if players remain. An empty room is removed from the in-memory map. Removing a player can also finish an active multiplayer round through `Game.checkEnd()`.
