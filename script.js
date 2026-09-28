const ROUND_SECONDS = 30;
const BUGS = ['🐛', '🪲', '🐞'];

const cells = Array.from(document.querySelectorAll('.cell'));
const scoreDisplay = document.querySelector('#score');
const timerDisplay = document.querySelector('#timer');
const startButton = document.querySelector('#start-button');
const hintDisplay = document.querySelector('#game-hint');
const resultDisplay = document.querySelector('#result');
const announcer = document.querySelector('#announcer');

let score = 0;
let secondsLeft = ROUND_SECONDS;
let activeCell = -1;
let previousCell = -1;
let selectedCell = 4;
let gameState = 'ready';
let timerId;

function formatScore(value) {
  return String(value).padStart(2, '0');
}

function clearBug() {
  cells.forEach((cell) => {
    cell.classList.remove('is-active');
    cell.querySelector('.cell-content').textContent = '';
  });
  activeCell = -1;
}

function showBug() {
  clearBug();
  const choices = cells.map((_, index) => index).filter((index) => index !== previousCell);
  activeCell = choices[Math.floor(Math.random() * choices.length)];
  previousCell = activeCell;
  const cell = cells[activeCell];
  cell.querySelector('.cell-content').textContent = BUGS[Math.floor(Math.random() * BUGS.length)];
  cell.classList.add('is-active');
  cell.setAttribute('aria-label', `${cell.dataset.label} — bug!`);
}

function restoreCellLabels() {
  cells.forEach((cell, index) => cell.setAttribute('aria-label', `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}`));
}

function updateSelection() {
  cells.forEach((cell, index) => {
    cell.tabIndex = index === selectedCell ? 0 : -1;
  });
}

function endGame() {
  window.clearInterval(timerId);
  gameState = 'ended';
  clearBug();
  restoreCellLabels();
  cells.forEach((cell) => { cell.disabled = true; });
  startButton.disabled = false;
  hintDisplay.textContent = 'ROUND OVER';
  startButton.innerHTML = '<span class="button-icon" aria-hidden="true">↻</span> PLAY AGAIN';
  resultDisplay.textContent = `TIME! You caught ${score} ${score === 1 ? 'bug' : 'bugs'}. Ready for another round?`;
  resultDisplay.hidden = false;
  announcer.textContent = `Time is up. You caught ${score} ${score === 1 ? 'bug' : 'bugs'}.`;
  startButton.focus();
}

function startGame() {
  window.clearInterval(timerId);
  score = 0;
  secondsLeft = ROUND_SECONDS;
  previousCell = -1;
  selectedCell = 4;
  gameState = 'playing';
  scoreDisplay.textContent = formatScore(score);
  timerDisplay.textContent = String(secondsLeft);
  hintDisplay.textContent = 'BUG DETECTED';
  resultDisplay.hidden = true;
  announcer.textContent = 'Round started. Catch the bug!';
  startButton.innerHTML = '<span class="button-icon" aria-hidden="true">●</span> GAME RUNNING';
  startButton.disabled = true;
  cells.forEach((cell) => { cell.disabled = false; });
  updateSelection();
  showBug();
  cells[selectedCell].focus();

  timerId = window.setInterval(() => {
    secondsLeft -= 1;
    timerDisplay.textContent = String(secondsLeft);
    if (secondsLeft === 10) announcer.textContent = '10 seconds left!';
    if (secondsLeft <= 0) endGame();
  }, 1000);
}

function catchBug(index) {
  if (gameState !== 'playing' || index !== activeCell) return;
  score += 1;
  scoreDisplay.textContent = formatScore(score);
  cells[index].classList.add('is-hit');
  window.setTimeout(() => cells[index].classList.remove('is-hit'), 230);
  announcer.textContent = `Bug caught! Score ${score}.`;
  showBug();
}

cells.forEach((cell, index) => {
  cell.dataset.label = `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}`;
  cell.addEventListener('click', () => catchBug(index));
  cell.addEventListener('focus', () => {
    selectedCell = index;
    updateSelection();
  });
});

startButton.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
  if (gameState !== 'playing' || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) return;
  const moves = {
    ArrowUp: selectedCell - 3,
    ArrowDown: selectedCell + 3,
    ArrowLeft: selectedCell - 1,
    ArrowRight: selectedCell + 1,
  };

  if (event.key in moves) {
    event.preventDefault();
    const nextCell = moves[event.key];
    const staysInBoard = nextCell >= 0 && nextCell < cells.length;
    const staysInRow = !['ArrowLeft', 'ArrowRight'].includes(event.key) || Math.floor(nextCell / 3) === Math.floor(selectedCell / 3);
    if (staysInBoard && staysInRow) cells[nextCell].focus();
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    if (cells.includes(document.activeElement)) {
      event.preventDefault();
      catchBug(selectedCell);
    }
  }
});
