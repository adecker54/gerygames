// ================================================================
// POINTS.JS - Pontszám kezelés (CSV, localStorage, ranglista)
// ================================================================

export class PointsManager {
    constructor() {
        this.codes = new Set();
        this.pointsData = [];
        this.currentCode = null;
        this.initialized = false;
    }

    async init() {
        try {
            await this.loadCodes();
            await this.loadPoints();
            this.restoreFromLocalStorage();

            this.initialized = true;
            console.log(`✅ Pontkezelő inicializálva: ${this.codes.size} kód, ${this.pointsData.length} rekord`);
            return true;
        } catch (error) {
            console.error('❌ Hiba a pontkezelő betöltésekor:', error);
            return false;
        }
    }

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
            if (window.GeryApp) {
                window.GeryApp.state.codeList = Array.from(this.codes);
            }
            return true;
        } catch (error) {
            const saved = localStorage.getItem('gery_codes_backup');
            if (saved) {
                try {
                    const codes = JSON.parse(saved);
                    this.codes = new Set(codes);
                    return true;
                } catch (e) {}
            }
            this.codes = new Set();
            return false;
        }
    }

    async loadPoints() {
        try {
            const response = await fetch('data/points.csv');
            if (!response.ok) {
                this.pointsData = [];
                return true;
            }
            const text = await response.text();
            this.pointsData = this.parseCSV(text);
            if (window.GeryApp) {
                window.GeryApp.state.pointsData = this.pointsData;
            }
            return true;
        } catch (error) {
            this.pointsData = [];
            return false;
        }
    }

    parseCSV(text) {
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (lines.length === 0) return [];
        
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

    generateCSV(data) {
        const header = 'code,points,timestamp';
        const rows = data.map(row => 
            `${row.code},${row.points},${row.timestamp}`
        );
        return [header, ...rows].join('\n');
    }

    validateCode(code) {
        const upperCode = code.toUpperCase().trim();
        const isValid = this.codes.has(upperCode);
        if (isValid) {
            this.currentCode = upperCode;
            if (window.GeryApp) {
                window.GeryApp.state.userCode = upperCode;
                window.GeryApp.state.isCodeValid = true;
            }
        }
        return isValid;
    }

    async savePoints(code, points) {
        if (!code) return false;

        const upperCode = code.toUpperCase().trim();
        const now = new Date();
        const timestamp = this.formatTimestamp(now);
        
        const newRecord = {
            code: upperCode,
            points: points,
            timestamp: timestamp
        };
        
        this.pointsData.push(newRecord);
        this.saveToLocalStorage(upperCode, points, timestamp);
        this.downloadCSV(now);
        
        if (window.GeryApp) {
            window.GeryApp.state.pointsData = this.pointsData;
        }
        
        console.log(`💾 Pontok mentve: ${upperCode} → ${points} pont (${timestamp})`);
        return true;
    }

    formatTimestamp(date) {
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        const year = date.getFullYear();
        const month = romanMonths[date.getMonth()];
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}. ${month}. ${day}. ${hours}:${minutes}`;
    }

    saveToLocalStorage(code, points, timestamp) {
        try {
            const key = `gery_points_${code}`;
            const data = { code, points, timestamp, lastUpdate: Date.now() };
            localStorage.setItem(key, JSON.stringify(data));
            
            const allPoints = JSON.parse(localStorage.getItem('gery_all_points') || '[]');
            allPoints.push(data);
            localStorage.setItem('gery_all_points', JSON.stringify(allPoints));
            localStorage.setItem('gery_codes_backup', JSON.stringify(Array.from(this.codes)));
        } catch (e) {
            console.warn('⚠️ LocalStorage mentés sikertelen:', e);
        }
    }

    restoreFromLocalStorage() {
        try {
            const saved = localStorage.getItem('gery_all_points');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.length > 0) {
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
                }
            }
        } catch (e) {
            console.warn('⚠️ LocalStorage visszatöltés sikertelen:', e);
        }
    }

    downloadCSV(nowDate = new Date()) {
        try {
            const csv = this.generateCSV(this.pointsData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            // Pontos dinamikus fájlnév: points_backup_év-hónap-nap.csv (pl. points_backup_2026-09-09.csv)
            const year = nowDate.getFullYear();
            const month = String(nowDate.getMonth() + 1).padStart(2, '0');
            const day = String(nowDate.getDate()).padStart(2, '0');
            link.download = `points_backup_${year}-${month}-${day}.csv`;
            
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.warn('⚠️ CSV letöltés sikertelen:', e);
        }
    }

    // ---------- RANGLISTA MEGJELENÍTÉS ----------
    showRanking() {
        // Pontszámok szerint csökkenő sorrend rendezése
        const sorted = [...this.pointsData].sort((a, b) => b.points - a.points);
        const top10 = sorted.slice(0, 10);
        
        const currentCode = window.GeryApp?.state?.userCode;
        const currentSessionPoints = window.GeryApp?.state?.sessionPoints || 0;
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

        if (top10.length === 0) {
            html += `<div class="rank-empty">${lang?.t('points_empty') || 'Még nincs pontszám'}</div>`;
        } else {
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

        // Vizsgáljuk, hogy a játékos bent van-e a Top 10-ben
        let inTop10 = false;
        if (currentCode) {
            inTop10 = top10.some(r => r.code === currentCode);
        }

        // Ha van 10 elem és nagyobb-e a 10. rekordnál, vagy még nincs 10 elem
        if (currentCode && currentSessionPoints > 0 && !inTop10) {
            const tenthPoints = top10.length >= 10 ? top10[9].points : -1;
            if (top10.length < 10 || currentSessionPoints > tenthPoints) {
                // Számoljuk ki a pontos helyezését a teljes listában
                const allRecords = [...sorted];
                const existingIndex = allRecords.findIndex(r => r.code === currentCode);
                if (existingIndex !== -1) {
                    allRecords[existingIndex].points = Math.max(allRecords[existingIndex].points, currentSessionPoints);
                } else {
                    allRecords.push({ code: currentCode, points: currentSessionPoints, timestamp: this.formatTimestamp(new Date()) });
                }
                allRecords.sort((a, b) => b.points - a.points);
                const rank = allRecords.findIndex(r => r.code === currentCode) + 1;

                html += `
                    <div class="rank-divider">⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯⋯</div>
                    <div style="margin-bottom:8px;font-weight:700;color:var(--brown-dark);font-size:0.85rem;">
                        🎯 ${lang?.t('points_current') || 'Te'}
                    </div>
                    <div class="rank-item current">
                        <span class="rank-pos">#${rank}</span>
                        <span class="rank-code">${currentCode}</span>
                        <span class="rank-points">${currentSessionPoints}</span>
                        <span class="rank-time">${this.formatTimestamp(new Date())}</span>
                    </div>
                `;
            }
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer.firstElementChild);

        document.querySelector('#ranking-modal .modal-close')?.addEventListener('click', () => {
            document.getElementById('ranking-modal')?.remove();
        });

        document.getElementById('ranking-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.target.remove();
            }
        });
    }

    getCurrentTotal() {
        return window.GeryApp?.state?.sessionPoints || 0;
    }

    addPoints(points) {
        if (window.GeryApp) {
            window.GeryApp.state.sessionPoints += points;
            const label = document.querySelector('#btn-points .label');
            if (label) {
                label.textContent = window.GeryApp.state.sessionPoints.toString();
            }
        }
        return window.GeryApp?.state?.sessionPoints || 0;
    }
}