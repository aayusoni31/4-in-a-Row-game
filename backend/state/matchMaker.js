import { BOT_WAIT_TIME, PLAYER_1, PLAYER_2 } from "../utils/constants.js";
import { createInitialBoard } from "../logic/gameLogic.js";

let waitingPlayer = null;
let botTimer = null;

export const handleJoinQueue = (socket, username, io, activeGames) => {
  // If someone is already waiting, pair them up
  if (waitingPlayer && waitingPlayer.id !== socket.id) {
    clearTimeout(botTimer);
    const gameId = `game_${waitingPlayer.id}_${socket.id}`;

    const gameState = {
      gameId,
      players: [
        {
          id: waitingPlayer.id,
          name: waitingPlayer.username,
          symbol: PLAYER_1,
        },
        { id: socket.id, name: username, symbol: PLAYER_2 },
      ],
      board: createInitialBoard(),
      turn: PLAYER_1,
      status: "playing",
    };

    activeGames.set(gameId, gameState);
    waitingPlayer.socket.join(gameId);
    socket.join(gameId);

    io.to(gameId).emit("game_started", gameState);
    waitingPlayer = null;
  } else {
    // No one waiting, set the timer for the Bot
    waitingPlayer = { id: socket.id, username, socket };
    socket.emit("waiting_for_opponent");

    botTimer = setTimeout(() => {
      if (waitingPlayer && waitingPlayer.id === socket.id) {
        const gameId = `bot_${socket.id}`;
        const botGameState = {
          gameId,
          players: [
            { id: socket.id, name: username, symbol: PLAYER_1 },
            { id: "bot", name: "SmartBot", symbol: PLAYER_2, isBot: true },
          ],
          board: createInitialBoard(),
          turn: PLAYER_1,
          status: "playing",
        };
        activeGames.set(gameId, botGameState);
        socket.join(gameId);
        io.to(gameId).emit("game_started", botGameState);
        waitingPlayer = null;
      }
    }, BOT_WAIT_TIME);
  }
};
