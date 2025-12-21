import React, { useState, useEffect } from "react";
import socket from "./services/socket"; // Ensure this file uses VITE_SOCKET_URL!
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Leaderboard from "./components/Leaderboard";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("fourInARowUser");
    if (savedUser && !gameState) {
      socket.emit("join_game", { username: savedUser });
    }

    socket.on("waiting_for_opponent", () => {
      setIsWaiting(true);
    });

    socket.on("game_started", (data) => {
      setIsWaiting(false);
      setGameState(data);
      const myName = data.players.find((p) => p.id === socket.id)?.name;
      if (myName) {
        localStorage.setItem("fourInARowUser", myName);
      }
    });

    socket.on("move_made", (data) => {
      setGameState((prev) => ({
        ...prev,
        board: data.board,
        turn: data.nextTurn,
      }));
    });

    socket.on("game_over", (data) => {
      setGameState((prev) => ({
        ...prev,
        board: data.board,
        status: "finished",
        winner: data.winner,
      }));
    });

    // Real-time leaderboard updates
    socket.on("update_leaderboard", (data) => {
      setLeaderboard(data);
    });

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
    window.location.reload();
  };

  return (
    <div className="App">
      {!gameState ? (
        <div className="lobby-wrapper">
          <Lobby onJoin={handleJoin} isWaiting={isWaiting} />
          {/* Now we pass the real-time leaderboard data here */}
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
