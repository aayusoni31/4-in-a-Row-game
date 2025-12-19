import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

// Import Kafka service
import { connectKafka, sendAnalytics } from "./services/kafkaService.js";

// Import Database and Logic helpers
import { incrementWin, getTopPlayers } from "./db/index.js";
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

// 1. Initialize environment variables and Kafka
dotenv.config();
connectKafka();

// 2. Setup Express and HTTP Server
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// 3. Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// 4. Global state for games
const activeGames = new Map();

// --- THE LEADERBOARD UPDATER ---
// This grabs the top 10 players from MySQL and pushes them to all connected users
const broadcastLeaderboard = async () => {
  try {
    const topPlayers = await getTopPlayers();
    io.emit("update_leaderboard", topPlayers);
    console.log(" Fresh leaderboard sent to all clients!");
  } catch (err) {
    console.error(" Failed to broadcast leaderboard:", err);
  }
};

// --- THE CORE GAME ENGINE ---
const processMove = async (gameId, col, playerId) => {
  const game = activeGames.get(gameId);
  if (!game || game.status !== "playing") return;

  const currentPlayer = game.players.find((p) => p.id === playerId);
  if (!currentPlayer || currentPlayer.symbol !== game.turn) return;

  const row = getLowestEmptyRow(game.board, col);
  if (row === -1) return; // Column is full

  // Update board
  game.board[row][col] = currentPlayer.symbol;

  // Log move to Kafka
  sendAnalytics("MOVE_MADE", {
    gameId,
    player: currentPlayer.name,
    column: col,
  });

  // Check for a winner
  if (checkWin(game.board, row, col, currentPlayer.symbol)) {
    game.status = "finished";
    const winnerName = currentPlayer.name;

    sendAnalytics("GAME_FINISHED", { gameId, winner: winnerName });

    // If a human won, update MySQL and refresh the leaderboard UI
    if (!currentPlayer.isBot) {
      await incrementWin(winnerName);
      await broadcastLeaderboard();
    }

    io.to(gameId).emit("game_over", {
      board: game.board,
      winner: winnerName,
    });
  } else if (isBoardFull(game.board)) {
    // Check for a draw
    game.status = "finished";
    io.to(gameId).emit("game_over", { board: game.board, winner: "draw" });
  } else {
    // Switch turns
    game.turn = game.turn === PLAYER_1 ? PLAYER_2 : PLAYER_1;
    io.to(gameId).emit("move_made", {
      board: game.board,
      nextTurn: game.turn,
    });

    // Handle Bot's turn if applicable
    const nextPlayer = game.players.find((p) => p.symbol === game.turn);
    if (nextPlayer && nextPlayer.isBot) {
      setTimeout(() => {
        const botCol = getBestMove(game.board);
        processMove(gameId, botCol, nextPlayer.id);
      }, 800);
    }
  }
};

// --- SOCKET EVENT HANDLERS ---
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_game", ({ username }) => {
    // Handle Reconnection Logic
    for (const [gameId, game] of activeGames.entries()) {
      const isPlayerInGame = game.players.find((p) => p.name === username);
      if (isPlayerInGame && game.status === "playing") {
        game.players.find((p) => p.name === username).id = socket.id;
        socket.join(gameId);
        socket.emit("game_started", game);
        return;
      }
    }
    // New Player Matchmaking
    handleJoinQueue(socket, username, io, activeGames);
  });

  socket.on("make_move", ({ gameId, col }) => {
    processMove(gameId, col, socket.id);
  });

  socket.on("play_again", ({ gameId }) => {
    const game = activeGames.get(gameId);
    if (game) {
      game.board = createInitialBoard();
      game.status = "playing";
      game.turn = PLAYER_1;
      io.to(gameId).emit("game_started", game);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// REST Routes
app.use("/api/leaderboard", leaderboardRoute);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(` Game Server running on http://localhost:${PORT}`);
});
