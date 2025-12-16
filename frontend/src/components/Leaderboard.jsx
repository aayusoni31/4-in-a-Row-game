import React, { useEffect, useState } from "react";
import axios from "axios";

function Leaderboard() {
  const [topPlayers, setTopPlayers] = useState([]);

  useEffect(() => {
    // Define the function inside the effect
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/leaderboard"
        );
        setTopPlayers(response.data);
      } catch (error) {
        console.error("Error fetching leaderboard", error);
      }
    };

    // Use a small timeout or just call it directly; React usually allows this
    // if the function is defined within the scope of the effect.
    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this runs only once on mount

  return (
    <div className="leaderboard-container">
      <h3>🏆 Top Players</h3>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Wins</th>
          </tr>
        </thead>
        <tbody>
          {topPlayers.map((player, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{player.username}</td>
              <td>{player.wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
