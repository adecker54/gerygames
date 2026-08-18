// ================================================================
// GAME3.JS - Szerencsejáték 1 (kockadobás)
// ================================================================

export class Game3 {
    constructor() {
        this.gameId = 3;
        this.isRunning = false;
        this.score = 0;
        this.elements = {};
        this.rolls = 0;
        this.totalRolls = 5;
        this.diceValues = [];
    }

    start(gameData) {
        this.isRunning = true;
        this.score = 0;
        this.rolls = 0;
        this.diceValues = [];

        const container = document.getElementById('screen-game');
        if (!container) return;

        const lang = window.GeryApp?.modules?.language;
        const gameName = lang?.t('game_name_3') || 'Szerencsejáték 1';
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
                <div class="game-content" style="flex-direction:column;gap:20px;">
                    <div style="text-align:center;">
                        <div style="font-size:1rem;color:var(--gray-medium);">
                            🎲 ${lang?.t('game_name_3') || 'Szerencsejáték 1'}
                        </div>
                        <div style="font-size:0.85rem;color:var(--gray-light);margin-top:4px;">
                            ${this.rolls}/${this.totalRolls} dobás
                        </div>
                    </div>
                    <div id="game3-dice-display" style="
                        display:flex;
                        justify-content:center;
                        gap:12px;
                        flex-wrap:wrap;
                        min-height:80px;
                    ">
                        ${this.getDiceEmojis([0,0,0,0,0])}
                    </div>
                    <div style="display:flex;gap:30px;justify-content:center;font-size:1.2rem;">
                        <div>
                            ${lang?.t('points_score') || 'Pont'}: 
                            <span id="game3-score" style="font-weight:700;color:var(--brown-dark);">0</span>
                        </div>
                        <div>
                            🎯 ${lang?.t('multiplier_label') || 'Szorzó'}: 
                            <span style="font-weight:700;color:var(--brown-dark);">×${multiplier}</span>
                        </div>
                    </div>
                    <button id="game3-roll-btn" style="
                        padding:16px 40px;
                        font-size:1.3rem;
                        background:linear-gradient(145deg, var(--brown-medium), var(--brown-dark));
                        color:white;
                        border:none;
                        border-radius:16px;
                        cursor:pointer;
                        box-shadow:0 4px 20px rgba(0,0,0,0.2);
                        transition:transform 0.1s;
                        touch-action:manipulation;
                    ">
                        🎲 ${lang?.t('continue_btn') || 'Dobás'}
                    </button>
                    <div style="display:flex;gap:16px;">
                        <button id="game3-finish-btn" style="
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
                </div>
            </div>
        `;

        this.elements = {
            diceDisplay: document.getElementById('game3-dice-display'),
            score: document.getElementById('game3-score'),
            rollBtn: document.getElementById('game3-roll-btn'),
            finishBtn: document.getElementById('game3-finish-btn'),
            exitBtn: container.querySelector('.game-exit-btn')
        };

        this.elements.rollBtn?.addEventListener('click', () => this.rollDice());
        this.elements.rollBtn?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.rollDice();
        });
        this.elements.finishBtn?.addEventListener('click', () => this.finish());
        this.elements.exitBtn?.addEventListener('click', () => this.finish());

        console.log(`🎮 Játék 3 indítva (szorzó: ×${multiplier})`);
    }

    getDiceEmojis(values) {
        const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return values.map(v => {
            const emoji = emojis[Math.min(Math.max(v - 1, 0), 5)] || '⚀';
            return `<span style="font-size:3rem;display:inline-block;transition:transform 0.3s;">${emoji}</span>`;
        }).join('');
    }

    rollDice() {
        if (!this.isRunning) return;
        if (this.rolls >= this.totalRolls) {
            this.finish();
            return;
        }

        const sound = window.GeryApp?.modules?.sound;
        if (sound) sound.playClick();

        this.rolls++;

        // 5 kocka dobás
        const values = [];
        let total = 0;
        for (let i = 0; i < 5; i++) {
            const val = Math.floor(Math.random() * 6) + 1;
            values.push(val);
            total += val;
        }

        this.diceValues = values;
        this.score += total;

        // Frissítés
        if (this.elements.diceDisplay) {
            this.elements.diceDisplay.innerHTML = this.getDiceEmojis(values);
            // Animáció
            this.elements.diceDisplay.querySelectorAll('span').forEach(el => {
                el.style.transform = 'scale(1.5)';
                setTimeout(() => {
                    el.style.transform = 'scale(1)';
                }, 300);
            });
        }

        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }

        // Gomb szövegének frissítése
        if (this.rolls >= this.totalRolls) {
            const lang = window.GeryApp?.modules?.language;
            this.elements.rollBtn.textContent = `🎯 ${lang?.t('exit_confirm') || 'Befejezés'}`;
        }

        console.log(`🎲 Dobás ${this.rolls}/${this.totalRolls}: ${values.join(', ')} = ${total} pont`);
    }

    finish() {
        if (!this.isRunning) return;

        this.isRunning = false;

        const gamesManager = window.GeryApp?.modules?.games;
        if (gamesManager) {
            gamesManager.recordGameResult(this.gameId, this.score);
        } else {
            const app = window.GeryApp?.modules?.app;
            if (app) app.showScreen('menu');
        }

        console.log(`🏁 Játék 3 befejezve: ${this.score} pont (${this.rolls} dobás)`);
    }

    reset() {
        this.isRunning = false;
        this.score = 0;
        this.rolls = 0;
        this.diceValues = [];
    }
}