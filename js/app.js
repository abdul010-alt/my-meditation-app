// Meditation App JavaScript

class MeditationApp {
    constructor() {
        this.timer = null;
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = 300; // 5 minutes default
        this.totalTime = 300;
        this.soundEnabled = true;
        this.currentAudio = null;
        this.notificationSound = true;
        this.vibration = true;
        
        this.quotes = [
            { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
            { text: "The present moment is the only time over which we have dominion.", author: "Thích Nhất Hạnh" },
            { text: "Meditation is not evasion; it is a serene encounter with reality.", author: "Thích Nhất Hạnh" },
            { text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill" },
            { text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra" },
            { text: "Meditation is a way for nourishing and blossoming the divinity within you.", author: "Amit Ray" },
            { text: "The goal of meditation isn't to control your thoughts, it's to stop letting them control you.", author: "Anonymous" },
            { text: "Wherever you are, be there totally.", author: "Eckhart Tolle" },
            { text: "Meditation brings wisdom; lack of meditation leaves ignorance.", author: "Buddha" },
            { text: "The mind is everything. What you think you become.", author: "Buddha" },
            { text: "Quiet the mind, and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
            { text: "Meditation is the tongue of the soul and the language of our spirit.", author: "Jeremy Taylor" },
            { text: "In meditation, healing can happen. When the mind is calm, alert and totally contented, then it is like a laser beam - it is very powerful and healing can happen.", author: "Amit Ray" },
            { text: "Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts and our feelings.", author: "Arianna Huffington" },
            { text: "The thing about meditation is: You become more and more you.", author: "David Lynch" }
        ];
        
        this.soundThemes = {
            none: null,
            rain: this.createAudioContext('rain'),
            ocean: this.createAudioContext('ocean'),
            forest: this.createAudioContext('forest'),
            birds: this.createAudioContext('birds'),
            wind: this.createAudioContext('wind')
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
        this.displayRandomQuote();
        this.loadSettings();
        this.disableContextMenu();
        this.preventZoom();
    }
    
    bindEvents() {
        // Timer controls
        document.getElementById('playPauseBtn').addEventListener('click', () => this.toggleTimer());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());
        document.getElementById('soundBtn').addEventListener('click', () => this.toggleSound());
        
        // Time presets
        document.querySelectorAll('.time-preset').forEach(btn => {
            btn.addEventListener('click', (e) => this.setTimePreset(parseInt(e.target.dataset.time)));
        });
        
        // Sound theme selector
        document.getElementById('soundTheme').addEventListener('change', (e) => this.changeSoundTheme(e.target.value));
        
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettings();
        });
        
        // Settings controls
        document.getElementById('notificationSound').addEventListener('change', (e) => {
            this.notificationSound = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('vibration').addEventListener('change', (e) => {
            this.vibration = e.target.checked;
            this.saveSettings();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Prevent sleep during meditation
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }
    
    createAudioContext(type) {
        // Create synthetic audio for different ambient sounds
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return {
            context: audioContext,
            type: type,
            oscillators: [],
            gainNode: null
        };
    }
    
    playAmbientSound(type) {
        if (!this.soundEnabled || type === 'none') return;
        
        const audioData = this.soundThemes[type];
        if (!audioData) return;
        
        const { context } = audioData;
        
        // Create gain node for volume control
        const gainNode = context.createGain();
        gainNode.connect(context.destination);
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        
        // Create different sound patterns based on type
        switch (type) {
            case 'rain':
                this.createRainSound(context, gainNode);
                break;
            case 'ocean':
                this.createOceanSound(context, gainNode);
                break;
            case 'forest':
                this.createForestSound(context, gainNode);
                break;
            case 'birds':
                this.createBirdSound(context, gainNode);
                break;
            case 'wind':
                this.createWindSound(context, gainNode);
                break;
        }
        
        audioData.gainNode = gainNode;
    }
    
    createRainSound(context, gainNode) {
        // White noise for rain effect
        const bufferSize = 4096;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = context.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;
        
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, context.currentTime);
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        whiteNoise.start();
        
        this.currentAudio = { source: whiteNoise, context };
    }
    
    createOceanSound(context, gainNode) {
        // Low frequency oscillation for ocean waves
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(0.1, context.currentTime);
        
        const lfo = context.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.05, context.currentTime);
        
        const lfoGain = context.createGain();
        lfoGain.gain.setValueAtTime(200, context.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        oscillator.connect(gainNode);
        oscillator.start();
        lfo.start();
        
        this.currentAudio = { source: oscillator, context };
    }
    
    createForestSound(context, gainNode) {
        // Multiple low-frequency tones for forest ambience
        const frequencies = [80, 120, 160, 200];
        const oscillators = [];
        
        frequencies.forEach(freq => {
            const osc = context.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq + Math.random() * 20, context.currentTime);
            
            const oscGain = context.createGain();
            oscGain.gain.setValueAtTime(0.02, context.currentTime);
            
            osc.connect(oscGain);
            oscGain.connect(gainNode);
            osc.start();
            
            oscillators.push(osc);
        });
        
        this.currentAudio = { source: oscillators[0], context };
    }
    
    createBirdSound(context, gainNode) {
        // Higher frequency tones for bird sounds
        const createBirdChirp = () => {
            const osc = context.createOscillator();
            osc.type = 'sine';
            
            const freq = 800 + Math.random() * 1200;
            osc.frequency.setValueAtTime(freq, context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, context.currentTime + 0.1);
            
            const envelope = context.createGain();
            envelope.gain.setValueAtTime(0, context.currentTime);
            envelope.gain.linearRampToValueAtTime(0.05, context.currentTime + 0.01);
            envelope.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
            
            osc.connect(envelope);
            envelope.connect(gainNode);
            osc.start();
            osc.stop(context.currentTime + 0.1);
            
            // Schedule next chirp
            setTimeout(createBirdChirp, Math.random() * 3000 + 2000);
        };
        
        createBirdChirp();
        this.currentAudio = { context };
    }
    
    createWindSound(context, gainNode) {
        // Filtered white noise for wind
        const bufferSize = 4096;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = context.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;
        
        const filter = context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, context.currentTime);
        filter.Q.setValueAtTime(0.5, context.currentTime);
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        whiteNoise.start();
        
        this.currentAudio = { source: whiteNoise, context };
    }
    
    stopAmbientSound() {
        if (this.currentAudio) {
            try {
                if (this.currentAudio.source && this.currentAudio.source.stop) {
                    this.currentAudio.source.stop();
                }
                if (this.currentAudio.context && this.currentAudio.context.close) {
                    this.currentAudio.context.close();
                }
            } catch (e) {
                console.log('Audio cleanup error:', e);
            }
            this.currentAudio = null;
        }
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.isPaused = false;
        
        // Start ambient sound
        const soundTheme = document.getElementById('soundTheme').value;
        this.playAmbientSound(soundTheme);
        
        // Update UI
        this.updatePlayPauseButton();
        this.updateTimerStatus('Meditating...');
        
        // Add breathing animation
        document.querySelector('.timer-circle')?.classList.add('breathing');
        
        // Start countdown
        this.timer = setInterval(() => {
            this.currentTime--;
            this.updateDisplay();
            this.updateProgress();
            
            if (this.currentTime <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        
        clearInterval(this.timer);
        this.stopAmbientSound();
        
        this.updatePlayPauseButton();
        this.updateTimerStatus('Paused');
        
        // Remove breathing animation
        document.querySelector('.timer-circle')?.classList.remove('breathing');
    }
    
    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        
        clearInterval(this.timer);
        this.stopAmbientSound();
        
        this.currentTime = this.totalTime;
        this.updateDisplay();
        this.updateProgress();
        this.updatePlayPauseButton();
        this.updateTimerStatus('Ready to begin');
        
        // Remove breathing animation
        document.querySelector('.timer-circle')?.classList.remove('breathing');
        
        // Update active preset
        this.updateActivePreset();
    }
    
    completeSession() {
        this.isRunning = false;
        this.isPaused = false;
        
        clearInterval(this.timer);
        this.stopAmbientSound();
        
        this.updatePlayPauseButton();
        this.updateTimerStatus('Session complete!');
        
        // Remove breathing animation
        document.querySelector('.timer-circle')?.classList.remove('breathing');
        
        // Play completion notification
        this.playCompletionNotification();
        
        // Show completion message
        this.showCompletionMessage();
        
        // Reset for next session
        setTimeout(() => {
            this.resetTimer();
            this.displayRandomQuote();
        }, 3000);
    }
    
    playCompletionNotification() {
        if (!this.notificationSound) return;
        
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.frequency.setValueAtTime(800, context.currentTime);
            oscillator.frequency.setValueAtTime(600, context.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, context.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0, context.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(context.currentTime + 0.3);
            
            // Vibration
            if (this.vibration && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        } catch (e) {
            console.log('Notification sound error:', e);
        }
    }
    
    showCompletionMessage() {
        // Create and show a temporary completion message
        const message = document.createElement('div');
        message.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 shadow-2xl z-50 animate-scale-in';
        message.innerHTML = `
            <div class="text-center">
                <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Session Complete!</h3>
                <p class="text-gray-600">Well done on completing your meditation session.</p>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
    
    setTimePreset(seconds) {
        if (this.isRunning) return;
        
        this.totalTime = seconds;
        this.currentTime = seconds;
        this.updateDisplay();
        this.updateProgress();
        this.updateActivePreset();
    }
    
    updateActivePreset() {
        document.querySelectorAll('.time-preset').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.time) === this.totalTime) {
                btn.classList.add('active');
            }
        });
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        const soundOnIcon = document.getElementById('soundOnIcon');
        const soundOffIcon = document.getElementById('soundOffIcon');
        
        if (this.soundEnabled) {
            soundOnIcon.classList.remove('hidden');
            soundOffIcon.classList.add('hidden');
        } else {
            soundOnIcon.classList.add('hidden');
            soundOffIcon.classList.remove('hidden');
            this.stopAmbientSound();
        }
    }
    
    changeSoundTheme(theme) {
        if (this.isRunning) {
            this.stopAmbientSound();
            this.playAmbientSound(theme);
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timerDisplay').textContent = display;
    }
    
    updateProgress() {
        const progress = ((this.totalTime - this.currentTime) / this.totalTime) * 283;
        const circle = document.getElementById('progressCircle');
        circle.style.strokeDashoffset = 283 - progress;
    }
    
    updatePlayPauseButton() {
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        
        if (this.isRunning) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }
    
    updateTimerStatus(status) {
        document.getElementById('timerStatus').textContent = status;
    }
    
    displayRandomQuote() {
        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        document.getElementById('quote').textContent = `"${randomQuote.text}"`;
        document.getElementById('quoteAuthor').textContent = `— ${randomQuote.author}`;
    }
    
    openSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
    }
    
    closeSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }
    
    handleKeyboard(e) {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.toggleTimer();
                break;
            case 'KeyR':
                e.preventDefault();
                this.resetTimer();
                break;
            case 'KeyS':
                e.preventDefault();
                this.toggleSound();
                break;
            case 'Escape':
                this.closeSettings();
                break;
        }
    }
    
    handleVisibilityChange() {
        // Keep timer running even when tab is not visible
        if (document.hidden && this.isRunning) {
            // Timer continues in background
        }
    }
    
    saveSettings() {
        const settings = {
            notificationSound: this.notificationSound,
            vibration: this.vibration,
            soundEnabled: this.soundEnabled
        };
        localStorage.setItem('meditationAppSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('meditationAppSettings') || '{}');
            
            this.notificationSound = settings.notificationSound !== false;
            this.vibration = settings.vibration !== false;
            this.soundEnabled = settings.soundEnabled !== false;
            
            // Update UI
            document.getElementById('notificationSound').checked = this.notificationSound;
            document.getElementById('vibration').checked = this.vibration;
            
            if (!this.soundEnabled) {
                this.toggleSound();
            }
        } catch (e) {
            console.log('Settings load error:', e);
        }
    }
    
    disableContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Disable drag
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Disable selection
        document.addEventListener('selectstart', (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                return false;
            }
        });
    }
    
    preventZoom() {
        // Prevent pinch zoom
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
}

// Initialize app when DOM is loaded
window.addEventListener("load", () => {
    new MeditationApp();
});

// Handle app installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    console.log('App can be installed');
});

window.addEventListener('appinstalled', () => {
    console.log('App was installed');
    deferredPrompt = null;
});

