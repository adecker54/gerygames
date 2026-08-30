// ================================================================
// LANGUAGE.JS - Nyelvi rendszer
// ================================================================

export class LanguageManager {
    constructor() {
        this.translations = {};
        this.currentLang = 'hu';
        this.listeners = [];
        this.ready = false;
    }

    async init() {
        try {
            const languages = ['hu', 'en', 'de', 'jp', 'ru'];
            const loadPromises = languages.map(lang => 
                fetch(`data/languages/${lang}.json`)
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP ${res.status} - ${lang}.json`);
                        return res.json();
                    })
                    .then(data => {
                        this.translations[lang] = data;
                        console.log(`✅ Nyelv betöltve: ${lang}`);
                    })
                    .catch(err => {
                        console.warn(`⚠️ Nem sikerült betölteni a ${lang} nyelvet:`, err);
                        // Fallback: üres objektum
                        this.translations[lang] = {};
                    })
            );
            
            await Promise.all(loadPromises);
            
            // Alapértelmezett nyelv beállítása
            const savedLang = localStorage.getItem('gery_language');
            if (savedLang && this.translations[savedLang]) {
                this.currentLang = savedLang;
            } else {
                // Böngésző nyelvérzékelés
                const browserLang = navigator.language?.substring(0, 2) || 'hu';
                this.currentLang = this.translations[browserLang] ? browserLang : 'hu';
            }
            
            this.ready = true;
            this.notifyListeners();
            console.log(`🌐 Nyelvi rendszer kész, aktuális nyelv: ${this.currentLang}`);
            return true;
        } catch (error) {
            console.error('❌ Hiba a nyelvi rendszer betöltésekor:', error);
            return false;
        }
    }

    // Szöveg lekérése kulcs alapján
    t(key) {
        if (!this.ready) {
            console.warn('⚠️ Nyelvi rendszer még nem készült el');
            return key;
        }
        const langData = this.translations[this.currentLang] || {};
        return langData[key] || key;
    }

    // Nyelv váltása
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`⚠️ A "${lang}" nyelv nem támogatott`);
            return false;
        }
        this.currentLang = lang;
        localStorage.setItem('gery_language', lang);
        this.notifyListeners();
        console.log(`🌐 Nyelv váltva: ${lang}`);
        return true;
    }

    // Aktuális nyelv lekérése
    getLanguage() {
        return this.currentLang;
    }

    // Támogatott nyelvek listája
    getSupportedLanguages() {
        return Object.keys(this.translations);
    }

    // Nyelv neve (saját nyelvén)
    getLanguageName(lang) {
        const names = {
            hu: 'Magyar',
            en: 'English',
            de: 'Deutsch',
            jp: '日本語',
            ru: 'Русский'
        };
        return names[lang] || lang;
    }

    // Eseményfigyelők
    onChange(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.currentLang));
    }

    // Segédfüggvény: összes szöveg cseréje a DOM-ban
    applyToDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        });
        
        // Placeholder-ek
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });
    }
}
