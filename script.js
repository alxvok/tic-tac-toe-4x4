const board = Array(6).fill().map(() => Array(6).fill(null)); // Поле 6x6
let currentPlayer = 'X';
let playerWins = 0; // Счётчик побед игрока
let botWins = 0; // Счётчик побед бота
let gameEnded = false; // Флаг окончания игры

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

// Создаём кнопку "Новая игра"
const newGameButton = document.createElement('button');
newGameButton.id = 'new-game-button';
newGameButton.textContent = 'Новая игра';
newGameButton.style.display = 'none'; // Скрыта по умолчанию
newGameButton.addEventListener('click', resetGame);
document.querySelector('.container').appendChild(newGameButton);

function makeMove(row, col) {
  if (board[row][col] === null && !gameEnded) {
    board[row][col] = currentPlayer;
    updateUI();
    if (checkWin(currentPlayer)) {
      if (currentPlayer === 'X') {
        playerWins++;
        document.getElementById('status').textContent = 'Ты победил!';
        document.getElementById('status').classList.add('win');
      } else {
        botWins++;
        document.getElementById('status').textContent = 'Бот победил!';
        document.getElementById('status').classList.add('win');
      }
      updateScore();
      endGame();
      return;
    }
    // Проверяем на ничью сразу после хода
    if (board.flat().every(cell => cell !== null)) {
      document.getElementById('status').textContent = 'Ничья!';
      endGame();
      return;
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
  if (gameEnded) return;

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
          document.getElementById('status').classList.add('win');
          endGame();
          return;
        }
        board[i][j] = null; // Отменяем симуляцию
      }
    }
  }

  // 2. Блокировка игрока (немедленная победа)
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      if (board[i][j] === null) {
        board[i][j] = 'X'; // Симулируем ход игрока
        if (checkWin('X')) {
          board[i][j] = 'O'; // Блокируем
          updateUI();
          currentPlayer = 'X';
          document.getElementById('status').textContent = 'Ты ходи';
          checkForDraw();
          return;
        }
        board[i][j] = null; // Отменяем симуляцию
      }
    }
  }

  // 3. Поиск линий с 2 или 3 "O" (стратегический ход)
  const bestMove = findBestMove('O', 2); // Ищем линии с 2 или 3 "O"
  if (bestMove) {
    board[bestMove.row][bestMove.col] = 'O';
    updateUI();
    currentPlayer = 'X';
    document.getElementById('status').textContent = 'Ты ходи';
    checkForDraw();
    return;
  }

  // 4. Блокировка линий с 2 или 3 "X" (предотвращение угрозы)
  const blockMove = findBestMove('X', 2); // Ищем линии с 2 или 3 "X"
  if (blockMove) {
    board[blockMove.row][blockMove.col] = 'O';
    updateUI();
    currentPlayer = 'X';
    document.getElementById('status').textContent = 'Ты ходи';
    checkForDraw();
    return;
  }

  // 5. Стратегический ход (приоритет — центр)
  const centerMoves = [[2, 2], [2, 3], [3, 2], [3, 3]]; // Центр для поля 6x6
  for (let [i, j] of centerMoves) {
    if (board[i][j] === null) {
      board[i][j] = 'O';
      updateUI();
      currentPlayer = 'X';
      document.getElementById('status').textContent = 'Ты ходи';
      checkForDraw();
      return;
    }
  }

  // 6. Случайный ход, если ничего не найдено
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
    checkForDraw();
  }
}

// Новая функция для поиска линий с 2 или 3 символами
function findBestMove(player, minCount) {
  // Проверка горизонталей
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j <= 6 - 4; j++) {
      let count = 0;
      let emptyCell = null;
      for (let k = 0; k < 4; k++) {
        if (board[i][j + k] === player) count++;
        else if (board[i][j + k] === null) emptyCell = { row: i, col: j + k };
      }
      if (count >= minCount && emptyCell) return emptyCell;
    }
  }

  // Проверка вертикалей
  for (let j = 0; j < 6; j++) {
    for (let i = 0; i <= 6 - 4; i++) {
      let count = 0;
      let emptyCell = null;
      for (let k = 0; k < 4; k++) {
        if (board[i + k][j] === player) count++;
        else if (board[i + k][j] === null) emptyCell = { row: i + k, col: j };
      }
      if (count >= minCount && emptyCell) return emptyCell;
    }
  }

  // Проверка главной диагонали
  for (let i = 0; i <= 6 - 4; i++) {
    for (let j = 0; j <= 6 - 4; j++) {
      let count = 0;
      let emptyCell = null;
      for (let k = 0; k < 4; k++) {
        if (board[i + k][j + k] === player) count++;
        else if (board[i + k][j + k] === null) emptyCell = { row: i + k, col: j + k };
      }
      if (count >= minCount && emptyCell) return emptyCell;
    }
  }

  // Проверка побочной диагонали
  for (let i = 0; i <= 6 - 4; i++) {
    for (let j = 3; j < 6; j++) {
      let count = 0;
      let emptyCell = null;
      for (let k = 0; k < 4; k++) {
        if (board[i + k][j - k] === player) count++;
        else if (board[i + k][j - k] === null) emptyCell = { row: i + k, col: j - k };
      }
      if (count >= minCount && emptyCell) return emptyCell;
    }
  }

  return null;
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
    for (let j = 0; j <= 6 - 4; j++) {
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

function checkForDraw() {
  if (board.flat().every(cell => cell !== null)) {
    document.getElementById('status').textContent = 'Ничья!';
    endGame();
  }
}

function endGame() {
  gameEnded = true;
  document.getElementById('new-game-button').style.display = 'block';
}

function resetGame() {
  board.forEach(row => row.fill(null));
  currentPlayer = 'X';
  gameEnded = false;
  updateUI();
  document.getElementById('status').textContent = 'Ты ходи';
  document.getElementById('status').classList.remove('win');
  document.getElementById('new-game-button').style.display = 'none';
}

function updateScore() {
  document.getElementById('player-score').textContent = `Ты: ${playerWins}`;
  document.getElementById('bot-score').textContent = `Бот: ${botWins}`;
}

// Инициализация счёта при загрузке
updateScore();
