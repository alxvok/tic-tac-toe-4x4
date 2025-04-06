document.addEventListener('DOMContentLoaded', () => {
    // --- Константы и Настройки ---
    const ROWS = 8; const COLS = 6; const WIN_LENGTH = 4; const BOMB_COUNT = 8;
    const PLAYER = 'X'; const BOT = 'O'; const BOMB = '💣'; const EMPTY = '';

    // --- Элементы DOM ---
    const gameContainer = document.querySelector('.game-container'); // Контейнер для добавления класса
    const boardElement = document.getElementById('game-board');
    const statusMessageElement = document.getElementById('status-message');
    const playerScoreElement = document.getElementById('player-score');
    const botScoreElement = document.getElementById('bot-score');
    const newGameButton = document.getElementById('new-game-button');

    // --- Состояние игры ---
    let board = []; let bombLocations = new Set();
    let currentPlayer = PLAYER; let gameOver = false;
    let playerScore = 0; let botScore = 0;
    let isBotThinking = false;

    // --- Инициализация Игры ---
    function initializeGame() {
        if (!gameContainer || !boardElement || !statusMessageElement || !playerScoreElement || !botScoreElement || !newGameButton) {
            console.error("Ошибка: Не найдены все необходимые DOM-элементы!"); return;
        }

        board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
        bombLocations.clear(); gameOver = false; isBotThinking = false; currentPlayer = PLAYER;
        gameContainer.classList.remove('game-over-active'); // Убираем класс для анимации кнопки

        placeBombs(); renderBoard();
        updateStatusMessage(`Ход игрока (${PLAYER})`);
        // Обновляем счет без анимации при старте
        updateScoreDisplay(false);
        newGameButton.disabled = true;
        console.log("Игра инициализирована (8x6). Бомбы:", Array.from(bombLocations));
    }

    // --- Размещение Бомб ---
    function placeBombs() {
        let bombsPlaced = 0;
        const maxBombs = ROWS * COLS;
        if (BOMB_COUNT >= maxBombs) {
            console.warn("Слишком много бомб!");
             // Заполняем почти все поле бомбами, оставляя 1-2 пустых места
             let safeSpots = 2;
             for(let r = 0; r < ROWS; r++) {
                 for (let c = 0; c < COLS; c++) {
                     if (safeSpots > 0 && Math.random() > 0.8) { // Даем шанс оставить место пустым
                         safeSpots--;
                     } else {
                        const key = `${r}-${c}`;
                        bombLocations.add(key);
                        bombsPlaced++;
                     }
                 }
             }
            return;
        }

        while (bombsPlaced < BOMB_COUNT) {
            const row = Math.floor(Math.random() * ROWS);
            const col = Math.floor(Math.random() * COLS);
            const key = `${row}-${col}`;
            if (!bombLocations.has(key)) {
                bombLocations.add(key); bombsPlaced++;
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
                cell.className = 'cell'; // Сразу ставим базовый класс
                cell.dataset.row = r; cell.dataset.col = c;
                const cellValue = board[r][c];
                if (cellValue === PLAYER) { cell.classList.add('x'); cell.textContent = PLAYER; }
                else if (cellValue === BOT) { cell.classList.add('o'); cell.textContent = BOT; }
                cell.addEventListener('click', handleCellClick);
                boardElement.appendChild(cell);
            }
        }
    }

    // --- Обработка Клика по Ячейке ---
    function handleCellClick(event) {
        if (gameOver || isBotThinking || currentPlayer !== PLAYER) return;
        const cell = event.target.closest('.cell'); // Ищем ближайший .cell, даже если клик был по иконке внутри
        if (!cell) return;
        const row = parseInt(cell.dataset.row); const col = parseInt(cell.dataset.col);
        if (isNaN(row) || isNaN(col) || row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
        const bombKey = `${row}-${col}`;
        if (board[row][col] !== EMPTY || cell.classList.contains('bomb-revealed')) return;

        if (bombLocations.has(bombKey)) {
            triggerBomb(row, col, PLAYER);
             if (!gameOver) {
                 switchPlayer(); isBotThinking = true;
                 updateStatusMessage('Бот думает...');
                 setTimeout(botMove, 600); // Задержка перед ходом бота
             }
        } else {
            makeMove(row, col, PLAYER);
        }
    }

     // --- Совершение Хода (без бомб) ---
     function makeMove(row, col, player) {
        if (gameOver || board[row][col] !== EMPTY) return false;
        board[row][col] = player; updateCell(row, col, player);
        const winInfo = checkWin(player);
        if (winInfo) { endGame(player, winInfo.winningCells); }
        else if (checkDraw()) { endGame('draw'); }
        else {
            switchPlayer();
            if (player === PLAYER && !gameOver) {
                 isBotThinking = true; updateStatusMessage('Бот думает...');
                 setTimeout(botMove, Math.random() * 500 + 300);
             } else if (player === BOT && !gameOver) {
                 updateStatusMessage(`Ход игрока (${PLAYER})`);
             }
        }
        return true;
    }

    // --- Активация Бомбы ---
    function triggerBomb(row, col, triggerPlayer) {
        console.log(`Бомба ${row}-${col} игроком ${triggerPlayer}`);
        const bombCell = getCellElement(row, col);
        if (bombCell) {
             bombCell.textContent = BOMB;
             bombCell.classList.add('bomb-revealed', 'exploded');
            setTimeout(() => bombCell?.classList.remove('exploded'), 600);
        }
        bombLocations.delete(`${row}-${col}`); board[row][col] = EMPTY;
        // Очистка соседей
        for (let rOffset = -1; rOffset <= 1; rOffset++) {
            for (let cOffset = -1; cOffset <= 1; cOffset++) {
                if (rOffset === 0 && cOffset === 0) continue;
                const nr = row + rOffset; const nc = col + cOffset;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                    if (board[nr][nc] === PLAYER || board[nr][nc] === BOT) {
                         board[nr][nc] = EMPTY; updateCell(nr, nc, EMPTY);
                         const clearedCell = getCellElement(nr, nc);
                         clearedCell?.classList.add('exploded');
                         setTimeout(() => clearedCell?.classList.remove('exploded'), 600);
                    }
                }
            }
        }
        // Статус обновляется позже
    }

    // --- Переключение Игрока ---
    function switchPlayer() { if (!gameOver) currentPlayer = (currentPlayer === PLAYER) ? BOT : PLAYER; }

    // --- Ход Бота ---
    function botMove() {
        if (gameOver || currentPlayer !== BOT) { isBotThinking = false; return; }
        updateStatusMessage('Бот ходит...');
        let bestMove = findBestMove();
        if (bestMove) {
            const { row, col } = bestMove; const bombKey = `${row}-${col}`;
            // Небольшая задержка перед действием
            setTimeout(() => {
                 if (gameOver) { isBotThinking = false; return; } // Проверка на конец игры во время паузы
                if (bombLocations.has(bombKey)) {
                    triggerBomb(row, col, BOT);
                    if (!gameOver) {
                        switchPlayer(); isBotThinking = false;
                        updateStatusMessage(`💥 Бум! Бот попал на бомбу! ${`Ход игрока (${PLAYER})`}`);
                    } else { isBotThinking = false; }
                } else {
                    const moveMade = makeMove(row, col, BOT);
                    // isBotThinking снимается только ПОСЛЕ успешного хода и если игра не окончена
                    if(moveMade && !gameOver){ isBotThinking = false; }
                    else { isBotThinking = false; } // Снять и если ход не удался или игра окончена
                }
            }, 200); // Пауза перед отображением хода
        } else {
            console.error("Бот не нашел ход!"); isBotThinking = false;
            if (!checkDraw() && !gameOver) { endGame('draw'); }
            else if (!gameOver) { endGame('draw'); }
        }
    }

    // --- Поиск лучшего хода для Бота (без изменений в логике ИИ) ---
    function findBestMove() {
        let move = findWinningMove(BOT); if (move) return move;
        move = findWinningMove(PLAYER); if (move) return move;
        move = findThreatMove(BOT); if (move) return move;
        let playerThreat = findThreatMove(PLAYER);
        if (playerThreat) { let botOwnThreat = findThreatMove(BOT, true); if(!botOwnThreat) return playerThreat; }
        let possibleMoves = [];
        for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) {
                const key = `${r}-${c}`; const cellElem = getCellElement(r, c);
                if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
                     possibleMoves.push({ row: r, col: c, score: calculateStrategicScore(r, c) });
                }}}
        if (possibleMoves.length === 0) {
             let bombCells = [];
             for(const key of bombLocations) { const [r_str, c_str] = key.split('-'); const r = parseInt(r_str); const c = parseInt(c_str); if(board[r][c] === EMPTY) { bombCells.push({ row: r, col: c }); }}
             if (bombCells.length > 0) { console.log("Бот идет на бомбу."); return bombCells[Math.floor(Math.random() * bombCells.length)]; }
             else { console.error("Нет ходов и бомб?"); return null; }
        }
        possibleMoves.sort((a, b) => b.score - a.score);
        const topN = Math.min(possibleMoves.length, 3);
        return possibleMoves[Math.floor(Math.random() * topN)];
    }
    function findWinningMove(player) { /* ... без изменений ... */
        for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) {
                 const key = `${r}-${c}`; const cellElem = getCellElement(r, c);
                 if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
                    board[r][c] = player; if (checkWin(player)) { board[r][c] = EMPTY; return { row: r, col: c }; }
                    board[r][c] = EMPTY; }}} return null; }
    function findThreatMove(player, onlyExisting = false) { /* ... без изменений ... */
        let bestThreatMove = null; let maxOwnPieces = -1;
        for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) {
            const key = `${r}-${c}`; const cellElem = getCellElement(r, c);
            if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) {
                if (onlyExisting) continue; board[r][c] = player; const potentialWinInfo = createsPotentialWin(r, c, player);
                if (potentialWinInfo && potentialWinInfo.count > maxOwnPieces) { maxOwnPieces = potentialWinInfo.count; bestThreatMove = { row: r, col: c }; }
                board[r][c] = EMPTY;
            } else if (onlyExisting && board[r][c] === player) {
                const potentialWinInfo = createsPotentialWin(r, c, player, true);
                if (potentialWinInfo && potentialWinInfo.count > maxOwnPieces) { maxOwnPieces = potentialWinInfo.count; }}}}
        if (onlyExisting) return maxOwnPieces >= WIN_LENGTH - 1 ? true : null; return bestThreatMove; }
    function createsPotentialWin(r, c, player, checkExistingOnly = false) { /* ... без изменений ... */
         const directions = [ { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 } ]; let bestPotential = null;
         for (const { dr, dc } of directions) { let count = 1; let openEnds = 0;
             for (let i = 1; i < WIN_LENGTH; i++) { const nr = r + i * dr; const nc = c + i * dc; if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break; const nKey = `${nr}-${nc}`; const nCellElem = getCellElement(nr, nc); if (board[nr][nc] === player) count++; else if (board[nr][nc] === EMPTY && !bombLocations.has(nKey) && (!nCellElem || !nCellElem.classList.contains('bomb-revealed'))) { openEnds++; break; } else break; }
             for (let i = 1; i < WIN_LENGTH; i++) { const nr = r - i * dr; const nc = c - i * dc; if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break; const nKey = `${nr}-${nc}`; const nCellElem = getCellElement(nr, nc); if (board[nr][nc] === player) count++; else if (board[nr][nc] === EMPTY && !bombLocations.has(nKey) && (!nCellElem || !nCellElem.classList.contains('bomb-revealed'))) { openEnds++; break; } else break; }
             if ((count === WIN_LENGTH - 1 && openEnds >= 1) || (count === WIN_LENGTH - 2 && openEnds >= 2)) { if (!bestPotential || count > bestPotential.count) { bestPotential = { count, openEnds }; } }
              if (checkExistingOnly && bestPotential) return bestPotential; } return bestPotential; }
    function calculateStrategicScore(r, c) { /* ... без изменений ... */
        let score = 0; const centerR = (ROWS - 1) / 2.0; const centerC = (COLS - 1) / 2.0; score -= (Math.abs(r - centerR) + Math.abs(c - centerC)) * 0.5;
        board[r][c] = BOT; const botThreatInfo = createsPotentialWin(r, c, BOT); if (botThreatInfo) { if (botThreatInfo.count === WIN_LENGTH - 1) score += 50; if (botThreatInfo.count === WIN_LENGTH - 2 && botThreatInfo.openEnds >= 2) score += 25; }
        board[r][c] = PLAYER; const playerThreatInfo = createsPotentialWin(r, c, PLAYER); if (playerThreatInfo) { if (playerThreatInfo.count === WIN_LENGTH - 1) score += 40; if (playerThreatInfo.count === WIN_LENGTH - 2 && playerThreatInfo.openEnds >= 2) score += 20; }
        board[r][c] = EMPTY;
        for (let dr = -1; dr <= 1; dr++) { for (let dc = -1; dc <= 1; dc++) { if (dr === 0 && dc === 0) continue; const nr = r + dr; const nc = c + dc; if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) { if (board[nr][nc] === BOT) score += 2; else if (board[nr][nc] === PLAYER) score += 1; }}} return score; }

    // --- Проверка Победителя ---
    function checkWin(player) { /* ... без изменений ... */
        const directions = [ { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 } ];
        for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) { if (board[r][c] === player) {
            for (const { dr, dc } of directions) { const winningCells = [{ row: r, col: c }];
                for (let i = 1; i < WIN_LENGTH; i++) { const nr = r + i * dr; const nc = c + i * dc; if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) { winningCells.push({ row: nr, col: nc }); } else { break; } }
                if (winningCells.length === WIN_LENGTH) { return { winner: player, winningCells: winningCells }; }}}}} return null; }

    // --- Проверка Ничьей ---
    function checkDraw() { /* ... без изменений ... */
        for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) { const key = `${r}-${c}`; const cellElem = getCellElement(r,c); if (board[r][c] === EMPTY && !bombLocations.has(key) && (!cellElem || !cellElem.classList.contains('bomb-revealed'))) { return false; }}}
        console.log("Ничья: ходов нет."); return true; }

    // --- Завершение Игры ---
    function endGame(winner, winningCells = []) {
        gameOver = true; isBotThinking = false;
        gameContainer?.classList.add('game-over-active'); // Добавляем класс для анимации кнопки

        if (winner === 'draw') { updateStatusMessage('Ничья!'); }
        else if (winner === PLAYER || winner === BOT) {
            updateStatusMessage(`Победил ${winner === PLAYER ? 'Игрок' : 'Бот'} (${winner})!`);
            if (winner === PLAYER) playerScore++; else botScore++;
            updateScoreDisplay(true); // Обновляем счет С АНИМАЦИЕЙ
            highlightWin(winningCells);
        }
        revealAllBombs();
        newGameButton.disabled = false;
    }

    // --- Подсветка Выигрышной Линии ---
    function highlightWin(cells) { cells.forEach(({ row, col }) => { getCellElement(row, col)?.classList.add('win-cell'); }); }

    // --- Показать все оставшиеся бомбы ---
    function revealAllBombs() {
        bombLocations.forEach(key => {
            const [r_str, c_str] = key.split('-'); const r = parseInt(r_str); const c = parseInt(c_str);
            const cellElement = getCellElement(r, c);
            if (cellElement && !cellElement.classList.contains('bomb-revealed')) {
                cellElement.textContent = BOMB; cellElement.classList.add('bomb-revealed');
            } }); }

     // --- Обновление Вида Ячейки ---
     function updateCell(row, col, value) { /* ... без изменений ... */
         const cellElement = getCellElement(row, col); if (!cellElement) return;
         const isRevealedBomb = cellElement.classList.contains('bomb-revealed');
         const isWinCell = cellElement.classList.contains('win-cell');
         cellElement.className = 'cell'; cellElement.textContent = '';
         cellElement.dataset.row = row; cellElement.dataset.col = col;
         if (isRevealedBomb) { cellElement.classList.add('bomb-revealed'); cellElement.textContent = BOMB; }
         if (isWinCell) { cellElement.classList.add('win-cell'); }
         if (value === PLAYER) { cellElement.classList.add('x'); cellElement.textContent = PLAYER; }
         else if (value === BOT) { cellElement.classList.add('o'); cellElement.textContent = BOT; } }

    // --- Получение DOM-элемента ячейки ---
    function getCellElement(row, col) { if (!boardElement) return null; return boardElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`); }

    // --- Обновление Статуса ---
    function updateStatusMessage(message) { if (statusMessageElement) { statusMessageElement.textContent = message; } }

    // --- ИЗМЕНЕННОЕ Обновление Счета с Анимацией ---
    function updateScoreDisplay(animate = false) {
        if (!playerScoreElement || !botScoreElement) return;

        // Функция для обновления одного элемента счета
        const updateElement = (element, score) => {
            if (element.textContent !== score.toString()) { // Обновляем только если значение изменилось
                 if (animate) {
                     element.classList.add('updated'); // Добавляем класс для анимации
                     setTimeout(() => {
                        element.textContent = score; // Обновляем текст ПОСЛЕ добавления класса
                        setTimeout(() => {
                           element.classList.remove('updated'); // Убираем класс через некоторое время
                        }, 300); // Длительность подсветки/увеличения
                     }, 50); // Небольшая задержка перед обновлением текста для срабатывания transition
                 } else {
                    element.textContent = score; // Обновляем без анимации
                 }
            }
        };

        updateElement(playerScoreElement, playerScore);
        updateElement(botScoreElement, botScore);
    }

    // --- Слушатель Кнопки "Новая Игра" ---
    if (newGameButton) { newGameButton.addEventListener('click', initializeGame); }
    else { console.error("Кнопка 'Новая игра' не найдена!"); }

    // --- Первый Запуск ---
    initializeGame();

    // --- Опционально: Интеграция с Telegram ---
    // try { if (window.Telegram && window.Telegram.WebApp) { window.Telegram.WebApp.ready(); console.log("Telegram WebApp SDK initialized"); } } catch (e) { console.error("Telegram WebApp SDK error:", e); }

}); // Конец DOMContentLoaded
