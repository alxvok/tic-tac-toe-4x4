document.addEventListener('DOMContentLoaded', () => {
    // --- Константы и Настройки ---
    const ROWS = 8; const COLS = 6; const WIN_LENGTH = 4; const BOMB_COUNT = 8;
    const PLAYER = 'X'; // Внутренний идентификатор игрока
    const BOT = 'O';    // Внутренний идентификатор бота
    const BOMB = '💣'; const EMPTY = '';

    // --- Элементы DOM ---
    const gameContainer = document.querySelector('.game-container');
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

    // --- Хелпер для получения имени игрока ---
    function getDisplayName(player) {
        return player === PLAYER ? 'Игрок' : 'Бот';
    }

    // --- Инициализация Игры ---
    function initializeGame() {
        // ... (проверки элементов) ...
        if (!gameContainer || !boardElement || !statusMessageElement || !playerScoreElement || !botScoreElement || !newGameButton) { console.error("DOM Error"); return; }

        board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
        bombLocations.clear(); gameOver = false; isBotThinking = false; currentPlayer = PLAYER;
        gameContainer.classList.remove('game-over-active');

        placeBombs(); renderBoard();
        updateStatusMessage(`Ход: ${getDisplayName(currentPlayer)}`); // ИЗМЕНЕНО
        updateScoreDisplay(false);
        newGameButton.disabled = true;
        console.log("Game Initialized (8x6). Bombs:", Array.from(bombLocations));
    }

    // --- Размещение Бомб ---
    function placeBombs() { /* ... без изменений ... */
        let bombsPlaced = 0; const maxBombs = ROWS * COLS; if (BOMB_COUNT >= maxBombs) { console.warn("Too many bombs!"); let safeSpots = 2; for(let r=0; r<ROWS; r++){for(let c=0; c<COLS; c++){if(safeSpots>0&&Math.random()>0.8){safeSpots--;}else{bombLocations.add(`${r}-${c}`);bombsPlaced++;}}}return;} while (bombsPlaced < BOMB_COUNT) { const r = Math.floor(Math.random()*ROWS); const c = Math.floor(Math.random()*COLS); const key = `${r}-${c}`; if (!bombLocations.has(key)) { bombLocations.add(key); bombsPlaced++; }}}

    // --- Отрисовка Поля ---
    function renderBoard() { /* ... без изменений ... */
        boardElement.innerHTML = ''; boardElement.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
        for(let r=0; r<ROWS; r++){for(let c=0; c<COLS; c++){ const cell=document.createElement('div'); cell.className='cell'; cell.dataset.row=r; cell.dataset.col=c; const v=board[r][c]; if(v===PLAYER){cell.classList.add('x');cell.textContent=PLAYER;}else if(v===BOT){cell.classList.add('o');cell.textContent=BOT;} cell.addEventListener('click',handleCellClick); boardElement.appendChild(cell);}}}

    // --- Обработка Клика по Ячейке ---
    function handleCellClick(event) { /* ... без изменений в логике ... */
        if (gameOver || isBotThinking || currentPlayer !== PLAYER) return;
        const cell = event.target.closest('.cell'); if (!cell) return;
        const row = parseInt(cell.dataset.row); const col = parseInt(cell.dataset.col); if (isNaN(row)||isNaN(col)||row<0||row>=ROWS||col<0||col>=COLS) return;
        const bombKey = `${row}-${col}`; if (board[row][col] !== EMPTY || cell.classList.contains('bomb-revealed')) return;
        if (bombLocations.has(bombKey)) {
            triggerBomb(row, col, PLAYER);
            if (!gameOver) {
                 switchPlayer(); isBotThinking = true;
                 updateStatusMessage('Бот думает...'); // ИЗМЕНЕНО (остается так)
                 setTimeout(botMove, 600);
             }
        } else { makeMove(row, col, PLAYER); } }

     // --- Совершение Хода (без бомб) ---
     function makeMove(row, col, player) { /* ... без изменений в логике ... */
        if (gameOver || board[row][col] !== EMPTY) return false;
        board[row][col] = player; updateCell(row, col, player);
        const winInfo = checkWin(player);
        if (winInfo) { endGame(player, winInfo.winningCells); }
        else if (checkDraw()) { endGame('draw'); }
        else {
            switchPlayer();
            if (player === PLAYER && !gameOver) {
                 isBotThinking = true; updateStatusMessage('Бот думает...'); // ИЗМЕНЕНО (остается так)
                 setTimeout(botMove, Math.random() * 500 + 300);
             } else if (player === BOT && !gameOver) {
                 updateStatusMessage(`Ход: ${getDisplayName(currentPlayer)}`); // ИЗМЕНЕНО
             }
        } return true; }

    // --- Активация Бомбы ---
    function triggerBomb(row, col, triggerPlayer) { /* ... без изменений в логике ... */
        console.log(`Bomb ${row}-${col} by ${getDisplayName(triggerPlayer)}`); const bombCell = getCellElement(row, col); if (bombCell) { bombCell.textContent = BOMB; bombCell.classList.add('bomb-revealed', 'exploded'); setTimeout(() => bombCell?.classList.remove('exploded'), 600); } bombLocations.delete(`${row}-${col}`); board[row][col] = EMPTY;
        for (let rO=-1; rO<=1; rO++){for (let cO=-1; cO<=1; cO++){ if (rO===0&&cO===0) continue; const nr=row+rO; const nc=col+cO; if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS){if(board[nr][nc]===PLAYER||board[nr][nc]===BOT){board[nr][nc]=EMPTY; updateCell(nr,nc,EMPTY); const cCell=getCellElement(nr,nc); cCell?.classList.add('exploded'); setTimeout(()=>cCell?.classList.remove('exploded'),600);}}}}
        // Статус обновляется в вызывающей функции
     }

    // --- Переключение Игрока ---
    function switchPlayer() { if (!gameOver) currentPlayer = (currentPlayer === PLAYER) ? BOT : PLAYER; }

    // --- Ход Бота ---
    function botMove() { /* ... без изменений в логике ... */
        if (gameOver || currentPlayer !== BOT) { isBotThinking = false; return; }
        updateStatusMessage('Бот ходит...'); // ИЗМЕНЕНО (остается так)
        let bestMove = findBestMove();
        if (bestMove) { const { row, col } = bestMove; const bombKey = `${row}-${col}`;
            setTimeout(() => {
                 if (gameOver) { isBotThinking = false; return; }
                if (bombLocations.has(bombKey)) {
                    triggerBomb(row, col, BOT);
                    if (!gameOver) { switchPlayer(); isBotThinking = false;
                        // ИЗМЕНЕНО - убран символ игрока
                        updateStatusMessage(`💥 Бум! ${getDisplayName(BOT)} попал на бомбу! Ход: ${getDisplayName(PLAYER)}`);
                    } else { isBotThinking = false; }
                } else { const moveMade = makeMove(row, col, BOT); if(moveMade && !gameOver){ isBotThinking = false; } else { isBotThinking = false; } }
            }, 200);
        } else { console.error("Bot can't find move!"); isBotThinking = false; if (!checkDraw() && !gameOver) { endGame('draw'); } else if (!gameOver) { endGame('draw'); } } }

    // --- ИИ Бота (findBestMove и его хелперы) ---
    function findBestMove() { /* ... без изменений ... */
        let move = findWinningMove(BOT); if (move) return move; move = findWinningMove(PLAYER); if (move) return move; move = findThreatMove(BOT); if (move) return move; let pThreat = findThreatMove(PLAYER); if (pThreat) { let bThreat = findThreatMove(BOT, true); if(!bThreat) return pThreat; } let moves = []; for (let r=0; r<ROWS; r++) { for (let c=0; c<COLS; c++) { const k = `${r}-${c}`; const el = getCellElement(r,c); if (board[r][c] === EMPTY && !bombLocations.has(k) && (!el || !el.classList.contains('bomb-revealed'))) { moves.push({ row: r, col: c, score: calculateStrategicScore(r, c) }); }}} if (moves.length === 0) { let bombs = []; for(const k of bombLocations) { const [rs,cs] = k.split('-'); const r=parseInt(rs); const c=parseInt(cs); if(board[r][c] === EMPTY) { bombs.push({ row: r, col: c }); }} if (bombs.length > 0) { console.log("Bot forced onto bomb."); return bombs[Math.floor(Math.random() * bombs.length)]; } else { console.error("No moves/bombs?"); return null; } } moves.sort((a,b)=>b.score-a.score); const topN=Math.min(moves.length,3); return moves[Math.floor(Math.random()*topN)]; }
    function findWinningMove(player) { /* ... без изменений ... */ for (let r=0; r<ROWS; r++){for(let c=0; c<COLS; c++){const k=`${r}-${c}`;const el=getCellElement(r,c); if(board[r][c]===EMPTY && !bombLocations.has(k) && (!el || !el.classList.contains('bomb-revealed'))){board[r][c]=player; if(checkWin(player)){board[r][c]=EMPTY; return {row: r, col: c};} board[r][c]=EMPTY;}}} return null;}
    function findThreatMove(player, onlyExisting=false) { /* ... без изменений ... */ let bestMove = null; let maxOwn = -1; for(let r=0; r<ROWS; r++){for(let c=0; c<COLS; c++){const k=`${r}-${c}`;const el=getCellElement(r,c); if(board[r][c]===EMPTY && !bombLocations.has(k) && (!el || !el.classList.contains('bomb-revealed'))){ if(onlyExisting) continue; board[r][c]=player; const pInfo=createsPotentialWin(r,c,player); if(pInfo&&pInfo.count>maxOwn){maxOwn=pInfo.count; bestMove={row: r, col: c};} board[r][c]=EMPTY;} else if(onlyExisting&&board[r][c]===player){const pInfo=createsPotentialWin(r,c,player,true); if(pInfo&&pInfo.count>maxOwn){maxOwn=pInfo.count;}}}} if(onlyExisting) return maxOwn>=WIN_LENGTH-1?true:null; return bestMove;}
    function createsPotentialWin(r,c,player, checkExistingOnly=false) { /* ... без изменений ... */ const DIRS=[{dr:0,dc:1},{dr:1,dc:0},{dr:1,dc:1},{dr:1,dc:-1}]; let bestP=null; for(const{dr,dc} of DIRS){let count=1; let openEnds=0; for(let i=1;i<WIN_LENGTH;i++){const nr=r+i*dr;const nc=c+i*dc; if(nr<0||nr>=ROWS||nc<0||nc>=COLS)break; const nk=`${nr}-${nc}`;const nel=getCellElement(nr,nc); if(board[nr][nc]===player)count++; else if(board[nr][nc]===EMPTY && !bombLocations.has(nk) && (!nel||!nel.classList.contains('bomb-revealed'))){openEnds++;break;} else break;} for(let i=1;i<WIN_LENGTH;i++){ const nr=r-i*dr;const nc=c-i*dc; if(nr<0||nr>=ROWS||nc<0||nc>=COLS)break; const nk=`${nr}-${nc}`;const nel=getCellElement(nr,nc); if(board[nr][nc]===player)count++; else if(board[nr][nc]===EMPTY && !bombLocations.has(nk) && (!nel||!nel.classList.contains('bomb-revealed'))){openEnds++;break;} else break;} if((count===WIN_LENGTH-1&&openEnds>=1)||(count===WIN_LENGTH-2&&openEnds>=2)){if(!bestP||count>bestP.count){bestP={count,openEnds};}} if(checkExistingOnly&&bestP)return bestP;} return bestP;}
    function calculateStrategicScore(r,c) { /* ... без изменений ... */ let s=0; const cR=(ROWS-1)/2.0; const cC=(COLS-1)/2.0; s-=(Math.abs(r-cR)+Math.abs(c-cC))*0.5; board[r][c]=BOT; const bt=createsPotentialWin(r,c,BOT); if(bt){if(bt.count===WIN_LENGTH-1)s+=50; if(bt.count===WIN_LENGTH-2&&bt.openEnds>=2)s+=25;} board[r][c]=PLAYER; const pt=createsPotentialWin(r,c,PLAYER); if(pt){if(pt.count===WIN_LENGTH-1)s+=40; if(pt.count===WIN_LENGTH-2&&pt.openEnds>=2)s+=20;} board[r][c]=EMPTY; for(let dr=-1;dr<=1;dr++){for(let dc=-1;dc<=1;dc++){if(dr===0&&dc===0)continue; const nr=r+dr;const nc=c+dc; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS){if(board[nr][nc]===BOT)s+=2; else if(board[nr][nc]===PLAYER)s+=1;}}} return s;}

    // --- Проверка Победителя ---
    function checkWin(player) { /* ... без изменений ... */ const DIRS=[{dr:0,dc:1},{dr:1,dc:0},{dr:1,dc:1},{dr:1,dc:-1}]; for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){if(board[r][c]===player){for(const{dr,dc} of DIRS){const WCs=[{row:r,col:c}]; for(let i=1;i<WIN_LENGTH;i++){const nr=r+i*dr;const nc=c+i*dc; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&board[nr][nc]===player){WCs.push({row:nr,col:nc});}else{break;}} if(WCs.length===WIN_LENGTH){return {winner:player,winningCells:WCs};}}}}} return null;}

    // --- Проверка Ничьей ---
    function checkDraw() { /* ... без изменений ... */ for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){const k=`${r}-${c}`;const el=getCellElement(r,c); if(board[r][c]===EMPTY && !bombLocations.has(k) && (!el||!el.classList.contains('bomb-revealed'))){return false;}}} console.log("Draw: No moves left."); return true;}

    // --- Завершение Игры ---
    function endGame(winner, winningCells = []) { /* ... без изменений в логике ... */
        gameOver = true; isBotThinking = false;
        gameContainer?.classList.add('game-over-active');

        if (winner === 'draw') { updateStatusMessage('Ничья!'); }
        else if (winner === PLAYER || winner === BOT) {
            // ИЗМЕНЕНО - убран символ победителя
            updateStatusMessage(`Победил ${getDisplayName(winner)}!`);
            if (winner === PLAYER) playerScore++; else botScore++;
            updateScoreDisplay(true); // Анимация счета
            highlightWin(winningCells);
        }
        revealAllBombs();
        newGameButton.disabled = false;
    }

    // --- Подсветка Выигрышной Линии ---
    function highlightWin(cells) { cells.forEach(({ row, col }) => { getCellElement(row, col)?.classList.add('win-cell'); }); }

    // --- Показать все оставшиеся бомбы ---
    function revealAllBombs() { /* ... без изменений ... */ bombLocations.forEach(key => { const [rs,cs]=key.split('-'); const r=parseInt(rs); const c=parseInt(cs); const el=getCellElement(r,c); if(el&&!el.classList.contains('bomb-revealed')){el.textContent=BOMB; el.classList.add('bomb-revealed');}}); }

     // --- Обновление Вида Ячейки ---
     function updateCell(row, col, value) { /* ... без изменений ... */
         const cellElement = getCellElement(row, col); if (!cellElement) return; const isRevBomb = cellElement.classList.contains('bomb-revealed'); const isWin = cellElement.classList.contains('win-cell'); cellElement.className = 'cell'; cellElement.textContent = ''; cellElement.dataset.row = row; cellElement.dataset.col = col; if (isRevBomb) { cellElement.classList.add('bomb-revealed'); cellElement.textContent = BOMB; } if (isWin) { cellElement.classList.add('win-cell'); } if (value === PLAYER) { cellElement.classList.add('x'); cellElement.textContent = PLAYER; } else if (value === BOT) { cellElement.classList.add('o'); cellElement.textContent = BOT; } }

    // --- Получение DOM-элемента ячейки ---
    function getCellElement(row, col) { if (!boardElement) return null; return boardElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`); }

    // --- Обновление Статуса ---
    function updateStatusMessage(message) { if (statusMessageElement) { statusMessageElement.textContent = message; } }

    // --- Обновление Счета с Анимацией ---
    function updateScoreDisplay(animate = false) { /* ... без изменений ... */
        if (!playerScoreElement || !botScoreElement) return; const updateElement = (element, score) => { if (element.textContent !== score.toString()) { if (animate) { element.classList.add('updated'); setTimeout(() => { element.textContent = score; setTimeout(() => { element.classList.remove('updated'); }, 300); }, 50); } else { element.textContent = score; } } }; updateElement(playerScoreElement, playerScore); updateElement(botScoreElement, botScore); }

    // --- Слушатель Кнопки "Новая Игра" ---
    if (newGameButton) { newGameButton.addEventListener('click', initializeGame); } else { console.error("New Game button not found!"); }

    // --- Первый Запуск ---
    initializeGame();

    // --- Опционально: Интеграция с Telegram ---
    // try { if (window.Telegram && window.Telegram.WebApp) { window.Telegram.WebApp.ready(); console.log("TWA SDK Ready"); } } catch (e) { console.error("TWA SDK Error:", e); }

}); // Конец DOMContentLoaded
