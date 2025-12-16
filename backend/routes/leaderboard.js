import express from "express";
import { getTopPlayers } from "../db/index.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const players = await getTopPlayers();
  res.json(players);
});

export default router;
