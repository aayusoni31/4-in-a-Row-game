import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// We create a "pool" which is basically a set of open connections
// so we don't have to connect/disconnect every time we save a win.
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "four_in_a_row",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// This updates the score.
// "ON DUPLICATE KEY UPDATE" is awesome because it creates the user
// if they are new, or just adds +1 win if they already exist.
export const incrementWin = async (username) => {
  try {
    const query = `
      INSERT INTO players (username, wins) 
      VALUES (?, 1) 
      ON DUPLICATE KEY UPDATE wins = wins + 1
    `;
    await pool.execute(query, [username]);
    console.log(`Win recorded in MySQL for ${username}`);
  } catch (err) {
    console.error("MySQL Win Update Error:", err);
  }
};

// This just grabs the top 10 players to show on the lobby screen.
export const getTopPlayers = async () => {
  try {
    const [rows] = await pool.execute(
      "SELECT username, wins FROM players ORDER BY wins DESC LIMIT 10"
    );
    return rows;
  } catch (err) {
    console.error("MySQL Fetch Error:", err);
    return [];
  }
};

export default pool;
