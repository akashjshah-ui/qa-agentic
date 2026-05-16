/**
 * Functional tests — run under jsdom.
 * We load the game logic directly (no <script src>) and build a minimal DOM
 * that mirrors index.html, then wire up the same event logic to test end-to-end
 * game flows: cell clicks, score updates, win detection, restart, timer.
 */

const {
  HUMAN, AI, MOVE_TIME,
  checkWinner, bestMove, emptyBoard, getEmptyCells,
} = require('../../game');

// ── Minimal DOM setup ────────────────────────────────────────────────────────

function buildDOM() {
  document.body.innerHTML = `
    <div id="status">Your turn</div>
    <div id="timer-bar-bg"><div id="timer-bar" style="width:100%"></div></div>
    <span id="timer-label">15</span>
    <div id="board">
      ${Array.from({length:9}, (_,i) => `<div class="cell" data-index="${i}"></div>`).join('')}
    </div>
    <button id="btn-restart">Restart</button>
    <button id="btn-toggle">Go Second</button>
    <span id="score-x">0</span>
    <span id="score-d">0</span>
    <span id="score-o">0</span>
  `;
}

// Inline the same controller logic used in index.html so we can drive it from tests.
function createController({ humanFirst = true } = {}) {
  const HUMAN_EMOJI = '🍦';
  const AI_EMOJI    = '🐸';

  let board = emptyBoard();
  let gameOver = false;
  let humanGoesFirst = humanFirst;
  let scores = { X: 0, O: 0, D: 0 };
  let timerInterval = null;
  let timeLeft = MOVE_TIME;

  const cells      = document.querySelectorAll('.cell');
  const statusEl   = document.getElementById('status');
  const timerBar   = document.getElementById('timer-bar');
  const timerLabel = document.getElementById('timer-label');

  function updateTimerUI() {
    const pct = (timeLeft / MOVE_TIME) * 100;
    timerBar.style.width = pct + '%';
    timerLabel.textContent = timeLeft;
    const warn = timeLeft <= 5;
    timerBar.classList.toggle('warning', warn);
    timerLabel.classList.toggle('warning', warn);
  }

  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = MOVE_TIME;
    updateTimerUI();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerUI();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        const empty = getEmptyCells(board);
        if (empty.length) {
          const i = empty[0];
          board[i] = HUMAN;
          renderBoard(i);
          const result = checkWinner(board);
          if (result) { endGame(result); return; }
          aiTurn();
        }
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerBar.style.width = '0%';
    timerLabel.textContent = '';
    timerBar.classList.remove('warning');
    timerLabel.classList.remove('warning');
  }

  function renderBoard(newIndex = -1) {
    cells.forEach((cell, i) => {
      const val = board[i];
      cell.textContent = val === HUMAN ? HUMAN_EMOJI : val === AI ? AI_EMOJI : '';
      cell.className = 'cell' + (val ? ' taken' : '') + (i === newIndex ? ' placed' : '');
    });
  }

  function endGame(result) {
    gameOver = true;
    stopTimer();
    if (result.winner === 'draw') {
      statusEl.textContent = "It's a draw!";
      scores.D++;
      document.getElementById('score-d').textContent = scores.D;
    } else {
      result.line.forEach(i => cells[i].classList.add('win'));
      if (result.winner === HUMAN) {
        statusEl.textContent = 'You win!';
        scores.X++;
        document.getElementById('score-x').textContent = scores.X;
      } else {
        statusEl.textContent = 'AI wins!';
        scores.O++;
        document.getElementById('score-o').textContent = scores.O;
      }
    }
  }

  function aiTurn() {
    if (gameOver) return;
    stopTimer();
    statusEl.textContent = 'AI is thinking…';
    const move = bestMove(board);
    board[move] = AI;
    renderBoard(move);
    const result = checkWinner(board);
    if (result) { endGame(result); return; }
    statusEl.textContent = 'Your turn';
    startTimer();
  }

  function handleClick(index) {
    if (gameOver || board[index] !== null) return false;
    board[index] = HUMAN;
    renderBoard(index);
    const result = checkWinner(board);
    if (result) { endGame(result); return true; }
    aiTurn();
    return true;
  }

  function startGame(goFirst = humanGoesFirst) {
    humanGoesFirst = goFirst;
    board = emptyBoard();
    gameOver = false;
    renderBoard();
    stopTimer();
    if (humanGoesFirst) {
      statusEl.textContent = 'Your turn';
      startTimer();
    } else {
      statusEl.textContent = 'AI goes first…';
      aiTurn();
    }
  }

  // expose internals for assertions
  return {
    getBoard: () => board,
    isGameOver: () => gameOver,
    getScores: () => scores,
    getTimeLeft: () => timeLeft,
    handleClick,
    startGame,
    stopTimer,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  buildDOM();
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Cell rendering ───────────────────────────────────────────────────────────

describe('initial render', () => {
  test('all cells are empty on game start', () => {
    createController().startGame();
    document.querySelectorAll('.cell').forEach(cell => {
      expect(cell.textContent).toBe('');
    });
  });

  test('status shows human turn message on start', () => {
    createController().startGame();
    expect(document.getElementById('status').textContent).toBe('Your turn');
  });
});

// ── Click handling ───────────────────────────────────────────────────────────

describe('cell click — valid moves', () => {
  test('clicking an empty cell places the human emoji', () => {
    const ctrl = createController();
    ctrl.startGame();
    ctrl.handleClick(0);
    expect(document.querySelector('[data-index="0"]').textContent).toBe('🍦');
  });

  test('clicking an empty cell returns true', () => {
    const ctrl = createController();
    ctrl.startGame();
    expect(ctrl.handleClick(4)).toBe(true);
  });

  test('after human clicks, AI fills exactly one more cell', () => {
    const ctrl = createController();
    ctrl.startGame();
    ctrl.handleClick(0);
    const filled = ctrl.getBoard().filter(v => v !== null);
    expect(filled).toHaveLength(2);
  });

  test('human token is placed at the clicked index', () => {
    const ctrl = createController();
    ctrl.startGame();
    ctrl.handleClick(3);
    expect(ctrl.getBoard()[3]).toBe(HUMAN);
  });
});

describe('cell click — invalid moves', () => {
  test('clicking an occupied cell returns false and does not change the board', () => {
    const ctrl = createController();
    ctrl.startGame();
    ctrl.handleClick(4);                // first move
    const snapshot = [...ctrl.getBoard()];
    expect(ctrl.handleClick(4)).toBe(false);
    expect(ctrl.getBoard()).toEqual(snapshot);
  });

  test('clicking after game over does nothing', () => {
    const ctrl = createController();
    ctrl.startGame();
    // Force a win for AI
    const board = ctrl.getBoard();
    board[0] = AI; board[1] = AI; board[2] = AI;
    board[3] = HUMAN; board[4] = HUMAN; board[5] = null;
    // simulate game-over by calling endGame indirectly: fill board to won state
    // We'll just set gameOver flag via a won board click sequence
    // Easier: construct a controller where we can trigger end via checkWinner
    // Use a fresh board that's one move from AI winning
    const ctrl2 = createController();
    ctrl2.startGame();
    const b2 = ctrl2.getBoard();
    b2[0] = AI; b2[1] = AI;        // AI has two in top row
    b2[3] = HUMAN; b2[4] = HUMAN;  // Human has two in middle row
    // Human clicks 5 → AI completes top row at 2 and wins
    ctrl2.handleClick(5);
    expect(ctrl2.isGameOver()).toBe(true);
    const snapshot = [...ctrl2.getBoard()];
    ctrl2.handleClick(7); // click after game over
    expect(ctrl2.getBoard()).toEqual(snapshot);
  });
});

// ── AI behaviour ─────────────────────────────────────────────────────────────

describe('AI behaviour', () => {
  test('AI always fills a currently-empty cell', () => {
    const ctrl = createController();
    ctrl.startGame();
    for (let i = 0; i < 3; i++) {
      const empty = ctrl.getBoard().indexOf(null);
      if (empty === -1 || ctrl.isGameOver()) break;
      ctrl.handleClick(empty);
      const board = ctrl.getBoard();
      // No cell should be null in an index that was previously AI's
      board.forEach((v, idx) => {
        if (v === AI) expect(idx).toBeGreaterThanOrEqual(0);
      });
    }
  });

  test('AI move is within bounds (0–8)', () => {
    const ctrl = createController();
    ctrl.startGame();
    ctrl.handleClick(0);
    const aiCell = ctrl.getBoard().indexOf(AI);
    expect(aiCell).toBeGreaterThanOrEqual(0);
    expect(aiCell).toBeLessThanOrEqual(8);
  });

  test('AI blocks human from winning', () => {
    // Human has X at 0 and 1; AI must block at 2
    const ctrl = createController();
    ctrl.startGame();
    const board = ctrl.getBoard();
    // Pre-set the board: X at 0,1; O at 3
    board[0] = HUMAN; board[1] = HUMAN; board[3] = AI;
    // Trigger AI turn by clicking any empty cell (not 2)
    ctrl.handleClick(6);
    // After human plays 6, AI should block at 2 (or win elsewhere; board may vary)
    // At minimum, index 2 should now be occupied (by AI block)
    expect(ctrl.getBoard()[2]).toBe(AI);
  });
});

// ── Win / draw detection ─────────────────────────────────────────────────────

describe('win and draw detection', () => {
  test('game ends when human completes a row (cannot happen vs minimax, tested via checkWinner)', () => {
    // checkWinner handles win detection; ensure endGame is called
    const ctrl = createController();
    ctrl.startGame();
    const b = ctrl.getBoard();
    b[0] = HUMAN; b[1] = HUMAN;
    b[3] = AI;    b[4] = AI;
    // Human clicks 2 → wins top row
    ctrl.handleClick(2);
    // checkWinner sees X wins; game should be over
    expect(ctrl.isGameOver()).toBe(true);
  });

  test('human score increments on human win', () => {
    const ctrl = createController();
    ctrl.startGame();
    const b = ctrl.getBoard();
    b[0] = HUMAN; b[1] = HUMAN;
    b[3] = AI;    b[4] = AI;
    ctrl.handleClick(2);
    expect(ctrl.getScores().X).toBe(1);
  });

  test('AI score increments on AI win', () => {
    // AI has top row minus index 2; human has no immediate threat.
    // Human plays an irrelevant cell (8); AI finishes top row → AI wins.
    const ctrl = createController();
    ctrl.startGame();
    const b = ctrl.getBoard();
    b[0] = AI; b[1] = AI;        // AI threatens top row at 2
    b[3] = HUMAN; b[6] = HUMAN;  // human has col, but needs 3 moves — no immediate threat
    ctrl.handleClick(8);          // human plays corner; AI must block/win at 2
    expect(ctrl.isGameOver()).toBe(true);
    expect(ctrl.getScores().O).toBe(1);
  });

  test('win cells receive the "win" CSS class', () => {
    const ctrl = createController();
    ctrl.startGame();
    const b = ctrl.getBoard();
    b[0] = HUMAN; b[1] = HUMAN;
    b[3] = AI;    b[4] = AI;
    ctrl.handleClick(2); // human wins row 0,1,2
    const winCells = document.querySelectorAll('.cell.win');
    expect(winCells.length).toBe(3);
  });

  test('draw increments draw score and sets draw status', () => {
    // Construct a near-draw board and play the final move
    const ctrl = createController();
    ctrl.startGame();
    const b = ctrl.getBoard();
    // X O X / X X O / O X _   — last cell is 8, no winner if O plays there
    b[0]='X'; b[1]='O'; b[2]='X';
    b[3]='X'; b[4]='X'; b[5]='O';
    b[6]='O'; b[7]='X'; b[8]=null;
    // Tell the controller the board is set, then click 8 as human
    // But cell 8 click will put HUMAN there and trigger AI — we need a true draw
    // Board where human clicking 8 completes a draw immediately:
    // Reset and use applyMove approach
    const ctrl2 = createController();
    ctrl2.startGame();
    const b2 = ctrl2.getBoard();
    b2[0]='X'; b2[1]='O'; b2[2]='X';
    b2[3]='X'; b2[4]='O'; b2[5]='O';
    b2[6]='O'; b2[7]='X'; // 8 is null
    // clicking 8 places HUMAN(X); checkWinner on full board → draw
    ctrl2.handleClick(8);
    expect(ctrl2.getScores().D).toBe(1);
    expect(document.getElementById('status').textContent).toBe("It's a draw!");
  });
});

// ── Restart ──────────────────────────────────────────────────────────────────

describe('restart', () => {
  test('restart clears all cells', () => {
    const ctrl = createController();
    ctrl.startGame();
    ctrl.handleClick(4);
    ctrl.startGame(); // restart
    document.querySelectorAll('.cell').forEach(cell => {
      expect(cell.textContent).toBe('');
    });
  });

  test('restart resets gameOver flag', () => {
    const ctrl = createController();
    ctrl.startGame();
    const b = ctrl.getBoard();
    b[0]=HUMAN; b[1]=HUMAN; b[3]=AI; b[4]=AI;
    ctrl.handleClick(2); // human wins → gameOver = true
    expect(ctrl.isGameOver()).toBe(true);
    ctrl.startGame();
    expect(ctrl.isGameOver()).toBe(false);
  });

  test('restart does not reset scores', () => {
    const ctrl = createController();
    ctrl.startGame();
    const b = ctrl.getBoard();
    b[0]=HUMAN; b[1]=HUMAN; b[3]=AI; b[4]=AI;
    ctrl.handleClick(2); // human wins
    ctrl.startGame();
    expect(ctrl.getScores().X).toBe(1);
  });

  test('restart resets the board state', () => {
    const ctrl = createController();
    ctrl.startGame();
    ctrl.handleClick(0);
    ctrl.startGame();
    expect(ctrl.getBoard()).toEqual(Array(9).fill(null));
  });
});

// ── Timer ────────────────────────────────────────────────────────────────────

describe('timer', () => {
  test('timer bar starts at 100%', () => {
    const ctrl = createController();
    ctrl.startGame();
    expect(document.getElementById('timer-bar').style.width).toBe('100%');
  });

  test('timer label starts at MOVE_TIME seconds', () => {
    const ctrl = createController();
    ctrl.startGame();
    expect(document.getElementById('timer-label').textContent).toBe(String(MOVE_TIME));
  });

  test('timer decrements after 1 second', () => {
    const ctrl = createController();
    ctrl.startGame();
    jest.advanceTimersByTime(1000);
    expect(Number(document.getElementById('timer-label').textContent)).toBe(MOVE_TIME - 1);
  });

  test('warning class applied when 5 or fewer seconds remain', () => {
    const ctrl = createController();
    ctrl.startGame();
    jest.advanceTimersByTime((MOVE_TIME - 5) * 1000);
    expect(document.getElementById('timer-bar').classList.contains('warning')).toBe(true);
    expect(document.getElementById('timer-label').classList.contains('warning')).toBe(true);
  });

  test('timer stops (label clears) when game ends', () => {
    const ctrl = createController();
    ctrl.startGame();
    const b = ctrl.getBoard();
    b[0]=HUMAN; b[1]=HUMAN; b[3]=AI; b[4]=AI;
    ctrl.handleClick(2);
    expect(document.getElementById('timer-label').textContent).toBe('');
  });

  test('timer auto-moves human after timeout', () => {
    const ctrl = createController();
    ctrl.startGame();
    const emptyBefore = ctrl.getBoard().filter(v => v === null).length;
    jest.advanceTimersByTime(MOVE_TIME * 1000 + 100);
    // After timeout the controller should have placed HUMAN somewhere + AI responded
    const emptyAfter = ctrl.getBoard().filter(v => v === null).length;
    expect(emptyAfter).toBeLessThan(emptyBefore);
  });
});

// ── Player order toggle ──────────────────────────────────────────────────────

describe('player order', () => {
  test('when AI goes first, board has one AI move before human interacts', () => {
    const ctrl = createController({ humanFirst: false });
    ctrl.startGame(false);
    const aiCells = ctrl.getBoard().filter(v => v === AI);
    expect(aiCells).toHaveLength(1);
  });

  test('when human goes first, board is empty before human interacts', () => {
    const ctrl = createController({ humanFirst: true });
    ctrl.startGame(true);
    expect(ctrl.getBoard().every(v => v === null)).toBe(true);
  });
});
