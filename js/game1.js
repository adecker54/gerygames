// ================================================================
// GAME1.JS - Ügyességi játék 1 (példa implementáció)
// ================================================================

export class Game1 {
    constructor() {
        this.gameId = 1;
        this.isRunning = false;
        this.score = 0;
        this.elements = {};
        this.timer = null;
        this.startTime = null;
    }

    // Játék indítása
    start(gameData) {
        this.isRunning = true;
        this.score = 0;
        this.startTime = Date.now();

        const container = document.getElementById('screen-game');
        if (!container) return;

        const lang = window.GeryApp?.modules?.language;
        const gameName = lang?.t('game_name_1') || 'Ügyességi játék 1';
        const multiplier = gameData?.multiplier || 1;

        // Játék UI
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
                    <div style="font-size:3rem;text-align:center;">
                        🎯
                    </div>
                    <div style="font-size:1.2rem;text-align:center;color:var(--brown-dark);">
                        ${lang?.t('game_name_1') || 'Ügyességi játék 1'} - 
                        ${lang?.t('multiplier_label') || 'Szorzó:'} ×${multiplier}
                    </div>
                    <div style="font-size:0.9rem;text-align:center;color:var(--gray-medium);">
                        Kattints a gombra pontot szerezni!
                    </div>
                    <div id="game1-score" style="font-size:2rem;font-weight:700;color:var(--brown-dark);">
                        0
                    </div>
                    <button id="game1-click-btn" style="
                        padding:20px 40px;
                        font-size:1.5rem;
                        background:linear-gradient(145deg, var(--brown-medium), var(--brown-dark));
                        color:white;
                        border:none;
                        border-radius:50%;
                        width:120px;
                        height:120px;
                        cursor:pointer;
                        box-shadow:0 4px 20px rgba(0,0,0,0.2);
                        transition:transform 0.1s;
                        touch-action:manipulation;
                    ">
                        👆
                    </button>
                    <div style="display:flex;gap:16px;margin-top:12px;">
                        <button id="game1-finish-btn" style="
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

        // Elemet mentése
        this.elements = {
            scoreDisplay: document.getElementById('game1-score'),
            clickBtn: document.getElementById('game1-click-btn'),
            finishBtn: document.getElementById('game1-finish-btn'),
            exitBtn: container.querySelector('.game-exit-btn')
        };

        // Eseményfigyelők
        this.elements.clickBtn?.addEventListener('click', () => this.onClick());
        this.elements.clickBtn?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onClick();
        });
        this.elements.finishBtn?.addEventListener('click', () => this.finish());
        this.elements.exitBtn?.addEventListener('click', () => this.finish());

        console.log(`🎮 Játék 1 indítva (szorzó: ×${multiplier})`);
    }

    // Kattintás kezelése
    onClick() {
        if (!this.isRunning) return;

        // Hang
        const sound = window.GeryApp?.modules?.sound;
        if (sound) sound.playClick();

        // Pont
        this.score += 1;

        // Pont frissítése
        if (this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = this.score;
        }

        // Animáció
        const btn = this.elements.clickBtn;
        if (btn) {
            btn.style.transform = 'scale(0.85)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
        }

        // Visszajelzés (pont villanás)
        const display = this.elements.scoreDisplay;
        if (display) {
            display.style.color = '#27ae60';
            setTimeout(() => {
                display.style.color = 'var(--brown-dark)';
            }, 200);
        }
    }

    // Befejezés
    finish() {
        if (!this.isRunning) return;

        this.isRunning = false;

        // Timer törlése
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        const gamesManager = window.GeryApp?.modules?.games;
        if (gamesManager) {
            gamesManager.recordGameResult(this.gameId, this.score);
        } else {
            console.warn('⚠️ GamesManager nem elérhető');
            // Fallback: vissza a menübe
            const app = window.GeryApp?.modules?.app;
            if (app) app.showScreen('menu');
        }

        console.log(`🏁 Játék 1 befejezve: ${this.score} pont`);
    }

    // Játék megszakítása (kilépés gomb)
    cancel() {
        this.finish();
    }

    // Reset
    reset() {
        this.isRunning = false;
        this.score = 0;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}