import React, { useState, useEffect } from "react";
import socket from "./services/socket";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Leaderboard from "./components/Leaderboard";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  // This is the new state to hold our top players list
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // If you refresh the page, this check sees if your name is in the "browser memory"
    // and tries to throw you back into your active game automatically.
    const savedUser = localStorage.getItem("fourInARowUser");
    if (savedUser && !gameState) {
      socket.emit("join_game", { username: savedUser });
    }

    // This triggers when you're in the queue but no one else has joined yet.
    socket.on("waiting_for_opponent", () => {
      setIsWaiting(true);
    });

    // When a match is found (or a bot is spawned), we get the game data here.
    socket.on("game_started", (data) => {
      setIsWaiting(false);
      setGameState(data);

      // We save your name so if you accidentally refresh, we know who you are.
      const myName = data.players.find((p) => p.id === socket.id)?.name;
      if (myName) {
        localStorage.setItem("fourInARowUser", myName);
      }
    });

    // Every time someone drops a piece, the server tells us the new board state.
    socket.on("move_made", (data) => {
      setGameState((prev) => ({
        ...prev,
        board: data.board,
        turn: data.nextTurn,
      }));
    });

    // When someone wins or the board is full, the server sends the final result.
    socket.on("game_over", (data) => {
      setGameState((prev) => ({
        ...prev,
        board: data.board,
        status: "finished",
        winner: data.winner,
      }));
    });

    // THIS IS THE FIX: The server screams "Hey, the leaderboard changed!"
    // and we catch that data here to update our UI list.
    socket.on("update_leaderboard", (data) => {
      console.log("Leaderboard updated via socket!");
      setLeaderboard(data);
    });

    // Good practice: Stop listening to these events if the component closes.
    return () => {
      socket.off("waiting_for_opponent");
      socket.off("game_started");
      socket.off("move_made");
      socket.off("game_over");
      socket.off("update_leaderboard");
    };
  }, [gameState]);

  const handleJoin = (name) => {
    if (!name.trim()) return alert("Please enter a username");
    socket.emit("join_game", { username: name });
  };

  const handleQuit = () => {
    localStorage.removeItem("fourInARowUser");
    setGameState(null);
    setIsWaiting(false);
    window.location.reload(); // Hard refresh to make sure everything is clean
  };

  return (
    <div className="App">
      {!gameState ? (
        <div className="lobby-wrapper">
          <Lobby onJoin={handleJoin} isWaiting={isWaiting} />
          {/* We pass the leaderboard state down to the component to show it */}
          <Leaderboard data={leaderboard} />
        </div>
      ) : (
        <div className="game-wrapper">
          <Game gameState={gameState} socketId={socket.id} />

          {gameState.status === "finished" && (
            <button onClick={handleQuit} className="exit-btn">
              Exit to Lobby
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
