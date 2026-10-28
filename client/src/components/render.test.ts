import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import App from '../App.svelte';
import { createBoard } from '../game/board';
import Board from './Board.svelte';
import Game from './Game.svelte';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

function renderAt(pathname: string, renderPage: () => string) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { pathname } },
  });

  try {
    return renderPage();
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
}

it('renders a 10×20 board with its cell colors', () => {
  const board = createBoard().map((row, y) => row.map((_, x) => (x + y) % 9));
  const { body } = render(Board, { props: { board } });

  expect(body.match(/aspect-square/g)).toHaveLength(200);
  for (const color of [
    'bg-zinc-900', 'bg-cyan-400', 'bg-blue-600', 'bg-orange-500', 'bg-yellow-300',
    'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-zinc-500',
  ]) {
    expect(body).toContain(color);
  }
});

it('renders the invalid URL state', () => {
  const body = renderAt('/', () => render(Game).body);

  expect(body).toContain('Invalid game URL');
  expect(body).toContain('Use /room/player to start a game.');
});

it('renders the initial valid game through App', () => {
  const body = renderAt('/room/alice', () => render(App).body);

  expect(body).toContain('Red Tetris');
  expect(body).toContain('Joining game…');
  expect(body).toContain('← → move · ↑ rotate · ↓ soft drop · Space hard drop');
  expect(body.match(/aspect-square/g)).toHaveLength(200);
});
