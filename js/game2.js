// ================================================================
// GAME2.JS - Ügyességi játék 2 (időzítős)
// ================================================================

export class Game2 {
    constructor() {
        this.gameId = 2;
        this.isRunning = false;
        this.score = 0;
        this.elements = {};
        this.timer = null;
        this.startTime = null;
        this.timeLeft = 10;
        this.maxTime = 10;
        this.targetX = 0;
        this.targetY = 0;
        this.hits = 0;
        this.misses = 0;
    }

    start(gameData) {
        this.isRunning = true;
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.timeLeft = this.maxTime;
        this.startTime = Date.now();

        const container = document.getElementById('screen-game');
        if (!container) return;

        const lang = window.GeryApp?.modules?.language;
        const gameName = lang?.t('game_name_2') || 'Ügyességi játék 2';
        const multiplier = gameData?.multiplier || 1;

        container.innerHTML = `
            <div class="game-container">
                <div class="game-header">
                    <div class="game-title">${gameName}</div>
                    <div class="game-multiplier-display">
                        ${lang?.t('multiplier_label') || 'Szorzó:'} <span>×${multiplier}</span>
                    </div>
                    <button class="game-exit-btn" style="background:transparent;border:none;font-size:1.5rem;cursor:pointer;color:#c0392b;">
                        ⬆
                    </button>
                </div>
                <div class="game-content" style="flex-direction:column;gap:16px;">
                    <div style="display:flex;justify-content:space-between;width:100%;padding:0 8px;">
                        <div style="font-size:1.2rem;font-weight:700;color:var(--brown-dark);">
                            ⏱️ <span id="game2-timer">${this.timeLeft}</span>s
                        </div>
                        <div style="font-size:1.2rem;font-weight:700;color:var(--brown-dark);">
                            🎯 <span id="game2-score">0</span>
                        </div>
                        <div style="font-size:1rem;color:var(--gray-medium);">
                            ✅ <span id="game2-hits">0</span> / ❌ <span id="game2-misses">0</span>
                        </div>
                    </div>
                    <div id="game2-target-area" style="
                        position:relative;
                        width:100%;
                        aspect-ratio:1/1;
                        background:var(--gray-pale);
                        border-radius:16px;
                        overflow:hidden;
                        cursor:pointer;
                        touch-action:manipulation;
                    ">
                        <div id="game2-target" style="
                            position:absolute;
                            width:50px;
                            height:50px;
                            background:radial-gradient(circle, #e74c3c, #c0392b);
                            border-radius:50%;
                            box-shadow:0 0 20px rgba(231,76,60,0.4);
                            transition:top 0.3s, left 0.3s;
                            cursor:pointer;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:1.5rem;
                            color:white;
                            font-weight:700;
                            touch-action:manipulation;
                        ">
                            🎯
                        </div>
                    </div>
                    <div style="display:flex;gap:16px;justify-content:center;margin-top:8px;">
                        <button id="game2-finish-btn" style="
                            padding:12px 24px;
                            background:var(--gray-medium);
                            color:white;
                            border:none;
                            border-radius:12px;
                            cursor:pointer;
                            font-size:1rem;
                        ">
                            ⏹ ${lang?.t('exit_confirm') || 'Befejezés'}
                        </button>
                    </div>
                    <div style="font-size:0.85rem;color:var(--gray-light);text-align:center;">
                        ${lang?.t('game_name_2') || 'Ügyességi játék 2'} - Kattints a célpontra!
                    </div>
                </div>
            </div>
        `;

        this.elements = {
            timer: document.getElementById('game2-timer'),
            score: document.getElementById('game2-score'),
            hits: document.getElementById('game2-hits'),
            misses: document.getElementById('game2-misses'),
            target: document.getElementById('game2-target'),
            targetArea: document.getElementById('game2-target-area'),
            finishBtn: document.getElementById('game2-finish-btn'),
            exitBtn: container.querySelector('.game-exit-btn')
        };

        // Célpont mozgatása
        this.moveTarget();

        // Eseményfigyelők
        this.elements.target?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onHit();
        });
        this.elements.target?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.onHit();
        });
        this.elements.targetArea?.addEventListener('click', (e) => {
            if (e.target === this.elements.targetArea || e.target === this.elements.target) {
                this.onMiss();
            }
        });
        this.elements.finishBtn?.addEventListener('click', () => this.finish());
        this.elements.exitBtn?.addEventListener('click', () => this.finish());

        // Timer indítása
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (this.elements.timer) {
                this.elements.timer.textContent = this.timeLeft;
            }
            if (this.timeLeft <= 0) {
                this.finish();
            }
        }, 1000);

        console.log(`🎮 Játék 2 indítva (szorzó: ×${multiplier})`);
    }

    moveTarget() {
        if (!this.isRunning) return;
        const area = this.elements.targetArea;
        const target = this.elements.target;
        if (!area || !target) return;

        const rect = area.getBoundingClientRect();
        const padding = 30;
        const maxX = rect.width - padding * 2 - 50;
        const maxY = rect.height - padding * 2 - 50;

        this.targetX = padding + Math.random() * maxX;
        this.targetY = padding + Math.random() * maxY;

        target.style.left = this.targetX + 'px';
        target.style.top = this.targetY + 'px';
    }

    onHit() {
        if (!this.isRunning) return;

        const sound = window.GeryApp?.modules?.sound;
        if (sound) sound.playClick();

        this.hits++;
        this.score += 10;

        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }
        if (this.elements.hits) {
            this.elements.hits.textContent = this.hits;
        }

        // Célpont mozgatása
        this.moveTarget();

        // Visszajelzés
        const target = this.elements.target;
        if (target) {
            target.style.boxShadow = '0 0 40px rgba(46,204,113,0.8)';
            setTimeout(() => {
                target.style.boxShadow = '0 0 20px rgba(231,76,60,0.4)';
            }, 200);
        }
    }

    onMiss() {
        if (!this.isRunning) return;

        this.misses++;
        if (this.elements.misses) {
            this.elements.misses.textContent = this.misses;
        }

        // Büntetés: -2 pont
        this.score = Math.max(0, this.score - 2);
        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }

        const sound = window.GeryApp?.modules?.sound;
        if (sound) sound.playError();
    }

    finish() {
        if (!this.isRunning) return;

        this.isRunning = false;

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        const gamesManager = window.GeryApp?.modules?.games;
        if (gamesManager) {
            gamesManager.recordGameResult(this.gameId, this.score);
        } else {
            const app = window.GeryApp?.modules?.app;
            if (app) app.showScreen('menu');
        }

        console.log(`🏁 Játék 2 befejezve: ${this.score} pont (találatok: ${this.hits}, hibák: ${this.misses})`);
    }

    reset() {
        this.isRunning = false;
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.timeLeft = this.maxTime;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}