import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", // Add your MySQL password here
  database: process.env.DB_NAME || "four_in_a_row",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper function to update wins
export const incrementWin = async (username) => {
  try {
    // This query inserts the player if they don't exist, or increments wins if they do
    const query = `
            INSERT INTO players (username, wins) 
            VALUES (?, 1) 
            ON DUPLICATE KEY UPDATE wins = wins + 1
        `;
    await pool.execute(query, [username]);
  } catch (err) {
    console.error("Database error updating wins:", err);
  }
};

// Helper function to get top players
export const getTopPlayers = async () => {
  try {
    const [rows] = await pool.execute(
      "SELECT username, wins FROM players ORDER BY wins DESC LIMIT 10"
    );
    return rows;
  } catch (err) {
    console.error("Database error fetching leaderboard:", err);
    return [];
  }
};

export default pool;
