// ================================================================
// GAMES.JS - Játékmenü kezelés
// ================================================================

export class GamesManager {
    constructor() {
        this.games = [];
        this.initialized = false;
    }

    async init() {
        // Játékok definiálása (szorzókkal együtt)
        this.games = [
            { 
                id: 1, 
                name: 'game_name_1', 
                image: 'assets/images/game1.jpg',
                multiplier: 2,
                description: 'Ügyességi játék - gyűjts minél több pontot!'
            },
            { 
                id: 2, 
                name: 'game_name_2', 
                image: 'assets/images/game2.jpg',
                multiplier: 3,
                description: 'Ügyességi játék - időzíts pontosan!'
            },
            { 
                id: 3, 
                name: 'game_name_3', 
                image: 'assets/images/game3.jpg',
                multiplier: 1,
                description: 'Szerencsejáték - szerencséd lesz ma?'
            },
            { 
                id: 4, 
                name: 'game_name_4', 
                image: 'assets/images/game4.jpg',
                multiplier: 5,
                description: 'Szerencsejáték - nagy kockázat, nagy nyeremény!'
            }
        ];

        // Globális állapot frissítése
        if (window.GeryApp) {
            window.GeryApp.state.games = this.games.map(g => ({
                ...g,
                active: false
            }));
            window.GeryApp.state.gameMultipliers = this.games.map(g => g.multiplier);
        }

        this.initialized = true;
        console.log('🎮 Játékmenü inicializálva');
        return true;
    }

    // Játékmenü megjelenítése
    renderMenu() {
        const screen = document.getElementById('screen-menu');
        if (!screen) return;

        const lang = window.GeryApp?.modules?.language;
        const state = window.GeryApp?.state;

        let html = `
            <div class="menu-title" data-i18n="menu_title">
                ${lang?.t('menu_title') || 'Játszva támogatom Geryt, a hegyi macskát'}
            </div>
            <div class="games-grid">
        `;

        this.games.forEach(game => {
            const isLocked = !state?.isCodeValid;
            const score = state?.gameScores?.[game.id - 1] || 0;
            const name = lang?.t(game.name) || game.name;

            html += `
                <div class="game-card ${isLocked ? 'locked' : ''}" 
                     data-game-id="${game.id}"
                     onclick="window.GeryApp?.modules?.games?.selectGame(${game.id})">
                    <img class="game-image" 
                         src="${game.image}" 
                         alt="${name}"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23C4A88C%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2240%22 fill=%22%238B6B4F%22%3E🎮%3C/text%3E%3C/svg%3E'">
                    <div class="game-info">
                        <div class="game-name">${name}</div>
                        <div class="game-multiplier">
                            ${lang?.t('multiplier_label') || 'Szorzó:'} 
                            <span>×${game.multiplier}</span>
                        </div>
                        ${score > 0 ? `<div class="game-score">🏆 ${score} ${lang?.t('points_score') || 'pont'}</div>` : ''}
                        ${isLocked ? `<div style="font-size:0.65rem;color:#c0392b;margin-top:4px;">🔒 ${lang?.t('enter_code') || 'Add meg a kódot'}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += `
            </div>
        `;

        screen.innerHTML = html;

        // Nyelvi frissítés
        if (lang) {
            lang.applyToDOM();
        }

        // Pontok frissítése a menüben
        this.updateMenuPoints();
    }

    // Játék kiválasztása
    selectGame(gameId) {
        const state = window.GeryApp?.state;
        const sound = window.GeryApp?.modules?.sound;
        const app = window.GeryApp?.modules?.app;

        // Hang
        if (sound) sound.playClick();

        // Ellenőrizzük, hogy a kód érvényes-e
        if (!state?.isCodeValid) {
            const lang = window.GeryApp?.modules?.language;
            alert(lang?.t('enter_code') || 'Előbb add meg a kódszámodat!');
            return;
        }

        // Játék indítása
        if (app) {
            app.startGame(gameId);
        } else {
            console.warn('⚠️ App modul nem elérhető');
        }
    }

    // Menü pontjainak frissítése
    updateMenuPoints() {
        const state = window.GeryApp?.state;
        if (!state) return;

        const cards = document.querySelectorAll('.game-card');
        cards.forEach(card => {
            const id = parseInt(card.dataset.gameId);
            const score = state.gameScores?.[id - 1] || 0;
            const infoDiv = card.querySelector('.game-info');
            if (infoDiv) {
                const existingScore = infoDiv.querySelector('.game-score');
                if (score > 0) {
                    if (existingScore) {
                        existingScore.textContent = `🏆 ${score} ${window.GeryApp?.modules?.language?.t('points_score') || 'pont'}`;
                    } else {
                        const scoreDiv = document.createElement('div');
                        scoreDiv.className = 'game-score';
                        scoreDiv.textContent = `🏆 ${score} ${window.GeryApp?.modules?.language?.t('points_score') || 'pont'}`;
                        infoDiv.appendChild(scoreDiv);
                    }
                } else {
                    if (existingScore) {
                        existingScore.remove();
                    }
                }
            }
        });
    }

    // Játék eredményének rögzítése (játékok hívják meg)
    recordGameResult(gameId, points) {
        const state = window.GeryApp?.state;
        const app = window.GeryApp?.modules?.app;
        const pointsManager = window.GeryApp?.modules?.points;

        if (!state || !app) return;

        // Szorzó alkalmazása
        const multiplier = state.games.find(g => g.id === gameId)?.multiplier || 1;
        const finalPoints = points * multiplier;

        // Pontok hozzáadása
        state.totalPoints += finalPoints;
        state.gameScores[gameId - 1] = finalPoints;
        state.sessionPoints += finalPoints;

        // Pont gomb frissítése
        const label = document.querySelector('#btn-points .label');
        if (label) {
            label.textContent = state.totalPoints.toString();
        }

        // Menü frissítése
        this.updateMenuPoints();

        // Hang
        const sound = window.GeryApp?.modules?.sound;
        if (sound) sound.playWin();

        console.log(`🎮 Játék ${gameId} eredmény: ${finalPoints} pont (${points} × ${multiplier})`);

        // Vissza a menübe
        app.showScreen('menu');
    }

    // Játékok újraindítása (új kód esetén)
    resetGames() {
        const state = window.GeryApp?.state;
        if (state) {
            state.gameScores = [0, 0, 0, 0];
            state.sessionPoints = 0;
            state.totalPoints = state.previousPoints || 0;
        }
        this.renderMenu();
    }

    // Szorzó lekérése játékhoz
    getMultiplier(gameId) {
        const game = this.games.find(g => g.id === gameId);
        return game?.multiplier || 1;
    }

    // Játék nevének lekérése
    getGameName(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return '';
        const lang = window.GeryApp?.modules?.language;
        return lang?.t(game.name) || game.name;
    }
}