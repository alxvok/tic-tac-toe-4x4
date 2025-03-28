const board = Array(4).fill().map(() => Array(4).fill(null));
let currentPlayer = 'X';

const gameBoard = document.getElementById('game-board');
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = i;
    cell.dataset.col = j;
    cell.addEventListener('click', () => makeMove(i, j));
    gameBoard.appendChild(cell);
  }
}

function makeMove(row, col) {
  if (board[row][col] === null) {
    board[row][col] = currentPlayer;
    updateUI();
    if (checkWin(currentPlayer)) {
      document.getElementById('status').textContent = `${currentPlayer} выиграл!`;
      setTimeout(resetGame, 2000);
    } else if (board.flat().every(cell => cell !== null)) {
      document.getElementById('status').textContent = 'Ничья!';
      setTimeout(resetGame, 2000);
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      document.getElementById('status').textContent = `Ходит: ${currentPlayer}`;
      if (currentPlayer === 'O') {
        setTimeout(botMove, 500);
      }
    }
  }
}

function botMove() {
  let emptyCells = [];
  board.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === null) emptyCells.push([i, j]);
    });
  });
  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  makeMove(row, col);
}

function updateUI() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    cell.textContent = board[row][col] || '';
  });
}

function checkWin(player) {
  for (let i = 0; i < 4; i++) {
    if (board[i].every(cell => cell === player)) return true;
  }
  for (let j = 0; j < 4; j++) {
    if (board.every(row => row[j] === player)) return true;
  }
  if ([0, 1, 2, 3].every(i => board[i][i] === player)) return true;
  if ([0, 1, 2, 3].every(i => board[i][3 - i] === player)) return true;
  return false;
}

function resetGame() {
  board.forEach(row => row.fill(null));
  currentPlayer = 'X';
  updateUI();
  document.getElementById('status').textContent = 'Ваш ход';
}