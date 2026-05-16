const { emptyBoard, applyMove, getEmptyCells, HUMAN, AI } = require('../../game');

describe('emptyBoard', () => {
  test('returns an array of 9 nulls', () => {
    const board = emptyBoard();
    expect(board).toHaveLength(9);
    expect(board.every(v => v === null)).toBe(true);
  });

  test('returns a fresh array each call (no shared reference)', () => {
    const a = emptyBoard();
    const b = emptyBoard();
    a[0] = HUMAN;
    expect(b[0]).toBeNull();
  });
});

describe('applyMove', () => {
  test('places the player token at the given index', () => {
    const board = emptyBoard();
    const next = applyMove(board, 4, HUMAN);
    expect(next[4]).toBe(HUMAN);
  });

  test('returns a new array (immutable operation)', () => {
    const board = emptyBoard();
    const next = applyMove(board, 0, AI);
    expect(next).not.toBe(board);
    expect(board[0]).toBeNull();
  });

  test('throws when the cell is already occupied', () => {
    const board = emptyBoard();
    board[3] = AI;
    expect(() => applyMove(board, 3, HUMAN)).toThrow();
  });

  test('places HUMAN token correctly', () => {
    const board = emptyBoard();
    expect(applyMove(board, 0, HUMAN)[0]).toBe(HUMAN);
  });

  test('places AI token correctly', () => {
    const board = emptyBoard();
    expect(applyMove(board, 8, AI)[8]).toBe(AI);
  });
});

describe('getEmptyCells', () => {
  test('returns all indices on an empty board', () => {
    expect(getEmptyCells(emptyBoard())).toEqual([0,1,2,3,4,5,6,7,8]);
  });

  test('returns no indices on a full board', () => {
    const board = 'XOXXXOOXO'.split('');
    expect(getEmptyCells(board)).toEqual([]);
  });

  test('returns only the empty cell indices', () => {
    const board = ['X', null, 'O', null, 'X', null, 'O', null, 'X'];
    expect(getEmptyCells(board)).toEqual([1, 3, 5, 7]);
  });

  test('does not mutate the board', () => {
    const board = emptyBoard();
    const snapshot = [...board];
    getEmptyCells(board);
    expect(board).toEqual(snapshot);
  });
});
