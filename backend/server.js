import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectKafka, sendAnalytics } from "./services/kafkaService.js";
connectKafka();

// Import Custom Logic & Helpers
import { incrementWin } from "./db/index.js";
import leaderboardRoute from "./routes/leaderboard.js";
import {
  createInitialBoard,
  getLowestEmptyRow,
  checkWin,
  isBoardFull,
} from "./logic/gameLogic.js";
import { handleJoinQueue } from "./state/matchMaker.js";
import { getBestMove } from "./logic/botLogic.js";
import { PLAYER_1, PLAYER_2 } from "./utils/constants.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite frontend
    methods: ["GET", "POST"],
  },
});

// Global state for active games
const activeGames = new Map();

// --- HELPER FUNCTION: PROCESS MOVE ---
// This handles logic for both Humans and Bots
const processMove = async (gameId, col, playerId) => {
  const game = activeGames.get(gameId);
  if (!game || game.status !== "playing") return;

  const currentPlayer = game.players.find((p) => p.id === playerId);
  if (!currentPlayer || currentPlayer.symbol !== game.turn) return;

  const row = getLowestEmptyRow(game.board, col);
  if (row === -1) return; // Column full

  // Update board state
  game.board[row][col] = currentPlayer.symbol;
  // Send event to Kafka
  sendAnalytics("MOVE_MADE", {
    gameId,
    player: currentPlayer.name,
    column: col,
  });
  if (checkWin(game.board, row, col, currentPlayer.symbol)) {
    game.status = "finished";
    const winnerName = currentPlayer.name;
    sendAnalytics("GAME_FINISHED", { gameId, winner: winnerName });
    // Save to DB if winner is not the bot
    if (!currentPlayer.isBot) {
      await incrementWin(winnerName);
    }

    io.to(gameId).emit("game_over", {
      board: game.board,
      winner: winnerName,
    });
  } else if (isBoardFull(game.board)) {
    game.status = "finished";
    io.to(gameId).emit("game_over", { board: game.board, winner: "draw" });
  } else {
    // Switch turn
    game.turn = game.turn === PLAYER_1 ? PLAYER_2 : PLAYER_1;
    io.to(gameId).emit("move_made", {
      board: game.board,
      nextTurn: game.turn,
    });

    // IF NEXT PLAYER IS A BOT, TRIGGER BOT MOVE
    const nextPlayer = game.players.find((p) => p.symbol === game.turn);
    if (nextPlayer && nextPlayer.isBot) {
      setTimeout(() => {
        const botCol = getBestMove(game.board);
        processMove(gameId, botCol, nextPlayer.id);
      }, 800); // 800ms delay to feel natural
    }
  }
};

// --- SOCKET CONNECTION ---
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Use the Matchmaker to handle 10s queue and Bot fallback
  socket.on("join_game", ({ username }) => {
    // 1. Check if this user is already in an active game (Reconnection)
    let existingGameId = null;
    let existingGameState = null;

    for (const [gameId, game] of activeGames.entries()) {
      const isPlayerInGame = game.players.find((p) => p.name === username);
      if (isPlayerInGame && game.status === "playing") {
        existingGameId = gameId;
        existingGameState = game;
        break;
      }
    }

    if (existingGameId) {
      console.log(`User ${username} reconnected to game ${existingGameId}`);

      // Update the player's socket ID in the game state to the new connection
      const playerIndex = existingGameState.players.findIndex(
        (p) => p.name === username
      );
      existingGameState.players[playerIndex].id = socket.id;

      socket.join(existingGameId);
      socket.emit("game_started", existingGameState); // Send them the current board
      return; // Stop here, don't put them in the queue
    }

    // 2. If not an existing player, proceed to normal matchmaking
    handleJoinQueue(socket, username, io, activeGames);
  });

  socket.on("make_move", ({ gameId, col }) => {
    processMove(gameId, col, socket.id);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Find if the disconnected socket was in a game
    for (const [gameId, game] of activeGames.entries()) {
      const player = game.players.find((p) => p.id === socket.id);

      if (player && game.status === "playing") {
        // Start a 30s timer
        setTimeout(() => {
          const latestGameStatus = activeGames.get(gameId);
          // Check if the player is still "gone" (socket ID hasn't been updated)
          const currentPlayer = latestGameStatus?.players.find(
            (p) => p.name === player.name
          );

          if (
            currentPlayer &&
            currentPlayer.id === socket.id &&
            latestGameStatus.status === "playing"
          ) {
            latestGameStatus.status = "finished";
            const opponent = latestGameStatus.players.find(
              (p) => p.name !== player.name
            );

            io.to(gameId).emit("game_over", {
              board: latestGameStatus.board,
              winner: opponent ? opponent.name : "Opponent (Forfeit)",
            });

            activeGames.delete(gameId);
          }
        }, 30000); // 30 seconds
      }
    }
  });
  socket.on("play_again", ({ gameId }) => {
    const game = activeGames.get(gameId);
    if (game) {
      game.board = createInitialBoard(); // Reset board
      game.status = "playing";
      game.turn = PLAYER_1; // Player 1 starts again
      io.to(gameId).emit("game_started", game); // Notify both players
    }
  });
});

// REST API Routes
app.use("/api/leaderboard", leaderboardRoute);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
