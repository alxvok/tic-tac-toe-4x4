document.addEventListener('DOMContentLoaded', () => {
    // --- Константы и Настройки ---
    const ROWS = 8;
    const COLS = 6;
    const WIN_LENGTH = 4;
    const BOMB_COUNT = 8;
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
    let board = [];
    let bombLocations = new Set();
    let currentPlayer = PLAYER;
    let gameOver = false;
    let playerScore = 0;
    let botScore = 0;
    let isBotThinking = false; // Ключевой флаг для блокировки кликов

    // --- Инициализация Игры ---
    function initializeGame() {
        if (!boardElement || !statusMessageElement || !playerScoreElement || !botScoreElement || !newGameButton) {
            console.error("Ошибка: Не найдены все необходимые DOM-элементы!");
            return;
        }

        board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
        bombLocations.clear();
        gameOver = false;
        isBotThinking = false;
        currentPlayer = PLAYER;

        placeBombs();
        renderBoard();
        // Класс 'thinking' НЕ добавляем/удаляем
        updateStatusMessage(`Ход игрока (${PLAYER})`);
        updateScoreDisplay();
        newGameButton.disabled = true;
        console.log("Игра инициализирована (8x6). Бомбы:", Array.from(bombLocations));
    }

    // --- Размещение Бомб ---
    function placeBombs() {
        let bombsPlaced = 0;
        if (BOMB_COUNT >= ROWS * COLS) {
            console.warn("Количество бомб слишком велико!");
            // Ограничиваем, чтобы избежать бесконечного цикла
            const maxBombs = ROWS * COLS -1;
             while (bombsPlaced < maxBombs) {
                 const row = Math.floor(Math.random() * ROWS);
                 const col = Math.floor(Math.random() * COLS);
                 const key = `${row}-${col}`;
                 if (!bombLocations.has(key)) {
                     bombLocations.add(key);
                     bombsPlaced++;
                 }
             }
            return;
        }

        while (bombsPlaced < BOMB_COUNT) {
            const row = Math.floor(Math.random() * ROWS);
            const col = Math.floor(Math.random() * COLS);
            const key = `${row}-${col}`;
            if (!bombLocations.has(key)) {
                bombLocations.add(key);
                bombsPlaced++;
            }
        }
    }

    // --- Отрисовка Поля ---
    function renderBoard() {
        boardElement.innerHTML = '';
        boardElement.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;

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

                cell.addEventListener('click', handleCellClick);
                boardElement.appendChild(cell);
            }
        }
    }

    // --- Обработка Клика по Ячейке ---
    function handleCellClick(event) {
        // Блокируем клик, если игра окончена, ходит бот (isBotThinking=true) или не ход игрока
        if (gameOver || isBotThinking || currentPlayer !== PLAYER) return;

        const cell = event.target;
        if (!cell.classList.contains('cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (isNaN(row) || isNaN(col) || row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

        const bombKey = `${row}-${col}`;

        // Проверяем, что ячейка пуста (фигуры нет)
        // и что это не уже взорванная бомба (на всякий случай)
        if (board[row][col] !== EMPTY || cell.classList.contains('bomb-revealed')) return;


        if (bombLocations.has(bombKey)) {
            triggerBomb(row, col, PLAYER);
             if (!gameOver) {
                 // Сразу переключаем игрока и запускаем бота
                 switchPlayer();
                 isBotThinking = true; // Блокируем клики игрока
                 updateStatusMessage('Бот думает...'); // Сообщаем о начале раздумий
                 setTimeout(botMove, 600); // Задержка перед фактическим ходом
             }
        } else {
            // Обычный ход игрока
            makeMove(row, col, PLAYER);
            // Запуск бота произойдет внутри makeMove, если игра продолжается
        }
    }

     // --- Совершение Хода (без бомб) ---
     function makeMove(row, col, player) {
        // Класс 'thinking' НЕ трогаем
        if (gameOver || board[row][col] !== EMPTY) return false;

        board[row][col] = player;
        updateCell(row, col, player);

        const winInfo = checkWin(player);
        if (winInfo) {
            endGame(player, winInfo.winningCells);
        } else if (checkDraw()) {
            endGame('draw');
        } else {
            switchPlayer();
            if (player === PLAYER && !gameOver) { // Ход игрока завершен, запускаем бота
                 isBotThinking = true; // Блокируем клики
                 updateStatusMessage('Бот думает...');
                 // boardElement?.classList.add('thinking'); // <<< УДАЛЕНО
                 setTimeout(botMove, Math.random() * 500 + 300);
             } else if (player === BOT && !gameOver) { // Ход бота завершен
                 // isBotThinking уже будет false (установлен в botMove)
                 updateStatusMessage(`Ход игрока (${PLAYER})`);
             }
        }
        return true;
    }


    // --- Активация Бомбы ---
    function triggerBomb(row, col, triggerPlayer) {
        console.log(`Бомба взорвана в ${row}-${col} игроком ${triggerPlayer}`);
        const bombCell = getCellElement(row, col);
        if (bombCell) {
             bombCell.textContent = BOMB;
             bombCell.classList.add('bomb-revealed'); // Показываем и оставляем
             bombCell.classList.add('exploded'); // Анимация взрыва
            setTimeout(() => {
                bombCell?.classList.remove('exploded'); // Убираем только класс анимации
            }, 600); // Длительность анимации
        }

        bombLocations.delete(`${row}-${col}`); // Удаляем из активных
        board[row][col] = EMPTY; // Клетка становится пустой (но визуально занята бомбой)

        // Очищаем соседей
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            for (let cOffset = -1; cOffset <= 1; cOffset++) {
                if (rOffset === 0 && cOffset === 0) continue;
                const nr = row + rOffset;
                const nc = col + cOffset;

                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    const neighborKey = `${nr}-${nc}`;
                    // Стираем только X и O
                    if (board[nr][nc] === PLAYER || board[nr][nc] === BOT) {
                         board[nr][nc] = EMPTY;
                         updateCell(nr, nc, EMPTY);
                         const clearedCell = getCellElement(nr, nc);
                         clearedCell?.classList.add('exploded'); // Анимация очистки
                         setTimeout(() => clearedCell?.classList.remove('exploded'), 600);
                    }
                }
            }
        }
        // Статус обновляется после вызова triggerBomb (в handleCellClick или botMove)
        // updateStatusMessage(`💥 Бум! ...`); // Можно добавить сюда, если нужно немедленно
    }


    // --- Переключение Игрока ---
    function switchPlayer() {
         if (gameOver) return;
        currentPlayer = (currentPlayer === PLAYER) ? BOT : PLAYER;
    }

    // --- Ход Бота ---
    function botMove() {
        if (gameOver || currentPlayer !== BOT) {
            isBotThinking = false; // Снимаем блокировку, если ход прерван
            // boardElement?.classList.remove('thinking'); // <<< УДАЛЕНО
            return;
        }

        // boardElement?.classList.add('thinking'); // <<< УДАЛЕНО (но isBotThinking все еще true)
        updateStatusMessage('Бот ходит...'); // Меняем статус с "думает" на "ходит"

        let bestMove = findBestMove();

        if (bestMove) {
            const { row, col } = bestMove;
            const bombKey = `${row}-${col}`;

            // Имитация небольшой задержки перед фактическим действием на поле
            setTimeout(() => {
                 if (gameOver) { // Перепроверка на случай завершения игры во время задержки
                     isBotThinking = false;
                     return;
                 }

                if (bombLocations.has(bombKey)) {
                    triggerBomb(row, col, BOT);
                    if (!gameOver) {
                        switchPlayer(); // Ход перешел игроку
                        isBotThinking = false; // Разблокируем клики
                        updateStatusMessage(`💥 Бум! Бот попал на бомбу! ${`Ход игрока (${PLAYER})`}`);
                    } else {
                         isBotThinking = false; // Игра окончена
                    }
                } else {
                    // Обычный ход бота
                    const moveMade = makeMove(row, col, BOT);
                    // Флаг isBotThinking будет снят *только если* ход был сделан
                    // и игра не закончилась (это произойдет после makeMove)
                    if(moveMade && !gameOver){
                         isBotThinking = false; // Разблокируем клики ПОСЛЕ успешного хода
                         // Статус для игрока обновится внутри makeMove
                    } else if (!moveMade) {
                        // Если ход не удался (что маловероятно, но возможно)
                        isBotThinking = false;
                        updateStatusMessage(`Ход игрока (${PLAYER})`); // Возвращаем ход игроку
                        console.error("Бот попытался сделать невозможный ход");
                    } else { // gameOver == true
                         isBotThinking = false;
                    }
                }
                 // boardElement?.classList.remove('thinking'); // <<< УДАЛЕНО
            }, 150); // Небольшая пауза (150мс) перед показом хода бота

        } else {
            console.error("Бот не смог найти ход!");
            isBotThinking = false; // Разблокируем в любом случае
            // boardElement?.classList.remove('thinking'); // <<< УДАЛЕНО
            if (!checkDraw() && !gameOver) {
               endGame('draw');
            } else if (!gameOver) {
                // Если checkDraw вернул true, но игра не закончилась, объявляем ничью
                endGame('draw');
            }
        }
    }


    // --- Поиск лучшего хода для Бота (Логика ИИ остается той же) ---
    function findBestMove() {
        // 1. Проверить, может ли бот выиграть следующим ходом
        let move = findWinningMove(BOT);
        if (move) return move;

        // 2. Проверить, нужно ли блокировать выигрышный ход игрока
        move = findWinningMove(PLAYER);
        if (move) return move;

        // 3. Попытаться создать угрозу (WIN_LENGTH - 1 в ряд)
        move = findThreatMove(BOT);
        if (move) return move;

        // 4. Попытаться заблокировать угрозу игрока
        let playerThreat = findThreatMove(PLAYER);
        if (playerThreat) {
             let botOwnThreat = findThreatMove(BOT, true); // Ищем свою существующую угрозу
             if(!botOwnThreat) return playerThreat; // Блокируем, если у бота нет своих планов
        }

        // 5. Занять стратегически важную клетку или случайную безопасную
        let possibleMoves = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const key = `${r}-${c}`;
                const cellElem = getCellElement(r, c);
                // Ищем пустую ячейку, не скрытую и не взорванную бомбу
                if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
                     possibleMoves.push({ row: r, col: c, score: calculateStrategicScore(r, c) });
                }
            }
        }

         if (possibleMoves.length === 0) {
             // Безопасных ходов нет, ищем бомбу для хода
             let bombCells = [];
             for(const key of bombLocations) {
                 const [r_str, c_str] = key.split('-');
                 const r = parseInt(r_str);
                 const c = parseInt(c_str);
                 if(board[r][c] === EMPTY) { // Убедимся, что там не X или O по ошибке
                    bombCells.push({ row: r, col: c });
                 }
             }
             if (bombCells.length > 0) {
                 console.log("Бот вынужден наступить на бомбу.");
                 return bombCells[Math.floor(Math.random() * bombCells.length)];
             } else {
                 console.error("Нет ни безопасных ходов, ни бомб. Ничья?");
                 return null;
             }
         }

        possibleMoves.sort((a, b) => b.score - a.score);
        const topN = Math.min(possibleMoves.length, 3);
        const randomIndex = Math.floor(Math.random() * topN);
        return possibleMoves[randomIndex];
    }

    // --- Вспомогательная функция для поиска выигрышного/блокирующего хода ---
    function findWinningMove(player) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                 const key = `${r}-${c}`;
                 const cellElem = getCellElement(r, c);
                 if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
                    board[r][c] = player;
                    if (checkWin(player)) {
                        board[r][c] = EMPTY;
                        return { row: r, col: c };
                    }
                    board[r][c] = EMPTY;
                }
            }
        }
        return null;
    }

     // --- Вспомогательная функция для поиска хода, создающего угрозу ---
     function findThreatMove(player, onlyExisting = false) {
        let bestThreatMove = null;
        let maxOwnPieces = -1;

         for (let r = 0; r < ROWS; r++) {
             for (let c = 0; c < COLS; c++) {
                  const key = `${r}-${c}`;
                  const cellElem = getCellElement(r, c);

                 if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
                     if (onlyExisting) continue;
                     board[r][c] = player;
                     const potentialWinInfo = createsPotentialWin(r, c, player);
                     if (potentialWinInfo && potentialWinInfo.count > maxOwnPieces) {
                         maxOwnPieces = potentialWinInfo.count;
                         bestThreatMove = { row: r, col: c };
                     }
                     board[r][c] = EMPTY;
                 }
                 else if (onlyExisting && board[r][c] === player) {
                     const potentialWinInfo = createsPotentialWin(r, c, player, true);
                     if (potentialWinInfo && potentialWinInfo.count > maxOwnPieces) {
                        maxOwnPieces = potentialWinInfo.count;
                     }
                 }
             }
         }
         if (onlyExisting) return maxOwnPieces >= WIN_LENGTH - 1 ? true : null;
         return bestThreatMove;
     }

     // --- Проверка, создает ли ход (r, c) потенциальную линию для победы ---
     function createsPotentialWin(r, c, player, checkExistingOnly = false) {
         const directions = [ { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 } ];
         let bestPotential = null;

         for (const { dr, dc } of directions) {
             let count = 1;
             let openEnds = 0;

             // Вперед
             for (let i = 1; i < WIN_LENGTH; i++) {
                 const nr = r + i * dr; const nc = c + i * dc;
                 if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
                 const nKey = `${nr}-${nc}`; const nCellElem = getCellElement(nr, nc);
                 if (board[nr][nc] === player) count++;
                 else if (board[nr][nc] === EMPTY && !bombLocations.has(nKey) && (!nCellElem || !nCellElem.classList.contains('bomb-revealed'))) { openEnds++; break; }
                 else break;
             }
             // Назад
             for (let i = 1; i < WIN_LENGTH; i++) {
                const nr = r - i * dr; const nc = c - i * dc;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
                const nKey = `${nr}-${nc}`; const nCellElem = getCellElement(nr, nc);
                if (board[nr][nc] === player) count++;
                else if (board[nr][nc] === EMPTY && !bombLocations.has(nKey) && (!nCellElem || !nCellElem.classList.contains('bomb-revealed'))) { openEnds++; break; }
                else break;
            }

             if ((count === WIN_LENGTH - 1 && openEnds >= 1) || (count === WIN_LENGTH - 2 && openEnds >= 2)) {
                 if (!bestPotential || count > bestPotential.count) {
                    bestPotential = { count, openEnds };
                 }
             }
              if (checkExistingOnly && bestPotential) return bestPotential;
         }
         return bestPotential;
     }

    // --- Стратегическая оценка клетки ---
    function calculateStrategicScore(r, c) {
        let score = 0;
        const centerR = (ROWS - 1) / 2.0;
        const centerC = (COLS - 1) / 2.0;
        score -= (Math.abs(r - centerR) + Math.abs(c - centerC)) * 0.5; // Центр

        // Оценка угрозы/блокировки (временная установка)
        board[r][c] = BOT;
        const botThreatInfo = createsPotentialWin(r, c, BOT);
        if (botThreatInfo) {
            if (botThreatInfo.count === WIN_LENGTH - 1) score += 50;
            if (botThreatInfo.count === WIN_LENGTH - 2 && botThreatInfo.openEnds >= 2) score += 25;
        }
        board[r][c] = PLAYER;
        const playerThreatInfo = createsPotentialWin(r, c, PLAYER);
         if (playerThreatInfo) {
             if (playerThreatInfo.count === WIN_LENGTH - 1) score += 40;
             if (playerThreatInfo.count === WIN_LENGTH - 2 && playerThreatInfo.openEnds >= 2) score += 20;
         }
        board[r][c] = EMPTY; // Вернуть пустоту

        // Соседи
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr; const nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    if (board[nr][nc] === BOT) score += 2;
                    else if (board[nr][nc] === PLAYER) score += 1;
                }
            }
        }
        return score;
    }

    // --- Проверка Победителя ---
    function checkWin(player) {
        const directions = [ { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 } ];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === player) {
                    for (const { dr, dc } of directions) {
                        const winningCells = [{ row: r, col: c }];
                        for (let i = 1; i < WIN_LENGTH; i++) {
                            const nr = r + i * dr; const nc = c + i * dc;
                            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                                winningCells.push({ row: nr, col: nc });
                            } else { break; }
                        }
                        if (winningCells.length === WIN_LENGTH) {
                            return { winner: player, winningCells: winningCells };
                        }
                    }
                }
            }
        }
        return null;
    }

    // --- Проверка Ничьей ---
    function checkDraw() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const key = `${r}-${c}`;
                const cellElem = getCellElement(r,c);
                if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
                    return false; // Есть доступные ходы
                }
            }
        }
        console.log("Проверка ничьей: ходов не осталось.");
        return true; // Ходов нет
    }

    // --- Завершение Игры ---
    function endGame(winner, winningCells = []) {
        gameOver = true;
        isBotThinking = false; // Снимаем блокировку
        // boardElement?.classList.remove('thinking'); // <<< УДАЛЕНО

        if (winner === 'draw') {
            updateStatusMessage('Ничья!');
        } else if (winner === PLAYER || winner === BOT) {
            updateStatusMessage(`Победил ${winner === PLAYER ? 'Игрок' : 'Бот'} (${winner})!`);
            if (winner === PLAYER) playerScore++;
            else botScore++;
            updateScoreDisplay();
            highlightWin(winningCells);
        }
        revealAllBombs();
        newGameButton.disabled = false;
    }

    // --- Подсветка Выигрышной Линии ---
    function highlightWin(cells) {
        cells.forEach(({ row, col }) => {
            getCellElement(row, col)?.classList.add('win-cell');
        });
    }

    // --- Показать все оставшиеся бомбы ---
    function revealAllBombs() {
        bombLocations.forEach(key => {
            const [r_str, c_str] = key.split('-');
            const r = parseInt(r_str); const c = parseInt(c_str);
            const cellElement = getCellElement(r, c);
            if (cellElement && !cellElement.classList.contains('bomb-revealed')) {
                cellElement.textContent = BOMB;
                cellElement.classList.add('bomb-revealed');
            }
        });
    }

     // --- Обновление Вида Ячейки ---
     function updateCell(row, col, value) {
         const cellElement = getCellElement(row, col);
         if (cellElement) {
             const isRevealedBomb = cellElement.classList.contains('bomb-revealed');
             const isWinCell = cellElement.classList.contains('win-cell'); // Сохраняем класс победы

             // Сброс стилей, кроме базовых и data-*
             cellElement.className = 'cell';
             cellElement.textContent = '';
             cellElement.dataset.row = row;
             cellElement.dataset.col = col;

             if (isRevealedBomb) { // Восстанавливаем вид взорванной бомбы
                 cellElement.classList.add('bomb-revealed');
                 cellElement.textContent = BOMB;
             }
             if (isWinCell) { // Восстанавливаем подсветку победы
                cellElement.classList.add('win-cell');
             }

             // Применяем новый стиль
             if (value === PLAYER) {
                 cellElement.classList.add('x');
                 cellElement.textContent = PLAYER;
             } else if (value === BOT) {
                 cellElement.classList.add('o');
                 cellElement.textContent = BOT;
             }
         }
     }

    // --- Получение DOM-элемента ячейки ---
    function getCellElement(row, col) {
        if (!boardElement) return null;
        return boardElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    }

    // --- Обновление Статуса ---
    function updateStatusMessage(message) {
        if (statusMessageElement) {
            statusMessageElement.textContent = message;
        }
    }

    // --- Обновление Счета ---
    function updateScoreDisplay() {
        if (playerScoreElement && botScoreElement) {
            playerScoreElement.textContent = playerScore;
            botScoreElement.textContent = botScore;
        }
    }

    // --- Слушатель Кнопки "Новая Игра" ---
    if (newGameButton) {
        newGameButton.addEventListener('click', initializeGame);
    } else {
        console.error("Кнопка 'Новая игра' не найдена!");
    }

    // --- Первый Запуск ---
    initializeGame();

    // --- Опционально: Интеграция с Telegram ---
    // try {
    //     if (window.Telegram && window.Telegram.WebApp) {
    //         window.Telegram.WebApp.ready();
    //         console.log("Telegram WebApp SDK initialized");
    //     }
    // } catch (e) { console.error("Telegram WebApp SDK error:", e); }

}); // Конец DOMContentLoaded
