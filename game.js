const HUMAN = 'X';
const AI    = 'O';
const MOVE_TIME = 15;

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (board.every(v => v !== null)) return { winner: 'draw', line: [] };
  return null;
}

function minimax(board, isMaximising, alpha, beta) {
  const result = checkWinner(board);
  if (result) {
    if (result.winner === AI)    return  10;
    if (result.winner === HUMAN) return -10;
    return 0;
  }

  if (isMaximising) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = AI;
        best = Math.max(best, minimax(board, false, alpha, beta));
        board[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = HUMAN;
        best = Math.min(best, minimax(board, true, alpha, beta));
        board[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

function bestMove(board) {
  let best = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = AI;
      const score = minimax(board, false, -Infinity, Infinity);
      board[i] = null;
      if (score > best) { best = score; move = i; }
    }
  }
  return move;
}

function emptyBoard() {
  return Array(9).fill(null);
}

function applyMove(board, index, player) {
  if (board[index] !== null) throw new Error(`Cell ${index} is already occupied`);
  const next = [...board];
  next[index] = player;
  return next;
}

function getEmptyCells(board) {
  return board.map((v, i) => (v === null ? i : null)).filter(i => i !== null);
}

if (typeof module !== 'undefined') {
  module.exports = {
    HUMAN, AI, MOVE_TIME, WIN_LINES,
    checkWinner, minimax, bestMove,
    emptyBoard, applyMove, getEmptyCells,
  };
}
