import { ROWS, COLS, EMPTY, PLAYER_1, PLAYER_2 } from "../utils/constants.js";
import { getLowestEmptyRow, checkWin } from "./gameLogic.js";

export const getBestMove = (board) => {
  // 1. Can the Bot win in one move?
  for (let c = 0; c < COLS; c++) {
    const r = getLowestEmptyRow(board, c);
    if (r !== -1) {
      board[r][c] = PLAYER_2;
      if (checkWin(board, r, c, PLAYER_2)) {
        board[r][c] = EMPTY;
        return c;
      }
      board[r][c] = EMPTY;
    }
  }

  // 2. Must the Bot block the player from winning?
  for (let c = 0; c < COLS; c++) {
    const r = getLowestEmptyRow(board, c);
    if (r !== -1) {
      board[r][c] = PLAYER_1;
      if (checkWin(board, r, c, PLAYER_1)) {
        board[r][c] = EMPTY;
        return c;
      }
      board[r][c] = EMPTY;
    }
  }

  // 3. Fallback: Pick the center-most available column
  const centerPreference = [3, 2, 4, 1, 5, 0, 6];
  for (let c of centerPreference) {
    if (getLowestEmptyRow(board, c) !== -1) return c;
  }
  return -1;
};
