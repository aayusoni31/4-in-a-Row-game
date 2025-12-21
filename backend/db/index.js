import pkg from "pg";
const { Pool } = pkg;
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool;
const isPostgres = !!process.env.DATABASE_URL;

if (isPostgres) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "four_in_a_row",
  });
}

// THIS IS THE FIX: We ensure the table exists every time the server starts
const initDB = async () => {
  const query = isPostgres
    ? `CREATE TABLE IF NOT EXISTS players (id SERIAL PRIMARY KEY, username VARCHAR(255) UNIQUE NOT NULL, wins INT DEFAULT 0);`
    : `CREATE TABLE IF NOT EXISTS players (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) UNIQUE NOT NULL, wins INT DEFAULT 0);`;

  try {
    isPostgres ? await pool.query(query) : await pool.execute(query);
    console.log(" Database Table Verified/Created");
  } catch (err) {
    console.error(" DB Init Error:", err);
  }
};
initDB();

export const incrementWin = async (username) => {
  console.log(`Attempting to save win for: ${username}`); // LOG THIS
  try {
    if (isPostgres) {
      const query = `INSERT INTO players (username, wins) VALUES ($1, 1) ON CONFLICT (username) DO UPDATE SET wins = players.wins + 1`;
      await pool.query(query, [username]);
    } else {
      const query = `INSERT INTO players (username, wins) VALUES (?, 1) ON DUPLICATE KEY UPDATE wins = wins + 1`;
      await pool.execute(query, [username]);
    }
    console.log(` Win successfully saved for ${username}`);
  } catch (err) {
    console.error(" DB Win Update Error:", err);
  }
};

export const getTopPlayers = async () => {
  try {
    const rows = isPostgres
      ? (
          await pool.query(
            "SELECT username, wins FROM players ORDER BY wins DESC LIMIT 10"
          )
        ).rows
      : (
          await pool.execute(
            "SELECT username, wins FROM players ORDER BY wins DESC LIMIT 10"
          )
        )[0];
    return rows;
  } catch (err) {
    console.error(" Leaderboard Fetch Error:", err);
    return [];
  }
};

export default pool;
