// ================================================================
// GAME4.JS - Szerencsejáték 2 (kártya húzás)
// ================================================================

export class Game4 {
    constructor() {
        this.gameId = 4;
        this.isRunning = false;
        this.score = 0;
        this.elements = {};
        this.draws = 0;
        this.totalDraws = 5;
        this.cards = ['♠', '♥', '♦', '♣'];
        this.values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.pointsMap = { 'A': 11, 'J': 10, 'Q': 10, 'K': 10 };
        this.lastCard = null;
    }

    start(gameData) {
        this.isRunning = true;
        this.score = 0;
        this.draws = 0;
        this.lastCard = null;

        const container = document.getElementById('screen-game');
        if (!container) return;

        const lang = window.GeryApp?.modules?.language;
        const gameName = lang?.t('game_name_4') || 'Szerencsejáték 2';
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
                    <div style="text-align:center;">
                        <div style="font-size:0.9rem;color:var(--gray-medium);">
                            🃏 ${lang?.t('game_name_4') || 'Szerencsejáték 2'}
                        </div>
                        <div style="font-size:0.85rem;color:var(--gray-light);">
                            ${this.draws}/${this.totalDraws} húzás
                        </div>
                    </div>
                    <div id="game4-card-display" style="
                        font-size:5rem;
                        text-align:center;
                        min-height:120px;
                        display:flex;
                        justify-content:center;
                        align-items:center;
                        background:var(--gray-pale);
                        border-radius:16px;
                        padding:20px;
                        transition:background 0.3s;
                    ">
                        🃏
                    </div>
                    <div style="display:flex;gap:30px;justify-content:center;font-size:1.2rem;">
                        <div>
                            ${lang?.t('points_score') || 'Pont'}: 
                            <span id="game4-score" style="font-weight:700;color:var(--brown-dark);">0</span>
                        </div>
                        <div>
                            🎯 ${lang?.t('multiplier_label') || 'Szorzó'}: 
                            <span style="font-weight:700;color:var(--brown-dark);">×${multiplier}</span>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;">
                        <button id="game4-draw-btn" style="
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
                            🃏 ${lang?.t('continue_btn') || 'Húzás'}
                        </button>
                        <button id="game4-finish-btn" style="
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
            cardDisplay: document.getElementById('game4-card-display'),
            score: document.getElementById('game4-score'),
            drawBtn: document.getElementById('game4-draw-btn'),
            finishBtn: document.getElementById('game4-finish-btn'),
            exitBtn: container.querySelector('.game-exit-btn')
        };

        this.elements.drawBtn?.addEventListener('click', () => this.drawCard());
        this.elements.drawBtn?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.drawCard();
        });
        this.elements.finishBtn?.addEventListener('click', () => this.finish());
        this.elements.exitBtn?.addEventListener('click', () => this.finish());

        console.log(`🎮 Játék 4 indítva (szorzó: ×${multiplier})`);
    }

    drawCard() {
        if (!this.isRunning) return;
        if (this.draws >= this.totalDraws) {
            this.finish();
            return;
        }

        const sound = window.GeryApp?.modules?.sound;
        if (sound) sound.playClick();

        this.draws++;

        // Kártya húzás
        const suit = this.cards[Math.floor(Math.random() * this.cards.length)];
        const value = this.values[Math.floor(Math.random() * this.values.length)];
        const points = this.pointsMap[value] || parseInt(value) || 0;

        this.lastCard = { suit, value, points };
        this.score += points;

        // Kártya megjelenítés
        const color = (suit === '♥' || suit === '♦') ? '#c0392b' : '#2c3e50';
        if (this.elements.cardDisplay) {
            this.elements.cardDisplay.innerHTML = `
                <div style="
                    background:white;
                    border-radius:12px;
                    padding:10px 20px;
                    box-shadow:0 4px 20px rgba(0,0,0,0.15);
                    color:${color};
                    font-size:3.5rem;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                ">
                    <div>${value}</div>
                    <div style="font-size:2.5rem;">${suit}</div>
                </div>
            `;
            // Animáció
            this.elements.cardDisplay.style.transform = 'scale(0.8)';
            setTimeout(() => {
                this.elements.cardDisplay.style.transform = 'scale(1)';
            }, 100);
        }

        // Pont frissítés
        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }

        // Gomb szövegének frissítése
        if (this.draws >= this.totalDraws) {
            const lang = window.GeryApp?.modules?.language;
            this.elements.drawBtn.textContent = `🎯 ${lang?.t('exit_confirm') || 'Befejezés'}`;
        }

        console.log(`🃏 Húzás ${this.draws}/${this.totalDraws}: ${value}${suit} = ${points} pont`);
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

        console.log(`🏁 Játék 4 befejezve: ${this.score} pont (${this.draws} húzás)`);
    }

    reset() {
        this.isRunning = false;
        this.score = 0;
        this.draws = 0;
        this.lastCard = null;
    }
}