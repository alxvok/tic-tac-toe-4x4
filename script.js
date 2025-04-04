const board = Array(8).fill().map(() => Array(6).fill(null)); // 8 строк, 6 столбцов
let currentPlayer = 'X';
let playerWins = 0;
let botWins = 0;
let gameEnded = false;

// Размещаем 5 случайных бомбочек
const bombs = [];
while (bombs.length < 5) {
  const row = Math.floor(Math.random() * 8);
  const col = Math.floor(Math.random() * 6);
  if (!bombs.some(b => b.row === row && b.col === col)) {
    bombs.push({ row, col });
  }
}

const gameBoard = document.getElementById('game-board');
for (let i = 0; i < 8; i++) {
  for (let j = 0; j < 6; j++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = i;
    cell.dataset.col = j;
    cell.addEventListener('click', () => makeMove(i, j));
    gameBoard.appendChild(cell);
  }
}

document.getElementById('new-game-button').addEventListener('click', resetGame);

function makeMove(row, col) {
  if (board[row][col] === null && !gameEnded) {
    board[row][col] = currentPlayer;
    updateUI();
    const winInfo = checkWin(currentPlayer);
    if (winInfo) {
      const bombCell = checkForBomb(winInfo);
      if (bombCell) {
        explodeLine(winInfo, bombCell);
        setTimeout(() => {
          document.getElementById('status').textContent = `Бомбочка в ячейке [${bombCell.row + 1}, ${bombCell.col + 1}] взорвала линию!`;
          setTimeout(() => {
            document.getElementById('status').textContent = currentPlayer === 'X' ? 'Ты ходи' : 'Ходит бот';
          }, 1000);
        }, 500);
      } else {
        highlightWinLine(winInfo);
        if (currentPlayer === 'X') {
          playerWins++;
          document.getElementById('status').textContent = 'Ты победил!';
        } else {
          botWins++;
          document.getElementById('status').textContent = 'Бот победил!';
        }
        document.getElementById('status').classList.add('win');
        updateScore();
        endGame();
      }
    } else if (board.flat().every(cell => cell !== null)) {
      document.getElementById('status').textContent = 'Ничья!';
      endGame();
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      document.getElementById('status').textContent = currentPlayer === 'X' ? 'Ты ходи' : 'Ходит бот';
      if (currentPlayer === 'O') {
        setTimeout(botMove, 500);
      }
    }
  }
}

function botMove() {
  if (gameEnded) return;
  let emptyCells = [];
  board.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === null) emptyCells.push([i, j]);
    });
  });
  if (emptyCells.length > 0) {
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    makeMove(row, col);
  }
}

function checkWin(player) {
  // Горизонтали
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j <= 6 - 4; j++) {
      if (board[i][j] === player && board[i][j + 1] === player && board[i][j + 2] === player && board[i][j + 3] === player) {
        return { type: 'horizontal', row: i, startCol: j };
      }
    }
  }
  // Вертикали
  for (let j = 0; j < 6; j++) {
    for (let i = 0; i <= 8 - 4; i++) {
      if (board[i][j] === player && board[i + 1][j] === player && board[i + 2][j] === player && board[i + 3][j] === player) {
        return { type: 'vertical', col: j, startRow: i };
      }
    }
  }
  // Главная диагональ
  for (let i = 0; i <= 8 - 4; i++) {
    for (let j = 0; j <= 6 - 4; j++) {
      if (board[i][j] === player && board[i + 1][j + 1] === player && board[i + 2][j + 2] === player && board[i + 3][j + 3] === player) {
        return { type: 'diagonal', startRow: i, startCol: j };
      }
    }
  }
  // Побочная диагональ
  for (let i = 0; i <= 8 - 4; i++) {
    for (let j = 3; j < 6; j++) {
      if (board[i][j] === player && board[i + 1][j - 1] === player && board[i + 2][j - 2] === player && board[i + 3][j - 3] === player) {
        return { type: 'anti-diagonal', startRow: i, startCol: j };
      }
    }
  }
  return null;
}

function checkForBomb(winInfo) {
  const { type, startRow, startCol, row, col } = winInfo;
  if (type === 'horizontal') {
    for (let j = startCol; j < startCol + 4; j++) {
      if (bombs.some(b => b.row === row && b.col === j)) {
        return { row, col: j };
      }
    }
  } else if (type === 'vertical') {
    for (let i = startRow; i < startRow + 4; i++) {
      if (bombs.some(b => b.row === i && b.col === col)) {
        return { row: i, col };
      }
    }
  } else if (type === 'diagonal') {
    for (let k = 0; k < 4; k++) {
      if (bombs.some(b => b.row === startRow + k && b.col === startCol + k)) {
        return { row: startRow + k, col: startCol + k };
      }
    }
  } else if (type === 'anti-diagonal') {
    for (let k = 0; k < 4; k++) {
      if (bombs.some(b => b.row === startRow + k && b.col === startCol - k)) {
        return { row: startRow + k, col: startCol - k };
      }
    }
  }
  return null;
}

function explodeLine(winInfo, bombCell) {
  const { type, startRow, startCol, row, col } = winInfo;
  let cellsToExplode = [];

  if (type === 'horizontal') {
    for (let j = startCol; j < startCol + 4; j++) {
      const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${j}"]`);
      cellsToExplode.push({ cell, row, col: j });
    }
  } else if (type === 'vertical') {
    for (let i = startRow; i < startRow + 4; i++) {
      const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${col}"]`);
      cellsToExplode.push({ cell, row: i, col });
    }
  }

  // Анимация взрыва
  cellsToExplode.forEach(({ cell, row, col }) => {
    cell.classList.add('explode');
    if (row === bombCell.row && col === bombCell.col) {
      cell.classList.add('bomb-explode');
    }
    setTimeout(() => {
      board[row][col] = null;
      cell.textContent = '';
      cell.classList.remove('explode', 'bomb-explode');
    }, 500);
  });
  setTimeout(updateUI, 500);
}

function highlightWinLine(winInfo) {
  const { type, startRow, startCol, row, col } = winInfo;
  if (type === 'horizontal') {
    for (let j = startCol; j < startCol + 4; j++) {
      document.querySelector(`.cell[data-row="${row}"][data-col="${j}"]`).classList.add('win-line');
    }
  } else if (type === 'vertical') {
    for (let i = startRow; i < startRow + 4; i++) {
      document.querySelector(`.cell[data-row="${i}"][data-col="${col}"]`).classList.add('win-line');
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
    cell.classList.remove('x', 'o', 'win-line');
    if (value === 'X') cell.classList.add('x');
    if (value === 'O') cell.classList.add('o');
  });
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
  // Перемещаем бомбочки
  bombs.length = 0;
  while (bombs.length < 5) {
    const row = Math.floor(Math.random() * 8);
    const col = Math.floor(Math.random() * 6);
    if (!bombs.some(b => b.row === row && b.col === col)) {
      bombs.push({ row, col });
    }
  }
}

function updateScore() {
  document.getElementById('player-score').textContent = `Ты: ${playerWins}`;
  document.getElementById('bot-score').textContent = `Бот: ${botWins}`;
}

updateScore();
