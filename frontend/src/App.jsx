// import React, { useState, useEffect } from "react";
// import socket from "./services/socket";
// import Lobby from "./pages/Lobby";
// import Game from "./pages/Game";
// import Leaderboard from "./components/Leaderboard";
// import "./App.css";

// function App() {
//   const [username, setUsername] = useState("");
//   const [gameState, setGameState] = useState(null); // Stores board, turn, etc.
//   const [isWaiting, setIsWaiting] = useState(false);

//   useEffect(() => {
//     const savedUser = localStorage.getItem("fourInARowUser");
//     if (savedUser) {
//       // Automatically try to rejoin if the page refreshed
//       socket.emit("join_game", { username: savedUser });
//     }
//     socket.on("waiting_for_opponent", () => {
//       setIsWaiting(true);
//     });

//     socket.on("game_started", (data) => {
//       setIsWaiting(false);
//       setGameState(data);

//       // Look for the user's name in the data sent from the backend instead of local state
//       const myName = data.players.find((p) => p.id === socket.id)?.name;
//       if (myName) {
//         localStorage.setItem("fourInARowUser", myName);
//       }
//     });

//     socket.on("move_made", (data) => {
//       setGameState((prev) => ({
//         ...prev,
//         board: data.board,
//         turn: data.nextTurn,
//       }));
//     });

//     socket.on("game_over", (data) => {
//       setGameState((prev) => ({
//         ...prev,
//         board: data.board,
//         status: "finished",
//       }));
//       alert(`Game Over! Winner: ${data.winner}`);
//     });

//     return () => {
//       socket.off("waiting_for_opponent");
//       socket.off("game_started");
//       socket.off("move_made");
//       socket.off("game_over");
//     };
//   }, []);

//   const handleJoin = (name) => {
//     setUsername(name);
//     socket.emit("join_game", { username: name });
//   };

//   return (
//     <div className="App">
//       {!gameState ? (
//         <>
//           <Lobby onJoin={handleJoin} isWaiting={isWaiting} />
//           <Leaderboard /> {/* Showing leaderboard below the join button */}
//         </>
//       ) : (
//         <Game gameState={gameState} socketId={socket.id} />
//       )}
//     </div>
//   );
// }

// export default App;
import React, { useState, useEffect } from "react";
import socket from "./services/socket";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Leaderboard from "./components/Leaderboard";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    // 1. Reconnection Logic: Check if we have a saved user session
    const savedUser = localStorage.getItem("fourInARowUser");
    if (savedUser && !gameState) {
      socket.emit("join_game", { username: savedUser });
    }

    // 2. Socket Listeners
    socket.on("waiting_for_opponent", () => {
      setIsWaiting(true);
    });

    socket.on("game_started", (data) => {
      setIsWaiting(false);
      setGameState(data);

      // Save user to localStorage for reconnection support
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

    // Cleanup listeners on unmount
    return () => {
      socket.off("waiting_for_opponent");
      socket.off("game_started");
      socket.off("move_made");
      socket.off("game_over");
    };
  }, [gameState]);

  const handleJoin = (name) => {
    if (!name.trim()) return alert("Please enter a username");
    socket.emit("join_game", { username: name });
  };

  // const handleQuit = () => {
  //   // This allows the user to go back to the lobby
  //   localStorage.removeItem("fourInARowUser");
  //   setGameState(null);
  //   setIsWaiting(false);
  //   // Optional: socket.emit("leave_game");
  // };
  const handleQuit = () => {
    localStorage.removeItem("fourInARowUser"); // Deletes the saved name
    setGameState(null); // Hides the game board
    setIsWaiting(false); // Resets waiting status
    window.location.reload(); // Refreshes to ensure a clean socket state
  };
  return (
    <div className="App">
      {!gameState ? (
        <div className="lobby-wrapper">
          <Lobby onJoin={handleJoin} isWaiting={isWaiting} />
          <Leaderboard />
        </div>
      ) : (
        <div className="game-wrapper">
          <Game gameState={gameState} socketId={socket.id} />

          {/* Back to Lobby button visible only when game is finished */}
          {gameState.status === "finished" && (
            <button
              onClick={handleQuit}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                background: "#666",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Exit to Lobby
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
