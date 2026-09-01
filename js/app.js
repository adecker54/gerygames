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
        // Kilépés előtti mentés (ha menüből vagy játékból lépünk ki)
        if (this.currentScreen === 'game' && screenName !== 'game' && screenName !== 'goodbye') {
            // Itt még nem mentünk, csak ha tényleg kilépés
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
            // Kis késleltetés a display változás után
            await new Promise(r => setTimeout(r, 50));
            target.classList.add('active', 'fade-in');
        }

        this.currentScreen = screenName;
        this.state.currentScreen = screenName;

        // Képernyő specifikus inicializálás
        if (screenName === 'intro') {
            this.state.totalPoints = 0;
            this.state.sessionPoints = 0;
            this.state.gameScores = [0, 0, 0, 0];
            this.state.isCodeValid = false;
            this.state.userCode = null;

            const pointsLabel = document.querySelector('#btn-points .label');
            if (pointsLabel) {
                pointsLabel.textContent = '0';
            }
            this.initIntroVideo();
        } else if (screenName === 'menu') {
            this.modules.games.renderMenu();
        } else if (screenName === 'goodbye') {
            this.initGoodbyeScreen(data);
        } else if (screenName === 'admin') {
            if (this.state.isAdmin) {
                this.modules.admin.render();
            } else {
                // Ha nem admin, vissza a főképernyőre
                this.showScreen('intro');
            }
        }

        // Nyelvi frissítés
        this.updateScreenTexts();
        this.modules.language.applyToDOM();

        console.log(`📱 Képernyő váltás: ${screenName}`);
    }

    // ---------- KÉPERNYŐK BEÁLLÍTÁSA ----------
    setupIntroScreen() {
        const screen = this.screens.intro;
        if (!screen) return;

        // Video elem
        this.videoElement = screen.querySelector('.background-video');
        this.backgroundImage = screen.querySelector('.background-image');

        // Gombok
        const supportBtn = screen.querySelector('.support-btn');
        const codeInput = screen.querySelector('.code-input');
        const continueBtn = screen.querySelector('.continue-btn');
        const errorMsg = screen.querySelector('.error-msg');

        // Támogatom gomb
        supportBtn.addEventListener('click', () => {
            this.modules.sound.playClick();
            if (this.state.isCodeValid) {
                // Ha már valid a kód, akkor a menübe megyünk
                this.showScreen('menu');
                return;
            }
            // Ellenkező esetben aktiváljuk a mezőt
            codeInput.disabled = false;
            codeInput.focus();
            supportBtn.classList.add('active');
        });

        // Kódszám bevitel
        codeInput.addEventListener('input', () => {
            const code = codeInput.value.toUpperCase().trim();
            // Csak betű és szám engedélyezése
            codeInput.value = code.replace(/[^A-Z0-9]/g, '');
            
            if (code.length === 6) {
                this.validateCode(code, codeInput, errorMsg, continueBtn, supportBtn);
            } else {
                errorMsg.textContent = '';
                codeInput.classList.remove('error');
                continueBtn.classList.remove('visible');
            }
        });

        // Enter billentyű
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

        // Tovább gomb
        continueBtn.addEventListener('click', () => {
            this.modules.sound.playClick();
            if (this.state.isCodeValid) {
                this.showScreen('menu');
            }
        });

        // Videó betöltés
        if (this.videoElement) {
            this.videoElement.addEventListener('ended', () => {
                // Videó vége: mutassuk a záróképet
                if (this.videoElement) {
                    this.videoElement.style.display = 'none';
                }
                if (this.backgroundImage) {
                    this.backgroundImage.style.display = 'block';
                }
            });
        }

        // Mentés ref-ek
        this.introElements = { supportBtn, codeInput, continueBtn, errorMsg };
    }

    setupMenuScreen() {
        const screen = this.screens.menu;
        if (!screen) return;
        // A menü tartalmát a GamesManager fogja kezelni
    }

    setupGameScreen() {
        const screen = this.screens.game;
        if (!screen) return;
        
        // Kilépés gomb a játék képernyőn (jobb felső sarok)
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

        // ---- LINK GOMBOK ----
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
    	// ---- VISSZA GOMB ----
    	const backBtn = document.getElementById('back-from-links-btn');
    	if (backBtn) {
            backBtn.addEventListener('click', () => {
            this.modules.sound.playClick();
        
            // ★★★ HA LÉTEZIK A _goodbyeData, AKKOR AZT HASZNÁLJUK, KÜLÖNBEN A STATE-BŐL OLVASUNK ★★★
            let points, code;
            if (this._goodbyeData && this._goodbyeData.points !== undefined) {
                points = this._goodbyeData.points;
                code = this._goodbyeData.code;
            } else {
                points = this.state.sessionPoints || 0;
                code = this.state.userCode || '----';
            }
        
            this.showScreen('goodbye', { points: points, code: code });
        });
    }
} // ---- Grok javaslat ----

    setupGoodbyeScreen() {
        const screen = this.screens.goodbye;
        if (!screen) return;

        // ---- VISSZA A KEZDŐKÉPERNYŐRE GOMB ----
        const backBtn = document.getElementById('back-to-start-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.modules.sound.playClick();
            
                // Pontok nullázása
                this.state.totalPoints = 0;
                this.state.sessionPoints = 0;
                this.state.gameScores = [0, 0, 0, 0];
                this.state.isCodeValid = false;
                this.state.userCode = null;
            
                // Pont gomb frissítése
                const pointsLabel = document.querySelector('#btn-points .label');
                if (pointsLabel) {
                    pointsLabel.textContent = '0';
                }
            
                // Vissza a nyitóképernyőre
                this.showScreen('intro');
            });
        }
        
        // ---- SZAVAZÁS GOMB (linkek képernyő megnyitása) ----
        const voteBtn = document.getElementById('vote-btn');
        if (voteBtn) {
            voteBtn.addEventListener('click', () => {
                this.modules.sound.playClick();
                // MENTSÜK EL A PONTOKAT ÉS A KÓDSZÁMOT A VISSZATÉRÉSHEZ!
                this._goodbyeData = {
                    points: this.state.sessionPoints,
                    code: this.state.userCode
                };
                this.showScreen('links');
            });
        }
    }

    setupAdminScreen() {
        const screen = this.screens.admin;
        if (!screen) return;

        // ---- VISSZA A KEZDŐKÉPERNYŐRE GOMB ----
        const backBtn = document.getElementById('back-to-start-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.modules.sound.playClick();
            
                // Pontok nullázása
                this.state.totalPoints = 0;
                this.state.sessionPoints = 0;
                this.state.gameScores = [0, 0, 0, 0];
                this.state.isCodeValid = false;
                this.state.userCode = null;
            
                // Pont gomb frissítése
                const pointsLabel = document.querySelector('#btn-points .label');
                if (pointsLabel) {
                    pointsLabel.textContent = '0';
                }
             
                // Vissza a nyitóképernyőre
                this.showScreen('intro');
            });
        }
    }

    setupFixedButtons() {
        // Help
        document.getElementById('btn-help')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            this.showHelpModal();
        });

        // Nyelv váltás
        document.getElementById('btn-lang')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            const langs = this.modules.language.getSupportedLanguages();
            const current = this.modules.language.getLanguage();
            const currentIndex = langs.indexOf(current);
            const nextIndex = (currentIndex + 1) % langs.length;
            const nextLang = langs[nextIndex];
            this.modules.language.setLanguage(nextLang);
            // Gomb feliratának frissítése
            this.updateLanguageButton();
        });

        // Hang
        document.getElementById('btn-sound')?.addEventListener('click', () => {
            const soundBtn = document.getElementById('btn-sound');
            this.state.soundEnabled = !this.state.soundEnabled;
            this.modules.sound.setMuted(!this.state.soundEnabled);
            soundBtn.classList.toggle('muted');
            // Ikon frissítése
            const icon = soundBtn.querySelector('.icon');
            if (icon) {
                icon.textContent = this.state.soundEnabled ? '🔊' : '🔇';
            }
            // Label frissítése
            const label = soundBtn.querySelector('.label');
            if (label) {
                label.textContent = this.state.soundEnabled ? 
                    this.modules.language.t('sound_on') : 
                    this.modules.language.t('sound_off');
            }
        });

        // Pontok / Ranglista
        document.getElementById('btn-points')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            this.modules.points.showRanking();
        });

        // Linkek / Szavazáshoz
        document.getElementById('show-links-btn')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            this.showScreen('links');
        });

        // Kilépés
        document.getElementById('btn-exit')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            // Búcsúzó képernyő
            this.exitApplication();
        });

        // Nyelv gomb frissítése
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
        
        // ★★★ ITT KÉZI FRISSÍTÉS A BIZTONSÁG KEDVÉÉRT ★★★
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
        // Nyelvi szövegek frissítése
        if (this.modules.language) {
            this.modules.language.applyToDOM();
        }
        
        const lang = this.modules.language?.getLanguage() || 'hu';
        const langNames = { hu: 'Magyar', en: 'English', de: 'Deutsch', jp: '日本語', ru: 'Русский' };
        const flags = { hu: '🇭🇺', en: '🇬🇧', de: '🇩🇪', jp: '🇯🇵', ru: '🇷🇺' };
        
        // ---- NYELV GOMB ----
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
        
        // ---- HANG GOMB ----
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
        
        // ---- KÓDSZÁM MEZŐ PLACEHOLDER FRISSÍTÉSE ----
        const codeInput = document.querySelector('.code-input');
        if (codeInput) {
            codeInput.placeholder = this.modules.language?.t('enter_code') || 'Add meg a kódszámodat';
        }
        
        // ---- HIBAÜZENET FRISSÍTÉSE (ha látható) ----
        const errorMsg = document.querySelector('.error-msg');
        if (errorMsg && errorMsg.textContent.trim() !== '') {
            errorMsg.textContent = this.modules.language?.t('invalid_code') || 'Nem jó a kódszám';
        }
    }

    // ---------- KÓDSZÁM ELLENŐRZÉS ----------
    validateCode(code, input, errorMsg, continueBtn, supportBtn) {
        const isValid = this.modules.points.validateCode(code);
        
        if (isValid) {
            this.state.userCode = code;
            this.state.isCodeValid = true;
            input.classList.remove('error');
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
            continueBtn.classList.add('visible');
            supportBtn.classList.remove('active');
            this.modules.points.loadPointsForCode(code);
        } else {
            this.state.isCodeValid = false;
            input.classList.add('error');
            
            // HIBAÜZENET MEGJELENÍTÉSE - JOBB DESIGN
            errorMsg.textContent = this.modules.language?.t('invalid_code') || '❌ Nem jó a kódszám!';
            errorMsg.style.display = 'block';
            
            continueBtn.classList.remove('visible');
            this.modules.sound.playError();
            
            // 3 MÁSODPERCIG LÁTHATÓ
            setTimeout(() => {
                input.classList.remove('error');
                errorMsg.textContent = '';
                errorMsg.style.display = 'none';
            }, 3000);
        }
    }

    // ---------- VIDEÓ KEZELÉS ----------
    initIntroVideo() {
        const video = this.videoElement;
        if (!video) return;

        // Videó visszaállítása
        video.currentTime = 0;
        video.style.display = 'block';
        if (this.backgroundImage) {
            this.backgroundImage.style.display = 'none';
        }
        // HANG BEÁLLÍTÁSA
        video.muted = !this.state.soundEnabled;
        if (!this.state.soundEnabled) {
            video.volume = 0.5;
        }

        // Első interakcióra indul a videó
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

    // ---------- BÚCSÚZÓ KÉPERNYŐ ----------
    initGoodbyeScreen(data) {
        const screen = this.screens.goodbye;
        if (!screen) return;
        
        const pointsDisplay = screen.querySelector('.points-display');
        const codeDisplay = screen.querySelector('.code-display');
        const dateDisplay = screen.querySelector('.date-display');

        // data-ból olvassuk ki az értékeket
        if (pointsDisplay) {
            pointsDisplay.textContent = data?.points || 0;
        }
        if (codeDisplay) {
            codeDisplay.textContent = data?.code || '----';
        }
        if (dateDisplay) {
            const now = new Date();
            const lang = this.modules.language.getLanguage();
            const dateStr = this.formatDate(now, lang);
            dateDisplay.textContent = dateStr;
        }
    }

    // ---------- DÁTUM FORMÁZÁS ----------
    formatDate(date, lang) {
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    
        const year = date.getFullYear();
        const month = romanMonths[date.getMonth()];
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
    
        return `${year}. ${month}. ${day}. ${hours}:${minutes}`;
    }

    // ---------- KILÉPÉS ----------
    async exitApplication() {
        // 1. Mentsük el a kódszámot és a session pontokat
        const userCode = this.state.userCode;
        const sessionPoints = this.state.sessionPoints;

        // 2. Pontok mentése
        if (userCode && sessionPoints > 0) {
            await this.modules.points.savePoints(
                userCode,
                sessionPoints,
                this.state.gameScores
            );
        }

        // 3. Pontok nullázása
        this.state.totalPoints = 0;
        this.state.sessionPoints = 0;
        this.state.gameScores = [0, 0, 0, 0];
        this.state.isCodeValid = false;

        const pointsLabel = document.querySelector('#btn-points .label');
        if (pointsLabel) {
            pointsLabel.textContent = '0';
        }

        // 4. Búcsúzó képernyő - átadjuk a pontokat
        await this.showScreen('goodbye', {
            points: sessionPoints,
            code: userCode
        });

        this.state.userCode = null;
        console.log(`👋 Kilépés: ${userCode} | Mentett pontok: ${sessionPoints}`);
    }

    // ---------- JÁTÉK INDÍTÁS ----------
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

    // ---------- JÁTÉK BEFEJEZÉS ----------
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
