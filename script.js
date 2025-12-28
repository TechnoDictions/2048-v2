
document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.querySelector('.grid-container');
    const tileContainer = document.querySelector('.tile-container');
    const scoreElement = document.querySelector('.score-container');
    const bestScoreElement = document.querySelector('.best-container');
    const messageContainer = document.querySelector('.game-message');
    const messageText = messageContainer.querySelector('p');
    const restartButton = document.querySelector('.restart-button');
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

    // Initialize Game
    function initGame() {
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        score = 0;
        won = false;
        keepPlaying = false;

        clearTiles();
        updateScore();
        updateBestScore();
        hideMessage();

        addRandomTile();
        addRandomTile();
        updateView();
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

            // We'll update the view separately, but we could add animation class here
            // Note: The main loop calls updateView which rebuilds DOM. 
            // Better approach for animation: differentiate new tiles.
            // For simplicity in this version, updateView handles everything.
        }
    }

    function updateView() {
        clearTiles(); // Naive approach: clear and redraw. For smoother animations, we'd need to track tile objects.
        // Let's implement a better view update that supports animations
        // Actually, for a simple implementation, let's just redraw. 
        // We will make it slightly smarter: we need to position them absolutely.

        const cellGap = 15;
        const cellSize = 106.25;

        // Check window width for responsive sizing
        // Simplified: using CSS variable logic or just standard calculations
        // We rely on CSS classes for positions if possible, or inline styles.
        // Let's use inline styles for generic logic

        // We need to know the exact layout size. 
        // But wait, our CSS defines sizes in pixels (500px container). 
        // We can just rely on percentages or calculated pixels.

        // Let's find the current size of a grid cell to be responsive
        const tempCell = document.querySelector('.grid-cell');
        const computedStyle = window.getComputedStyle(tempCell);
        const cellW = parseFloat(computedStyle.width);
        const cellH = parseFloat(computedStyle.height);

        // Grid gap
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

                    // Position
                    // x = c * (width + gap)
                    // y = r * (height + gap)

                    const x = c * (cellW + gap);
                    const y = r * (cellH + gap);

                    tile.style.transform = `translate(${x}px, ${y}px)`;

                    // Add animation classes if needed (new, merged) 
                    // This is hard to track without a diffing algorithm or object tracking.
                    // For this MVP, we will skip complex move animations and just snap.
                    // But we can add 'new' animation if we track it.

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
        // [2, 0, 2, 0] -> [2, 2] -> [4] -> [4, 0, 0, 0]
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
                // Score is no longer updated here

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
        for (let r = 0; r < gridSize; r++) {
            let row = grid[r];
            // reverse for right
            let reversed = row.slice().reverse();
            let slid = slide(reversed);
            let combined = combine(slid);
            let slidAgain = slide(combined); // slide again after merge
            let newRow = slidAgain.reverse();

            if (JSON.stringify(grid[r]) !== JSON.stringify(newRow)) {
                moved = true;
                grid[r] = newRow;
            }
        }
        return moved;
    }

    function moveLeft() {
        let moved = false;
        for (let r = 0; r < gridSize; r++) {
            let row = grid[r];
            let slid = slide(row);
            let combined = combine(slid);
            let slidAgain = slide(combined);
            let newRow = slidAgain;

            if (JSON.stringify(grid[r]) !== JSON.stringify(newRow)) {
                moved = true;
                grid[r] = newRow;
            }
        }
        return moved;
    }

    function moveDown() {
        let moved = false;
        for (let c = 0; c < gridSize; c++) {
            let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            let reversed = col.reverse();
            let slid = slide(reversed);
            let combined = combine(slid);
            let slidAgain = slide(combined);
            let newCol = slidAgain.reverse();

            for (let r = 0; r < gridSize; r++) {
                if (grid[r][c] !== newCol[r]) {
                    moved = true;
                    grid[r][c] = newCol[r];
                }
            }
        }
        return moved;
    }

    function moveUp() {
        let moved = false;
        for (let c = 0; c < gridSize; c++) {
            let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            let slid = slide(col);
            let combined = combine(slid);
            let slidAgain = slide(combined);
            let newCol = slidAgain;

            for (let r = 0; r < gridSize; r++) {
                if (grid[r][c] !== newCol[r]) {
                    moved = true;
                    grid[r][c] = newCol[r];
                }
            }
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
    retryButton.addEventListener('click', initGame);
    keepPlayingButton.addEventListener('click', () => {
        keepPlaying = true;
        hideMessage();
    });

    // Touch support (basic)
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
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
        // Debounce or just update
        updateView();
    });

    // Start
    initGame();
});
