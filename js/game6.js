// ================================================================
// GAME6.JS - Kígyó (klasszikus)
// ================================================================

export class game6 {
    constructor() {
        this.gameId = 5;
        this.isRunning = false;
        this.score = 0;
        this.elements = {};
        this.multiplier = 1;

        this.cols = 16;
        this.rows = 16;
        this.cell = 18;
        this.tickMs = 140;

        this.snake = [];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.food = { x: 8, y: 8 };
        this.loopId = null;
        this.started = false;
        this.paused = false;
        this.gameOver = false;

        this._onKey = this.onKey.bind(this);
        this._touchStart = null;
    }

    start(gameData) {
        this.resetState();
        this.isRunning = true;
        this.multiplier = gameData?.multiplier || 1;

        const container = document.getElementById('screen-game');
        if (!container) return;

        const lang = window.GeryApp?.modules?.language;
        const gameName = lang?.t('game_name_6') || 'Kígyó';

        const canvasW = this.cols * this.cell;
        const canvasH = this.rows * this.cell;

        container.innerHTML = `
            <div class="game-container">
                <div class="game-header">
                    <div class="game-title">${gameName}</div>
                    <div class="game-multiplier-display">
                        ${lang?.t('multiplier_label') || 'Szorzó:'} <span>×${this.multiplier}</span>
                    </div>
                    <button class="game-exit-btn" style="background:transparent;border:none;font-size:1.5rem;cursor:pointer;color:#c0392b;">
                        ⬆
                    </button>
                </div>
                <div class="game-content" style="flex-direction:column;gap:16px;">
                    <div style="text-align:center;">
                        <div style="font-size:0.9rem;color:var(--gray-medium);">
                            🐍 ${gameName}
                        </div>
                        <div id="game6-status" style="font-size:0.85rem;color:var(--gray-light);">
                            ${lang?.t('continue_btn') || 'Tovább'}
                        </div>
                    </div>
                    <div id="game6-board-wrap" style="
                        display:flex;
                        justify-content:center;
                        align-items:center;
                        background:var(--gray-pale);
                        border-radius:16px;
                        padding:16px;
                        touch-action:none;
                    ">
                        <canvas id="game6-canvas" width="${canvasW}" height="${canvasH}"
                            style="
                                width:100%;
                                max-width:${canvasW}px;
                                background:#1a1a1a;
                                border-radius:12px;
                                box-shadow:0 4px 20px rgba(0,0,0,0.15);
                            "></canvas>
                    </div>
                    <div style="display:flex;gap:30px;justify-content:center;font-size:1.2rem;">
                        <div>
                            ${lang?.t('points_score') || 'Pont'}:
                            <span id="game6-score" style="font-weight:700;color:var(--brown-dark);">0</span>
                        </div>
                        <div>
                            🎯 ${lang?.t('multiplier_label') || 'Szorzó'}:
                            <span style="font-weight:700;color:var(--brown-dark);">×${this.multiplier}</span>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;">
                        <button id="game6-draw-btn" style="
                            padding:16px 32px;
                            font-size:1.2rem;
                            background:linear-gradient(145deg, var(--brown-medium), var(--brown-dark));
                            color:white;
                            border:none;
                            border-radius:16px;
                            cursor:pointer;
                            box-shadow:0 4px 20px rgba(0,0,0,0.2);
                            transition:transform 0.1s;
                            touch-action:manipulation;
                            flex:1;
                        ">
                            🃏 ${lang?.t('continue_btn') || 'Tovább'}
                        </button>
                        <button id="game6-finish-btn" style="
                            padding:12px 24px;
                            background:var(--gray-medium);
                            color:white;
                            border:none;
                            border-radius:12px;
                            cursor:pointer;
                            font-size:1rem;
                        ">
                            ⏹
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.elements = {
            canvas: document.getElementById('game6-canvas'),
            score: document.getElementById('game6-score'),
            status: document.getElementById('game6-status'),
            drawBtn: document.getElementById('game6-draw-btn'),
            finishBtn: document.getElementById('game6-finish-btn'),
            exitBtn: container.querySelector('.game-exit-btn'),
            boardWrap: document.getElementById('game6-board-wrap')
        };

        this.ctx = this.elements.canvas?.getContext('2d');

        this.elements.drawBtn?.addEventListener('click', () => this.onMainButton());
        this.elements.drawBtn?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onMainButton();
        });
        this.elements.finishBtn?.addEventListener('click', () => this.finish());
        this.elements.exitBtn?.addEventListener('click', () => this.finish());

        window.addEventListener('keydown', this._onKey);

        const wrap = this.elements.boardWrap;
        wrap?.addEventListener('touchstart', (e) => {
            const t = e.changedTouches[0];
            this._touchStart = { x: t.clientX, y: t.clientY };
        }, { passive: true });
        wrap?.addEventListener('touchend', (e) => {
            if (!this._touchStart) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - this._touchStart.x;
            const dy = t.clientY - this._touchStart.y;
            this._touchStart = null;
            if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.setDir(dx > 0 ? 1 : -1, 0);
            } else {
                this.setDir(0, dy > 0 ? 1 : -1);
            }
        }, { passive: true });

        this.placeFood();
        this.draw();

        console.log(`🎮 Játék 6 indítva (szorzó: ×${this.multiplier})`);
    }

    resetState() {
        this.score = 0;
        this.started = false;
        this.paused = false;
        this.gameOver = false;
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        const midY = Math.floor(this.rows / 2);
        this.snake = [
            { x: 4, y: midY },
            { x: 3, y: midY },
            { x: 2, y: midY }
        ];
        this.clearLoop();
    }

    onMainButton() {
        if (!this.isRunning) return;

        const sound = window.GeryApp?.modules?.sound;
        if (sound) sound.playClick();

        const lang = window.GeryApp?.modules?.language;

        if (this.gameOver) {
            this.resetState();
            this.isRunning = true;
            if (this.elements.score) this.elements.score.textContent = '0';
                        if (this.elements.drawBtn) {
                this.elements.drawBtn.textContent = `🃏 ${lang?.t('continue_btn') || 'Húzás'}`;
            }
            this.placeFood();
            this.draw();
            this.beginPlay();
            return;
        }

        if (!this.started) {
            this.beginPlay();
            return;
        }

        this.paused = !this.paused;
        if (this.elements.status) {
            this.elements.status.textContent = this.paused
                ? (lang?.t('continue_btn') || 'Szünet')
                : '🐍';
        }
    }

    beginPlay() {
        this.started = true;
        this.paused = false;
        this.gameOver = false;
        const lang = window.GeryApp?.modules?.language;
        if (this.elements.status) this.elements.status.textContent = '🐍';
        this.clearLoop();
        this.loopId = setInterval(() => this.tick(), this.tickMs);
    }

    onKey(e) {
        if (!this.isRunning) return;
        const k = e.key.toLowerCase();
        if (k === 'arrowup' || k === 'w') this.setDir(0, -1);
        else if (k === 'arrowdown' || k === 's') this.setDir(0, 1);
        else if (k === 'arrowleft' || k === 'a') this.setDir(-1, 0);
        else if (k === 'arrowright' || k === 'd') this.setDir(1, 0);
        else if (k === ' ' || k === 'enter') {
            e.preventDefault();
            this.onMainButton();
        }
    }

    setDir(x, y) {
        if (this.dir.x + x === 0 && this.dir.y + y === 0) return;
        this.nextDir = { x, y };
        if (!this.started && this.isRunning && !this.gameOver) this.beginPlay();
    }

    tick() {
        if (!this.isRunning || this.paused || this.gameOver) return;

        this.dir = this.nextDir;
        const head = this.snake[0];
        const nx = head.x + this.dir.x;
        const ny = head.y + this.dir.y;

        if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) {
            this.endRound();
            return;
        }

        if (this.snake.some((s) => s.x === nx && s.y === ny)) {
            this.endRound();
            return;
        }

        this.snake.unshift({ x: nx, y: ny });

        if (nx === this.food.x && ny === this.food.y) {
            this.score += 10;
            if (this.elements.score) this.elements.score.textContent = this.score;
            this.placeFood();
            if (this.tickMs > 70) {
                this.tickMs -= 3;
                this.clearLoop();
                this.loopId = setInterval(() => this.tick(), this.tickMs);
            }
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    placeFood() {
        let x, y, clash;
        do {
            x = Math.floor(Math.random() * this.cols);
            y = Math.floor(Math.random() * this.rows);
            clash = this.snake.some((s) => s.x === x && s.y === y);
        } while (clash);
        this.food = { x, y };
    }

    draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        const c = this.cell;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.cols * c, this.rows * c);

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.cols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * c, 0);
            ctx.lineTo(i * c, this.rows * c);
            ctx.stroke();
        }
        for (let j = 0; j <= this.rows; j++) {
            ctx.beginPath();
            ctx.moveTo(0, j * c);
            ctx.lineTo(this.cols * c, j * c);
            ctx.stroke();
        }

        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(this.food.x * c + c / 2, this.food.y * c + c / 2, c * 0.32, 0, Math.PI * 2);
        ctx.fill();

        this.snake.forEach((s, i) => {
            ctx.fillStyle = i === 0 ? '#8B5A2B' : '#C4A574';
            const pad = i === 0 ? 1 : 2;
            ctx.fillRect(s.x * c + pad, s.y * c + pad, c - pad * 2, c - pad * 2);
        });
    }

    endRound() {
        this.gameOver = true;
        this.clearLoop();
        const lang = window.GeryApp?.modules?.language;
        if (this.elements.status) {
            this.elements.status.textContent = lang?.t('exit_confirm') || 'Vége';
        }
        if (this.elements.drawBtn) {
            this.elements.drawBtn.textContent = `🎯 ${lang?.t('exit_confirm') || 'Vissza'}`;
        }
        this.draw();
    }

    clearLoop() {
        if (this.loopId) {
            clearInterval(this.loopId);
            this.loopId = null;
        }
    }

    finish() {
        if (!this.isRunning && !this.gameOver) return;

        this.isRunning = false;
        this.clearLoop();
        window.removeEventListener('keydown', this._onKey);

        const gamesManager = window.GeryApp?.modules?.games;
        if (gamesManager) {
            gamesManager.recordGameResult(this.gameId, this.score);
        } else {
            const app = window.GeryApp?.modules?.app;
            if (app) app.showScreen('menu');
        }

        console.log(`🏁 Játék 5 befejezve: ${this.score} pont`);
    }

    reset() {
        this.clearLoop();
        window.removeEventListener('keydown', this._onKey);
        this.isRunning = false;
        this.score = 0;
        this.started = false;
        this.paused = false;
        this.gameOver = false;
        this.lastCard = null;
        this.tickMs = 140;
    }
}