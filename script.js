// script.js
let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameActive = true;
let difficulty = 1; // 0: easy, 1: medium, 2: hard
let scores = { player: 0, computer: 0, draws: 0 };

const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diags
];

const cells = [];
let winningLineElement;

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    createBoard();
    updateScoreboard();
    updateStatus("Your turn as X");
});

// Create board cells
function createBoard() {
    const boardEl = document.getElementById('game-board');
    boardEl.innerHTML = '';
    cells.length = 0;
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', `Cell ${i+1}`);
        
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleCellClick(e);
            }
        });
        
        boardEl.appendChild(cell);
        cells.push(cell);
    }
    
    // Create winning line
    winningLineElement = document.getElementById('winning-line');
}

// Handle player click
function handleCellClick(e) {
    const index = parseInt(e.target.dataset.index);
    
    if (!gameActive || board[index] || currentPlayer !== 'X') return;
    
    makeMove(index, 'X');
}

// Make a move
function makeMove(index, player) {
    board[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add(player.toLowerCase());
    
    const winResult = checkWinner();
    
    if (winResult) {
        handleWin(winResult);
        return;
    }
    
    if (checkDraw()) {
        handleDraw();
        return;
    }
    
    // Switch player
    currentPlayer = player === 'X' ? 'O' : 'X';
    updateTurnIndicator();
    
    if (currentPlayer === 'O') {
        updateStatus("Computer thinking...");
        setTimeout(computerMove, 420);
    } else {
        updateStatus("Your turn");
    }
}

// Computer move based on difficulty
function computerMove() {
    if (!gameActive) return;
    
    let index;
    
    if (difficulty === 0) {
        // Easy - completely random
        index = getRandomMove();
    } else if (difficulty === 1) {
        // Medium
        index = getMediumMove();
    } else {
        // Hard - minimax
        index = getBestMove();
    }
    
    if (index !== null) {
        makeMove(index, 'O');
    }
}

// Get random empty cell
function getRandomMove() {
    const empty = board.map((val, idx) => val === null ? idx : null).filter(v => v !== null);
    return empty[Math.floor(Math.random() * empty.length)];
}

// Medium AI: win if possible, block if possible, else random
function getMediumMove() {
    // Try to win
    for (let i = 0; i < winningCombos.length; i++) {
        const combo = winningCombos[i];
        if (board[combo[0]] === 'O' && board[combo[1]] === 'O' && board[combo[2]] === null) {
            return combo[2];
        }
        if (board[combo[0]] === 'O' && board[combo[2]] === 'O' && board[combo[1]] === null) {
            return combo[1];
        }
        if (board[combo[1]] === 'O' && board[combo[2]] === 'O' && board[combo[0]] === null) {
            return combo[0];
        }
    }
    
    // Block player
    for (let i = 0; i < winningCombos.length; i++) {
        const combo = winningCombos[i];
        if (board[combo[0]] === 'X' && board[combo[1]] === 'X' && board[combo[2]] === null) {
            return combo[2];
        }
        if (board[combo[0]] === 'X' && board[combo[2]] === 'X' && board[combo[1]] === null) {
            return combo[1];
        }
        if (board[combo[1]] === 'X' && board[combo[2]] === 'X' && board[combo[0]] === null) {
            return combo[0];
        }
    }
    
    return getRandomMove();
}

// Minimax for hard difficulty
function minimax(newBoard, player) {
    const availSpots = newBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
    
    // Check terminal states
    const win = checkWinnerForBoard(newBoard);
    if (win && win.player === 'O') return { score: 10 };
    if (win && win.player === 'X') return { score: -10 };
    if (availSpots.length === 0) return { score: 0 };
    
    const moves = [];
    
    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        
        newBoard[availSpots[i]] = player;
        
        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }
        
        newBoard[availSpots[i]] = null;
        moves.push(move);
    }
    
    let bestMove;
    
    if (player === 'O') {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = moves[i];
            }
        }
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = moves[i];
            }
        }
    }
    
    return bestMove;
}

function getBestMove() {
    return minimax([...board], 'O').index;
}

// Check winner for any board state (used in minimax)
function checkWinnerForBoard(testBoard) {
    for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (testBoard[a] && testBoard[a] === testBoard[b] && testBoard[a] === testBoard[c]) {
            return { player: testBoard[a], combo };
        }
    }
    return null;
}

// Check current winner
function checkWinner() {
    for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { player: board[a], combo };
        }
    }
    return null;
}

function handleWin(result) {
    gameActive = false;
    highlightWinningLine(result.combo);
    
    if (result.player === 'X') {
        scores.player++;
        showResultModal("You Win!", "Congratulations 🎉", "win");
    } else {
        scores.computer++;
        showResultModal("Computer Wins", "Better luck next time", "lose");
    }
    
    updateScoreboard();
}

function handleDraw() {
    gameActive = false;
    scores.draws++;
    showResultModal("It's a Draw", "Well played!", "draw");
    updateScoreboard();
}

function highlightWinningLine(combo) {
    const first = cells[combo[0]].getBoundingClientRect();
    const last = cells[combo[2]].getBoundingClientRect();
    const boardRect = document.getElementById('game-board').getBoundingClientRect();
    
    const line = winningLineElement;
    line.classList.remove('hidden');
    
    // Simple horizontal / vertical / diagonal detection
    const startX = first.left - boardRect.left + first.width / 2;
    const startY = first.top - boardRect.top + first.height / 2;
    const endX = last.left - boardRect.left + last.width / 2;
    const endY = last.top - boardRect.top + last.height / 2;
    
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
    
    line.style.left = `${startX}px`;
    line.style.top = `${startY - 6}px`;
    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = 'left center';
}

// Check draw
function checkDraw() {
    return board.every(cell => cell !== null);
}

// Update UI
function updateStatus(message) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turn-indicator');
    const text = document.getElementById('current-turn');
    
    if (currentPlayer === 'X') {
        indicator.className = 'px-4 py-2 bg-emerald-900/30 text-emerald-300 rounded-3xl text-sm font-medium flex items-center gap-x-2';
        text.textContent = "YOUR TURN";
    } else {
        indicator.className = 'px-4 py-2 bg-pink-900/30 text-pink-300 rounded-3xl text-sm font-medium flex items-center gap-x-2';
        text.textContent = "COMPUTER";
    }
}

function updateScoreboard() {
    document.getElementById('player-score').textContent = scores.player;
    document.getElementById('computer-score').textContent = scores.computer;
    document.getElementById('draw-score').textContent = scores.draws;
}

// Difficulty
function setDifficulty(level) {
    difficulty = level;
    
    document.querySelectorAll('.difficulty-btn').forEach((btn, i) => {
        if (i === level) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Restart current game
function restartGame() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });
    
    winningLineElement.classList.add('hidden');
    updateTurnIndicator();
    updateStatus("Your turn as X");
}

// Full reset
function resetScore() {
    if (!confirm("Reset all scores?")) return;
    
    scores = { player: 0, computer: 0, draws: 0 };
    updateScoreboard();
    restartGame();
}

// Modal
function showResultModal(title, subtitle, type) {
    const modal = document.getElementById('result-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-subtitle').textContent = subtitle;
    
    const iconEl = document.getElementById('modal-icon');
    
    if (type === 'win') {
        iconEl.innerHTML = '🏆';
        iconEl.className = 'text-7xl mb-6 text-yellow-400';
    } else if (type === 'lose') {
        iconEl.innerHTML = '🤖';
        iconEl.className = 'text-7xl mb-6';
    } else {
        iconEl.innerHTML = '🤝';
        iconEl.className = 'text-7xl mb-6 text-zinc-400';
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('result-modal').classList.add('hidden');
}

function closeModalAndRestart() {
    closeModal();
    restartGame();
}

// Keyboard support for entire game
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        restartGame();
    }
});