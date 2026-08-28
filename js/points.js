// ================================================================
// POINTS.JS - Pontszám kezelés (CSV, localStorage, ranglista)
// ================================================================

export class PointsManager {
    constructor() {
        this.codes = new Set();
        this.pointsData = [];
        this.currentCode = null;
        this.currentPoints = 0;
        this.initialized = false;
        this.dataLoaded = false;
    }

    async init() {
        try {
            // 1. Kódszámok betöltése
            await this.loadCodes();
            
            // 2. Pontok betöltése
            await this.loadPoints();
            
            // 3. LocalStorage-ból visszatöltés (ha van félbeszakadt session)
            this.restoreFromLocalStorage();

            this.initialized = true;
            console.log(`✅ Pontkezelő inicializálva: ${this.codes.size} kód, ${this.pointsData.length} rekord`);
            return true;

        } catch (error) {
            console.error('❌ Hiba a pontkezelő betöltésekor:', error);
            return false;
        }
    }

    // ---------- KÓDSZÁMOK BETÖLTÉSE ----------
    async loadCodes() {
        try {
            const response = await fetch('data/codes.txt');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - codes.txt nem található`);
            }
            const text = await response.text();
            const lines = text.split('\n')
                .map(line => line.trim().toUpperCase())
                .filter(line => line.length === 6 && /^[A-Z0-9]{6}$/.test(line));
            
            this.codes = new Set(lines);
            console.log(`📋 ${this.codes.size} kódszám betöltve`);
            
            // Mentés a globális állapotba
            if (window.GeryApp) {
                window.GeryApp.state.codeList = Array.from(this.codes);
            }
            return true;

        } catch (error) {
            console.error('❌ Hiba a kódszámok betöltésekor:', error);
            // Fallback: próbáljuk a localStorage-t
            const saved = localStorage.getItem('gery_codes_backup');
            if (saved) {
                try {
                    const codes = JSON.parse(saved);
                    this.codes = new Set(codes);
                    console.log(`📋 ${this.codes.size} kód betöltve localStorage-ból (fallback)`);
                    return true;
                } catch (e) {}
            }
            // Ha nincs, akkor üres set
            this.codes = new Set();
            return false;
        }
    }

    // ---------- PONTOK BETÖLTÉSE ----------
    async loadPoints() {
        try {
            const response = await fetch('data/points.csv');
            if (!response.ok) {
                // Ha nincs fájl, kezdünk egy újat
                console.log('ℹ️ points.csv nem található, új fájl lesz létrehozva');
                this.pointsData = [];
                return true;
            }
            
            const text = await response.text();
            this.pointsData = this.parseCSV(text);
            console.log(`📊 ${this.pointsData.length} pontrekord betöltve`);
            
            // Mentés a globális állapotba
            if (window.GeryApp) {
                window.GeryApp.state.pointsData = this.pointsData;
            }
            return true;

        } catch (error) {
            console.error('❌ Hiba a pontok betöltésekor:', error);
            this.pointsData = [];
            return false;
        }
    }

    // ---------- CSV PARSER ----------
    parseCSV(text) {
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (lines.length === 0) return [];
        
        // Fejléc érzékelés
        const headerLine = lines[0];
        const hasHeader = headerLine.toLowerCase().includes('code') || 
                          headerLine.toLowerCase().includes('points') ||
                          headerLine.toLowerCase().includes('timestamp');
        
        const startIndex = hasHeader ? 1 : 0;
        const result = [];
        
        for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(',').map(s => s.trim());
            if (parts.length >= 3) {
                result.push({
                    code: parts[0].toUpperCase(),
                    points: parseInt(parts[1]) || 0,
                    timestamp: parts[2] || ''
                });
            }
        }
        
        return result;
    }

    // ---------- CSV GENERÁLÁS ----------
    generateCSV(data) {
        const header = 'code,points,timestamp';
        const rows = data.map(row => 
            `${row.code},${row.points},${row.timestamp}`
        );
        return [header, ...rows].join('\n');
    }

    // ---------- KÓD ELLENŐRZÉS ----------
    validateCode(code) {
        const upperCode = code.toUpperCase().trim();
        const isValid = this.codes.has(upperCode);
        if (isValid) {
            this.currentCode = upperCode;
        }
        return isValid;
    }

    // ---------- PONTOK BETÖLTÉSE KÓD ALAPJÁN ----------
    loadPointsForCode(code) {
        const upperCode = code.toUpperCase().trim();
        const records = this.pointsData.filter(row => row.code === upperCode);
        
        if (records.length > 0) {
            // Utolsó rekord pontszáma
            const latest = records[records.length - 1];
            this.currentPoints = latest.points || 0;
        } else {
            this.currentPoints = 0;
        }
        
        // Globális állapot frissítése
        if (window.GeryApp) {
            window.GeryApp.state.previousPoints = this.currentPoints;
            window.GeryApp.state.totalPoints = this.currentPoints;
            window.GeryApp.state.userCode = upperCode;
            window.GeryApp.state.isCodeValid = true;
        }
        
        console.log(`📊 Kód: ${upperCode}, eddigi pontok: ${this.currentPoints}`);
        return this.currentPoints;
    }

    // ---------- PONTOK MENTÉSE ----------
    async savePoints(code, totalPoints, gameScores) {
        if (!code) {
            console.warn('⚠️ Nincs kódszám a mentéshez');
            return false;
        }

        const upperCode = code.toUpperCase().trim();
        const now = new Date();
        const timestamp = this.formatTimestamp(now);
        
        // 1. Új rekord létrehozása
        const newRecord = {
            code: upperCode,
            points: totalPoints,
            timestamp: timestamp
        };
        
        // 2. Hozzáadás a ponthoz
        this.pointsData.push(newRecord);
        
        // 3. Mentés localStorage-ba (backup)
        this.saveToLocalStorage(upperCode, totalPoints, timestamp);
        
        // 4. CSV letöltés (opcionális, de jó backup)
        this.downloadCSV();
        
        // 5. Frissítés a globális állapotban
        if (window.GeryApp) {
            window.GeryApp.state.pointsData = this.pointsData;
        }
        
        console.log(`💾 Pontok mentve: ${upperCode} → ${totalPoints} pont (${timestamp})`);
        
        // 6. Kísérlet a szerverre küldésre (ha van API)
        await this.sendToServer(upperCode, totalPoints, timestamp);
        
        return true;
    }

    // ---------- IDŐPONT FORMAZÁS ----------
formatTimestamp(date) {
    // Római számok a hónapokhoz (független a nyelvtől)
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    
    const year = date.getFullYear();
    const month = romanMonths[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}. ${month}. ${day}. ${hours}:${minutes}`;
}

    // ---------- LOCALSTORAGE MENTÉS ----------
    saveToLocalStorage(code, points, timestamp) {
        try {
            const key = `gery_points_${code}`;
            const data = {
                code,
                points,
                timestamp,
                lastUpdate: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(data));
            
            // Globális pontlista mentése
            const allPoints = JSON.parse(localStorage.getItem('gery_all_points') || '[]');
            allPoints.push(data);
            localStorage.setItem('gery_all_points', JSON.stringify(allPoints));
            
            // Kódok backup
            localStorage.setItem('gery_codes_backup', JSON.stringify(Array.from(this.codes)));
            
        } catch (e) {
            console.warn('⚠️ LocalStorage mentés sikertelen:', e);
        }
    }

    // ---------- LOCALSTORAGE VISSZATÖLTÉS ----------
    restoreFromLocalStorage() {
        try {
            const saved = localStorage.getItem('gery_all_points');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.length > 0) {
                    // Összefésülés a meglévő adatokkal
                    const existingCodes = new Set(this.pointsData.map(r => r.code));
                    data.forEach(item => {
                        if (!existingCodes.has(item.code)) {
                            this.pointsData.push({
                                code: item.code,
                                points: item.points,
                                timestamp: item.timestamp || ''
                            });
                        }
                    });
                    console.log(`🔄 ${data.length} rekord visszatöltve localStorage-ból`);
                }
            }
        } catch (e) {
            console.warn('⚠️ LocalStorage visszatöltés sikertelen:', e);
        }
    }

    // ---------- CSV LETÖLTÉS ----------
    downloadCSV() {
        try {
            const csv = this.generateCSV(this.pointsData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `points_backup_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.warn('⚠️ CSV letöltés sikertelen:', e);
        }
    }

    // ---------- SZERVERRE KÜLDÉS (API) ----------
    async sendToServer(code, points, timestamp) {
        try {
            const response = await fetch('/api/save-points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    points: points,
                    timestamp: timestamp
                })
            });
            
            if (response.ok) {
                console.log('📤 Pontok elküldve a szerverre');
            } else {
                console.warn('⚠️ Szerver mentés sikertelen (HTTP ' + response.status + ')');
            }
        } catch (e) {
            // Szerver nem elérhető - ez normális, ha nincs backend
            console.log('ℹ️ Szerver nem elérhető (backend nélkül is működik)');
        }
    }

    // ---------- RANGLISTA MEGJELENÍTÉS ----------
showRanking() {
    // Rendezés pont szerint csökkenő
    const sorted = [...this.pointsData].sort((a, b) => b.points - a.points);
    
    // Top 10
    const top10 = sorted.slice(0, 10);
    
    // Aktuális játékos keresése
    const currentCode = window.GeryApp?.state?.userCode;
    const currentSessionPoints = window.GeryApp?.state?.sessionPoints || 0;
    
    let currentRecord = null;
    let currentInTop10 = false;
    
    if (currentCode) {
        // Keresés a mentett rekordok között
        const existingRecord = sorted.find(r => r.code === currentCode);
        
        if (existingRecord) {
            // Ha van mentett rekord, de a session pontok többek, akkor a session pontokat használjuk
            const maxPoints = Math.max(existingRecord.points, currentSessionPoints);
            currentRecord = {
                code: currentCode,
                points: maxPoints,
                timestamp: existingRecord.timestamp || '-'
            };
        } else if (currentSessionPoints > 0) {
            // Ha nincs mentett rekord, de van session pont
            currentRecord = {
                code: currentCode,
                points: maxPoints,
                timestamp: existingRecord.timestamp || '-'
            };
            } else if (currentSessionPoints > 0) {
            // Ha nincs mentett rekord, de van session pont
            currentRecord = {
                code: currentCode,
                points: currentSessionPoints,
                timestamp: this.formatTimestamp(new Date()) || '-'
            };
        }
        
        if (currentRecord) {
            currentInTop10 = top10.some(r => r.code === currentCode && r.points >= currentRecord.points);
        }
    }

    // Ranglista HTML előállítása
    const lang = window.GeryApp?.modules?.language;
    let html = `
        <div class="modal-overlay active" id="ranking-modal">
            <div class="modal-box">
                <div class="modal-header">
                    <h3>🏆 ${lang?.t('points_title') || 'Ranglista'}</h3>
                    <button class="modal-close" onclick="document.getElementById('ranking-modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom:12px;font-weight:700;color:var(--brown-dark);">
                        ${lang?.t('points_top10') || 'Top 10'}
                    </div>
    `;

    if (top10.length === 0 && (!currentRecord || currentRecord.points === 0)) {
        html += `<div class="rank-empty">${lang?.t('points_empty') || 'Még nincs pontszám'}</div>`;
    } else {
        // Top 10 mutatása
        if (top10.length > 0) {
            top10.forEach((record, index) => {
                const isCurrent = record.code === currentCode;
                html += `
                    <div class="rank-item ${isCurrent ? 'current' : ''}">
                        <span class="rank-pos">#${index + 1}</span>
                        <span class="rank-code">${record.code}</span>
                        <span class="rank-points">${record.points}</span>
                        <span class="rank-time">${record.timestamp}</span>
                    </div>
                `;
            });
        }

        // Aktuális játékos hozzáadása (ha nincs a top 10-ben)
        if (currentRecord && !currentInTop10) {
            html += `
                <div class="rank-divider">⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯</div>
                <div style="margin-bottom:8px;font-weight:700;color:var(--brown-dark);font-size:0.85rem;">
                    🎯 ${lang?.t('points_current') || 'Te'}
                </div>
                <div class="rank-item current">
                    <span class="rank-pos">#${sorted.findIndex(r => r.code === currentCode) + 1 || '?'}</span>
                    <span class="rank-code">${currentRecord.code}</span>
                    <span class="rank-points">${currentRecord.points}</span>
                    <span class="rank-time">${currentRecord.timestamp}</span>
                </div>
            `;
        }

        // Ha nincs rekord az aktuális játékosnak, de van session pont
        if (!currentRecord && currentCode && currentSessionPoints > 0) {
            html += `
                <div class="rank-divider">⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯</div>
                <div style="margin-bottom:8px;font-weight:700;color:var(--brown-dark);font-size:0.85rem;">
                    🎯 ${lang?.t('points_current') || 'Te'}
                </div>
                <div class="rank-item current">
                    <span class="rank-pos">${sorted.length + 1}</span>
                    <span class="rank-code">${currentCode}</span>
                    <span class="rank-points">${currentSessionPoints}</span>
                    <span class="rank-time">${this.formatTimestamp(new Date()) || '-'}</span>
                </div>
            `;
        }
    }

    html += `
                </div>
            </div>
        </div>
    `;

    // Modal hozzáadása a DOM-hoz
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = html;
    document.body.appendChild(modalContainer.firstElementChild);

    // Bezárás gomb működése
    document.querySelector('#ranking-modal .modal-close')?.addEventListener('click', () => {
        document.getElementById('ranking-modal')?.remove();
    });

    // Háttérre kattintva bezárás
    document.getElementById('ranking-modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.target.remove();
        }
    });
}

    // ---------- AKTUÁLIS PONTSZÁM LEKÉRÉSE ----------
    getCurrentTotal() {
        return window.GeryApp?.state?.totalPoints || 0;
    }

    // ---------- PONTSZÁM HOZZÁADÁSA (játék végén) ----------
    addPoints(points) {
        if (window.GeryApp) {
            window.GeryApp.state.totalPoints += points;
            // Pont gomb frissítése
            const label = document.querySelector('#btn-points .label');
            if (label) {
                label.textContent = window.GeryApp.state.totalPoints.toString();
            }
        }
        return window.GeryApp?.state?.totalPoints || 0;
    }
}