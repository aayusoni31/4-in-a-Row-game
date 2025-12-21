import React, { useEffect, useState } from "react";
import axios from "axios";

function Leaderboard() {
  const [topPlayers, setTopPlayers] = useState([]);

  // Use the Environment Variable from Vercel, or fallback to localhost for your own testing
  const API_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Updated to use the dynamic API_URL
        const response = await axios.get(`${API_URL}/api/leaderboard`);
        setTopPlayers(response.data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchLeaderboard();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [API_URL]); // Added API_URL to dependency array

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
          {topPlayers.length > 0 ? (
            topPlayers.map((player, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{player.username}</td>
                <td>{player.wins}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
