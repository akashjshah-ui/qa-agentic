const { minimax, checkWinner, HUMAN, AI } = require('../../game');

function clone(b) { return [...b]; }

describe('minimax — terminal state scores', () => {
  test('returns +10 when AI has already won', () => {
    // AI owns top row
    const board = ['O','O','O', 'X','X',null, null,null,null];
    expect(minimax(board, false, -Infinity, Infinity)).toBe(10);
  });

  test('returns -10 when human has already won', () => {
    const board = ['X','X','X', 'O','O',null, null,null,null];
    expect(minimax(board, true, -Infinity, Infinity)).toBe(-10);
  });

  test('returns 0 for a draw board', () => {
    // X O X / X X O / O X O — no winner, full board
    const board = 'XOXXXOOXO'.split('').map(c => c);
    expect(minimax(board, true, -Infinity, Infinity)).toBe(0);
  });
});

describe('minimax — one move away positions', () => {
  test('AI picks the winning move (returns +10 from maximising=true)', () => {
    // O needs index 2 to win top row
    const board = ['O','O',null, 'X','X',null, null,null,null];
    // Maximising = true means AI is about to move
    const score = minimax(board, true, -Infinity, Infinity);
    expect(score).toBe(10);
  });

  test('human one move away: minimax returns -10 from human perspective (minimising)', () => {
    // X needs index 2 to win
    const board = ['X','X',null, 'O','O',null, null,null,null];
    // From AI's perspective (maximising) the score should be -10 because
    // the human (minimising) will pick index 2 on the next move
    // We call with isMaximising=false (human's turn conceptually is minimising)
    const score = minimax(board, false, -Infinity, Infinity);
    expect(score).toBe(-10);
  });

  test('does not mutate the board passed to it', () => {
    const board = ['O','O',null, 'X','X',null, null,null,null];
    const snapshot = clone(board);
    minimax(board, true, -Infinity, Infinity);
    expect(board).toEqual(snapshot);
  });
});

describe('minimax — deeper search correctness', () => {
  test('prefers winning in fewer moves (fork position)', () => {
    // O can win immediately at index 6 (diagonal 2,4,6)
    // but also has other moves; score must still be +10
    const board = [null,'X','O', 'X','O',null, null,null,'X'];
    const score = minimax(board, true, -Infinity, Infinity);
    expect(score).toBe(10);
  });

  test('returns 0 for a near-draw position where both play optimally', () => {
    // Board where the game cannot be won by either side with optimal play
    // X O X / _ X O / O _ X — human has forced a draw situation
    const board = ['X','O','X', null,'X','O', 'O',null,'X'];
    // With optimal play from both sides the result should be determined
    // (here X has won diagonally — let's use a proper near-draw)
    // X _ O / _ X _ / O _ X — X wins diagonal, so rechoose
    const nearDraw = [null,'O','X', 'O','X',null, 'X','O',null];
    // X wins anti-diagonal here, score will be -10 from minimising player
    // Use a truly balanced board instead
    const balanced = ['X','O','X', 'X','O','O', 'O','X',null];
    const score2 = minimax(balanced, true, -Infinity, Infinity);
    // Last cell doesn't create any win → draw → 0
    expect(score2).toBe(0);
  });
});
