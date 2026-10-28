<script lang="ts">
  import type { Board } from '../game/board';

  const CELL_COLORS = [
    'bg-zinc-900',
    'bg-cyan-400',
    'bg-blue-600',
    'bg-orange-500',
    'bg-yellow-300',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-zinc-500',
  ];

  let { board }: { board: Board } = $props();
</script>

<div class="grid w-64 grid-cols-10 gap-px border-2 border-zinc-600 bg-zinc-700">
  {#each board.flat() as cell}
    <div class="aspect-square {CELL_COLORS[cell]}"></div>
  {/each}
</div>