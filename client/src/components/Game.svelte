<script lang="ts">
    import { mergePiece } from "../game/operations";
    import {
        addPieces,
        createGame,
        tick,
        hardDrop,
        receivePenalty,
        moveLeft,
        moveRight,
        rotate,
        softDrop,
    } from "../game/game";
    import { getSpectrum } from "../game/spectrum";
    import BoardView from "./Board.svelte";
    import { io } from "socket.io-client";

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

    type PlayerState = {
        name: string;
        host: boolean;
        alive: boolean;
        spectrum: ReadonlyArray<number>;
    };

    const isPlayerState = (value: unknown): value is PlayerState => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return false;
        return "name" in value && typeof value.name === "string" &&
            "host" in value && typeof value.host === "boolean" &&
            "alive" in value && typeof value.alive === "boolean" &&
            "spectrum" in value && Array.isArray(value.spectrum) &&
            value.spectrum.length === 10 &&
            value.spectrum.every((height) => Number.isInteger(height) && height >= 0 && height <= 20);
    };

    type ConnectionState = "joining" | "joined" | "error" | "disconnected";
    let connection = $state<ConnectionState>(identity ? "joining" : "disconnected");
    let connectionError = $state("");
    let serverPlaying = $state(false);
    let serverStatus = $state<string | null>(null);
    let winner = $state<string | null>(null);
    let isHost = $state(false);
    let roomPlayers = $state<ReadonlyArray<PlayerState>>([]);
    const opponents = $derived(
        identity ? roomPlayers.filter((player) => player.name !== identity.player) : [],
    );
    let socket: ReturnType<typeof io> | null = null;
    let piecesRequestInFlight = $state(false);
    let round = 0;
    let lossReportedRound = -1;

    $effect(() => {
        if (!identity) return;
        const client = io(window.location.origin, {
            autoConnect: false,
            reconnection: false,
        });
        socket = client;

        client.on("connect", () => {
            client.emit(
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
        client.on("state", (state: unknown) => {
            if (
                !state ||
                typeof state !== "object" ||
                Array.isArray(state) ||
                !("status" in state) ||
                typeof state.status !== "string" ||
                !("winner" in state) ||
                (state.winner !== null && typeof state.winner !== "string") ||
                !("players" in state) ||
                !Array.isArray(state.players) ||
                !state.players.every(isPlayerState)
            ) return;

            serverStatus = state.status;
            winner = state.winner;
            roomPlayers = state.players;
            isHost = identity !== null && roomPlayers.some(
                (player) => player.name === identity.player && player.host,
            );

            const nextPlaying = state.status === "playing";
            if (nextPlaying && !serverPlaying) {
                round += 1;
                serverPlaying = true;
                game = createGame();
                return;
            }
            serverPlaying = nextPlaying;
        });
        client.on("penalty", (count: unknown) => {
            if (
                !serverPlaying ||
                typeof count !== "number" ||
                !Number.isInteger(count) ||
                count < 1 ||
                count > 3
            ) return;
            const previousBoard = game.board;
            const next = receivePenalty(game, count);
            game = next;
            if (next.board !== previousBoard) {
                client.emit("spectrum", getSpectrum(next.board));
            }
        });
        client.on("connect_error", () => {
            connectionError = "SERVER_UNAVAILABLE";
            connection = "error";
        });
        client.on("disconnect", () => {
            connectionError = "DISCONNECTED";
            connection = "disconnected";
        });
        client.connect();
        return () => {
            client.disconnect();
            if (socket === client) socket = null;
        };
    });

    let game = $state.raw(createGame());

    $effect(() => {
        if (
            !identity || connection !== "joined" || !serverPlaying || !socket ||
            piecesRequestInFlight || game.pieces.length - game.nextIndex > 10
        ) return;

        const client = socket;
        const requestRound = round;
        piecesRequestInFlight = true;
        client.emit("pieces", { from: game.pieces.length, count: 50 }, (pieces: unknown) => {
            piecesRequestInFlight = false;
            if (
                requestRound !== round || !serverPlaying ||
                !Array.isArray(pieces) || pieces.length === 0
            ) return;
            game = addPieces(game, pieces);
        });
    });

    $effect(() => {
        if (
            !identity || connection !== "joined" || !serverPlaying || !socket ||
            !game.lost || lossReportedRound === round
        ) return;

        lossReportedRound = round;
        socket.emit("lost");
    });

    const startGame = () => socket?.emit("start", () => {});

    const visibleBoard = $derived(
        game.piece ? mergePiece(game.board, game.piece) : game.board,
    );

    $effect(() => {
        if (!identity || connection !== "joined" || !serverPlaying) return;
        const id = setInterval(() => {
            const previousBoard = game.board;
            const result = tick(game);
            game = result.state;
            if (result.cleared > 0) socket?.emit("lines", result.cleared);
            if (result.state.board !== previousBoard) {
                socket?.emit("spectrum", getSpectrum(result.state.board));
            }
        }, TICK_MS);
        return () => clearInterval(id);
    });

    const handleKeydown = (event: KeyboardEvent) => {
        if (!identity || connection !== "joined" || !serverPlaying) return;
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
                if (!event.repeat) {
                    const previousBoard = game.board;
                    const result = hardDrop(game);
                    game = result.state;
                    if (result.cleared > 0) socket?.emit("lines", result.cleared);
                    if (result.state.board !== previousBoard) {
                        socket?.emit("spectrum", getSpectrum(result.state.board));
                    }
                }
                break;
            default:
                return;
        }
        event.preventDefault();
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

    {#if connection === "joined" && isHost && serverStatus !== "playing"}
        <button
            class="rounded bg-red-600 px-4 py-2 font-semibold hover:bg-red-500"
            onclick={startGame}
        >
            {serverStatus === "finished" ? "Restart" : "Start"}
        </button>
    {/if}
    {#if connection === "joined" && serverStatus === "finished"}
        <p class="text-lg font-semibold" aria-live="polite">
            {winner === null ? "Game over" : `Winner: ${winner}`}
        </p>
    {/if}

    <div class="flex w-full max-w-5xl flex-wrap items-start justify-center gap-6">
        <div class="relative shrink-0">
            <BoardView board={visibleBoard} />
            {#if game.lost}
                <div
                    class="absolute inset-0 flex items-center justify-center bg-black/70 text-2xl font-bold"
                >
                    Game over
                </div>
            {/if}
        </div>
        {#if opponents.length > 0}
            <aside class="flex max-w-full flex-wrap justify-center gap-3" aria-label="Opponents">
                {#each opponents as opponent (opponent.name)}
                    <section class="rounded border border-zinc-700 bg-zinc-900 p-3">
                        <h2 class="mb-2 max-w-40 truncate text-sm font-semibold">{opponent.name}</h2>
                        <div
                            class="grid h-40 w-40 grid-cols-10 gap-1"
                            role="img"
                            aria-label={`${opponent.name} spectrum`}
                        >
                            {#each opponent.spectrum as height, index (index)}
                                <div class="flex h-full items-end bg-zinc-950" aria-hidden="true">
                                    <div
                                        class="w-full bg-red-500"
                                        style={`height: ${(height / 20) * 100}%`}
                                    ></div>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/each}
            </aside>
        {/if}
    </div>

    <p class="text-sm text-zinc-400">
        ← → move · ↑ rotate · ↓ soft drop · Space hard drop
    </p>
</main>
{/if}
