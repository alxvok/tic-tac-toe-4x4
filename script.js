document.addEventListener('DOMContentLoaded', () => {
    // --- Константы и Настройки ---
    const ROWS = 8;
    const COLS = 6;
    const WIN_LENGTH = 4; // Нужно 4 в ряд для победы
    const BOMB_COUNT = 8;  // Количество бомб на поле (можно настроить)
    const PLAYER = 'X';
    const BOT = 'O';
    const BOMB = '💣';
    const EMPTY = '';

    // --- Элементы DOM ---
    const boardElement = document.getElementById('game-board');
    const statusMessageElement = document.getElementById('status-message');
    const playerScoreElement = document.getElementById('player-score');
    const botScoreElement = document.getElementById('bot-score');
    const newGameButton = document.getElementById('new-game-button');

    // --- Состояние игры ---
    let board = []; // 2D массив для хранения состояния поля
    let bombLocations = new Set(); // Храним координаты бомб ('row-col')
    let currentPlayer = PLAYER;
    let gameOver = false;
    let playerScore = 0;
    let botScore = 0;
    let isBotThinking = false; // Флаг, чтобы игрок не кликал во время хода бота

    // --- Инициализация Игры ---
    function initializeGame() {
        board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
        bombLocations.clear();
        gameOver = false;
        isBotThinking = false;
        currentPlayer = PLAYER; // Игрок всегда начинает первым

        placeBombs();
        renderBoard();
        updateStatusMessage(`Ход игрока (${PLAYER})`);
        updateScoreDisplay();
        newGameButton.disabled = true; // Кнопка активна только после завершения игры
        console.log("Игра инициализирована. Бомбы:", Array.from(bombLocations)); // Для отладки
    }

    // --- Размещение Бомб ---
    function placeBombs() {
        let bombsPlaced = 0;
        while (bombsPlaced < BOMB_COUNT) {
            const row = Math.floor(Math.random() * ROWS);
            const col = Math.floor(Math.random() * COLS);
            const key = `${row}-${col}`;
            if (!bombLocations.has(key)) {
                bombLocations.add(key);
                // Не ставим бомбу в массив board сразу, она "скрыта"
                bombsPlaced++;
            }
        }
    }

    // --- Отрисовка Поля ---
    function renderBoard() {
        boardElement.innerHTML = ''; // Очищаем поле перед отрисовкой
        boardElement.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
        boardElement.style.gridAutoRows = `var(--cell-size)`;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                const cellValue = board[r][c];
                if (cellValue === PLAYER) {
                    cell.classList.add('x');
                    cell.textContent = PLAYER;
                } else if (cellValue === BOT) {
                    cell.classList.add('o');
                    cell.textContent = BOT;
                }
                 // Бомбы не показываем до клика
                 // else if (bombLocations.has(`${r}-${c}`)) {
                 //    cell.textContent = '?'; // Можно показать индикатор бомбы для отладки
                 // }

                // Убираем старые обработчики и добавляем новые
                cell.removeEventListener('click', handleCellClick);
                cell.addEventListener('click', handleCellClick);

                boardElement.appendChild(cell);
            }
        }
    }

    // --- Обработка Клика по Ячейке ---
    function handleCellClick(event) {
        if (gameOver || isBotThinking || currentPlayer !== PLAYER) return; // Игнорируем клики не в свой ход или во время раздумий бота

        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const bombKey = `${row}-${col}`;

        // Проверяем, не является ли ячейка уже занятой (кроме скрытых бомб)
        if (board[row][col] !== EMPTY) return;

        if (bombLocations.has(bombKey)) {
            // Игрок попал на бомбу!
            triggerBomb(row, col, PLAYER); // Передаем, кто активировал бомбу
             // Бомба взорвалась, ход переходит к боту (после небольшой задержки)
             if (!gameOver) {
                 switchPlayer();
                 // Небольшая задержка перед ходом бота после взрыва
                 setTimeout(botMove, 600);
             }

        } else {
            // Обычный ход игрока
            makeMove(row, col, PLAYER);
        }
    }

     // --- Совершение Хода (без бомб) ---
     function makeMove(row, col, player) {
        if (gameOver || board[row][col] !== EMPTY) return false; // Проверка на всякий случай

        board[row][col] = player;
        updateCell(row, col, player);

        const winInfo = checkWin(player);
        if (winInfo) {
            endGame(player, winInfo.winningCells);
        } else if (checkDraw()) {
            endGame('draw');
        } else {
            switchPlayer();
             // Если это был ход игрока, запускаем ход бота
            if (player === PLAYER && !gameOver) {
                 isBotThinking = true;
                 updateStatusMessage('Бот думает...');
                 // Имитация задержки для "раздумий" бота
                 setTimeout(botMove, Math.random() * 500 + 300); // 300-800ms
             }
        }
        return true; // Ход совершен
    }


    // --- Активация Бомбы ---
    function triggerBomb(row, col, triggerPlayer) {
        console.log(`Бомба взорвана в ${row}-${col} игроком ${triggerPlayer}`);
        const bombCell = getCellElement(row, col);
        if (bombCell) {
             bombCell.textContent = BOMB; // Показываем бомбу
             bombCell.classList.add('bomb-revealed', 'exploded');
             // Убираем класс 'exploded' после анимации
            setTimeout(() => {
                bombCell?.classList.remove('exploded');
                 // Возможно, стоит оставить иконку бомбы видимой
                 // bombCell.textContent = ''; // Или очистить ячейку после взрыва
            }, 500);
        }

        // Удаляем бомбу из списка активных
        bombLocations.delete(`${row}-${col}`);
        // Устанавливаем значение ячейки в EMPTY, чтобы она стала доступной
        // (или можно оставить специальный маркер взорванной ячейки)
        board[row][col] = EMPTY;

        // Очищаем соседние ячейки
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            for (let cOffset = -1; cOffset <= 1; cOffset++) {
                if (rOffset === 0 && cOffset === 0) continue; // Пропускаем саму бомбу

                const nr = row + rOffset;
                const nc = col + cOffset;

                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    // Не стираем другие бомбы взрывом, только фигуры X и O
                    if (board[nr][nc] === PLAYER || board[nr][nc] === BOT) {
                         board[nr][nc] = EMPTY;
                         updateCell(nr, nc, EMPTY); // Обновляем визуал очищенной ячейки
                         // Добавить эффект очистки?
                         const clearedCell = getCellElement(nr, nc);
                         clearedCell?.classList.add('exploded'); // Кратковременная анимация очистки
                         setTimeout(() => clearedCell?.classList.remove('exploded'), 500);
                    }
                    // Если соседняя ячейка - тоже бомба, она не стирается
                }
            }
        }

        updateStatusMessage(`💥 Бум! Игрок ${triggerPlayer} попал на бомбу!`);
        // Ход переходит другому игроку (это делается в handleCellClick или botMove)
    }


    // --- Переключение Игрока ---
    function switchPlayer() {
         if (gameOver) return;
        currentPlayer = (currentPlayer === PLAYER) ? BOT : PLAYER;
        if (!isBotThinking) { // Не обновляем статус если бот еще "думает"
             updateStatusMessage(`Ход ${currentPlayer === PLAYER ? 'игрока' : 'бота'} (${currentPlayer})`);
        }
    }

    // --- Ход Бота ---
    function botMove() {
         if (gameOver || currentPlayer !== BOT) {
             isBotThinking = false;
             return;
         }

         updateStatusMessage('Бот ходит...');

         // --- Логика ИИ Бота ---
         let bestMove = findBestMove();

         if (bestMove) {
             const { row, col } = bestMove;
             const bombKey = `${row}-${col}`;

             if (bombLocations.has(bombKey)) {
                 // Бот попал на бомбу!
                 triggerBomb(row, col, BOT);
                 // Ход возвращается игроку
                 if (!gameOver) {
                    switchPlayer(); // Вернули ход игроку
                 }
             } else {
                 // Обычный ход бота
                makeMove(row, col, BOT);
             }
         } else {
             // Это может случиться, если свободных клеток нет (ничья уже должна была быть объявлена)
             console.error("Бот не смог найти ход!");
             if (!checkDraw()) { // Если не ничья, что-то пошло не так
                endGame('draw'); // Форсируем ничью в крайнем случае
             }
         }
         isBotThinking = false; // Бот закончил ход
         // Статус обновится автоматически в switchPlayer или endGame
         if (!gameOver && currentPlayer === PLAYER) {
             updateStatusMessage(`Ход игрока (${PLAYER})`);
         }
    }

    // --- Поиск лучшего хода для Бота (Умный, но сбалансированный) ---
    function findBestMove() {
        // 1. Проверить, может ли бот выиграть следующим ходом
        let move = findWinningMove(BOT);
        if (move) return move;

        // 2. Проверить, нужно ли блокировать выигрышный ход игрока
        move = findWinningMove(PLAYER);
        if (move) return move;

        // 3. Попытаться создать угрозу (3 в ряд с пустой клеткой)
        move = findThreatMove(BOT);
        if (move) return move;

        // 4. Попытаться заблокировать угрозу игрока (если не критично для победы)
        move = findThreatMove(PLAYER); // Найти угрозу игрока
        if (move) {
            // Проверим, нет ли у бота более важного хода (например, своей угрозы)
            let botThreat = findThreatMove(BOT, true); // Ищем только существующую угрозу
            if(!botThreat) return move; // Блокируем игрока, если у бота нет своей угрозы
        }


        // 5. Занять стратегически важную клетку (ближе к центру или своим фигурам)
        //    или просто случайную пустую клетку (не бомбу!)
        let possibleMoves = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === EMPTY && !bombLocations.has(`${r}-${c}`)) {
                    possibleMoves.push({ row: r, col: c, score: calculateStrategicScore(r, c) });
                }
            }
        }

         // Если остались только бомбы - бот вынужден наступить на одну
         if (possibleMoves.length === 0) {
             let bombCells = [];
             for (let r = 0; r < ROWS; r++) {
                 for (let c = 0; c < COLS; c++) {
                      if (board[r][c] === EMPTY && bombLocations.has(`${r}-${c}`)) {
                          bombCells.push({ row: r, col: c });
                      }
                 }
             }
             if (bombCells.length > 0) {
                 // Выбираем случайную бомбу
                 return bombCells[Math.floor(Math.random() * bombCells.length)];
             } else {
                 return null; // Вообще нет ходов - ничья?
             }
         }


        // Сортируем ходы по стратегической оценке (выше - лучше)
        possibleMoves.sort((a, b) => b.score - a.score);

        // Добавляем немного случайности, чтобы бот не всегда делал одно и то же
        // Выбираем из нескольких лучших ходов
        const topMoves = possibleMoves.slice(0, Math.min(possibleMoves.length, 3)); // Берем до 3 лучших
        return topMoves[Math.floor(Math.random() * topMoves.length)];
    }

    // --- Вспомогательная функция для поиска выигрышного/блокирующего хода ---
    function findWinningMove(player) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === EMPTY && !bombLocations.has(`${r}-${c}`)) {
                    board[r][c] = player; // Временно ставим фигуру
                    if (checkWin(player)) {
                        board[r][c] = EMPTY; // Возвращаем как было
                        return { row: r, col: c };
                    }
                    board[r][c] = EMPTY; // Возвращаем как было
                }
            }
        }
        return null; // Нет выигрышного хода
    }

     // --- Вспомогательная функция для поиска хода, создающего угрозу (3 в ряд) ---
     function findThreatMove(player, onlyExisting = false) {
         for (let r = 0; r < ROWS; r++) {
             for (let c = 0; c < COLS; c++) {
                  // Ищем пустую клетку, не бомбу
                 if (board[r][c] === EMPTY && !bombLocations.has(`${r}-${c}`)) {
                     board[r][c] = player; // Временно ставим фигуру
                     // Проверяем, создает ли этот ход линию из 3-х с возможностью продления до 4-х
                     if (createsPotentialWin(r, c, player)) {
                         board[r][c] = EMPTY; // Возвращаем как было
                         return { row: r, col: c };
                     }
                     board[r][c] = EMPTY; // Возвращаем как было
                 }
                 // Если ищем только существующую угрозу - проверяем текущие фигуры
                 else if (onlyExisting && board[r][c] === player){
                     if (createsPotentialWin(r, c, player, true)) {
                         // Нашли существующую угрозу. Вернем координаты фигуры, создающей ее
                         // (хотя для блокировки нужна пустая клетка рядом)
                         // Эта логика требует доработки, если нужна именно блокировка угрозы
                         // Проще использовать findWinningMove для игрока, чтобы найти куда ставить блок
                     }
                 }
             }
         }
         return null;
     }

     // --- Проверка, создает ли ход (r, c) потенциальную линию для победы ---
     function createsPotentialWin(r, c, player, checkExisting = false) {
         const directions = [
             { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 }
         ];

         for (const { dr, dc } of directions) {
             let count = 1;
             let openEnds = 0;

             // Проверяем в одном направлении
             for (let i = 1; i < WIN_LENGTH; i++) {
                 const nr = r + i * dr;
                 const nc = c + i * dc;
                 if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                     count++;
                 } else if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === EMPTY && !bombLocations.has(`${nr}-${nc}`)) {
                     openEnds++;
                     break; // Достаточно одного открытого конца
                 } else {
                     break; // Препятствие или граница
                 }
             }

             // Проверяем в противоположном направлении
             for (let i = 1; i < WIN_LENGTH; i++) {
                 const nr = r - i * dr;
                 const nc = c - i * dc;
                 if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                     count++;
                 } else if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === EMPTY && !bombLocations.has(`${nr}-${nc}`)) {
                      openEnds++;
                      break; // Достаточно одного открытого конца
                 } else {
                     break; // Препятствие или граница
                 }
             }

             // Если у нас есть линия из WIN_LENGTH - 1 фигур и хотя бы один открытый конец
             if (count === WIN_LENGTH - 1 && openEnds >= 1) {
                 return true; // Нашли угрозу (потенциальную победу)
             }
         }
         return false;
     }


    // --- Стратегическая оценка клетки ---
    function calculateStrategicScore(r, c) {
        let score = 0;
        // Приоритет центральным клеткам (немного смещено из-за нечетных размеров)
        const centerR = Math.floor(ROWS / 2);
        const centerC = Math.floor(COLS / 2);
        score -= Math.abs(r - centerR) + Math.abs(c - centerC); // Чем ближе к центру, тем меньше штраф

        // Добавляем очки за соседство со своими фигурами
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    if (board[nr][nc] === BOT) score += 2; // Бонус за соседа-бота
                    // Небольшой штраф за соседство с игроком (менее важно, чем своя фигура)
                    // else if (board[nr][nc] === PLAYER) score -= 1;
                }
            }
        }
        return score;
    }

    // --- Проверка Победителя ---
    function checkWin(player) {
        const directions = [
            { dr: 0, dc: 1 }, // Горизонталь
            { dr: 1, dc: 0 }, // Вертикаль
            { dr: 1, dc: 1 }, // Диагональ \
            { dr: 1, dc: -1 } // Диагональ /
        ];

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === player) {
                    for (const { dr, dc } of directions) {
                        const winningCells = [{ row: r, col: c }];
                        let count = 1;
                        for (let i = 1; i < WIN_LENGTH; i++) {
                            const nr = r + i * dr;
                            const nc = c + i * dc;
                            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                                winningCells.push({ row: nr, col: nc });
                                count++;
                            } else {
                                break; // Прервать проверку в этом направлении
                            }
                        }
                        if (count === WIN_LENGTH) {
                             // Проверяем, не идет ли линия дальше (для корректной подсветки только 4)
                            // Эта проверка не обязательна, но делает подсветку точнее
                            // if (winningCells.length > WIN_LENGTH) {
                            //    winningCells = winningCells.slice(0, WIN_LENGTH);
                            // }
                            return { winner: player, winningCells: winningCells };
                        }
                    }
                }
            }
        }
        return null; // Нет победителя
    }

    // --- Проверка Ничьей ---
    function checkDraw() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                // Если есть пустая ячейка, которая НЕ бомба, игра не закончена
                if (board[r][c] === EMPTY && !bombLocations.has(`${r}-${c}`)) {
                    return false;
                }
            }
        }
        // Если дошли сюда, все не-бомбовые ячейки заняты, и никто не выиграл
        return true;
    }

    // --- Завершение Игры ---
    function endGame(winner, winningCells = []) {
        gameOver = true;
        isBotThinking = false; // Остановить любые "раздумья"

        if (winner === 'draw') {
            updateStatusMessage('Ничья!');
        } else if (winner === PLAYER || winner === BOT) {
            updateStatusMessage(`Победил ${winner === PLAYER ? 'Игрок' : 'Бот'} (${winner})!`);
            if (winner === PLAYER) playerScore++;
            else botScore++;
            updateScoreDisplay();
            highlightWin(winningCells);
        }

        newGameButton.disabled = false; // Разрешаем начать новую игру
    }

    // --- Подсветка Выигрышной Линии ---
    function highlightWin(cells) {
        cells.forEach(({ row, col }) => {
            const cellElement = getCellElement(row, col);
            cellElement?.classList.add('win-cell');
        });
    }

     // --- Обновление Вида Ячейки ---
     function updateCell(row, col, value) {
         const cellElement = getCellElement(row, col);
         if (cellElement) {
             cellElement.classList.remove('x', 'o', 'bomb-revealed', 'win-cell'); // Убираем все классы состояния
             cellElement.textContent = ''; // Очищаем содержимое

             if (value === PLAYER) {
                 cellElement.classList.add('x');
                 cellElement.textContent = PLAYER;
             } else if (value === BOT) {
                 cellElement.classList.add('o');
                 cellElement.textContent = BOT;
             } else if (value === EMPTY) {
                 // Просто оставляем пустой
             }
             // Бомбы не отображаются здесь напрямую
         }
     }

    // --- Получение DOM-элемента ячейки ---
    function getCellElement(row, col) {
        return boardElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }


    // --- Обновление Статуса ---
    function updateStatusMessage(message) {
        statusMessageElement.textContent = message;
    }

    // --- Обновление Счета ---
    function updateScoreDisplay() {
        playerScoreElement.textContent = playerScore;
        botScoreElement.textContent = botScore;
    }

    // --- Слушатель Кнопки "Новая Игра" ---
    newGameButton.addEventListener('click', initializeGame);

    // --- Первый Запуск ---
    initializeGame();

    // --- Опционально: Интеграция с Telegram ---
    // if (window.Telegram && window.Telegram.WebApp) {
    //     window.Telegram.WebApp.ready();
    //     // Можно добавить кнопки или другие взаимодействия с Telegram UI
    //     // window.Telegram.WebApp.MainButton.setText("Закрыть игру").show().onClick(() => window.Telegram.WebApp.close());
    // }
});
