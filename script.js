document.addEventListener('DOMContentLoaded', () => {
    // --- Константы и Настройки ---
    const ROWS = 8;          // Соответствует требованиям
    const COLS = 6;          // Соответствует требованиям
    const WIN_LENGTH = 4;    // Соответствует требованиям
    const BOMB_COUNT = 8;    // Количество бомб для поля 8x6 (можно настроить)
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
        // Проверка наличия элементов перед их использованием
        if (!boardElement || !statusMessageElement || !playerScoreElement || !botScoreElement || !newGameButton) {
            console.error("Ошибка: Не найдены все необходимые DOM-элементы!");
            return; // Прекращаем инициализацию, если что-то не найдено
        }

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
        console.log("Игра инициализирована (8x6). Бомбы:", Array.from(bombLocations)); // Для отладки
    }

    // --- Размещение Бомб ---
    function placeBombs() {
        let bombsPlaced = 0;
        if (BOMB_COUNT >= ROWS * COLS) {
            console.warn("Количество бомб слишком велико для поля!");
            // Можно или уменьшить BOMB_COUNT, или заполнить все поле бомбами
            // пока просто ограничиваем
            while (bombsPlaced < ROWS * COLS - 1) { // Оставляем хотя бы одну не-бомбу
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
        boardElement.innerHTML = ''; // Очищаем поле перед отрисовкой
        // Устанавливаем количество колонок в CSS Grid
        boardElement.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
        // Высота строк определяется --cell-size (можно не указывать grid-auto-rows)

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

                // Убираем старые обработчики (на всякий случай, если renderBoard вызовется снова)
                cell.removeEventListener('click', handleCellClick);
                cell.addEventListener('click', handleCellClick);

                boardElement.appendChild(cell);
            }
        }
    }

    // --- Обработка Клика по Ячейке ---
    function handleCellClick(event) {
        if (gameOver || isBotThinking || currentPlayer !== PLAYER) return;

        const cell = event.target;
        // Доп. проверка, что кликнули именно по ячейке
        if (!cell.classList.contains('cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Проверка корректности координат (на всякий случай)
        if (isNaN(row) || isNaN(col) || row < 0 || row >= ROWS || col < 0 || col >= COLS) {
            console.error("Некорректные координаты ячейки:", cell.dataset);
            return;
        }

        const bombKey = `${row}-${col}`;

        // Проверяем, не является ли ячейка уже занятой (кроме скрытых бомб)
        if (board[row][col] !== EMPTY) return;

        if (bombLocations.has(bombKey)) {
            triggerBomb(row, col, PLAYER);
             if (!gameOver) {
                 // Ход переходит к боту после взрыва
                 switchPlayer();
                 // Небольшая задержка перед ходом бота
                 setTimeout(botMove, 600);
             }
        } else {
            // Обычный ход игрока
            makeMove(row, col, PLAYER);
            // Ход бота запустится внутри makeMove, если игра не окончена
        }
    }

     // --- Совершение Хода (без бомб) ---
     function makeMove(row, col, player) {
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
            if (player === PLAYER && !gameOver) { // Если это был ход игрока, передаем ход боту
                 isBotThinking = true;
                 updateStatusMessage('Бот думает...');
                 setTimeout(botMove, Math.random() * 500 + 300); // 300-800ms
             } else if (player === BOT && !gameOver) { // Если это был ход бота, просто обновляем статус для игрока
                 updateStatusMessage(`Ход игрока (${PLAYER})`);
             }
        }
        return true; // Ход совершен
    }


    // --- Активация Бомбы ---
    function triggerBomb(row, col, triggerPlayer) {
        console.log(`Бомба взорвана в ${row}-${col} игроком ${triggerPlayer}`);
        const bombCell = getCellElement(row, col);
        if (bombCell) {
             bombCell.textContent = BOMB;
             bombCell.classList.add('bomb-revealed'); // Показываем бомбу постоянно
             bombCell.classList.add('exploded'); // Добавляем анимацию взрыва
             // Убираем класс 'exploded' после анимации, но оставляем bomb-revealed
            setTimeout(() => {
                bombCell?.classList.remove('exploded');
            }, 500);
        }

        // Удаляем бомбу из списка активных, чтобы на нее нельзя было нажать снова
        // или чтобы бот ее не выбирал
        bombLocations.delete(`${row}-${col}`);
        // Устанавливаем значение ячейки в EMPTY, чтобы ее нельзя было выбрать, но она была "пустой"
        // Важно: если хотим чтобы ячейка осталась непроходимой, НЕ ставим EMPTY
        // board[row][col] = 'exploded_bomb'; // Можно использовать маркер
        // Оставим пока EMPTY, чтобы бот мог оценить поле после взрыва
        board[row][col] = EMPTY; // Стала пустой и недоступной для клика из-за .bomb-revealed

        // Очищаем соседние ячейки (только X и O)
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            for (let cOffset = -1; cOffset <= 1; cOffset++) {
                if (rOffset === 0 && cOffset === 0) continue;

                const nr = row + rOffset;
                const nc = col + cOffset;

                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    const neighborKey = `${nr}-${nc}`;
                    // Стираем только X и O, не трогаем другие бомбы и пустые клетки
                    if (board[nr][nc] === PLAYER || board[nr][nc] === BOT) {
                         console.log(`Очищена ячейка ${nr}-${nc} взрывом`);
                         board[nr][nc] = EMPTY;
                         updateCell(nr, nc, EMPTY);
                         // Добавить эффект очистки
                         const clearedCell = getCellElement(nr, nc);
                         clearedCell?.classList.add('exploded'); // Кратковременная анимация очистки
                         setTimeout(() => clearedCell?.classList.remove('exploded'), 500);
                    }
                }
            }
        }

        updateStatusMessage(`💥 Бум! ${triggerPlayer === PLAYER ? 'Игрок' : 'Бот'} (${triggerPlayer}) попал на бомбу!`);
        // Переход хода происходит в вызывающей функции (handleCellClick или botMove)
    }


    // --- Переключение Игрока ---
    function switchPlayer() {
         if (gameOver) return;
        currentPlayer = (currentPlayer === PLAYER) ? BOT : PLAYER;
        // Статус обновляется в makeMove или botMove после завершения хода
    }

    // --- Ход Бота ---
    function botMove() {
         if (gameOver || currentPlayer !== BOT) {
             isBotThinking = false;
             return;
         }

         updateStatusMessage('Бот ходит...'); // Обновляем статус перед поиском хода

         // --- Логика ИИ Бота ---
         let bestMove = findBestMove();

         if (bestMove) {
             const { row, col } = bestMove;
             const bombKey = `${row}-${col}`;

             if (bombLocations.has(bombKey)) {
                 triggerBomb(row, col, BOT);
                 // Ход возвращается игроку
                 if (!gameOver) {
                    switchPlayer(); // Вернули ход игроку
                    updateStatusMessage(`Ход игрока (${PLAYER})`);
                 }
             } else {
                 // Обычный ход бота - запустит switchPlayer и обновление статуса внутри
                makeMove(row, col, BOT);
             }
         } else {
             console.error("Бот не смог найти ход! Возможно, ничья или ошибка.");
             if (!checkDraw() && !gameOver) { // Если не ничья и игра не закончена
                endGame('draw'); // Форсируем ничью в этом странном случае
             }
         }
         isBotThinking = false; // Бот закончил ход
    }

    // --- Поиск лучшего хода для Бота (Умный, но сбалансированный) ---
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
        //    (Важно: бот должен блокировать только если у него нет своей немедленной угрозы)
        move = findThreatMove(PLAYER);
        if (move) {
             let botThreat = findThreatMove(BOT, true); // Ищем свою существующую угрозу
             if(!botThreat) return move; // Блокируем, если у бота нет своих планов получше
        }

        // 5. Занять стратегически важную клетку или случайную безопасную
        let possibleMoves = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] === EMPTY && !bombLocations.has(`${r}-${c}`)) {
                    // Убедимся, что на этой клетке нет уже показанной бомбы
                    const cellElem = getCellElement(r, c);
                    if (!cellElem || !cellElem.classList.contains('bomb-revealed')) {
                        possibleMoves.push({ row: r, col: c, score: calculateStrategicScore(r, c) });
                    }
                }
            }
        }

         // Если безопасных ходов нет, бот вынужден наступить на бомбу
         if (possibleMoves.length === 0) {
             let bombCells = [];
             // Собираем все ячейки, которые являются скрытыми бомбами
             for(const key of bombLocations) {
                 const [r_str, c_str] = key.split('-');
                 const r = parseInt(r_str);
                 const c = parseInt(c_str);
                 // Убедимся, что ячейка действительно пуста на доске (не X или O)
                 if(board[r][c] === EMPTY) {
                    bombCells.push({ row: r, col: c });
                 }
             }

             if (bombCells.length > 0) {
                 console.log("Бот вынужден наступить на бомбу.");
                 return bombCells[Math.floor(Math.random() * bombCells.length)];
             } else {
                 // Этого не должно произойти, если checkDraw работает правильно
                 console.error("Нет ни безопасных ходов, ни бомб для бота. Ничья?");
                 return null;
             }
         }

        // Сортируем ходы по стратегической оценке (выше - лучше)
        possibleMoves.sort((a, b) => b.score - a.score);

        // Добавляем немного случайности, выбирая из нескольких лучших
        const topN = Math.min(possibleMoves.length, 3); // Берем до 3 лучших
        const randomIndex = Math.floor(Math.random() * topN);
        return possibleMoves[randomIndex];
    }

    // --- Вспомогательная функция для поиска выигрышного/блокирующего хода ---
    function findWinningMove(player) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                 const key = `${r}-${c}`;
                 const cellElem = getCellElement(r, c);
                 // Ищем пустую ячейку, которая не является скрытой или взорванной бомбой
                 if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
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

     // --- Вспомогательная функция для поиска хода, создающего угрозу (WIN_LENGTH - 1) ---
     function findThreatMove(player, onlyExisting = false) {
        let bestThreatMove = null;
        let maxOwnPieces = -1; // Для выбора лучшей угрозы (где больше своих фигур уже стоит)

         for (let r = 0; r < ROWS; r++) {
             for (let c = 0; c < COLS; c++) {
                  const key = `${r}-${c}`;
                  const cellElem = getCellElement(r, c);
                  // Ищем пустую клетку, не бомбу (скрытую или взорванную)
                 if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
                     if (onlyExisting) continue; // Пропускаем пустые, если ищем только существующие угрозы

                     board[r][c] = player; // Временно ставим фигуру
                     const potentialWinInfo = createsPotentialWin(r, c, player);
                     if (potentialWinInfo && potentialWinInfo.count > maxOwnPieces) {
                         // Нашли ход, создающий угрозу. Приоритет у угрозы с большим числом своих фигур.
                         maxOwnPieces = potentialWinInfo.count;
                         bestThreatMove = { row: r, col: c };
                     }
                     board[r][c] = EMPTY; // Возвращаем как было
                 }
                 // Если ищем существующую угрозу, проверяем ячейки с фигурами 'player'
                 else if (onlyExisting && board[r][c] === player) {
                     const potentialWinInfo = createsPotentialWin(r, c, player, true); // Ищем открытую линию от этой фигуры
                     if (potentialWinInfo && potentialWinInfo.count > maxOwnPieces) {
                        // Нашли существующую угрозу. Запоминаем, что она есть.
                        // Возвращать будем не эту ячейку, а просто факт наличия.
                        // В `findBestMove` нам достаточно знать, что угроза ЕСТЬ.
                        maxOwnPieces = potentialWinInfo.count;
                        // bestThreatMove не обновляем, так как нам нужен ход в пустую клетку
                     }
                 }
             }
         }
          // Если искали только существующую угрозу, возвращаем true/false (или кол-во фигур)
         if (onlyExisting) return maxOwnPieces >= WIN_LENGTH - 1 ? true : null;
         // Иначе возвращаем лучший найденный ход для создания угрозы
         return bestThreatMove;
     }

     // --- Проверка, создает ли ход (r, c) потенциальную линию для победы ---
     // Возвращает { count: число_фигур_в_линии, openEnds: число_открытых_концов } или null
     function createsPotentialWin(r, c, player, checkExistingOnly = false) {
         const directions = [
             { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 }
         ];
         let bestPotential = null;

         for (const { dr, dc } of directions) {
             let count = 1; // Считаем текущую фигуру (или ту, что поставили временно)
             let openEnds = 0;
             let lineCells = [{r,c}]; // Координаты клеток в линии

             // Проверяем в одном направлении
             for (let i = 1; i < WIN_LENGTH; i++) {
                 const nr = r + i * dr;
                 const nc = c + i * dc;
                 if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                     const nKey = `${nr}-${nc}`;
                     const nCellElem = getCellElement(nr, nc);
                     if (board[nr][nc] === player) {
                         count++;
                         lineCells.push({r:nr, c:nc});
                     } else if (board[nr][nc] === EMPTY && !bombLocations.has(nKey) && (!nCellElem || !nCellElem.classList.contains('bomb-revealed'))) {
                         openEnds++;
                         break; // Достаточно одного открытого конца с этой стороны
                     } else {
                         break; // Препятствие или граница
                     }
                 } else {
                     break; // Граница поля
                 }
             }

             // Проверяем в противоположном направлении
             for (let i = 1; i < WIN_LENGTH; i++) {
                 const nr = r - i * dr;
                 const nc = c - i * dc;
                  if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                     const nKey = `${nr}-${nc}`;
                     const nCellElem = getCellElement(nr, nc);
                     if (board[nr][nc] === player) {
                         count++;
                          lineCells.push({r:nr, c:nc});
                     } else if (board[nr][nc] === EMPTY && !bombLocations.has(nKey) && (!nCellElem || !nCellElem.classList.contains('bomb-revealed'))) {
                         openEnds++;
                         break; // Достаточно одного открытого конца с этой стороны
                     } else {
                         break; // Препятствие или граница
                     }
                  } else {
                       break; // Граница поля
                  }
             }

            // Считается угрозой, если есть WIN_LENGTH - 1 своих фигур И хотя бы 1 открытый конец
            // ИЛИ если есть WIN_LENGTH - 2 своих фигур И 2 открытых конца (двойная угроза)
            // ИЛИ если есть WIN_LENGTH - 3 своих фигуры И 2 открытых конца (для блокировки противника тоже полезно)
             if ((count === WIN_LENGTH - 1 && openEnds >= 1) || (count === WIN_LENGTH - 2 && openEnds >= 2)) {
                 // Нашли угрозу. Выбираем лучшую (где больше своих фигур)
                 if (!bestPotential || count > bestPotential.count) {
                    bestPotential = { count, openEnds };
                 }
             }
              // Если проверяем только существующие, нам достаточно найти хотя бы одну угрозу
              if (checkExistingOnly && bestPotential) return bestPotential;
         }
         return bestPotential; // Возвращаем информацию о лучшей найденной угрозе (или null)
     }


    // --- Стратегическая оценка клетки ---
    function calculateStrategicScore(r, c) {
        let score = 0;
        // Приоритет центральным клеткам
        const centerR = (ROWS - 1) / 2.0;
        const centerC = (COLS - 1) / 2.0;
        // Уменьшаем штраф, чтобы не был слишком сильным
        score -= (Math.abs(r - centerR) + Math.abs(c - centerC)) * 0.5;

        // Бонус за создание потенциальных линий (проверка для бота)
        board[r][c] = BOT; // Временно ставим
        const threatInfo = createsPotentialWin(r, c, BOT);
        if (threatInfo) {
            if (threatInfo.count === WIN_LENGTH - 1) score += 50; // Сильная угроза
            if (threatInfo.count === WIN_LENGTH - 2 && threatInfo.openEnds >= 2) score += 25; // Двойная угроза
        }
        board[r][c] = EMPTY; // Убираем

         // Бонус за блокировку потенциальных линий игрока
        board[r][c] = PLAYER; // Временно ставим за игрока
        const playerThreatInfo = createsPotentialWin(r, c, PLAYER);
         if (playerThreatInfo) {
             if (playerThreatInfo.count === WIN_LENGTH - 1) score += 40; // Блокировка важной угрозы
             if (playerThreatInfo.count === WIN_LENGTH - 2 && playerThreatInfo.openEnds >= 2) score += 20; // Блокировка двойной угрозы
         }
        board[r][c] = EMPTY; // Убираем

        // Добавляем очки за соседство со своими фигурами
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    if (board[nr][nc] === BOT) score += 2; // Бонус за соседа-бота
                    else if (board[nr][nc] === PLAYER) score += 1; // Небольшой бонус за соседа-игрока (рядом с ним часто выгодно ставить)
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
                        for (let i = 1; i < WIN_LENGTH; i++) {
                            const nr = r + i * dr;
                            const nc = c + i * dc;
                            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                                winningCells.push({ row: nr, col: nc });
                            } else {
                                break;
                            }
                        }
                        if (winningCells.length === WIN_LENGTH) {
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
                const key = `${r}-${c}`;
                const cellElem = getCellElement(r,c);
                // Если есть пустая ячейка, которая НЕ является скрытой ИЛИ взорванной бомбой
                if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
                    return false; // Есть еще ходы
                }
            }
        }
        // Если дошли сюда, все не-бомбовые ячейки заняты, и никто не выиграл
        console.log("Проверка ничьей: ходов не осталось.");
        return true;
    }

    // --- Завершение Игры ---
    function endGame(winner, winningCells = []) {
        gameOver = true;
        isBotThinking = false;

        if (winner === 'draw') {
            updateStatusMessage('Ничья!');
        } else if (winner === PLAYER || winner === BOT) {
            updateStatusMessage(`Победил ${winner === PLAYER ? 'Игрок' : 'Бот'} (${winner})!`);
            if (winner === PLAYER) playerScore++;
            else botScore++;
            updateScoreDisplay();
            highlightWin(winningCells);
        }

        // Можно показать все оставшиеся бомбы в конце игры
        revealAllBombs();

        newGameButton.disabled = false;
    }

    // --- Подсветка Выигрышной Линии ---
    function highlightWin(cells) {
        cells.forEach(({ row, col }) => {
            const cellElement = getCellElement(row, col);
            cellElement?.classList.add('win-cell');
        });
    }

    // --- Показать все оставшиеся бомбы ---
    function revealAllBombs() {
        bombLocations.forEach(key => {
            const [r_str, c_str] = key.split('-');
            const r = parseInt(r_str);
            const c = parseInt(c_str);
            const cellElement = getCellElement(r, c);
            if (cellElement && !cellElement.classList.contains('bomb-revealed')) {
                 // Показываем только если она еще не была взорвана
                cellElement.textContent = BOMB;
                cellElement.classList.add('bomb-revealed');
                // Можно добавить стиль для "неактивной" показанной бомбы
                // cellElement.style.opacity = '0.6';
            }
        });
    }

     // --- Обновление Вида Ячейки ---
     function updateCell(row, col, value) {
         const cellElement = getCellElement(row, col);
         if (cellElement) {
             // Сначала сбросим все классы и содержимое, кроме базового 'cell' и data-атрибутов
             const isRevealedBomb = cellElement.classList.contains('bomb-revealed');
             cellElement.className = 'cell'; // Очищаем классы
             cellElement.textContent = '';
             // Восстанавливаем data-атрибуты, если они слетели (не должны)
             cellElement.dataset.row = row;
             cellElement.dataset.col = col;
              // Если это была взорванная бомба, восстанавливаем ее класс
             if (isRevealedBomb) {
                 cellElement.classList.add('bomb-revealed');
                 cellElement.textContent = BOMB; // Возвращаем иконку
             }


             if (value === PLAYER) {
                 cellElement.classList.add('x');
                 cellElement.textContent = PLAYER;
             } else if (value === BOT) {
                 cellElement.classList.add('o');
                 cellElement.textContent = BOT;
             }
             // Для EMPTY и BOMB (скрытых) ничего не делаем, они пустые
             // Взорванные бомбы обрабатываются отдельно в triggerBomb и updateCell
         }
     }

    // --- Получение DOM-элемента ячейки ---
    function getCellElement(row, col) {
        // Убедимся, что boardElement существует
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
    // Вызываем initializeGame только после полной загрузки DOM
    initializeGame();

    // --- Опционально: Интеграция с Telegram ---
    // try {
    //     if (window.Telegram && window.Telegram.WebApp) {
    //         window.Telegram.WebApp.ready();
    //         console.log("Telegram WebApp SDK initialized");
    //         // window.Telegram.WebApp.MainButton.setText("Закрыть игру").show().onClick(() => window.Telegram.WebApp.close());
    //     }
    // } catch (e) {
    //     console.error("Telegram WebApp SDK error:", e);
    // }

}); // Конец document.addEventListener('DOMContentLoaded', ... )
