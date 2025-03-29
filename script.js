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
      document.getElementById('status').textContent = currentPlayer === 'X' ? 'Ты победил!' : 'Бот победил!';
      setTimeout(resetGame, 2000);
    } else if (board.flat().every(cell => cell !== null)) {
      document.getElementById('status').textContent = 'Ничья!';
      setTimeout(resetGame, 2000);
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      document.getElementById('status').textContent = currentPlayer === 'X' ? 'Ты ходи' : 'Ходит бот';
      if (currentPlayer === 'O') {
        setTimeout(botMove, 500); // Задержка для реалистичности
      }
    }
  }
}

function botMove() {
  // 1. Проверка на победу бота
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] === null) {
        board[i][j] = 'O'; // Симулируем ход
        if (checkWin('O')) {
          board[i][j] = 'O'; // Реальный ход
          updateUI();
          document.getElementById('status').textContent = 'Бот победил!';
          setTimeout(resetGame, 2000);
          return;
        }
        board[i][j] = null; // Отменяем симуляцию
      }
    }
  }

  // 2. Блокировка игрока
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] === null) {
        board[i][j] = 'X'; // Симулируем ход игрока
        if (checkWin('X')) {
          board[i][j] = 'O'; // Блокируем
          updateUI();
          currentPlayer = 'X';
          document.getElementById('status').textContent = 'Ты ходи';
          return;
        }
        board[i][j] = null; // Отменяем симуляцию
      }
    }
  }

  // 3. Стратегический ход (приоритет — центр)
  const centerMoves = [[1, 1], [1, 2], [2, 1], [2, 2]];
  for (let [i, j] of centerMoves) {
    if (board[i][j] === null) {
      board[i][j] = 'O';
      updateUI();
      currentPlayer = 'X';
      document.getElementById('status').textContent = 'Ты ходи';
      return;
    }
  }

  // 4. Случайный ход, если ничего не найдено
  let emptyCells = [];
  board.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === null) emptyCells.push([i, j]);
    });
  });
  if (emptyCells.length > 0) {
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[row][col] = 'O';
    updateUI();
    currentPlayer = 'X';
    document.getElementById('status').textContent = 'Ты ходи';
  }
}

function updateUI() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    const value = board[row][col];
    cell.textContent = value || '';
    cell.classList.remove('x', 'o');
    if (value === 'X') cell.classList.add('x');
    if (value === 'O') cell.classList.add('o');
  });
}

function checkWin(player) {
  // Проверка горизонталей
  for (let i = 0; i < 4; i++) {
    if (board[i].every(cell => cell === player)) return true;
  }
  // Проверка вертикалей
  for (let j = 0; j < 4; j++) {
    if (board.every(row => row[j] === player)) return true;
  }
  // Проверка главной диагонали
  if ([0, 1, 2, 3].every(i => board[i][i] === player)) return true;
  // Проверка побочной диагонали
  if ([0, 1, 2, 3].every(i => board[i][3 - i] === player)) return true;
  return false;
}

function resetGame() {
  board.forEach(row => row.fill(null));
  currentPlayer = 'X';
  updateUI();
  document.getElementById('status').textContent = 'Ты ходи';
}
