import React from "react";
import socket from "../services/socket";

function Game({ gameState, socketId }) {
  const { board, turn, players, gameId, status } = gameState;

  // Find player details
  const myData = players.find((p) => p.id === socketId);
  const opponentData = players.find((p) => p.id !== socketId);

  const isMyTurn = myData?.symbol === turn;

  const dropDisc = (col) => {
    if (!isMyTurn || status === "finished") return;
    socket.emit("make_move", { gameId, col });
  };

  return (
    <div className="game-container">
      {/* 1. Header Section: Shows Turn or Game Over Status */}
      <div className="game-header">
        <h2>
          {status === "finished"
            ? `🎉 Game Over! Winner: ${gameState.winner}`
            : isMyTurn
            ? "🟢 Your Turn (X)"
            : `⏳ ${opponentData?.name}'s Turn (O)`}
        </h2>
      </div>

      {/* 2. Board Section: The 7x6 Grid */}
      <div className="board">
        {board.map((row, rIdx) => (
          <div key={rIdx} className="row">
            {row.map((cell, cIdx) => (
              <div
                key={cIdx}
                className={`cell player-${cell}`}
                onClick={() => dropDisc(cIdx)}
              >
                {cell === 1 ? "X" : cell === 2 ? "O" : ""}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 3. Info Section: Shows who is X and who is O */}
      <div className="game-info" style={{ marginTop: "20px" }}>
        <p style={{ color: "#333", fontSize: "1.1rem" }}>
          <span style={{ color: "#dc0e0e", fontWeight: "bold" }}>X</span>:{" "}
          <span style={{ fontWeight: "500" }}>
            {myData?.symbol === 1 ? "You" : opponentData?.name}
          </span>
          {" | "}
          <span style={{ color: "#060771", fontWeight: "bold" }}>O</span>:{" "}
          <span style={{ fontWeight: "500" }}>
            {myData?.symbol === 2 ? "You" : opponentData?.name}
          </span>
        </p>

        {/* 4. Action Section: Play Again button appears only when game ends */}
        {status === "finished" && (
          <button
            onClick={() => socket.emit("play_again", { gameId })}
            style={{
              marginTop: "20px",
              background: "#2ecc71",
              color: "white",
              padding: "10px 25px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}

export default Game;
