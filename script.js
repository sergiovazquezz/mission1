const ROUND_SECONDS = 30;
const CATCHES_PER_ROUND = 5;
const BUGS = ["🐛", "🪲", "🐞"];
const WRONG_BOX_SECONDS = 2;
const GRID_COLUMNS = 3;
const START_CELL = Math.floor(GRID_COLUMNS ** 2 / 2);
const BUG_MOVE_MS = 4000;
const ROUND_SPEEDUP_MS = 400;
const MIN_BUG_MOVE_MS = 1200;
const HIT_ANIMATION_MS = 230;
const MISS_ANIMATION_MS = 280;

const board = document.querySelector("#board");
const scoreDisplay = document.querySelector("#score");
const timerDisplay = document.querySelector("#timer");
const roundDisplay = document.querySelector("#round-number");
const startButton = document.querySelector("#start-button");
const startButtonLabel = startButton.querySelector(".button-label");
const hintDisplay = document.querySelector("#game-hint");
const resultDisplay = document.querySelector("#result");
const announcer = document.querySelector("#announcer");
const themeColor = document.querySelector('meta[name="theme-color"]');
const cells = [];
const cellContents = [];
const animationTimers = new Map();

let score = 0;
let roundNumber = 1;
let catchesTowardNextRound = 0;
let secondsLeft = ROUND_SECONDS;
let activeCell = -1;
let previousCell = -1;
let selectedCell = START_CELL;
let gameState = "ready";
let timerId;
let bugTimerId;

function formatScore(value) {
    return String(value).padStart(2, "0");
}

function quantity(value, singular, plural = `${singular}s`) {
    return `${value} ${value === 1 ? singular : plural}`;
}

function renderHud() {
    scoreDisplay.textContent = formatScore(score);
    timerDisplay.textContent = String(secondsLeft);
    roundDisplay.textContent = formatScore(roundNumber);
}

function updateSelection() {
    cells.forEach((cell, index) => {
        cell.tabIndex = index === selectedCell ? 0 : -1;
        cell.classList.toggle("is-selected", index === selectedCell);
    });
}

function createBoard() {
    for (let index = 0; index < GRID_COLUMNS ** 2; index += 1) {
        const cell = document.createElement("button");
        cell.classList.add("cell");
        cell.type = "button";
        cell.disabled = true;
        cell.dataset.cell = String(index);
        cell.dataset.label = `Row ${Math.floor(index / GRID_COLUMNS) + 1}, column ${(index % GRID_COLUMNS) + 1}`;
        cell.setAttribute("aria-label", cell.dataset.label);

        const number = document.createElement("span");
        number.classList.add("cell-index");
        number.textContent = formatScore(index + 1);
        number.setAttribute("aria-hidden", "true");
        const content = document.createElement("span");
        content.classList.add("cell-content");
        content.setAttribute("aria-hidden", "true");
        cell.append(number, content);
        board.append(cell);
        cells.push(cell);
        cellContents.push(content);

        cell.addEventListener("pointerdown", (event) => event.preventDefault());
        cell.addEventListener("focus", () => {
            selectedCell = index;
            updateSelection();
        });
    }
    updateSelection();
}

function clearBug() {
    cells.forEach((cell, index) => {
        cell.setAttribute("aria-label", cell.dataset.label);
        cell.classList.remove("is-active");
        cellContents[index].textContent = "";
    });
    activeCell = -1;
}

function showBug() {
    clearBug();
    const choices = cells.map((_, index) => index).filter((index) => index !== previousCell);
    activeCell = choices[Math.floor(Math.random() * choices.length)];
    previousCell = activeCell;
    cellContents[activeCell].textContent = BUGS[Math.floor(Math.random() * BUGS.length)];
    cells[activeCell].classList.add("is-active");
    cells[activeCell].setAttribute("aria-label", `${cells[activeCell].dataset.label} — bug!`);
}

function bugMoveDelay() {
    return Math.max(MIN_BUG_MOVE_MS, BUG_MOVE_MS - (roundNumber - 1) * ROUND_SPEEDUP_MS);
}

function scheduleBugMove() {
    window.clearTimeout(bugTimerId);
    bugTimerId = window.setTimeout(() => {
        if (gameState !== "playing") return;
        showBug();
        announcer.textContent = `Bug moved to ${cells[activeCell].dataset.label}.`;
        scheduleBugMove();
    }, bugMoveDelay());
}

function animateCell(index, className, duration) {
    const cell = cells[index];
    window.clearTimeout(animationTimers.get(cell));
    cell.classList.remove("is-hit", "is-miss");
    cell.classList.add(className);
    animationTimers.set(cell, window.setTimeout(() => {
        cell.classList.remove(className);
        animationTimers.delete(cell);
    }, duration));
}

function clearGameTimers() {
    window.clearInterval(timerId);
    window.clearTimeout(bugTimerId);
    animationTimers.forEach((id) => window.clearTimeout(id));
    animationTimers.clear();
    cells.forEach((cell) => cell.classList.remove("is-hit", "is-miss"));
}

function endGame() {
    if (gameState !== "playing") return;
    gameState = "ended";
    clearGameTimers();
    clearBug();
    renderHud();
    cells.forEach((cell) => { cell.disabled = true; });
    startButton.disabled = false;
    hintDisplay.textContent = "ROUND OVER";
    startButtonLabel.textContent = "PLAY AGAIN";
    resultDisplay.textContent = `TIME! You caught ${quantity(score, "bug")}. Ready for another round?`;
    resultDisplay.hidden = false;
    announcer.textContent = `Time is up. You caught ${quantity(score, "bug")}.`;
    startButton.focus();
}

function startGame() {
    if (gameState === "playing") return;
    clearGameTimers();
    score = 0;
    roundNumber = 1;
    catchesTowardNextRound = 0;
    secondsLeft = ROUND_SECONDS;
    previousCell = -1;
    selectedCell = START_CELL;
    gameState = "playing";
    renderHud();
    hintDisplay.textContent = "BUG DETECTED";
    resultDisplay.hidden = true;
    startButtonLabel.textContent = "GAME RUNNING";
    startButton.disabled = true;
    cells.forEach((cell) => { cell.disabled = false; });
    updateSelection();
    showBug();
    announcer.textContent = `Round started. Catch the bug at ${cells[activeCell].dataset.label}!`;
    scheduleBugMove();
    cells[selectedCell].focus();
    timerId = window.setInterval(() => {
        if (gameState !== "playing") return;
        secondsLeft = Math.max(0, secondsLeft - 1);
        renderHud();
        if (secondsLeft === 10) announcer.textContent = "10 seconds left!";
        if (secondsLeft === 0) endGame();
    }, 1000);
}

function catchMessage(advancedRound) {
    const remaining = CATCHES_PER_ROUND - catchesTowardNextRound;
    const progress = advancedRound ? `Round ${roundNumber}. Bug movement every ${bugMoveDelay() / 1000} seconds!` : `Bug caught! Score ${score}.`;
    return `${progress} ${quantity(remaining, "catch", "catches")} to advance. Bug at ${cells[activeCell].dataset.label}.`;
}

function missMessage(lostPoint) {
    const pointMessage = lostPoint ? "One point lost." : "Score stays at zero.";
    return `Wrong box. ${pointMessage} ${quantity(WRONG_BOX_SECONDS, "second")} lost. ${quantity(secondsLeft, "second")} left.`;
}

function catchBug(index) {
    if (gameState !== "playing") return;
    if (index !== activeCell) {
        const lostPoint = score > 0;
        score = Math.max(0, score - 1);
        secondsLeft = Math.max(0, secondsLeft - WRONG_BOX_SECONDS);
        renderHud();
        animateCell(index, "is-miss", MISS_ANIMATION_MS);
        announcer.textContent = missMessage(lostPoint);
        if (secondsLeft === 0) endGame();
        return;
    }

    score += 1;
    catchesTowardNextRound += 1;
    animateCell(index, "is-hit", HIT_ANIMATION_MS);
    const advancedRound = catchesTowardNextRound === CATCHES_PER_ROUND;
    if (advancedRound) {
        roundNumber += 1;
        catchesTowardNextRound = 0;
    }
    renderHud();
    showBug();
    scheduleBugMove();
    announcer.textContent = catchMessage(advancedRound);
}

function moveSelection(key) {
    const moves = {
        ArrowUp: selectedCell - GRID_COLUMNS,
        ArrowDown: selectedCell + GRID_COLUMNS,
        ArrowLeft: selectedCell - 1,
        ArrowRight: selectedCell + 1,
    };
    const nextCell = moves[key];
    const staysInBoard = nextCell >= 0 && nextCell < cells.length;
    const horizontal = key === "ArrowLeft" || key === "ArrowRight";
    const staysInRow = !horizontal || Math.floor(nextCell / GRID_COLUMNS) === Math.floor(selectedCell / GRID_COLUMNS);
    if (staysInBoard && staysInRow) cells[nextCell].focus();
}

function toggleTheme() {
    const theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    themeColor.setAttribute("content", theme === "dark" ? "#10131d" : "#f3f5ed");
    announcer.textContent = `${theme === "dark" ? "Dark" : "Light"} theme enabled.`;
}

createBoard();
renderHud();
startButton.addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey ||
        event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;

    if (event.key.toLowerCase() === "d") {
        if (!event.repeat) toggleTheme();
        return;
    }
    if (gameState !== "playing" || !cells.includes(document.activeElement)) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        moveSelection(event.key);
        return;
    }
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!event.repeat) catchBug(selectedCell);
    }
});
