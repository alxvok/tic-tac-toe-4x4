/* --- Общие стили --- */
:root {
    --board-bg: #f4f6f8;
    --cell-bg: #ffffff;
    --cell-border: #d8dde2;
    --cell-hover-bg: #e8ebee;
    --player-x-color: #ff4136; /* Красный */
    --player-o-color: #0074d9; /* Синий */
    --bomb-color: #333333;
    --bomb-revealed-bg: #e0e0e0;
    --win-highlight-bg: rgba(255, 215, 0, 0.55);
    --text-color: #333;
    --status-color: #555;
    --button-bg: #007bff;
    --button-text: #ffffff;
    --button-hover-bg: #0056b3;
    --container-bg: #ffffff;
    --shadow-color: rgba(0, 0, 0, 0.1);

    /* --- УВЕЛИЧЕННЫЕ ЯЧЕЙКИ --- */
    --cell-size: min(max(42px, 13vw), 65px);
    --cell-gap: 4px;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                 Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    background-color: #e9eef5;
    color: var(--text-color);
    padding: 15px;
    overflow-y: auto;
    line-height: 1.5;
}

.game-container {
    width: 100%;
    max-width: 500px;
    background-color: var(--container-bg);
    padding: clamp(15px, 4vw, 25px);
    border-radius: 16px;
    box-shadow: 0 6px 20px var(--shadow-color);
    text-align: center;
}

h1 {
    font-size: clamp(1.6rem, 5.5vw, 2.2rem);
    margin-bottom: 15px;
    color: #2c3e50;
    font-weight: 600;
}

/* --- Инфо и Статус --- */
.game-info {
    margin-bottom: 20px;
    font-size: clamp(0.95rem, 3.2vw, 1.15rem);
}

.score {
    font-weight: 500;
    margin-bottom: 10px;
    color: #34495e;
}
.score span {
    font-weight: 600;
}

.status {
    min-height: 1.4em;
    font-style: italic;
    color: var(--status-color);
    transition: color 0.3s ease;
}

.bomb-info {
    font-size: clamp(0.8rem, 2.6vw, 0.95rem);
    margin-top: 15px;
    color: #7f8c8d;
}


/* --- Игровое поле --- */
.board {
    display: grid;
    gap: var(--cell-gap);
    background-color: var(--board-bg);
    border: 1px solid var(--cell-border);
    border-radius: 10px;
    margin: 0 auto;
    width: fit-content;
    padding: 6px;
    margin-bottom: 25px;
    /* Убрали transition для opacity/filter */
}

/* Стиль .board.thinking УДАЛЕН */

.cell {
    width: var(--cell-size);
    height: var(--cell-size);
    background-color: var(--cell-bg);
    border: 1px solid var(--cell-border);
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: calc(var(--cell-size) * 0.65); /* Увеличенный символ */
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.15s ease;
    user-select: none;
    position: relative;
}

/* Эффект при наведении на доступную ячейку */
.cell:not(.x):not(.o):not(.bomb-revealed):not(.exploded):hover {
    background-color: var(--cell-hover-bg);
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Эффект при нажатии (тапе) на доступную ячейку */
.cell:not(.x):not(.o):not(.bomb-revealed):not(.exploded):active {
    transform: scale(0.92);
    background-color: #dce1e6;
}

/* Стили для ячеек с X и O */
.cell.x, .cell.o {
    cursor: not-allowed;
    animation: placeMark 0.2s ease-out;
}

@keyframes placeMark {
    from { transform: scale(0.5); opacity: 0.5; }
    to { transform: scale(1); opacity: 1; }
}

.cell.x {
    color: var(--player-x-color);
}

.cell.o {
    color: var(--player-o-color);
}

/* Стиль для бомбы (виден при взрыве / в конце игры) */
.cell.bomb-revealed {
    color: var(--bomb-color);
    font-size: calc(var(--cell-size) * 0.55);
    cursor: not-allowed;
    background-color: var(--bomb-revealed-bg);
}
.cell.bomb-revealed:hover {
     transform: none;
     box-shadow: none;
}

/* Стиль для анимации взрыва (бомбы и очищенных соседей) */
.cell.exploded {
    animation: explosion 0.6s ease-out forwards;
    cursor: not-allowed;
}

@keyframes explosion {
    0% { transform: scale(1); background-color: #ffdddd;}
    30% { transform: scale(1.15); background-color: #ffcccc; }
    100% { transform: scale(1); background-color: var(--cell-bg); }
}

/* Если ячейка была бомбой, после взрыва возвращаем её спец. фон */
.cell.bomb-revealed.exploded {
     animation: bombExplosion 0.6s ease-out forwards;
}
@keyframes bombExplosion {
    0% { transform: scale(1); background-color: #ffc8c8;}
    30% { transform: scale(1.15); background-color: #ffaaaa; }
    100% { transform: scale(1); background-color: var(--bomb-revealed-bg); }
}

/* Стиль для ячеек выигрышной линии */
.cell.win-cell {
    background-color: var(--win-highlight-bg);
    animation: winPulse 0.7s infinite alternate ease-in-out;
    position: relative;
    z-index: 1;
}
.cell.win-cell::before {
    content: '';
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    border: 2px solid gold;
    border-radius: 10px;
    animation: winBorderPulse 0.7s infinite alternate ease-in-out;
    z-index: -1;
}

@keyframes winPulse {
    from { background-color: rgba(255, 215, 0, 0.45); transform: scale(1); }
    to { background-color: rgba(255, 215, 0, 0.65); transform: scale(1.03); }
}
@keyframes winBorderPulse {
     from { opacity: 0.5; }
     to { opacity: 1; }
}

/* --- Кнопки управления --- */
.controls {
    margin-top: 20px;
}

#new-game-button {
    padding: 14px 30px; /* Увеличенная кнопка */
    font-size: clamp(1rem, 3.5vw, 1.2rem);
    background-color: var(--button-bg);
    color: var(--button-text);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
    box-shadow: 0 3px 8px rgba(0, 123, 255, 0.3);
    font-weight: 500;
}

#new-game-button:hover:not(:disabled) {
    background-color: var(--button-hover-bg);
    box-shadow: 0 5px 12px rgba(0, 123, 255, 0.4);
    transform: translateY(-1px);
}
#new-game-button:active:not(:disabled) {
    transform: translateY(0px) scale(0.98);
     box-shadow: 0 2px 5px rgba(0, 123, 255, 0.3);
}

#new-game-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.6;
     box-shadow: none;
}

/* --- Адаптивность --- */
@media (max-width: 360px) {
     /* :root { --cell-size: min(max(40px, 12vw), 60px); } */
    .game-container { padding: 15px; }
    h1 { font-size: 1.5rem; }
    #new-game-button { padding: 12px 25px; }
}
