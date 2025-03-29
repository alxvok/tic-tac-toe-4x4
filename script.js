const board = Array(6).fill().map(() => Array(6).fill(null)); // Поле 6x6
let currentPlayer = 'X';
let playerWins = 0; // Счётчик побед игрока
let botWins = 0; // Счётчик побед бота

const gameBoard = document.getElementById('game-board');
for (let i = 0; i < 6; i++) {
  for (let j = 0; j < 6; j++) {
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
      if (currentPlayer === 'X') {
        playerWins++;
        document.getElementById('status').textContent = 'Ты победил!';
      } else {
        botWins++;
        document.getElementById('status').textContent = 'Бот победил!';
      }
      updateScore();
      setTimeout(resetGame, 2000);
      return; // Завершаем ход
    }
    // Проверяем на ничью сразу после хода
    if (board.flat().every(cell => cell !== null)) {
      document.getElementById('status').textContent = 'Ничья!';
      setTimeout(resetGame, 2000);
      return; // Завершаем ход
    }
    // Если игра продолжается, меняем игрока
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    document.getElementById('status').textContent = currentPlayer === 'X' ? 'Ты ходи' : 'Ходит бот';
    if (currentPlayer === 'O') {
      setTimeout(botMove, 500); // Задержка для реалистичности
    }
  }
}

function botMove() {
  // 1. Проверка на победу бота
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      if (board[i][j] === null) {
        board[i][j] = 'O'; // Симулируем ход
        if (checkWin('O')) {
          board[i][j] = 'O'; // Реальный ход
          updateUI();
          botWins++;
          updateScore();
          document.getElementById('status').textContent = 'Бот победил!';
          setTimeout(resetGame, 2000);
          return;
        }
        board[i][j] = null; // Отменяем симуляцию
      }
    }
  }

  // 2. Блокировка игрока
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      if (board[i][j] === null) {
        board[i][j] = 'X'; // Симулируем ход игрока
        if (checkWin('X')) {
          board[i][j] = 'O'; // Блокируем
          updateUI();
          currentPlayer = 'X';
          document.getElementById('status').textContent = 'Ты ходи';
          // Проверяем на ничью после хода бота
          if (board.flat().every(cell => cell !== null)) {
            document.getElementById('status').textContent = 'Ничья!';
            setTimeout(resetGame, 2000);
          }
          return;
        }
        board[i][j] = null; // Отменяем симуляцию
      }
    }
  }

  // 3. Стратегический ход (приоритет — центр)
  const centerMoves = [[2, 2], [2, 3], [3, 2], [3, 3]]; // Центр для поля 6x6
  for (let [i, j] of centerMoves) {
    if (board[i][j] === null) {
      board[i][j] = 'O';
      updateUI();
      currentPlayer = 'X';
      document.getElementById('status').textContent = 'Ты ходи';
      // Проверяем на ничью после хода бота
      if (board.flat().every(cell => cell !== null)) {
        document.getElementById('status').textContent = 'Ничья!';
        setTimeout(resetGame, 2000);
      }
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
    // Проверяем на ничью после хода бота
    if (board.flat().every(cell => cell !== null)) {
      document.getElementById('status').textContent = 'Ничья!';
      setTimeout(resetGame, 2000);
    }
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
  // Проверка горизонталей (нужно 4 в ряд)
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j <= 6 - 4; j++) { // Проверяем отрезки длиной 4
      if (board[i][j] === player && board[i][j + 1] === player && board[i][j + 2] === player && board[i][j + 3] === player) {
        return true;
      }
    }
  }

  // Проверка вертикалей (нужно 4 в ряд)
  for (let j = 0; j < 6; j++) {
    for (let i = 0; i <= 6 - 4; i++) {
      if (board[i][j] === player && board[i + 1][j] === player && board[i + 2][j] === player && board[i + 3][j] === player) {
        return true;
      }
    }
  }

  // Проверка главной диагонали (нужно 4 в ряд)
  for (let i = 0; i <= 6 - 4; i++) {
    for (let j = 0; j <= 6 - 4; j++) {
      if (board[i][j] === player && board[i + 1][j + 1] === player && board[i + 2][j + 2] === player && board[i + 3][j + 3] === player) {
        return true;
      }
    }
  }

  // Проверка побочной диагонали (нужно 4 в ряд)
  for (let i = 0; i <= 6 - 4; i++) {
    for (let j = 3; j < 6; j++) {
      if (board[i][j] === player && board[i + 1][j - 1] === player && board[i + 2][j - 2] === player && board[i + 3][j - 3] === player) {
        return true;
      }
    }
  }

  return false;
}

function resetGame() {
  board.forEach(row => row.fill(null));
  currentPlayer = 'X';
  updateUI();
  document.getElementById('status').textContent = 'Ты ходи';
}

function updateScore() {
  document.getElementById('player-score').textContent = `Ты: ${playerWins}`;
  document.getElementById('bot-score').textContent = `Бот: ${botWins}`;
}

// Инициализация счёта при загрузке
updateScore();
