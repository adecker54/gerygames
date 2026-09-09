// ================================================================
// APP.JS - Fő alkalmazás (router, állapotkezelés, képernyők)
// ================================================================

import { LanguageManager } from './language.js';
import { AuthManager } from './auth.js';
import { PointsManager } from './points.js';
import { SoundManager } from './sound.js';
import { GamesManager } from './games.js';

export class App {
    constructor() {
        this.screens = {};
        this.currentScreen = 'intro';
        this.initialized = false;
        this.videoElement = null;
        this.backgroundImage = null;
    }

    async init() {
        if (this.initialized) return;
        
        // Hivatkozások a globális állapotra
        this.state = window.GeryApp.state;
        this.modules = window.GeryApp.modules;
        
        // Képernyők referenciái
        this.screens = {
            intro: document.getElementById('screen-intro'),
            menu: document.getElementById('screen-menu'),
            game: document.getElementById('screen-game'),
            goodbye: document.getElementById('screen-goodbye'),
            admin: document.getElementById('screen-admin'),
            links: document.getElementById('screen-links')
        };

        // Admin ellenőrzés (URL paraméter)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
            this.state.isAdmin = true;
        }

        // Képernyők beállítása
        this.setupIntroScreen();
        this.setupMenuScreen();
        this.setupGameScreen();
        this.setupGoodbyeScreen();
        this.setupLinksScreen();
        this.setupAdminScreen();
        this.setupFixedButtons();

        // Nyelvi eseményfigyelő
        this.modules.language.onChange(() => {
            this.updateScreenTexts();
            this.modules.language.applyToDOM();
        });

        // Betöltés után megjelenítés
        await this.showScreen('intro');
        
        this.initialized = true;
        console.log('✅ App inicializálva');
    }

    async showScreen(screenName, data = null) {
        if (screenName === 'menu') {
            this.modules.games.renderMenu();
        } else if (screenName === 'goodbye') {
            this.initGoodbyeScreen();
        }

        // Összes képernyő elrejtése
        Object.values(this.screens).forEach(el => {
            if (el) {
                el.classList.remove('active', 'fade-in');
                el.style.display = 'none';
            }
        });

        // Kiválasztott képernyő megjelenítése
        const target = this.screens[screenName];
        if (target) {
            target.style.display = 'flex';
            await new Promise(r => setTimeout(r, 50));
            target.classList.add('active', 'fade-in');
        }

        this.currentScreen = screenName;
        this.state.currentScreen = screenName;

        // Képernyő specifikus inicializálás
        if (screenName === 'intro') {
            this.state.sessionPoints = 0;
            this.state.gameScores = [0, 0, 0, 0];
            this.state.isCodeValid = false;
            this.state.userCode = null;

            const pointsLabel = document.querySelector('#btn-points .label');
            if (pointsLabel) {
                pointsLabel.textContent = '0';
            }
            this.initIntroVideo();
        }
        
        this.updateScreenTexts();
        this.modules.language.applyToDOM();

        console.log(`📱 Képernyő váltás: ${screenName}`);
    }

    // ---------- KÉPERNYŐK BEÁLLÍTÁSA ----------
    setupIntroScreen() {
        const screen = this.screens.intro;
        if (!screen) return;

        this.videoElement = screen.querySelector('.background-video');
        this.backgroundImage = screen.querySelector('.background-image');

        const supportBtn = screen.querySelector('.support-btn');
        const codeInput = screen.querySelector('.code-input');
        const continueBtn = screen.querySelector('.continue-btn');
        const errorMsg = screen.querySelector('.error-msg');

        supportBtn.addEventListener('click', () => {
            this.modules.sound.playClick();
            if (this.state.isCodeValid) {
                this.showScreen('menu');
                return;
            }
            codeInput.disabled = false;
            codeInput.focus();
            supportBtn.classList.add('active');
        });

        codeInput.addEventListener('input', () => {
            const code = codeInput.value.toUpperCase().trim();
            codeInput.value = code.replace(/[^A-Z0-9]/g, '');
            
            if (code.length === 6) {
                this.validateCode(code, codeInput, errorMsg, continueBtn, supportBtn);
            } else {
                errorMsg.textContent = '';
                codeInput.classList.remove('error');
                continueBtn.classList.remove('visible');
            }
        });

        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const code = codeInput.value.toUpperCase().trim();
                if (code.length === 6) {
                    this.validateCode(code, codeInput, errorMsg, continueBtn, supportBtn);
                }
                if (this.state.isCodeValid) {
                    this.showScreen('menu');
                }
            }
        });

        continueBtn.addEventListener('click', () => {
            this.modules.sound.playClick();
            if (this.state.isCodeValid) {
                this.showScreen('menu');
            }
        });

        if (this.videoElement) {
            this.videoElement.addEventListener('ended', () => {
                if (this.videoElement) {
                    this.videoElement.style.display = 'none';
                }
                if (this.backgroundImage) {
                    this.backgroundImage.style.display = 'block';
                }
            });
        }

        this.introElements = { supportBtn, codeInput, continueBtn, errorMsg };
    }

    setupMenuScreen() {
        const screen = this.screens.menu;
        if (!screen) return;
    }

    setupGameScreen() {
        const screen = this.screens.game;
        if (!screen) return;
        
        const exitBtn = screen.querySelector('.game-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.modules.sound.playClick();
                this.showScreen('menu');
            });
        }
    }

    setupLinksScreen() {
        const screen = this.screens.links;
        if (!screen) return;

        const linkBtns = screen.querySelectorAll('.link-btn');
        linkBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.modules.sound.playClick();
                btn.classList.add('visited');
                const status = btn.querySelector('.link-status');
                if (status) {
                    status.textContent = '✅';
                }
                const url = btn.getAttribute('data-link');
                if (url) {
                    window.open(url, '_blank');
                }
            });
        });

        const backBtn = document.getElementById('back-from-links-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.modules.sound.playClick();
                this.showScreen('goodbye');
            });
        }
    }

    setupGoodbyeScreen() {
        const screen = this.screens.goodbye;
        if (!screen) return;

        const backBtn = document.getElementById('back-to-start-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.modules.sound.playClick();
                this.showScreen('intro');
            });
        }
        
        const voteBtn = document.getElementById('vote-btn');
        if (voteBtn) {
            voteBtn.addEventListener('click', () => {
                this.modules.sound.playClick();
                this.showScreen('links');
            });
        }
    }

    setupAdminScreen() {
        const screen = this.screens.admin;
        if (!screen) return;

        const backBtn = document.getElementById('back-to-start-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.modules.sound.playClick();
                this.showScreen('intro');
            });
        }
    }

    setupFixedButtons() {
        document.getElementById('btn-help')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            this.showHelpModal();
        });

        document.getElementById('btn-lang')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            const langs = this.modules.language.getSupportedLanguages();
            const current = this.modules.language.getLanguage();
            const currentIndex = langs.indexOf(current);
            const nextIndex = (currentIndex + 1) % langs.length;
            const nextLang = langs[nextIndex];
            this.modules.language.setLanguage(nextLang);
            this.updateLanguageButton();
        });

        document.getElementById('btn-sound')?.addEventListener('click', () => {
            const soundBtn = document.getElementById('btn-sound');
            this.state.soundEnabled = !this.state.soundEnabled;
            this.modules.sound.setMuted(!this.state.soundEnabled);
            soundBtn.classList.toggle('muted');
            const icon = soundBtn.querySelector('.icon');
            if (icon) {
                icon.textContent = this.state.soundEnabled ? '🔊' : '🔇';
            }
            const label = soundBtn.querySelector('.label');
            if (label) {
                label.textContent = this.state.soundEnabled ? 
                    this.modules.language.t('sound_on') : 
                    this.modules.language.t('sound_off');
            }
        });

        document.getElementById('btn-points')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            this.modules.points.showRanking();
        });

        document.getElementById('show-links-btn')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            this.showScreen('links');
        });

        document.getElementById('btn-exit')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            this.exitApplication();
        });

        this.updateLanguageButton();
    }

    updateLanguageButton() {
        const btn = document.getElementById('btn-lang');
        if (!btn) return;
    
        const current = this.modules.language.getLanguage();
        const label = btn.querySelector('.label');
        if (label) {
            label.textContent = this.modules.language.getLanguageName(current);
        }
        const icon = btn.querySelector('.icon');
        if (icon) {
            const flags = { hu: '🇭🇺', en: '🇬🇧', de: '🇩🇪', jp: '🇯🇵', ru: '🇷🇺' };
            icon.textContent = flags[current] || '🌐';
        }
    }

    showHelpModal() {
        const lang = this.modules.language;
        const title = lang?.t('help_title') || 'Súgó';
        const text = lang?.t('help_text') || 'Ez itt az információs ablak';
        
        const modal = document.createElement('div');
        modal.className = 'help-modal-overlay';
        modal.id = 'help-modal';
        modal.innerHTML = `
            <div class="help-modal-box">
                <div class="help-icon">❓</div>
                <h2>${title}</h2>
                <div class="help-text">${text}</div>
                <button class="help-close-btn" data-i18n="help_close">Bezárás</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('.help-close-btn');
        if (closeBtn) {
            closeBtn.textContent = lang?.t('help_close') || 'Bezárás';
            closeBtn.addEventListener('click', () => modal.remove());
        }
    
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        }); 
    }

    updateScreenTexts() {
        if (this.modules.language) {
            this.modules.language.applyToDOM();
        }
        
        const lang = this.modules.language?.getLanguage() || 'hu';
        const langNames = { hu: 'Magyar', en: 'English', de: 'Deutsch', jp: '日本語', ru: 'Русский' };
        const flags = { hu: '🇭🇺', en: '🇬🇧', de: '🇩🇪', jp: '🇯🇵', ru: '🇷🇺' };
        
        const langBtn = document.getElementById('btn-lang');
        if (langBtn) {
            const label = langBtn.querySelector('.label');
            if (label) {
                label.textContent = langNames[lang] || lang;
            }
            const icon = langBtn.querySelector('.icon');
            if (icon) {
                icon.textContent = flags[lang] || '🌐';
            }
        }
        
        const soundBtn = document.getElementById('btn-sound');
        if (soundBtn) {
            const label = soundBtn.querySelector('.label');
            if (label) {
                label.textContent = this.state.soundEnabled ? 
                    (this.modules.language?.t('sound_on') || 'Hang be') : 
                    (this.modules.language?.t('sound_off') || 'Hang ki');
            }
            const icon = soundBtn.querySelector('.icon');
            if (icon) {
                icon.textContent = this.state.soundEnabled ? '🔊' : '🔇';
            }
        }
        
        const codeInput = document.querySelector('.code-input');
        if (codeInput) {
            codeInput.placeholder = this.modules.language?.t('enter_code') || 'Add meg a kódszámodat';
        }
        
        const errorMsg = document.querySelector('.error-msg');
        if (errorMsg && errorMsg.textContent.trim() !== '') {
            errorMsg.textContent = this.modules.language?.t('invalid_code') || 'Nem jó a kódszám';
        }
    }

    validateCode(code, input, errorMsg, continueBtn, supportBtn) {
        const isValid = this.modules.points.validateCode(code);
    
        if (isValid) {
            this.state.userCode = code;
            this.state.isCodeValid = true;
            this.state.sessionPoints = 0;
            this.state.gameScores = [0, 0, 0, 0];
        
            input.classList.remove('error');
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
            continueBtn.classList.add('visible');
            supportBtn.classList.remove('active');
        } else {
            input.classList.add('error');
            errorMsg.textContent = this.modules.language?.t('invalid_code') || 'Nem jó a kódszám';
            errorMsg.style.display = 'block';
            continueBtn.classList.remove('visible');
        }
    }

    initIntroVideo() {
        const video = this.videoElement;
        if (!video) return;

        video.currentTime = 0;
        video.style.display = 'block';
        if (this.backgroundImage) {
            this.backgroundImage.style.display = 'none';
        }
        video.muted = !this.state.soundEnabled;
        if (!this.state.soundEnabled) {
            video.volume = 0.5;
        }

        const playVideo = () => {
            if (video.paused) {
                video.play().catch(() => {
                    if (this.backgroundImage) {
                        video.style.display = 'none';
                        this.backgroundImage.style.display = 'block';
                    }
                });
            }
            document.removeEventListener('click', playVideo);
            document.removeEventListener('touchstart', playVideo);
        };

        document.addEventListener('click', playVideo);
        document.addEventListener('touchstart', playVideo);

        setTimeout(() => {
            if (video.paused) {
                video.style.display = 'none';
                if (this.backgroundImage) {
                    this.backgroundImage.style.display = 'block';
                }
            }
        }, 10000);

        video.removeEventListener('ended', this.videoEndHandler);
        this.videoEndHandler = () => {
            video.style.display = 'none';
            if (this.backgroundImage) {
                this.backgroundImage.style.display = 'block';
            }
        };
        video.addEventListener('ended', this.videoEndHandler);
    }

    initGoodbyeScreen() {
        const screen = this.screens.goodbye;
        if (!screen) return;
        
        const pointsDisplay = screen.querySelector('.points-display');
        const codeDisplay = screen.querySelector('.code-display');
        const dateDisplay = screen.querySelector('.date-display');

        if (pointsDisplay) {
            pointsDisplay.textContent = this.state.sessionPoints || 0;
        }
        if (codeDisplay) {
            codeDisplay.textContent = this.state.userCode || '----';
        }
        if (dateDisplay) {
            const now = new Date();
            const lang = this.modules.language.getLanguage();
            dateDisplay.textContent = this.formatDate(now, lang);
        }
    }

    formatDate(date, lang) {
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        const year = date.getFullYear();
        const month = romanMonths[date.getMonth()];
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
    
        return `${year}. ${month}. ${day}. ${hours}:${minutes}`;
    }

    async exitApplication() {
        const userCode = this.state.userCode;
        const sessionPoints = this.state.sessionPoints;

        if (userCode) {
            await this.modules.points.savePoints(userCode, sessionPoints);
        }

        await this.showScreen('goodbye');
        console.log(`👋 Kilépés: ${userCode} | Mentett pontok: ${sessionPoints}`);
    }

    startGame(gameId) {
        const game = this.state.games.find(g => g.id === gameId);
        if (!game) return;

        this.state.currentGame = gameId;
        this.showScreen('game');
        
        const gameModule = this.modules[`game${gameId}`];
        if (gameModule && gameModule.start) {
            gameModule.start(game);
        }
    }

    finishGame(points) {
        const gameId = this.state.currentGame;
        const multiplier = this.state.games.find(g => g.id === gameId)?.multiplier || 1;
        const finalPoints = points * multiplier;
    
        this.state.sessionPoints += finalPoints;
        this.state.gameScores[gameId - 1] = finalPoints;

        const pointsLabel = document.querySelector('#btn-points .label');
        if (pointsLabel) {
            pointsLabel.textContent = this.state.sessionPoints.toString();
        }

        this.modules.sound.playWin();
        this.showScreen('menu');
    }
}