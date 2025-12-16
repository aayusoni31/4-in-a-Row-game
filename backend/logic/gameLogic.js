import { ROWS, COLS, EMPTY } from "../utils/constants.js";

// 1. Initialize an empty 6x7 grid
export const createInitialBoard = () => {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(EMPTY));
};

// 2. Find the lowest empty row in a column to "drop" the piece
export const getLowestEmptyRow = (board, col) => {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) return r;
  }
  return -1; // Column is full
};

// 3. Check if the last move won the game
export const checkWin = (board, row, col, player) => {
  const directions = [
    { r: 0, c: 1 }, // Horizontal
    { r: 1, c: 0 }, // Vertical
    { r: 1, c: 1 }, // Diagonal (top-left to bottom-right)
    { r: 1, c: -1 }, // Diagonal (top-right to bottom-left)
  ];

  for (let { r: dr, c: dc } of directions) {
    let count = 1;

    // Check in one direction
    let i = 1;
    while (
      row + i * dr >= 0 &&
      row + i * dr < ROWS &&
      col + i * dc >= 0 &&
      col + i * dc < COLS &&
      board[row + i * dr][col + i * dc] === player
    ) {
      count++;
      i++;
    }

    // Check in the opposite direction
    i = 1;
    while (
      row - i * dr >= 0 &&
      row - i * dr < ROWS &&
      col - i * dc >= 0 &&
      col - i * dc < COLS &&
      board[row - i * dr][col - i * dc] === player
    ) {
      count++;
      i++;
    }

    if (count >= 4) return true;
  }
  return false;
};

// 4. Check if the board is full (Draw)
export const isBoardFull = (board) => {
  return board[0].every((cell) => cell !== EMPTY);
};
