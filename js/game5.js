// ================================================================
// GAME5.JS - Kő-Papír-Olló Geryvel (5. Játék)
// ================================================================

export class Game5 {
    constructor() {
        this.score = 0;
        this.round = 1;
        this.maxRounds = 3;
        this.playerWins = 0;
        this.geryWins = 0;
    }

    start() {
        this.score = 0;
        this.round = 1;
        this.playerWins = 0;
        this.geryWins = 0;
        this.renderGameScreen();
    }

    renderGameScreen() {
        const screen = document.getElementById('screen-game') || document.getElementById('app');
        if (!screen) return;

        screen.innerHTML = `
            <div class="game-wrapper" style="text-align:center; padding: 20px; max-width: 500px; margin: 0 auto; box-sizing: border-box;">
                <h2 style="color: var(--brown-dark, #8B6B4F); margin-bottom: 10px;">🐾 Kő - Papír - Olló Geryvel</h2>
                <p style="margin-bottom: 15px; font-size: 0.95rem;">Győzd le Geryt, a hegyi macskát 3 körben!</p>
                
                <div id="game-status" style="margin: 15px 0; font-size: 1.1rem; font-weight: bold; color: var(--brown-dark, #8B6B4F);">
                    1. kör / ${this.maxRounds} - Válassz egy lehetőséget!
                </div>

                <div class="choices-container" style="display: flex; justify-content: center; gap: 15px; margin: 25px 0; flex-wrap: wrap;">
                    <button class="choice-btn" data-choice="rock" style="font-size: 2.2rem; padding: 15px 22px; cursor: pointer; border-radius: 12px; border: 2px solid var(--brown-dark, #8B6B4F); background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.1s;">🪨</button>
                    <button class="choice-btn" data-choice="paper" style="font-size: 2.2rem; padding: 15px 22px; cursor: pointer; border-radius: 12px; border: 2px solid var(--brown-dark, #8B6B4F); background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.1s;">📄</button>
                    <button class="choice-btn" data-choice="scissors" style="font-size: 2.2rem; padding: 15px 22px; cursor: pointer; border-radius: 12px; border: 2px solid var(--brown-dark, #8B6B4F); background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.1s;">✂️</button>
                </div>

                <div id="result-area" style="min-height: 90px; margin: 15px 0; font-size: 1rem; background: rgba(255,255,255,0.6); padding: 10px; border-radius: 8px;">
                    Készülj a játékra! Kattints a gombok egyikére.
                </div>

                <button id="exit-game-btn" class="btn-secondary" style="margin-top: 20px; padding: 12px 24px; display: none; background-color: var(--brown-dark, #8B6B4F); color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    Eredmény mentése és visszatérés
                </button>
            </div>
        `;

        screen.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const playerChoice = e.currentTarget.dataset.choice;
                this.playRound(playerChoice);
            });
        });

        const exitBtn = document.getElementById('exit-game-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.finishGame();
            });
        }
    }

    playRound(playerChoice) {
        if (this.round > this.maxRounds) return;

        const choices = ['rock', 'paper', 'scissors'];
        const geryChoice = choices[Math.floor(Math.random() * choices.length)];

        const emojis = { rock: '🪨 Kő', paper: '📄 Papír', scissors: '✂️ Olló' };
        
        let roundResultText = '';
        let roundPoints = 0;

        const isWin = 
            (playerChoice === 'rock' && geryChoice === 'scissors') ||
            (playerChoice === 'paper' && geryChoice === 'rock') ||
            (playerChoice === 'scissors' && geryChoice === 'paper');

        if (playerChoice === geryChoice) {
            roundResultText = `🤝 Döntetlen! Gery is ezt választotta: ${emojis[geryChoice]}.`;
            roundPoints = 5;
        } else if (isWin) {
            roundResultText = `🎉 Nyertél ebben a körben! Gery választása: ${emojis[geryChoice]}.`;
            roundPoints = 15;
            this.playerWins++;
        } else {
            roundResultText = `😿 Gery nyerte ezt a kört! Ő ezt választotta: ${emojis[geryChoice]}.`;
            this.geryWins++;
        }

        this.score += roundPoints;

        const resultArea = document.getElementById('result-area');
        if (resultArea) {
            resultArea.innerHTML = `
                <div>Te: <strong>${emojis[playerChoice]}</strong> | Gery: <strong>${emojis[geryChoice]}</strong></div>
                <div style="margin-top: 6px; font-weight: bold; color: var(--brown-dark, #8B6B4F);">${roundResultText}</div>
                <div style="margin-top: 4px; font-size: 0.85rem;">Eddigi gyűjtött pont: <strong>${this.score}</strong></div>
            `;
        }

        this.round++;

        if (this.round > this.maxRounds) {
            document.querySelectorAll('.choice-btn').forEach(b => {
                b.disabled = true;
                b.style.opacity = '0.6';
                b.style.cursor = 'default';
            });
            const status = document.getElementById('game-status');
            if (status) {
                status.textContent = `🏆 Vége! Összesen elért alap pont: ${this.score}`;
            }
            const exitBtn = document.getElementById('exit-game-btn');
            if (exitBtn) {
                exitBtn.style.display = 'inline-block';
            }
        } else {
            const status = document.getElementById('game-status');
            if (status) {
                status.textContent = `${this.round}. kör / ${this.maxRounds} - Válassz újra!`;
            }
        }
    }

    finishGame() {
        if (window.GeryApp && window.GeryApp.modules && window.GeryApp.modules.games) {
            // Átadja az 5-ös játék azonosítót és az elért pontot a games.js-nek,
            // ami automatikusan felszorozza a multiplierrel (×4) és menti.
            window.GeryApp.modules.games.recordGameResult(5, this.score);
        } else {
            console.warn('⚠️ Nem található a GamesManager a pontok rögzítéséhez.');
        }
    }
}