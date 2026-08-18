// ================================================================
// ADMIN.JS - Admin felület (rejtett belépés URL paraméterrel)
// ================================================================

export class AdminManager {
    constructor() {
        this.initialized = false;
        this.isActive = false;
        this.elements = {};
    }

    async init() {
        // Ellenőrizzük, hogy admin mód aktív-e
        const urlParams = new URLSearchParams(window.location.search);
        this.isActive = urlParams.get('admin') === 'true';

        if (this.isActive) {
            console.log('🔐 Admin mód aktiválva');
            // Admin képernyő előkészítése
            this.setupAdminScreen();
        }

        this.initialized = true;
        return true;
    }

    // Admin képernyő beállítása
    setupAdminScreen() {
        const screen = document.getElementById('screen-admin');
        if (!screen) return;

        // Admin UI építése
        screen.innerHTML = `
            <div class="admin-box">
                <h2 data-i18n="admin_title">🔐 Admin felület</h2>
                
                <div style="margin-bottom:16px;">
                    <label style="font-weight:600;color:var(--brown-dark);display:block;margin-bottom:4px;">
                        📋 Kódszámok (soronként 1, 6 karakter)
                    </label>
                    <textarea id="admin-codes" rows="8"></textarea>
                    <button id="admin-save-codes" class="admin-btn" data-i18n="admin_save">
                        💾 Mentés
                    </button>
                </div>

                <div style="margin-bottom:16px;">
                    <label style="font-weight:600;color:var(--brown-dark);display:block;margin-bottom:4px;">
                        📊 Pontok (CSV formátum: code,points,timestamp)
                    </label>
                    <textarea id="admin-points" rows="8"></textarea>
                    <button id="admin-save-points" class="admin-btn" data-i18n="admin_save">
                        💾 Mentés
                    </button>
                </div>

                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button id="admin-export-csv" class="admin-btn" style="background:var(--gray-medium);">
                        📥 CSV export
                    </button>
                    <button id="admin-import-csv" class="admin-btn" style="background:var(--gray-medium);">
                        📤 CSV import
                    </button>
                    <button id="admin-reset" class="admin-btn" style="background:#c0392b;">
                        🗑️ Összes adat törlése
                    </button>
                    <button id="admin-close" class="admin-btn" style="background:var(--gray-light);">
                        ✕ Bezárás
                    </button>
                </div>

                <div id="admin-status" style="
                    margin-top:16px;
                    padding:12px;
                    border-radius:8px;
                    background:var(--gray-pale);
                    color:var(--gray-dark);
                    font-size:0.9rem;
                    display:none;
                "></div>
            </div>
        `;

        // Elemek mentése
        this.elements = {
            codesTextarea: document.getElementById('admin-codes'),
            pointsTextarea: document.getElementById('admin-points'),
            saveCodesBtn: document.getElementById('admin-save-codes'),
            savePointsBtn: document.getElementById('admin-save-points'),
            exportBtn: document.getElementById('admin-export-csv'),
            importBtn: document.getElementById('admin-import-csv'),
            resetBtn: document.getElementById('admin-reset'),
            closeBtn: document.getElementById('admin-close'),
            status: document.getElementById('admin-status')
        };

        // Adatok betöltése
        this.loadData();

        // Eseményfigyelők
        this.elements.saveCodesBtn?.addEventListener('click', () => this.saveCodes());
        this.elements.savePointsBtn?.addEventListener('click', () => this.savePoints());
        this.elements.exportBtn?.addEventListener('click', () => this.exportCSV());
        this.elements.importBtn?.addEventListener('click', () => this.importCSV());
        this.elements.resetBtn?.addEventListener('click', () => this.resetAll());
        this.elements.closeBtn?.addEventListener('click', () => this.closeAdmin());

        // Nyelvi frissítés
        const lang = window.GeryApp?.modules?.language;
        if (lang) {
            lang.applyToDOM();
        }
    }

    // Admin képernyő megjelenítése
    render() {
        if (!this.isActive) {
            console.warn('⚠️ Admin mód nincs aktiválva');
            return;
        }

        const app = window.GeryApp?.modules?.app;
        if (app) {
            app.showScreen('admin');
        }

        // Adatok frissítése
        this.loadData();
    }

    // Adatok betöltése a mezőkbe
    async loadData() {
        try {
            // Kódszámok betöltése
            const codesResponse = await fetch('data/codes.txt');
            if (codesResponse.ok) {
                const codesText = await codesResponse.text();
                if (this.elements.codesTextarea) {
                    this.elements.codesTextarea.value = codesText;
                }
            }

            // Pontok betöltése
            const pointsResponse = await fetch('data/points.csv');
            if (pointsResponse.ok) {
                const pointsText = await pointsResponse.text();
                if (this.elements.pointsTextarea) {
                    this.elements.pointsTextarea.value = pointsText;
                }
            }

            this.showStatus('✅ Adatok betöltve', 'success');

        } catch (error) {
            console.error('❌ Hiba az adatok betöltésekor:', error);
            this.showStatus('❌ Hiba az adatok betöltésekor: ' + error.message, 'error');
        }
    }

    // Kódszámok mentése
    async saveCodes() {
        const text = this.elements.codesTextarea?.value || '';
        const lines = text.split('\n')
            .map(line => line.trim().toUpperCase())
            .filter(line => line.length > 0);

        // Ellenőrzés
        const invalid = lines.filter(line => !/^[A-Z0-9]{6}$/.test(line));
        if (invalid.length > 0) {
            this.showStatus(`❌ Hibás kódok: ${invalid.join(', ')} (csak 6 karakter, betű+szám)`, 'error');
            return;
        }

        if (lines.length > 300) {
            this.showStatus(`❌ Túl sok kód: ${lines.length} (max 300)`, 'error');
            return;
        }

        try {
            // Mentés localStorage-ba
            localStorage.setItem('gery_codes_backup', JSON.stringify(lines));

            // CSV letöltés a mentett kódokról
            const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'codes.txt';
            link.click();
            URL.revokeObjectURL(link.href);

            this.showStatus(`✅ ${lines.length} kódszám mentve (letöltve)`, 'success');

            // Globális állapot frissítése
            if (window.GeryApp?.state) {
                window.GeryApp.state.codeList = lines;
                const pointsManager = window.GeryApp?.modules?.points;
                if (pointsManager) {
                    pointsManager.codes = new Set(lines);
                }
            }

        } catch (error) {
            this.showStatus('❌ Hiba a mentés során: ' + error.message, 'error');
        }
    }

    // Pontok mentése
    async savePoints() {
        const text = this.elements.pointsTextarea?.value || '';
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            this.showStatus('⚠️ Nincs adat a mentéshez', 'warning');
            return;
        }

        try {
            // CSV letöltés
            const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'points.csv';
            link.click();
            URL.revokeObjectURL(link.href);

            // LocalStorage mentés
            localStorage.setItem('gery_points_backup', text);

            // Pontok értelmezése és betöltés
            const pointsManager = window.GeryApp?.modules?.points;
            if (pointsManager) {
                const parsed = pointsManager.parseCSV(text);
                pointsManager.pointsData = parsed;
                if (window.GeryApp?.state) {
                    window.GeryApp.state.pointsData = parsed;
                }
            }

            this.showStatus(`✅ ${lines.length} pontrekord mentve (letöltve)`, 'success');

        } catch (error) {
            this.showStatus('❌ Hiba a mentés során: ' + error.message, 'error');
        }
    }

    // CSV export
    exportCSV() {
        const pointsManager = window.GeryApp?.modules?.points;
        if (!pointsManager) {
            this.showStatus('❌ Pontkezelő nem elérhető', 'error');
            return;
        }

        const csv = pointsManager.generateCSV(pointsManager.pointsData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `points_export_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        this.showStatus(`✅ CSV exportálva (${pointsManager.pointsData.length} rekord)`, 'success');
    }

    // CSV import
    importCSV() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                if (this.elements.pointsTextarea) {
                    this.elements.pointsTextarea.value = text;
                }
                this.showStatus(`✅ CSV importálva (${text.split('\n').length} sor)`, 'success');
            };
            reader.onerror = () => {
                this.showStatus('❌ Hiba a fájl olvasása során', 'error');
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // Összes adat törlése
    resetAll() {
        const lang = window.GeryApp?.modules?.language;
        const confirmMsg = lang?.t('exit_confirm') || 'Biztosan törlöd az összes adatot?';

        if (!confirm(confirmMsg)) return;

        try {
            // LocalStorage törlése
            localStorage.removeItem('gery_codes_backup');
            localStorage.removeItem('gery_points_backup');
            localStorage.removeItem('gery_all_points');

            // Pontok törlése
            const pointsManager = window.GeryApp?.modules?.points;
            if (pointsManager) {
                pointsManager.pointsData = [];
                if (window.GeryApp?.state) {
                    window.GeryApp.state.pointsData = [];
                }
            }

            // Mezők ürítése
            if (this.elements.codesTextarea) {
                this.elements.codesTextarea.value = '';
            }
            if (this.elements.pointsTextarea) {
                this.elements.pointsTextarea.value = '';
            }

            this.showStatus('🗑️ Minden adat törölve', 'warning');

        } catch (error) {
            this.showStatus('❌ Hiba a törlés során: ' + error.message, 'error');
        }
    }

    // Admin bezárása
    closeAdmin() {
        const app = window.GeryApp?.modules?.app;
        if (app) {
            app.showScreen('intro');
        }
    }

    // Státuszüzenet megjelenítése
    showStatus(message, type = 'info') {
        const el = this.elements.status;
        if (!el) return;

        el.style.display = 'block';
        el.textContent = message;

        const colors = {
            success: '#d4edda',
            error: '#f8d7da',
            warning: '#fff3cd',
            info: '#d1ecf1'
        };

        const textColors = {
            success: '#155724',
            error: '#721c24',
            warning: '#856404',
            info: '#0c5460'
        };

        el.style.background = colors[type] || colors.info;
        el.style.color = textColors[type] || textColors.info;

        // Automatikus eltűnés 5 másodperc után
        clearTimeout(this.statusTimeout);
        this.statusTimeout = setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    }

    // Admin mód ellenőrzése
    isAdminMode() {
        return this.isActive;
    }

    // Admin belépés URL paraméterrel
    static enableAdmin() {
        const url = new URL(window.location);
        url.searchParams.set('admin', 'true');
        window.location.href = url.toString();
    }

    // Admin kilépés
    static disableAdmin() {
        const url = new URL(window.location);
        url.searchParams.delete('admin');
        window.location.href = url.toString();
    }
}