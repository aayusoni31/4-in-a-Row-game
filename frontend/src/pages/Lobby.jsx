import React, { useState } from "react";

function Lobby({ onJoin, isWaiting }) {
  const [name, setName] = useState("");

  return (
    <div className="lobby">
      <h1>4 In A Row</h1>
      {isWaiting ? (
        <p>Searching for opponent... (Bot will join in 10s)</p>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Enter Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={() => onJoin(name)}>Join Game</button>
        </div>
      )}
    </div>
  );
}

export default Lobby;
