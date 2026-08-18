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
            admin: document.getElementById('screen-admin')
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

    // ---------- KÉPERNYŐ VÁLTÁS ----------
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

    setupGoodbyeScreen() {
        // A búcsúzó képernyőt dinamikusan töltjük
    }

    setupAdminScreen() {
        // Admin képernyőt az AdminManager kezeli
    }

    setupFixedButtons() {
        // Help
        document.getElementById('btn-help')?.addEventListener('click', () => {
            this.modules.sound.playClick();
            const text = this.modules.language.t('help_text');
            const title = this.modules.language.t('help_title');
            alert(`${title}\n\n${text}`);
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
            const flags = { hu: '🇭🇺', en: '🇬🇧', de: '🇩🇪', ru: '🇷🇺' };
            icon.textContent = flags[current] || '🌐';
        }
    }

    updateScreenTexts() {
        // A data-i18n attribútumokat a LanguageManager kezeli
        this.modules.language.applyToDOM();
        
        // Fix gombok frissítése
        const lang = this.modules.language.getLanguage();
        const langNames = { hu: 'Magyar', en: 'English', de: 'Deutsch', ru: 'Русский' };
        document.querySelector('#btn-lang .label').textContent = langNames[lang] || lang;
        
        const soundBtn = document.getElementById('btn-sound');
        if (soundBtn) {
            const label = soundBtn.querySelector('.label');
            if (label) {
                label.textContent = this.state.soundEnabled ? 
                    this.modules.language.t('sound_on') : 
                    this.modules.language.t('sound_off');
            }
        }
        
        // Pont gomb frissítése
        const pointsBtn = document.getElementById('btn-points');
        if (pointsBtn) {
            const label = pointsBtn.querySelector('.label');
            if (label) {
                const total = this.modules.points?.getCurrentTotal() || 0;
                label.textContent = total.toString();
            }
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
            continueBtn.classList.add('visible');
            supportBtn.classList.remove('active');
            // Pontok betöltése a kódhoz
            this.modules.points.loadPointsForCode(code);
        } else {
            this.state.isCodeValid = false;
            input.classList.add('error');
            errorMsg.textContent = this.modules.language.t('invalid_code');
            continueBtn.classList.remove('visible');
            this.modules.sound.playError();
            
            // 2 másodperc után töröljük a hibát
            setTimeout(() => {
                input.classList.remove('error');
                errorMsg.textContent = '';
            }, 2000);
        }
    }

    // ---------- VIDEÓ KEZELÉS ----------
    initIntroVideo() {
        if (this.videoElement) {
            // Videó újraindítása
            this.videoElement.currentTime = 0;
            this.videoElement.style.display = 'block';
            if (this.backgroundImage) {
                this.backgroundImage.style.display = 'none';
            }
            // Hang állapot beállítása
            this.videoElement.muted = !this.state.soundEnabled;
            
            // Play attempt (böngészők blokkolhatják)
            try {
                const playPromise = this.videoElement.play();
                if (playPromise) {
                    playPromise.catch(() => {
                        // Auto-play blokkolt, nem csinálunk semmit
                        console.log('🔇 Video auto-play blokkolt, várunk felhasználói interakcióra');
                    });
                }
            } catch (e) {
                // Fallback: képet mutatunk
                if (this.backgroundImage) {
                    this.videoElement.style.display = 'none';
                    this.backgroundImage.style.display = 'block';
                }
            }
        }
    }

    // ---------- BÚCSÚZÓ KÉPERNYŐ ----------
    initGoodbyeScreen(data) {
        const screen = this.screens.goodbye;
        if (!screen) return;
        
        const pointsDisplay = screen.querySelector('.points-display');
        const codeDisplay = screen.querySelector('.code-display');
        const dateDisplay = screen.querySelector('.date-display');
        
        if (pointsDisplay) {
            pointsDisplay.textContent = (data?.points || this.state.totalPoints || 0);
        }
        if (codeDisplay) {
            codeDisplay.textContent = this.state.userCode || '----';
        }
        if (dateDisplay) {
            const now = new Date();
            const lang = this.modules.language.getLanguage();
            const dateStr = this.formatDate(now, lang);
            dateDisplay.textContent = dateStr;
        }

        // Kilépés utáni automatikus zárás (5 másodperc múlva)
        setTimeout(() => {
            // Itt lehetne egy "Bezárás" gomb, de most csak a képernyő marad
        }, 5000);
    }

    // ---------- DÁTUM FORMAZÁS ----------
    formatDate(date, lang) {
        const months = {
            hu: ['január', 'február', 'március', 'április', 'május', 'június', 
                 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'],
            en: ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'],
            de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
        };
        
        const year = date.getFullYear();
        const month = months[lang]?.[date.getMonth()] || months.hu[date.getMonth()];
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}. ${month} ${day}. ${hours}:${minutes}`;
    }

    // ---------- KILÉPÉS ----------
    async exitApplication() {
        // 1. Pontok mentése
        await this.modules.points.savePoints(
            this.state.userCode,
            this.state.totalPoints,
            this.state.gameScores
        );

        // 2. Búcsúzó képernyő megjelenítése
        await this.showScreen('goodbye', {
            points: this.state.totalPoints
        });

        // 3. Sound lejátszás (ha engedélyezett)
        if (this.state.soundEnabled) {
            // Győzelmi hang a búcsúzáskor? Inkább egy halk hang
        }

        console.log(`👋 Kilépés: ${this.state.userCode} | ${this.state.totalPoints} pont`);
    }

    // ---------- JÁTÉK INDÍTÁS ----------
    startGame(gameId) {
        const game = this.state.games.find(g => g.id === gameId);
        if (!game) return;

        // Játék betöltése
        this.state.currentGame = gameId;
        
        // Játék képernyő megjelenítése
        this.showScreen('game');
        
        // Játék specifikus indítás
        const gameModule = this.modules[`game${gameId}`];
        if (gameModule && gameModule.start) {
            gameModule.start(game);
        }
    }

    // ---------- JÁTÉK BEFEJEZÉS ----------
    finishGame(points) {
        // Pontok hozzáadása
        const gameId = this.state.currentGame;
        const multiplier = this.state.games.find(g => g.id === gameId)?.multiplier || 1;
        const finalPoints = points * multiplier;
        
        this.state.totalPoints += finalPoints;
        this.state.gameScores[gameId - 1] = finalPoints;
        this.state.sessionPoints += finalPoints;

        // Pont gomb frissítése
        const pointsLabel = document.querySelector('#btn-points .label');
        if (pointsLabel) {
            pointsLabel.textContent = this.state.totalPoints.toString();
        }

        // Hang lejátszás
        this.modules.sound.playWin();

        console.log(`🎮 Játék ${gameId} befejezve: ${finalPoints} pont (${points} × ${multiplier})`);

        // Vissza a menübe
        this.showScreen('menu');
    }
}