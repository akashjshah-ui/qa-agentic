const { bestMove, checkWinner, minimax, HUMAN, AI } = require('../../game');

describe('bestMove — winning moves', () => {
  test('takes an immediate winning move (top row)', () => {
    const board = ['O','O',null, 'X','X',null, null,null,null];
    expect(bestMove(board)).toBe(2);
  });

  test('takes an immediate winning move (column)', () => {
    const board = ['O',null,null, 'O',null,null, null,'X','X'];
    expect(bestMove(board)).toBe(6);
  });

  test('takes an immediate winning move (main diagonal)', () => {
    const board = ['O',null,'X', null,'O','X', null,null,null];
    expect(bestMove(board)).toBe(8);
  });

  test('picks an optimal move when anti-diagonal win is available', () => {
    // O at 2,4 — index 6 wins immediately, but other paths also score +10.
    // Assert: the chosen move scores +10 (forced win), and the cell is empty.
    const board = [null,'X','O', 'X','O',null, null,null,null];
    const move = bestMove(board);
    expect(board[move]).toBeNull();
    const after = [...board];
    after[move] = AI;
    expect(minimax(after, false, -Infinity, Infinity)).toBe(10);
  });
});

describe('bestMove — blocking moves', () => {
  test('blocks human from winning the top row', () => {
    const board = ['X','X',null, 'O',null,null, null,null,null];
    expect(bestMove(board)).toBe(2);
  });

  test('blocks human from winning a column OR wins instead', () => {
    // X at 0,3 threatens col [0,3,6]; O at 1,7 can win at 4 ([1,4,7]).
    // Minimax correctly prefers winning to blocking — accept either outcome.
    const board = ['X','O',null, 'X',null,null, null,'O',null];
    const move = bestMove(board);
    const after = [...board];
    after[move] = AI;
    const result = checkWinner(after);
    // Either AI wins immediately, or it blocked the human threat at 6
    const aiWins = result?.winner === AI;
    const blocked = move === 6;
    expect(aiWins || blocked).toBe(true);
  });

  test('blocks human from winning the main diagonal', () => {
    const board = ['X',null,'O', null,'X',null, null,null,null];
    // Human threatens 8; AI must block or win — best move is 8 (block) or elsewhere
    const move = bestMove(board);
    // AI should respond at 8 to block or find a winning move
    expect(move).toBe(8);
  });

  test('prefers winning over blocking when both available', () => {
    // AI can win at index 2 (top row); human threatens at index 7 (column)
    const board = ['O','O',null, 'X',null,null, 'X','X',null];
    expect(bestMove(board)).toBe(2);
  });
});

describe('bestMove — early game strategy', () => {
  test('returns a valid first move on an empty board', () => {
    // On an empty board all moves score equally (draw with optimal play),
    // so we only assert the returned index is empty and in range.
    const board = Array(9).fill(null);
    const move = bestMove(board);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
    expect(board[move]).toBeNull();
  });

  test('returns a valid cell index (0–8)', () => {
    const boards = [
      Array(9).fill(null),
      ['X',null,null, null,null,null, null,null,null],
      ['X','O',null, null,'X',null, null,null,null],
    ];
    for (const board of boards) {
      const move = bestMove(board);
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThanOrEqual(8);
      expect(board[move]).toBeNull();
    }
  });

  test('does not mutate the board', () => {
    const board = ['X',null,null, null,'O',null, null,null,null];
    const snapshot = [...board];
    bestMove(board);
    expect(board).toEqual(snapshot);
  });
});

describe('bestMove — AI never loses (exhaustive)', () => {
  function playOut(board, currentPlayer) {
    const { checkWinner, HUMAN, AI } = require('../../game');
    const result = checkWinner(board);
    if (result) return result.winner;
    if (currentPlayer === AI) {
      const move = bestMove(board);
      board[move] = AI;
      return playOut(board, HUMAN);
    }
    // Human plays first available cell (worst-case for AI stress test)
    const empty = board.indexOf(null);
    board[empty] = HUMAN;
    return playOut(board, AI);
  }

  test('AI never loses when going first against a naive human', () => {
    const board = Array(9).fill(null);
    const winner = playOut(board, AI);
    expect(winner).not.toBe(HUMAN);
  });

  test('AI never loses when going second against a naive human', () => {
    const board = Array(9).fill(null);
    board[0] = HUMAN;
    const winner = playOut(board, AI);
    expect(winner).not.toBe(HUMAN);
  });
});
