
document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    const tileContainer = document.querySelector('.tile-container');
    const scoreElement = document.querySelector('.score-container');
    const bestScoreElement = document.querySelector('.best-container');
    const messageContainer = document.querySelector('.game-message');
    const messageText = messageContainer.querySelector('p');
    const restartButton = document.querySelector('.restart-button');
    const undoButton = document.querySelector('.undo-button');
    const mergeButton = document.querySelector('.merge-button');
    const retryButton = document.querySelector('.retry-button');
    const keepPlayingButton = document.querySelector('.keep-playing-button');

    // Game Constants
    const gridSize = 4;

    // Game State
    let grid = [];
    let score = 0;
    let bestScore = localStorage.getItem('2048-best-score') || 0;
    let won = false;
    let keepPlaying = false;
    let touchStartX = 0;
    let touchStartY = 0;

    // Undo State
    let gameHistory = [];
    const maxUndos = 9;
    let undoCount = maxUndos;

    // Merge Powerup State
    const maxMerges = 2;
    let mergeCount = maxMerges;

    // Initialize Game
    function initGame() {
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        score = 0;
        won = false;
        keepPlaying = false;

        // Reset Undo and Merge
        undoCount = maxUndos;
        mergeCount = maxMerges;
        gameHistory = [];
        updateUndoButton();
        updateMergeButton();

        clearTiles();
        updateScore();
        updateBestScore();
        hideMessage();

        addRandomTile();
        addRandomTile();
        updateView();
    }

    // Save state for Undo
    function saveState() {
        if (undoCount > 0) {
            const gridCopy = grid.map(row => [...row]);
            gameHistory.push({
                grid: gridCopy,
                score: score,
                won: won,
                keepPlaying: keepPlaying,
                mergeCount: mergeCount // Save merge count too so it reverts
            });
        }
    }

    function undo() {
        if (undoCount > 0 && gameHistory.length > 0) {
            const previousState = gameHistory.pop();
            grid = previousState.grid;
            score = previousState.score;
            won = previousState.won;
            keepPlaying = previousState.keepPlaying;
            mergeCount = previousState.mergeCount !== undefined ? previousState.mergeCount : maxMerges;

            undoCount--;
            updateUndoButton();
            updateMergeButton();
            updateView();
            updateScore();
            hideMessage();
        }
        updateUndoButton();
    }

    function magicMerge() {
        if (mergeCount <= 0) return;

        let merged = false;
        // Check Horizontal Merges first
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize - 1; c++) {
                if (grid[r][c] !== 0 && grid[r][c] === grid[r][c + 1]) {
                    // Merge!
                    if (!merged) {
                        saveState(); // Save only if at least one merge happens
                        merged = true;
                    }
                    grid[r][c] *= 2;
                    grid[r][c + 1] = 0;
                    c++; // Skip next since we just merged into it (avoid 2-2-2 -> 4-2)
                }
            }
        }

        // Check Vertical Merges (independent scan)
        for (let c = 0; c < gridSize; c++) {
            for (let r = 0; r < gridSize - 1; r++) {
                if (grid[r][c] !== 0 && grid[r][c] === grid[r + 1][c]) {
                    if (!merged) {
                        saveState(); // Ensure we save state if only vertical merge happens
                        merged = true;
                    }
                    grid[r][c] *= 2;
                    grid[r + 1][c] = 0;
                    r++;
                }
            }
        }

        if (merged) {
            mergeCount--;
            updateMergeButton();
            updateView();
            updateScore();

            // Note: NO new tile is added, just pure relief.
        }
    }

    function updateUndoButton() {
        undoButton.textContent = `Undo (${undoCount})`;
        if (undoCount === 0 || gameHistory.length === 0) {
            undoButton.disabled = true;
        } else {
            undoButton.disabled = false;
        }
    }

    function updateMergeButton() {
        if (mergeButton) {
            mergeButton.textContent = `Merge (${mergeCount})`;
            mergeButton.disabled = (mergeCount === 0);
        }
    }

    function clearTiles() {
        tileContainer.innerHTML = '';
    }

    function addRandomTile() {
        const availableCells = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) {
                    availableCells.push({ r, c });
                }
            }
        }

        if (availableCells.length > 0) {
            const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            grid[randomCell.r][randomCell.c] = value;
        }
    }

    function updateView() {
        clearTiles();

        const tempCell = document.querySelector('.grid-cell');
        const computedStyle = window.getComputedStyle(tempCell);
        const cellW = parseFloat(computedStyle.width);
        const cellH = parseFloat(computedStyle.height);

        const gridCompStyle = window.getComputedStyle(gridContainer);
        const gap = parseFloat(gridCompStyle.gap) || 15;

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const value = grid[r][c];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.classList.add('tile');
                    tile.classList.add(`tile-${value > 2048 ? 'super' : value}`);
                    tile.textContent = value;

                    const x = c * (cellW + gap);
                    const y = r * (cellH + gap);

                    tile.style.transform = `translate(${x}px, ${y}px)`;

                    tileContainer.appendChild(tile);
                }
            }
        }
    }

    function updateScore() {
        // Recalculate score: Sum of all numbers on the grid
        score = 0;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                score += grid[r][c];
            }
        }
        scoreElement.textContent = score;

        if (score > bestScore) {
            bestScore = score;
            updateBestScore();
        }
    }

    function updateBestScore() {
        bestScoreElement.textContent = bestScore;
        localStorage.setItem('2048-best-score', bestScore);
    }

    function showMessage(wonGame) {
        if (wonGame) {
            messageContainer.classList.add('game-won');
            messageText.textContent = 'You Win!';
        } else {
            messageContainer.classList.add('game-over');
            messageText.textContent = 'Game Over!';
        }
        messageContainer.style.display = 'flex';
    }

    function hideMessage() {
        messageContainer.classList.remove('game-won', 'game-over');
        messageContainer.style.display = 'none';
    }

    // Game Logic
    function slide(row) {
        let arr = row.filter(val => val);
        let missing = gridSize - arr.length;
        let zeros = Array(missing).fill(0);
        return arr.concat(zeros);
    }

    function combine(row) {
        for (let i = 0; i < gridSize - 1; i++) {
            if (row[i] !== 0 && row[i] === row[i + 1]) {
                row[i] *= 2;
                row[i + 1] = 0;

                if (row[i] === 2048 && !won && !keepPlaying) {
                    won = true;
                    setTimeout(() => showMessage(true), 300);
                }
            }
        }
        return row;
    }

    function moveRight() {
        let moved = false;
        let newGrid = JSON.parse(JSON.stringify(grid)); // Deep copy to detect change

        for (let r = 0; r < gridSize; r++) {
            let row = newGrid[r];
            let reversed = row.slice().reverse();
            let slid = slide(reversed);
            let combined = combine(slid);
            let slidAgain = slide(combined);
            newGrid[r] = slidAgain.reverse();
        }

        if (JSON.stringify(grid) !== JSON.stringify(newGrid)) {
            moved = true;
            saveState(); // Save BEFORE updating grid
            grid = newGrid;
        }
        return moved;
    }

    function moveLeft() {
        let moved = false;
        let newGrid = JSON.parse(JSON.stringify(grid));

        for (let r = 0; r < gridSize; r++) {
            let row = newGrid[r];
            let slid = slide(row);
            let combined = combine(slid);
            let slidAgain = slide(combined);
            newGrid[r] = slidAgain;
        }

        if (JSON.stringify(grid) !== JSON.stringify(newGrid)) {
            moved = true;
            saveState();
            grid = newGrid;
        }
        return moved;
    }

    function moveDown() {
        let moved = false;
        let newGrid = JSON.parse(JSON.stringify(grid));

        for (let c = 0; c < gridSize; c++) {
            let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
            let reversed = col.reverse();
            let slid = slide(reversed);
            let combined = combine(slid);
            let slidAgain = slide(combined);
            let newCol = slidAgain.reverse();

            for (let r = 0; r < gridSize; r++) {
                newGrid[r][c] = newCol[r];
            }
        }

        if (JSON.stringify(grid) !== JSON.stringify(newGrid)) {
            moved = true;
            saveState();
            grid = newGrid;
        }
        return moved;
    }

    function moveUp() {
        let moved = false;
        let newGrid = JSON.parse(JSON.stringify(grid));

        for (let c = 0; c < gridSize; c++) {
            let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
            let slid = slide(col);
            let combined = combine(slid);
            let slidAgain = slide(combined);
            let newCol = slidAgain;

            for (let r = 0; r < gridSize; r++) {
                newGrid[r][c] = newCol[r];
            }
        }

        if (JSON.stringify(grid) !== JSON.stringify(newGrid)) {
            moved = true;
            saveState();
            grid = newGrid;
        }
        return moved;
    }

    function isGameOver() {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) return false;
                if (c < gridSize - 1 && grid[r][c] === grid[r][c + 1]) return false;
                if (r < gridSize - 1 && grid[r][c] === grid[r + 1][c]) return false;
            }
        }
        return true;
    }

    function handleInput(key) {
        if (won && !keepPlaying) return;

        let moved = false;
        switch (key) {
            case 'ArrowUp': moved = moveUp(); break;
            case 'ArrowDown': moved = moveDown(); break;
            case 'ArrowLeft': moved = moveLeft(); break;
            case 'ArrowRight': moved = moveRight(); break;
        }

        if (moved) {
            addRandomTile();
            updateView();
            updateScore();
            updateUndoButton(); // Enable button if it was disabled
            if (isGameOver()) {
                setTimeout(() => showMessage(false), 500);
            }
        }
    }

    // Event Listeners
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault(); // prevent scrolling
            handleInput(e.key);
        }
    });

    restartButton.addEventListener('click', initGame);
    undoButton.addEventListener('click', undo);
    if (mergeButton) mergeButton.addEventListener('click', magicMerge);
    retryButton.addEventListener('click', initGame);
    keepPlayingButton.addEventListener('click', () => {
        keepPlaying = true;
        hideMessage();
    });

    // Touch support
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        // IMPORTANT: Prevent default global scrolling/refresh
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;

        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;

        let diffX = touchEndX - touchStartX;
        let diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal
            if (Math.abs(diffX) > 30) { // threshold
                if (diffX > 0) handleInput('ArrowRight');
                else handleInput('ArrowLeft');
            }
        } else {
            // Vertical
            if (Math.abs(diffY) > 30) {
                if (diffY > 0) handleInput('ArrowDown');
                else handleInput('ArrowUp');
            }
        }

        touchStartX = 0;
        touchStartY = 0;
    }, { passive: false });

    // Handle window resize for positioning
    window.addEventListener('resize', () => {
        updateView();
    });

    // Start
    initGame();
});
