const { checkWinner, HUMAN, AI } = require('../../game');

// helper: build a board from a string like 'XOX OXO X ' (space = null)
function b(str) {
  return str.split('').map(c => (c === ' ' ? null : c));
}

describe('checkWinner — no result cases', () => {
  test('empty board returns null', () => {
    expect(checkWinner(Array(9).fill(null))).toBeNull();
  });

  test('partially filled board with no winner returns null', () => {
    expect(checkWinner(b('XO       '))).toBeNull();
  });

  test('four X and four O with no winner returns null', () => {
    expect(checkWinner(b('XOXO XO  '))).toBeNull();
  });
});

describe('checkWinner — draw', () => {
  test('full board with no winner returns draw', () => {
    // X O X
    // X X O
    // O X O  — no three in a row
    const board = b('XOXXXOOXO');
    const result = checkWinner(board);
    expect(result).not.toBeNull();
    expect(result.winner).toBe('draw');
    expect(result.line).toEqual([]);
  });
});

describe('checkWinner — row wins', () => {
  test('X wins top row (0,1,2)', () => {
    const result = checkWinner(b('XXX OO   '));
    expect(result.winner).toBe(HUMAN);
    expect(result.line).toEqual([0, 1, 2]);
  });

  test('O wins middle row (3,4,5)', () => {
    const result = checkWinner(b('XX OOO X '));
    expect(result.winner).toBe(AI);
    expect(result.line).toEqual([3, 4, 5]);
  });

  test('X wins bottom row (6,7,8)', () => {
    const result = checkWinner(b('OO  O XXX'));
    expect(result.winner).toBe(HUMAN);
    expect(result.line).toEqual([6, 7, 8]);
  });
});

describe('checkWinner — column wins', () => {
  test('X wins left column (0,3,6)', () => {
    const result = checkWinner(b('XO X  XOO'));
    expect(result.winner).toBe(HUMAN);
    expect(result.line).toEqual([0, 3, 6]);
  });

  test('O wins middle column (1,4,7)', () => {
    const result = checkWinner(b('XOX XOOXO'));
    // board: X O X / _ X O / O X O — col 1 = O,X,X no; retry with proper board
    const board = [null,'O',null, null,'O',null, 'X','O','X'];
    const r = checkWinner(board);
    expect(r.winner).toBe(AI);
    expect(r.line).toEqual([1, 4, 7]);
  });

  test('X wins right column (2,5,8)', () => {
    const board = ['O','O','X', null,null,'X', null,null,'X'];
    const result = checkWinner(board);
    expect(result.winner).toBe(HUMAN);
    expect(result.line).toEqual([2, 5, 8]);
  });
});

describe('checkWinner — diagonal wins', () => {
  test('X wins main diagonal (0,4,8)', () => {
    const board = ['X','O',null, 'O','X',null, null,null,'X'];
    const result = checkWinner(board);
    expect(result.winner).toBe(HUMAN);
    expect(result.line).toEqual([0, 4, 8]);
  });

  test('O wins anti-diagonal (2,4,6)', () => {
    const board = [null,'X','O', 'X','O',null, 'O',null,null];
    const result = checkWinner(board);
    expect(result.winner).toBe(AI);
    expect(result.line).toEqual([2, 4, 6]);
  });
});

describe('checkWinner — edge cases', () => {
  test('returns the first matching win line found', () => {
    // Top row and left column both satisfied — should return the first line matched
    const board = ['X','X','X', 'X',null,null, 'X',null,null];
    const result = checkWinner(board);
    expect(result).not.toBeNull();
    expect(result.winner).toBe(HUMAN);
    expect([[0,1,2],[0,3,6]]).toContainEqual(result.line);
  });

  test('single cell filled board with no winner returns null', () => {
    const board = Array(9).fill(null);
    board[4] = HUMAN;
    expect(checkWinner(board)).toBeNull();
  });
});
