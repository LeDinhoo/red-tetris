# Red Tetris

Red Tetris is a full-stack multiplayer Tetris game. The browser uses Svelte and TypeScript; Node.js, Express and Socket.IO handle multiplayer rooms in memory.

## Run

Build the client, then start the server from its own npm project:

```sh
cd client
npm install
npm run build

cd ../server
npm install
npm start
```

The server serves the built client. It listens on port `3000` by default; set `PORT` in the process environment to use another port.

## Game URL

Open `/<room>/<player>`, for example `http://localhost:3000/my-room/alice`.

Players using the same room segment join the same game. Names must be non-blank and at most 20 characters. A room refuses duplicate names and new players while a round is active.

## Controls

| Key | Action |
| --- | --- |
| ← | Move left |
| → | Move right |
| ↑ | Rotate |
| ↓ | Soft drop |
| Space | Hard drop |

## Multiplayer rules

- The host starts or restarts the round. If the host disconnects, the next remaining player becomes host.
- Rooms are independent. Each round has one server-generated piece sequence shared by its players, who advance through it independently.
- The server sends `n - 1` penalty lines to every other living player when a player clears `n` lines.
- Player names and board spectra update in real time. Players report their own loss; the last living multiplayer player wins. Solo play is supported.
- Room and round state exists in memory and disappears when the server process stops.

## Architecture

- `client/src/game/*` contains immutable Tetris mechanics.
- `client/src/components/Game.svelte` handles the browser UI and Socket.IO.
- `server/Game.js`, `Player.js` and `Piece.js` contain room rules and validation.
- `server/src/index.js` serves the built SPA and static assets, and handles HTTP and Socket.IO.
- The server stores rooms in an in-memory `Map<room, Game>`.

## Tests

Client:

```sh
cd client
npm test
npm run coverage
npm run check
```

Server:

```sh
cd server
npm test
npm run coverage
```

## Protocol

See [PROTOCOL.md](PROTOCOL.md) for the existing Socket.IO events and payloads.
