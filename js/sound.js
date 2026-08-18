// ================================================================
// SOUND.JS - Hangvezérlés (kattanás, győzelem, hiba)
// ================================================================

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.initialized = false;
        this.audioContext = null;
    }

    init() {
        try {
            // AudioContext létrehozása (felhasználói interakcióra indul)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Hangok betöltése
            this.loadSounds();
            
            // Mute állapot beállítása
            this.isMuted = !(window.GeryApp?.state?.soundEnabled ?? true);
            
            this.initialized = true;
            console.log('🔊 Hangrendszer inicializálva');
            return true;

        } catch (error) {
            console.warn('⚠️ Hangrendszer nem elérhető:', error);
            return false;
        }
    }

    loadSounds() {
        // Hangok definiálása
        const soundFiles = {
            click: 'assets/sounds/click.mp3',
            win: 'assets/sounds/win.mp3',
            error: 'assets/sounds/error.mp3'
        };

        Object.entries(soundFiles).forEach(([name, path]) => {
            try {
                const audio = new Audio(path);
                audio.preload = 'auto';
                audio.load();
                this.sounds[name] = audio;
            } catch (e) {
                console.warn(`⚠️ Hang betöltése sikertelen: ${name}`, e);
                // Fallback: hanggenerálás
                this.sounds[name] = this.createFallbackSound(name);
            }
        });

        // Videó hangerő
        const video = document.querySelector('.background-video');
        if (video) {
            video.volume = 0.5;
        }
    }

    // Fallback hangok (ha nincs MP3 fájl)
    createFallbackSound(type) {
        try {
            const ctx = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            const duration = type === 'click' ? 0.05 : type === 'win' ? 0.2 : 0.1;
            const frequency = type === 'click' ? 800 : type === 'win' ? 523 : 300;
            
            return {
                play: () => {
                    if (this.isMuted) return;
                    try {
                        const oscillator = ctx.createOscillator();
                        const gainNode = ctx.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(ctx.destination);
                        oscillator.frequency.value = frequency;
                        oscillator.type = type === 'error' ? 'sawtooth' : 'sine';
                        gainNode.gain.value = 0.3;
                        oscillator.start();
                        oscillator.stop(ctx.currentTime + duration);
                    } catch (e) {
                        // Fallback sikertelen
                    }
                }
            };
        } catch (e) {
            return { play: () => {} };
        }
    }

    // Hang lejátszás
    play(soundName) {
        if (this.isMuted) {
            return;
        }

        const sound = this.sounds[soundName];
        if (!sound) {
            return;
        }

        try {
            // AudioContext felébresztése (ha szükséges)
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // Ha Audio objektum, akkor klónozzuk és játszuk
            if (sound.cloneNode) {
                const clone = sound.cloneNode();
                clone.volume = 0.3;
                clone.play().catch(() => {});
                // Automatikus cleanup
                setTimeout(() => clone.remove(), 2000);
            } else if (sound.play) {
                // Fallback hang
                sound.play();
            }
        } catch (e) {
            // Hang lejátszás sikertelen (csendben)
        }
    }

    // Speciális hangok
    playClick() {
        this.play('click');
    }

    playWin() {
        this.play('win');
    }

    playError() {
        this.play('error');
    }

    // Némítás be/ki
    setMuted(muted) {
        this.isMuted = muted;
        
        // Videó hangja
        const video = document.querySelector('.background-video');
        if (video) {
            video.muted = muted;
        }
        
        // Globális állapot frissítése
        if (window.GeryApp) {
            window.GeryApp.state.soundEnabled = !muted;
        }
        
        console.log(`🔊 Hang ${muted ? 'ki' : 'be'}`);
    }

    // Némítás állapot lekérése
    isMutedState() {
        return this.isMuted;
    }

    // Hang váltás (toggle)
    toggleMute() {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    }

    // Videó hangjának beállítása
    setVideoVolume(volume) {
        const video = document.querySelector('.background-video');
        if (video) {
            video.volume = Math.max(0, Math.min(1, volume));
        }
    }
}