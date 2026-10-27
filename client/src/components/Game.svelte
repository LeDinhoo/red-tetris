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
    import { io } from "socket.io-client";

    // Constant falling speed, as required by the subject
    const TICK_MS = 800;

    const identity = (() => {
        const match = /^\/([^/]+)\/([^/]+)$/.exec(window.location.pathname);
        if (!match) return null;
        try {
            const [room, player] = match.slice(1).map(decodeURIComponent);
            return room && player ? { room, player } : null;
        } catch {
            return null;
        }
    })();

    type ConnectionState = "joining" | "joined" | "error" | "disconnected";
    let connection = $state<ConnectionState>(identity ? "joining" : "disconnected");
    let connectionError = $state("");

    $effect(() => {
        if (!identity) return;
        const socket = io(window.location.origin, {
            autoConnect: false,
            reconnection: false,
        });

        socket.on("connect", () => {
            socket.emit(
                "join",
                { room: identity.room, name: identity.player },
                (result: unknown) => {
                if (
                    result &&
                    typeof result === "object" &&
                    "ok" in result &&
                    result.ok === true
                ) {
                    connection = "joined";
                    return;
                }
                connectionError =
                    result &&
                    typeof result === "object" &&
                    "error" in result &&
                    typeof result.error === "string"
                        ? result.error
                        : "JOIN_FAILED";
                connection = "error";
                },
            );
        });
        socket.on("connect_error", () => {
            connectionError = "SERVER_UNAVAILABLE";
            connection = "error";
        });
        socket.on("disconnect", () => {
            connectionError = "DISCONNECTED";
            connection = "disconnected";
        });
        socket.connect();
        return () => socket.disconnect();
    });

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
        if (!identity || connection !== "joined") return;
        const id = setInterval(() => {
            game = tick(game).state;
        }, TICK_MS);
        return () => clearInterval(id);
    });

    const handleKeydown = (event: KeyboardEvent) => {
        if (!identity || connection !== "joined") return;
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
        if (connection !== "joined") return;
        game = createGame(randomPieces());
    };
</script>

<svelte:window onkeydown={handleKeydown} />

{#if !identity}
    <main
        class="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-4 text-zinc-100"
    >
        <h1 class="text-2xl font-bold">Invalid game URL</h1>
        <p class="text-sm text-zinc-400">Use /room/player to start a game.</p>
    </main>
{:else}
<main
    class="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-4 text-zinc-100"
>
    <h1 class="text-2xl font-bold">Red Tetris</h1>
    {#if connection === "joining"}
        <p class="text-sm text-zinc-400">Joining game…</p>
    {:else if connection === "error" || connection === "disconnected"}
        <p class="text-sm text-red-400" role="alert">Connection: {connectionError}</p>
    {/if}

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
{/if}
