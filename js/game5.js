// ================================================================
// GAME5.JS - Kő-Papír-Olló Geryvel (5. Játék - Többnyelvű verzió)
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

        const lang = window.GeryApp?.modules?.language;

        const titleText = lang?.t('game5_title') || '🐾 Kő - Papír - Olló Geryvel';
        const subtitleText = lang?.t('game5_subtitle') || 'Győzd le Geryt, a hegyi macskát 3 körben!';
        const statusText = `${this.round}. ${lang?.t('game5_round_label') || 'kör'} / ${this.maxRounds} - ${lang?.t('game5_choose_prompt') || 'Válassz egy lehetőséget!'}`;
        const readyText = lang?.t('game5_ready') || 'Készülj a játékra! Kattints a gombok egyikére.';
        const exitBtnText = lang?.t('game5_exit_btn') || 'Eredmény mentése és visszatérés';

        screen.innerHTML = `
            <div class="game-wrapper" style="text-align:center; padding: 20px; margin-top: 70px; max-width: 500px; margin-left: auto; margin-right: auto; box-sizing: border-box;">
                <h2 style="color: var(--brown-dark, #8B6B4F); margin-bottom: 10px;">${titleText}</h2>
                <p style="margin-bottom: 15px; font-size: 0.95rem;">${subtitleText}</p>
                
                <div id="game-status" style="margin: 15px 0; font-size: 1.1rem; font-weight: bold; color: var(--brown-dark, #8B6B4F);">
                    ${statusText}
                </div>

                <div class="choices-container" style="display: flex; justify-content: center; gap: 15px; margin: 25px 0; flex-wrap: wrap;">
                    <button class="choice-btn" data-choice="rock" style="font-size: 2.2rem; padding: 15px 22px; cursor: pointer; border-radius: 12px; border: 2px solid var(--brown-dark, #8B6B4F); background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.1s;">🪨</button>
                    <button class="choice-btn" data-choice="paper" style="font-size: 2.2rem; padding: 15px 22px; cursor: pointer; border-radius: 12px; border: 2px solid var(--brown-dark, #8B6B4F); background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.1s;">📄</button>
                    <button class="choice-btn" data-choice="scissors" style="font-size: 2.2rem; padding: 15px 22px; cursor: pointer; border-radius: 12px; border: 2px solid var(--brown-dark, #8B6B4F); background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.1s;">✂️</button>
                </div>

                <div id="result-area" style="min-height: 90px; margin: 15px 0; font-size: 1rem; background: rgba(255,255,255,0.6); padding: 10px; border-radius: 8px;">
                    ${readyText}
                </div>

                <button id="exit-game-btn" class="btn-secondary" style="margin-top: 20px; padding: 12px 24px; display: none; background-color: var(--brown-dark, #8B6B4F); color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    ${exitBtnText}
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

        const lang = window.GeryApp?.modules?.language;
        const choices = ['rock', 'paper', 'scissors'];
        const geryChoice = choices[Math.floor(Math.random() * choices.length)];

        const emojis = { rock: '🪨 ' + (lang?.t('rock') || 'Kő'), paper: '📄 ' + (lang?.t('paper') || 'Papír'), scissors: '✂️ ' + (lang?.t('scissors') || 'Olló') };
        
        let roundResultText = '';
        let roundPoints = 0;

        const isWin = 
            (playerChoice === 'rock' && geryChoice === 'scissors') ||
            (playerChoice === 'paper' && geryChoice === 'rock') ||
            (playerChoice === 'scissors' && geryChoice === 'paper');

        if (playerChoice === geryChoice) {
            roundResultText = lang?.t('game5_draw') || `🤝 Döntetlen! Gery is ezt választotta: ${emojis[geryChoice]}.`;
            roundPoints = 5;
        } else if (isWin) {
            roundResultText = lang?.t('game5_win') || `🎉 Nyertél ebben a körben! Gery választása: ${emojis[geryChoice]}.`;
            roundPoints = 15;
            this.playerWins++;
        } else {
            roundResultText = lang?.t('game5_lose') || `😿 Gery nyerte ezt a kört! Ő ezt választotta: ${emojis[geryChoice]}.`;
            this.geryWins++;
        }

        this.score += roundPoints;

        const resultArea = document.getElementById('result-area');
        if (resultArea) {
            const pointsLabelText = lang?.t('points_score') || 'pont';
            resultArea.innerHTML = `
                <div>Te: <strong>${emojis[playerChoice]}</strong> | Gery: <strong>${emojis[geryChoice]}</strong></div>
                <div style="margin-top: 6px; font-weight: bold; color: var(--brown-dark, #8B6B4F);">${roundResultText}</div>
                <div style="margin-top: 4px; font-size: 0.85rem;">${lang?.t('game5_current_score') || 'Eddigi gyűjtött pont'}: <strong>${this.score}</strong> ${pointsLabelText}</div>
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
                const pointsLabelText = lang?.t('points_score') || 'pont';
                status.textContent = lang?.t('game5_over') || `🏆 Vége! Összesen elért alap pont: ${this.score} ${pointsLabelText}`;
            }
            const exitBtn = document.getElementById('exit-game-btn');
            if (exitBtn) {
                exitBtn.style.display = 'inline-block';
            }
        } else {
            const status = document.getElementById('game-status');
            if (status) {
                status.textContent = `${this.round}. ${lang?.t('game5_round_label') || 'kör'} / ${this.maxRounds} - ${lang?.t('game5_choose_prompt') || 'Válassz újra!'}`;
            }
        }
    }

    finishGame() {
        if (window.GeryApp && window.GeryApp.modules && window.GeryApp.modules.games) {
            window.GeryApp.modules.games.recordGameResult(5, this.score);
        } else {
            console.warn('⚠️ Nem található a GamesManager a pontok rögzítéséhez.');
        }
    }
}