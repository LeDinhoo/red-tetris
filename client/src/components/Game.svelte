<script lang="ts">
    import { PIECE_TYPES } from "../game/pieces";
    import { mergePiece } from "../game/operations";
    import {
        createGame,
        tick,
        hardDrop,
        moveLeft,
        moveRight,
        rotate,
        softDrop,
    } from "../game/game";
    import BoardView from "./Board.svelte";

    // Constant falling speed, as required by the subject
    const TICK_MS = 800;

    // Solo mode only: the sequence of pieces is generated locally.
    // In multiplayer, it will come from the server (see addPieces in game.ts).
    const SEQUENCE_LENGTH = 1000;

    const randomPieces = (): number[] =>
        Array.from(
            { length: SEQUENCE_LENGTH },
            () => PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)],
        );

    // The state is never mutated, only replaced: $state.raw is enough (no deep proxy).
    let game = $state.raw(createGame(randomPieces()));

    // The current piece is drawn by merging it into a copy of the board, for display only.
    const visibleBoard = $derived(
        game.piece ? mergePiece(game.board, game.piece) : game.board,
    );

    // Gravity. `game` is only read inside the callback, so this effect runs once.
    $effect(() => {
        const id = setInterval(() => {
            game = tick(game).state;
        }, TICK_MS);
        return () => clearInterval(id);
    });

    const handleKeydown = (event: KeyboardEvent) => {
        switch (event.code) {
            case "ArrowLeft":
                game = moveLeft(game);
                break;
            case "ArrowRight":
                game = moveRight(game);
                break;
            case "ArrowDown":
                game = softDrop(game);
                break;
            case "ArrowUp":
                if (!event.repeat) game = rotate(game);
                break;
            case "Space":
                if (!event.repeat) game = hardDrop(game).state;
                break;
            default:
                return;
        }
        // Avoid scrolling the page with the arrows and the space bar
        event.preventDefault();
    };

    const restart = () => {
        game = createGame(randomPieces());
    };
</script>

<svelte:window onkeydown={handleKeydown} />

<main
    class="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-4 text-zinc-100"
>
    <h1 class="text-2xl font-bold">Red Tetris</h1>

    <div class="relative">
        <BoardView board={visibleBoard} />
        {#if game.lost}
            <div
                class="absolute inset-0 flex items-center justify-center bg-black/70 text-2xl font-bold"
            >
                Game over
            </div>
        {/if}
    </div>

    <button
        class="rounded bg-red-600 px-4 py-2 font-semibold hover:bg-red-500"
        onmousedown={(event) => event.preventDefault()}
        onclick={restart}
    >
        Restart
    </button>

    <p class="text-sm text-zinc-400">
        ← → move · ↑ rotate · ↓ soft drop · Space hard drop
    </p>
</main>
