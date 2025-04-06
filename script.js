document.addEventListener('DOMContentLoaded', () => {
    // --- Константы ---
    const ROWS = 8; const COLS = 6; const WIN_LENGTH = 4; const BOMB_COUNT = 8;
    const PLAYER = 'X'; const BOT = 'O'; const BOMB = '💣'; const EMPTY = '';
    const BOOM_MESSAGE_DURATION = 1000; // Длительность показа "Бум!" в мс

    // --- DOM Элементы ---
    const gameContainer = document.querySelector('.game-container');
    const boardElement = document.getElementById('game-board');
    const statusMessageElement = document.getElementById('status-message');
    const playerScoreElement = document.getElementById('player-score');
    const botScoreElement = document.getElementById('bot-score');
    const newGameButton = document.getElementById('new-game-button');

    // --- Состояние Игры ---
    let board = []; let bombLocations = new Set(); let currentPlayer = PLAYER;
    let gameOver = false; let playerScore = 0; let botScore = 0; let isBotThinking = false;
    let statusTimeoutId = null; // Для отмены предыдущей смены статуса после Бум!

    // --- Хелпер: Имя игрока ---
    function getDisplayName(player) { return player === PLAYER ? 'Игрок' : 'Бот'; }

    // --- Обновление Статуса ---
    function updateStatusMessage(message, type = 'info') {
        if (!statusMessageElement) return;
        // Отменяем предыдущий запланированный таймаут смены статуса, если он есть
        if (statusTimeoutId) {
            clearTimeout(statusTimeoutId);
            statusTimeoutId = null;
        }
        statusMessageElement.textContent = message;
        statusMessageElement.classList.remove('thinking', 'game-won', 'game-draw', 'bomb-hit');
        if (type === 'thinking') statusMessageElement.classList.add('thinking');
        else if (type === 'win') statusMessageElement.classList.add('game-won');
        else if (type === 'draw') statusMessageElement.classList.add('game-draw');
        else if (type === 'bomb') statusMessageElement.classList.add('bomb-hit');
    }

    // --- Инициализация Игры ---
    function initializeGame() {
        if (!gameContainer || !boardElement || !statusMessageElement || !playerScoreElement || !botScoreElement || !newGameButton) { console.error("DOM Error"); return; }
        board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
        bombLocations.clear(); gameOver = false; isBotThinking = false; currentPlayer = PLAYER;
        gameContainer.classList.remove('game-over-active');
        placeBombs(); renderBoard();
        updateStatusMessage('Ход игрока', 'info');
        updateScoreDisplay(false);
        newGameButton.disabled = true;
        console.log("Game Initialized (8x6). Bombs:", Array.from(bombLocations));
    }

    // --- Размещение Бомб ---
    function placeBombs() { let bombsPlaced=0; const maxBombs=ROWS*COLS; if(BOMB_COUNT>=maxBombs){console.warn("Too many bombs!"); let safeSpots=2; for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){if(safeSpots>0&&Math.random()>0.8){safeSpots--;}else{bombLocations.add(`${r}-${c}`);bombsPlaced++;}}}return;} while(bombsPlaced<BOMB_COUNT){const r=Math.floor(Math.random()*ROWS); const c=Math.floor(Math.random()*COLS); const key=`${r}-${c}`; if(!bombLocations.has(key)){bombLocations.add(key);bombsPlaced++;}}}

    // --- Отрисовка Поля ---
    function renderBoard() { boardElement.innerHTML = ''; boardElement.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`; for(let r=0; r<ROWS; r++){for(let c=0; c<COLS; c++){ const cell=document.createElement('div'); cell.className='cell'; cell.dataset.row=r; cell.dataset.col=c; const v=board[r][c]; if(v===PLAYER){cell.classList.add('x');cell.textContent=PLAYER;}else if(v===BOT){cell.classList.add('o');cell.textContent=BOT;} cell.addEventListener('click',handleCellClick); boardElement.appendChild(cell);}}}

    // --- Обработка Клика по Ячейке ---
    function handleCellClick(event) {
        if (gameOver || isBotThinking || currentPlayer !== PLAYER) return;
        const cell = event.target.closest('.cell'); if (!cell) return;
        const row = parseInt(cell.dataset.row); const col = parseInt(cell.dataset.col); if (isNaN(row)||isNaN(col)||row<0||row>=ROWS||col<0||col>=COLS) return;
        const bombKey = `${row}-${col}`; if (board[row][col] !== EMPTY || cell.classList.contains('bomb-revealed')) return;

        if (bombLocations.has(bombKey)) {
            triggerBomb(row, col, PLAYER); // Ставит "Бум!"
            if (!gameOver) {
                 switchPlayer(); isBotThinking = true;
                 // Запланировать смену статуса на "Бот думает..." через время
                 statusTimeoutId = setTimeout(() => {
                     if (!gameOver) updateStatusMessage('Бот думает...', 'thinking');
                     statusTimeoutId = null; // Очистить ID после выполнения
                 }, BOOM_MESSAGE_DURATION); // Задержка равна длительности показа "Бум!"

                 // Запустить ход бота чуть позже, чем сменится статус
                 setTimeout(botMove, BOOM_MESSAGE_DURATION + 100);
             }
        } else {
            makeMove(row, col, PLAYER);
        }
    }

     // --- Совершение Хода ---
     function makeMove(row, col, player) {
        if (gameOver || board[row][col] !== EMPTY) return false;
        board[row][col] = player; updateCell(row, col, player);
        const winInfo = checkWin(player);
        if (winInfo) { endGame(player, winInfo.winningCells); }
        else if (checkDraw()) { endGame('draw'); }
        else {
            switchPlayer();
            if (player === PLAYER && !gameOver) { // Игрок сходил
                 isBotThinking = true; updateStatusMessage('Бот думает...', 'thinking');
                 setTimeout(botMove, Math.random() * 500 + 300);
             } else if (player === BOT && !gameOver) { // Бот сходил
                 updateStatusMessage('Ход игрока', 'info');
             }
        } return true; }

    // --- Активация Бомбы ---
    function triggerBomb(row, col, triggerPlayer) {
        console.log(`Bomb ${row}-${col} by ${getDisplayName(triggerPlayer)}`);
        const bombCell = getCellElement(row, col); if (bombCell) { bombCell.textContent = BOMB; bombCell.classList.add('bomb-revealed', 'exploded'); setTimeout(() => bombCell?.classList.remove('exploded'), 600); } bombLocations.delete(`${row}-${col}`); board[row][col] = EMPTY;
        for(let rO=-1;rO<=1;rO++){for(let cO=-1;cO<=1;cO++){if(rO===0&&cO===0)continue; const nr=row+rO; const nc=col+cO; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS){if(board[nr][nc]===PLAYER||board[nr][nc]===BOT){board[nr][nc]=EMPTY; updateCell(nr,nc,EMPTY); const cCell=getCellElement(nr,nc); cCell?.classList.add('exploded'); setTimeout(()=>cCell?.classList.remove('exploded'),600);}}}}
        // Ставим "Бум!", следующий статус будет установлен через setTimeout
        updateStatusMessage('💥 Бум!', 'bomb');
    }

    // --- Переключение Игрока ---
    function switchPlayer() { if (!gameOver) currentPlayer = (currentPlayer === PLAYER) ? BOT : PLAYER; }

    // --- Ход Бота ---
    function botMove() {
        if (gameOver || currentPlayer !== BOT) { isBotThinking = false; return; }
        // updateStatusMessage('Бот ходит...', 'thinking'); // Не обязательно менять
        let bestMove = findBestMove();
        if (bestMove) { const { row, col } = bestMove; const bombKey = `${row}-${col}`;
            setTimeout(() => { // Задержка перед действием
                 if (gameOver) { isBotThinking = false; return; }
                if (bombLocations.has(bombKey)) {
                    triggerBomb(row, col, BOT); // Ставит "Бум!"
                    if (!gameOver) {
                        switchPlayer(); isBotThinking = false; // Передали ход, сняли блокировку
                         // Запланировать смену статуса на "Ход игрока" через время
                         statusTimeoutId = setTimeout(() => {
                             if (!gameOver) updateStatusMessage('Ход игрока', 'info');
                             statusTimeoutId = null;
                         }, BOOM_MESSAGE_DURATION);
                    } else { isBotThinking = false; }
                } else {
                    const moveMade = makeMove(row, col, BOT);
                    // Статус "Ход игрока" ставится в makeMove
                    // Снимаем блокировку только если ход сделан и игра не окончена
                    if(moveMade && !gameOver){ isBotThinking = false; }
                    else { isBotThinking = false; } // Снимаем и если не сделан или игра окончена
                }
            }, 250); // Задержка перед действием бота
        } else { console.error("Bot can't find move!"); isBotThinking = false; if (!checkDraw() && !gameOver) { endGame('draw'); } else if (!gameOver) { endGame('draw'); } } }

    // --- ИИ Бота ---
    function findBestMove() { let m=findWinningMove(BOT);if(m)return m; m=findWinningMove(PLAYER);if(m)return m; m=findThreatMove(BOT);if(m)return m; let pT=findThreatMove(PLAYER);if(pT){let bT=findThreatMove(BOT,true);if(!bT)return pT;} let ps=[]; for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){const k=`${r}-${c}`; const el=getCellElement(r,c); if(board[r][c]===EMPTY&&!bombLocations.has(k)&&(!el||!el.classList.contains('bomb-revealed'))){ps.push({row:r,col:c,score:calculateStrategicScore(r,c)});}}} if(ps.length===0){let bs=[]; for(const k of bombLocations){const [rs,cs]=k.split('-');const r=parseInt(rs);const c=parseInt(cs);if(board[r][c]===EMPTY){bs.push({row:r,col:c});}} if(bs.length>0){console.log("Bot forced bomb.");return bs[Math.floor(Math.random()*bs.length)];}else{console.error("No moves/bombs?");return null;}} ps.sort((a,b)=>b.score-a.score); const topN=Math.min(ps.length,3); return ps[Math.floor(Math.random()*topN)]; }
    function findWinningMove(player) { for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){const k=`${r}-${c}`;const el=getCellElement(r,c); if(board[r][c]===EMPTY&&!bombLocations.has(k)&&(!el||!el.classList.contains('bomb-revealed'))){board[r][c]=player; if(checkWin(player)){board[r][c]=EMPTY; return {row:r,col:c};} board[r][c]=EMPTY;}}} return null;}
    function findThreatMove(player, onlyExisting=false) { let bestM=null; let maxO=-1; for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){const k=`${r}-${c}`;const el=getCellElement(r,c); if(board[r][c]===EMPTY&&!bombLocations.has(k)&&(!el||!el.classList.contains('bomb-revealed'))){ if(onlyExisting) continue; board[r][c]=player; const pI=createsPotentialWin(r,c,player); if(pI&&pI.count>maxO){maxO=pI.count; bestM={row:r,col:c};} board[r][c]=EMPTY;} else if(onlyExisting&&board[r][c]===player){const pI=createsPotentialWin(r,c,player,true); if(pI&&pI.count>maxO){maxO=pI.count;}}}} if(onlyExisting) return maxO>=WIN_LENGTH-1?true:null; return bestM;}
    function createsPotentialWin(r,c,player, checkExistingOnly=false) { const DIRS=[{dr:0,dc:1},{dr:1,dc:0},{dr:1,dc:1},{dr:1,dc:-1}]; let bestP=null; for(const{dr,dc} of DIRS){let count=1; let openEnds=0; for(let i=1;i<WIN_LENGTH;i++){const nr=r+i*dr;const nc=c+i*dc; if(nr<0||nr>=ROWS||nc<0||nc>=COLS)break; const nk=`${nr}-${nc}`;const nel=getCellElement(nr,nc); if(board[nr][nc]===player)count++; else if(board[nr][nc]===EMPTY&&!bombLocations.has(nk)&&(!nel||!nel.classList.contains('bomb-revealed'))){openEnds++;break;}else break;} for(let i=1;i<WIN_LENGTH;i++){ const nr=r-i*dr;const nc=c-i*dc; if(nr<0||nr>=ROWS||nc<0||nc>=COLS)break; const nk=`${nr}-${nc}`;const nel=getCellElement(nr,nc); if(board[nr][nc]===player)count++; else if(board[nr][nc]===EMPTY&&!bombLocations.has(nk)&&(!nel||!nel.classList.contains('bomb-revealed'))){openEnds++;break;}else break;} if((count===WIN_LENGTH-1&&openEnds>=1)||(count===WIN_LENGTH-2&&openEnds>=2)){if(!bestP||count>bestP.count){bestP={count,openEnds};}} if(checkExistingOnly&&bestP)return bestP;} return bestP;}
    function calculateStrategicScore(r,c) { let s=0; const cR=(ROWS-1)/2.0; const cC=(COLS-1)/2.0; s-=(Math.abs(r-cR)+Math.abs(c-cC))*0.5; board[r][c]=BOT; const bt=createsPotentialWin(r,c,BOT); if(bt){if(bt.count===WIN_LENGTH-1)s+=50; if(bt.count===WIN_LENGTH-2&&bt.openEnds>=2)s+=25;} board[r][c]=PLAYER; const pt=createsPotentialWin(r,c,PLAYER); if(pt){if(pt.count===WIN_LENGTH-1)s+=40; if(pt.count===WIN_LENGTH-2&&pt.openEnds>=2)s+=20;} board[r][c]=EMPTY; for(let dr=-1;dr<=1;dr++){for(let dc=-1;dc<=1;dc++){if(dr===0&&dc===0)continue; const nr=r+dr;const nc=c+dc; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS){if(board[nr][nc]===BOT)s+=2; else if(board[nr][nc]===PLAYER)s+=1;}}} return s;}

    // --- Проверка Победителя ---
    function checkWin(player) { const DIRS=[{dr:0,dc:1},{dr:1,dc:0},{dr:1,dc:1},{dr:1,dc:-1}]; for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){if(board[r][c]===player){for(const{dr,dc} of DIRS){const WCs=[{row:r,col:c}]; for(let i=1;i<WIN_LENGTH;i++){const nr=r+i*dr;const nc=c+i*dc; if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&board[nr][nc]===player){WCs.push({row:nr,col:nc});}else{break;}} if(WCs.length===WIN_LENGTH){return {winner:player,winningCells:WCs};}}}}} return null;}

    // --- Проверка Ничьей ---
    function checkDraw() { for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){const k=`${r}-${c}`;const el=getCellElement(r,c); if(board[r][c]===EMPTY&&!bombLocations.has(k)&&(!el||!el.classList.contains('bomb-revealed'))){return false;}}} console.log("Draw: No moves left."); return true;}

    // --- Завершение Игры ---
    function endGame(winner, winningCells = []) {
        gameOver = true; isBotThinking = false;
        gameContainer?.classList.add('game-over-active');
        if (winner === 'draw') { updateStatusMessage('Ничья!', 'draw'); }
        else if (winner === PLAYER || winner === BOT) { updateStatusMessage(`${getDisplayName(winner)} победил!`, 'win'); if (winner === PLAYER) playerScore++; else botScore++; updateScoreDisplay(true); highlightWin(winningCells); }
        revealAllBombs(); newGameButton.disabled = false;
    }

    // --- Подсветка Выигрышной Линии ---
    function highlightWin(cells) { cells.forEach(({ row, col }) => { getCellElement(row, col)?.classList.add('win-cell'); }); }

    // --- Показать все оставшиеся бомбы ---
    function revealAllBombs() { bombLocations.forEach(key => { const [rs,cs]=key.split('-'); const r=parseInt(rs); const c=parseInt(cs); const el=getCellElement(r,c); if(el&&!el.classList.contains('bomb-revealed')){el.textContent=BOMB; el.classList.add('bomb-revealed');}}); }

     // --- Обновление Вида Ячейки ---
     function updateCell(row, col, value) { const el = getCellElement(row, col); if (!el) return; const isRevBomb = el.classList.contains('bomb-revealed'); const isWin = el.classList.contains('win-cell'); el.className = 'cell'; el.textContent = ''; el.dataset.row = row; el.dataset.col = col; if (isRevBomb) { el.classList.add('bomb-revealed'); el.textContent = BOMB; } if (isWin) { el.classList.add('win-cell'); } if (value === PLAYER) { el.classList.add('x'); el.textContent = PLAYER; } else if (value === BOT) { el.classList.add('o'); el.textContent = BOT; } }

    // --- Получение DOM Элемента Ячейки ---
    function getCellElement(row, col) { if (!boardElement) return null; return boardElement.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`); }

    // --- Обновление Счета ---
    function updateScoreDisplay(animate = false) { if (!playerScoreElement || !botScoreElement) return; const updateElement = (element, score) => { if (element.textContent !== score.toString()) { if (animate) { element.classList.add('updated'); setTimeout(() => { element.textContent = score; setTimeout(() => { element.classList.remove('updated'); }, 300); }, 50); } else { element.textContent = score; } } }; updateElement(playerScoreElement, playerScore); updateElement(botScoreElement, botScore); }

    // --- Слушатель Кнопки ---
    if (newGameButton) { newGameButton.addEventListener('click', initializeGame); } else { console.error("New Game button not found!"); }

    // --- Первый Запуск ---
    initializeGame();

    // --- Telegram WebApp SDK (Optional) ---
    // try { if (window.Telegram && window.Telegram.WebApp) { window.Telegram.WebApp.ready(); console.log("TWA SDK Ready"); } } catch (e) { console.error("TWA SDK Error:", e); }

}); // End DOMContentLoaded
