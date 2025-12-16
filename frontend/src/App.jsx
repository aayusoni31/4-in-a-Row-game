import React, { useState, useEffect } from "react";
import socket from "./services/socket";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Leaderboard from "./components/Leaderboard";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [gameState, setGameState] = useState(null); // Stores board, turn, etc.
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("fourInARowUser");
    if (savedUser) {
      // Automatically try to rejoin if the page refreshed
      socket.emit("join_game", { username: savedUser });
    }
    socket.on("waiting_for_opponent", () => {
      setIsWaiting(true);
    });

    socket.on("game_started", (data) => {
      setIsWaiting(false);
      setGameState(data);

      // Look for the user's name in the data sent from the backend instead of local state
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
      }));
      alert(`Game Over! Winner: ${data.winner}`);
    });

    return () => {
      socket.off("waiting_for_opponent");
      socket.off("game_started");
      socket.off("move_made");
      socket.off("game_over");
    };
  }, []);

  const handleJoin = (name) => {
    setUsername(name);
    socket.emit("join_game", { username: name });
  };

  return (
    <div className="App">
      {!gameState ? (
        <>
          <Lobby onJoin={handleJoin} isWaiting={isWaiting} />
          <Leaderboard /> {/* Showing leaderboard below the join button */}
        </>
      ) : (
        <Game gameState={gameState} socketId={socket.id} />
      )}
    </div>
  );
}

export default App;
