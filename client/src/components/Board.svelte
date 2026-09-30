<script lang="ts">
  import type { Board } from '../game/board';

  // Tailwind class for each cell value.
  // The full class names must appear in the source so that Tailwind can detect them.
  const CELL_COLORS = [
    'bg-zinc-900', // 0: empty
    'bg-cyan-400', // 1: I
    'bg-blue-600', // 2: J
    'bg-orange-500', // 3: L
    'bg-yellow-300', // 4: O
    'bg-green-500', // 5: S
    'bg-purple-500', // 6: T
    'bg-red-500', // 7: Z
    'bg-zinc-500', // 8: penalty line
  ];

  let { board }: { board: Board } = $props();
</script>

<!-- 10 columns, one div per cell (no table, no canvas, no SVG) -->
<div class="grid w-64 grid-cols-10 gap-px border-2 border-zinc-600 bg-zinc-700">
  {#each board.flat() as cell}
    <div class="aspect-square {CELL_COLORS[cell]}"></div>
  {/each}
</div>