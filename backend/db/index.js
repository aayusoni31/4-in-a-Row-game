import pkg from "pg";
const { Pool } = pkg;
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool;
const isPostgres = !!process.env.DATABASE_URL;

if (isPostgres) {
  // --- CONNECT TO POSTGRES (RENDER) ---
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log(" Database: Using PostgreSQL (Production)");
} else {
  // --- CONNECT TO MYSQL (LOCAL) ---
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "four_in_a_row",
  });
  console.log(" Database: Using MySQL (Local)");
}

// --- UNIVERSAL AUTO-TABLE-CREATOR ---
const initDB = async () => {
  try {
    const query = isPostgres
      ? `CREATE TABLE IF NOT EXISTS players (id SERIAL PRIMARY KEY, username VARCHAR(255) UNIQUE NOT NULL, wins INT DEFAULT 0);`
      : `CREATE TABLE IF NOT EXISTS players (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) UNIQUE NOT NULL, wins INT DEFAULT 0);`;

    isPostgres ? await pool.query(query) : await pool.execute(query);
    console.log("Database Table is ready.");
  } catch (err) {
    console.error(" DB Init Error:", err);
  }
};
initDB();

export const incrementWin = async (username) => {
  try {
    if (isPostgres) {
      const query = `INSERT INTO players (username, wins) VALUES ($1, 1) ON CONFLICT (username) DO UPDATE SET wins = players.wins + 1`;
      await pool.query(query, [username]);
    } else {
      const query = `INSERT INTO players (username, wins) VALUES (?, 1) ON DUPLICATE KEY UPDATE wins = wins + 1`;
      await pool.execute(query, [username]);
    }
  } catch (err) {
    console.error("DB Win Update Error:", err);
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
    return [];
  }
};

export default pool;
