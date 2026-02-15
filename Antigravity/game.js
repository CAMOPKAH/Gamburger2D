// GameBurger2D — Antigravity Edition
// Полностью переработанный, чистый, адаптивный интерфейс

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ── Конфигурация ──
    const CONFIG = {
        FPS: 60,
        MAX_BURGERS: 5,
        MIN_BURGERS: 3,
        BURGER_TYPES: [
            { name: 'small', pieces: 3, size: 80, speed: 1.5, color: '#8B4513', img: 'images/burger_whole.png' },
            { name: 'medium', pieces: 5, size: 100, speed: 1.2, color: '#CD853F', img: 'images/burger_whole.png' },
            { name: 'large', pieces: 8, size: 120, speed: 0.8, color: '#D2691E', img: 'images/burger_whole.png' }
        ],
        MOVEMENT_PATTERNS: ['linear', 'sine', 'circle', 'spiral', 'figure8', 'zigzag'],
        FIELD_WIDTH: 400,
        FIELD_HEIGHT: 400,
        QUOTE_INTERVAL: 10000,
        BURGER_SPAWN_INTERVAL: 2000,
        SOUND_ENABLED: true
    };

    // ── Состояние ──
    const state = {
        score: 0,
        burgersEaten: 0,
        burgers: [],
        gameRunning: false,
        gamePaused: false,
        lastTime: 0,
        lastQuoteTime: 0,
        lastSpawnTime: 0,
        soundEnabled: CONFIG.SOUND_ENABLED,
        ttsEnabled: true
    };

    // ── DOM элементы (единый интерфейс) ──
    const $ = id => document.getElementById(id);
    const el = {
        gameField: $('game-field'),
        score: $('score'),
        burgerCount: $('burger-count'),
        startBtn: $('start-btn'),
        pauseBtn: $('pause-btn'),
        soundBtn: $('sound-btn'),
        fullscreenBtn: $('fullscreen-btn'),
        helpBtn: $('help-btn'),
        speakBtn: $('speak-btn'),
        instructions: $('instructions'),
        quote: $('current-quote'),
        notification: $('notification')
    };

    // ══════════════════════════════════════════
    //  Класс Burger
    // ══════════════════════════════════════════
    class Burger {
        constructor(typeIndex, x, y, pattern) {
            const type = CONFIG.BURGER_TYPES[typeIndex];
            this.typeIndex = typeIndex;
            this.type = type;
            this.totalPieces = type.pieces;
            this.piecesLeft = type.pieces;
            this.size = type.size;
            this.speed = type.speed;
            this.x = x;
            this.y = y;
            this.customPosition = (x !== undefined && y !== undefined);
            this.pattern = (pattern && CONFIG.MOVEMENT_PATTERNS.includes(pattern))
                ? pattern
                : CONFIG.MOVEMENT_PATTERNS[Math.floor(Math.random() * CONFIG.MOVEMENT_PATTERNS.length)];
            this.time = 0;

            this.initPositionAndDirection();
            this.patternParams = this.initPatternParams();

            // DOM
            this.element = document.createElement('div');
            this.element.className = 'burger';
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;

            this.img = document.createElement('img');
            this.img.src = type.img;
            this.img.className = 'burger-img';
            this.img.draggable = false;
            this.img.onload = () => this.applyChromaKey();
            this.element.appendChild(this.img);

            // Health bar
            this.healthBar = document.createElement('div');
            this.healthBar.className = 'health-bar';
            this.healthBarFill = document.createElement('div');
            this.healthBarFill.className = 'health-bar-fill';
            this.healthBar.appendChild(this.healthBarFill);
            this.element.appendChild(this.healthBar);

            // Клик + тач
            const handler = e => { e.preventDefault(); this.bite(); };
            this.element.addEventListener('click', handler);
            this.element.addEventListener('touchstart', handler, { passive: false });

            el.gameField.appendChild(this.element);
            this.updateVisual();
        }

        // ── Позиция / направление ──
        initPositionAndDirection() {
            const margin = 50;
            const fw = CONFIG.FIELD_WIDTH;
            const fh = CONFIG.FIELD_HEIGHT;
            const fixed = this.customPosition;

            switch (this.pattern) {
                case 'linear': {
                    if (!fixed) {
                        const r = Math.random();
                        const side = r < 0.4 ? 3 : r < 0.6 ? 0 : r < 0.8 ? 1 : 2;
                        switch (side) {
                            case 0: this.x = -this.size; this.y = Math.random() * fh;
                                this.dx = Math.random() * 2 * this.speed + 1;
                                this.dy = (Math.random() - 0.5) * 2 * this.speed; break;
                            case 1: this.x = fw; this.y = Math.random() * fh;
                                this.dx = -(Math.random() * 2 * this.speed + 1);
                                this.dy = (Math.random() - 0.5) * 2 * this.speed; break;
                            case 2: this.x = Math.random() * fw; this.y = -this.size;
                                this.dx = (Math.random() - 0.5) * 2 * this.speed;
                                this.dy = Math.random() * 2 * this.speed + 1; break;
                            case 3: this.x = Math.random() * fw; this.y = fh;
                                this.dx = (Math.random() - 0.5) * 2 * this.speed;
                                this.dy = -(Math.random() * 2 * this.speed + 1); break;
                        }
                    } else {
                        this.dx ??= (Math.random() - 0.5) * 2 * this.speed;
                        this.dy ??= (Math.random() - 0.5) * 2 * this.speed;
                    }
                    break;
                }
                case 'sine': case 'circle': case 'spiral': case 'figure8': {
                    if (!fixed) {
                        this.centerX = margin + Math.random() * (fw - 2 * margin);
                        this.centerY = margin + Math.random() * (fh - 2 * margin);
                        this.x = this.centerX + (Math.random() - 0.5) * 100;
                        this.y = this.centerY + (Math.random() - 0.5) * 100;
                    } else {
                        this.centerX = this.x; this.centerY = this.y;
                    }
                    this.dx = 0; this.dy = 0;
                    break;
                }
                case 'zigzag': {
                    if (!fixed) {
                        if (Math.random() > 0.5) { this.x = -this.size; this.dx = Math.random() * 2 * this.speed + 1; }
                        else { this.x = fw; this.dx = -(Math.random() * 2 * this.speed + 1); }
                        this.y = Math.random() * fh;
                    } else {
                        this.dx ??= (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2 * this.speed + 1);
                    }
                    this.dy = 0;
                    break;
                }
                default: {
                    if (!fixed) { this.x = Math.random() * fw; this.y = Math.random() * fh; }
                    this.dx ??= (Math.random() - 0.5) * 4 * this.speed;
                    this.dy ??= (Math.random() - 0.5) * 4 * this.speed;
                }
            }
            const ms = 0.5;
            if (this.dx !== undefined && Math.abs(this.dx) < ms) this.dx = ms * Math.sign(this.dx || 1);
            if (this.dy !== undefined && Math.abs(this.dy) < ms) this.dy = ms * Math.sign(this.dy || 1);
        }

        initPatternParams() {
            const p = {};
            p.centerX = this.centerX ?? CONFIG.FIELD_WIDTH / 2;
            p.centerY = this.centerY ?? CONFIG.FIELD_HEIGHT / 2;
            switch (this.pattern) {
                case 'sine':
                    p.amplitudeX = Math.random() * 100 + 50; p.amplitudeY = Math.random() * 100 + 50;
                    p.frequencyX = Math.random() * 0.01 + 0.005; p.frequencyY = Math.random() * 0.01 + 0.005;
                    p.phaseX = Math.random() * Math.PI * 2; p.phaseY = Math.random() * Math.PI * 2; break;
                case 'circle':
                    p.radius = Math.random() * 100 + 50; p.angularSpeed = Math.random() * 0.02 + 0.01;
                    p.angle = Math.random() * Math.PI * 2; break;
                case 'spiral':
                    p.radius = Math.random() * 50 + 30; p.angularSpeed = Math.random() * 0.03 + 0.01;
                    p.spiralSpeed = Math.random() * 0.5 + 0.2; p.angle = Math.random() * Math.PI * 2; break;
                case 'figure8':
                    p.amplitudeX = Math.random() * 80 + 40; p.amplitudeY = Math.random() * 40 + 20;
                    p.frequencyX = Math.random() * 0.015 + 0.005; p.frequencyY = p.frequencyX * 2;
                    p.phase = Math.random() * Math.PI * 2; break;
                case 'zigzag':
                    p.amplitude = Math.random() * 100 + 50; p.frequency = Math.random() * 0.02 + 0.01;
                    p.phase = Math.random() * Math.PI * 2; break;
                default: p.amplitude = 0;
            }
            return p;
        }

        // ── Откусить ──
        bite() {
            if (!state.gameRunning || state.gamePaused || this.piecesLeft <= 0) return;
            this.piecesLeft--;
            state.score++;
            updateScore();
            this.element.classList.add('pulse');
            setTimeout(() => this.element.classList.remove('pulse'), 400);
            this.updateVisual();
            playBiteSound();
            if (Math.random() < 0.3) showRandomQuote();
            if (this.piecesLeft <= 0) this.eat();
            showNotification(`Откушен кусочек! +1`);
        }

        eat() {
            state.burgersEaten++;
            updateBurgerCount();
            this.element.classList.add('eaten');
            setTimeout(() => {
                this.element.remove();
                const idx = state.burgers.indexOf(this);
                if (idx > -1) state.burgers.splice(idx, 1);
                showQuote('Гамбургер уничтожен! Отличная работа, солдат!');
            }, 500);
            showNotification(`Гамбургер съеден! Всего: ${state.burgersEaten}`);
        }

        // ── Визуал ──
        updateVisual() {
            if (this.piecesLeft < this.totalPieces) {
                const bp = 'images/burger_bitten.png';
                if (!this.img.src.includes(bp)) {
                    this.img.src = bp;
                    this.img.onload = () => this.applyChromaKey();
                }
            } else {
                this.img.src = this.type.img;
            }
            this.img.style.opacity = 1 - ((this.totalPieces - this.piecesLeft) / this.totalPieces) * 0.5;

            const hp = (this.piecesLeft / this.totalPieces) * 100;
            this.healthBarFill.style.width = `${hp}%`;
            this.healthBarFill.style.background = hp > 60
                ? 'linear-gradient(90deg, #00e676, #7fff00)'
                : hp > 30
                    ? 'linear-gradient(90deg, #ffab00, #ff5e00)'
                    : 'linear-gradient(90deg, #ff1744, #cc0000)';
        }

        // ── Движение ──
        update(dt) {
            if (state.gamePaused) return;
            this.time += dt * 0.001;
            this.calcPosition(dt);
            this.handleBounds();
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            this.applyRotation();
        }

        calcPosition(dt) {
            const p = this.patternParams;
            switch (this.pattern) {
                case 'linear':
                    this.x += this.dx * dt * 0.1; this.y += this.dy * dt * 0.1; break;
                case 'sine':
                    this.x = p.centerX + Math.sin(this.time * p.frequencyX + p.phaseX) * p.amplitudeX;
                    this.y = p.centerY + Math.sin(this.time * p.frequencyY + p.phaseY) * p.amplitudeY; break;
                case 'circle':
                    p.angle += p.angularSpeed * dt * 0.1;
                    this.x = p.centerX + Math.cos(p.angle) * p.radius;
                    this.y = p.centerY + Math.sin(p.angle) * p.radius; break;
                case 'spiral':
                    p.angle += p.angularSpeed * dt * 0.1; p.radius += p.spiralSpeed * dt * 0.1;
                    this.x = p.centerX + Math.cos(p.angle) * p.radius;
                    this.y = p.centerY + Math.sin(p.angle) * p.radius; break;
                case 'figure8': {
                    const t = this.time * p.frequencyX + p.phase;
                    this.x = p.centerX + Math.sin(t) * p.amplitudeX;
                    this.y = p.centerY + Math.sin(2 * t) * p.amplitudeY; break;
                }
                case 'zigzag':
                    this.x += this.dx * dt * 0.1;
                    this.y = p.centerY + Math.sin(this.time * p.frequency + p.phase) * p.amplitude; break;
                default:
                    this.x += this.dx * dt * 0.1; this.y += this.dy * dt * 0.1;
            }
        }

        handleBounds() {
            if (this.x < -this.size) this.x = CONFIG.FIELD_WIDTH;
            if (this.x > CONFIG.FIELD_WIDTH) this.x = -this.size;
            if (this.y < -this.size) this.y = CONFIG.FIELD_HEIGHT;
            if (this.y > CONFIG.FIELD_HEIGHT) this.y = -this.size;
        }

        applyRotation() {
            let r = 0;
            switch (this.pattern) {
                case 'circle': case 'spiral': r = this.patternParams.angle * (180 / Math.PI); break;
                case 'figure8': r = Math.sin(this.time * 0.005) * 45; break;
                case 'zigzag': r = Math.sin(this.time * 0.01) * 15; break;
                default: r = Math.sin(this.time * 0.001 + this.x * 0.01) * 2;
            }
            this.element.style.transform = `translate(-50%, -50%) rotate(${r}deg)`;
        }

        // ── Chroma key ──
        applyChromaKey() {
            try {
                const c = document.createElement('canvas');
                const ctx = c.getContext('2d');
                c.width = this.img.naturalWidth || this.img.width;
                c.height = this.img.naturalHeight || this.img.height;
                if (!c.width || !c.height) return;
                ctx.drawImage(this.img, 0, 0);
                const id = ctx.getImageData(0, 0, c.width, c.height);
                const px = id.data;
                const kR = px[0], kG = px[1], kB = px[2], thr = 30;
                for (let i = 0; i < px.length; i += 4) {
                    if (Math.abs(px[i] - kR) + Math.abs(px[i + 1] - kG) + Math.abs(px[i + 2] - kB) < thr) {
                        px[i + 3] = 0;
                    }
                }
                ctx.putImageData(id, 0, 0);
                this.img.src = c.toDataURL('image/png');
            } catch (e) { /* CORS или другие ограничения */ }
        }
    }

    // ══════════════════════════════════════════
    //  Функции игры
    // ══════════════════════════════════════════

    function init() {
        updateFieldSize();
        window.addEventListener('resize', updateFieldSize);
        window.addEventListener('orientationchange', () => setTimeout(updateFieldSize, 200));
        loadSettings();
        initTTS();

        // Привязка кнопок — click + touchstart для мгновенной реакции
        bindBtn(el.startBtn, startGame);
        bindBtn(el.pauseBtn, togglePause);
        bindBtn(el.soundBtn, toggleSound);
        bindBtn(el.fullscreenBtn, toggleFullscreen);
        bindBtn(el.helpBtn, showHelp);
        bindBtn(el.speakBtn, speakCurrentQuote);

        // Предотвращение зума жестами на iOS
        document.addEventListener('gesturestart', e => e.preventDefault());

        showRandomQuote();
        requestAnimationFrame(gameLoop);
    }

    function bindBtn(button, fn) {
        if (!button) return;
        button.addEventListener('click', fn);
        button.addEventListener('touchstart', e => { e.preventDefault(); fn(); }, { passive: false });
    }

    function updateFieldSize() {
        const rect = el.gameField.getBoundingClientRect();
        CONFIG.FIELD_WIDTH = rect.width;
        CONFIG.FIELD_HEIGHT = rect.height;
    }

    // ── Настройки ──
    function loadSettings() {
        const ss = localStorage.getItem('gb2d_score');
        const sb = localStorage.getItem('gb2d_burgers');
        const snd = localStorage.getItem('gb2d_sound');
        if (ss) state.score = parseInt(ss, 10);
        if (sb) state.burgersEaten = parseInt(sb, 10);
        if (snd) state.soundEnabled = snd === 'true';
        updateScore();
        updateBurgerCount();
        updateSoundIcon();
    }

    function saveSettings() {
        localStorage.setItem('gb2d_score', state.score);
        localStorage.setItem('gb2d_burgers', state.burgersEaten);
        localStorage.setItem('gb2d_sound', state.soundEnabled);
    }

    function initTTS() {
        if (!('speechSynthesis' in window)) {
            state.ttsEnabled = false;
            if (el.speakBtn) el.speakBtn.style.opacity = '0.4';
        }
    }

    // ── Запуск / пауза ──
    function startGame() {
        if (state.gameRunning) return;
        state.gameRunning = true;
        state.gamePaused = false;
        el.startBtn.style.display = 'none';
        el.instructions.style.display = 'none';
        spawnInitialBurgers();
        showQuote('Игра началась! Уничтожай гамбургеры, солдат!');
    }

    function togglePause() {
        if (!state.gameRunning) return;
        state.gamePaused = !state.gamePaused;
        const icon = el.pauseBtn.querySelector('i');
        if (state.gamePaused) {
            icon.className = 'fas fa-play';
            showQuote('Игра на паузе. Но гамбургеры ждать не будут!');
        } else {
            icon.className = 'fas fa-pause';
            showQuote('Продолжаем уничтожение гамбургеров!');
        }
    }

    // ── Звук ──
    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        updateSoundIcon();
        saveSettings();
        showNotification(`Звук ${state.soundEnabled ? 'включён' : 'выключен'}`);
    }

    function updateSoundIcon() {
        const icon = el.soundBtn.querySelector('i');
        icon.className = state.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        el.soundBtn.style.opacity = state.soundEnabled ? '1' : '0.5';
    }

    // ── Полноэкранный режим ──
    function toggleFullscreen() {
        const icon = el.fullscreenBtn.querySelector('i');
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                icon.className = 'fas fa-compress';
                showNotification('Полноэкранный режим');
            }).catch(() => showNotification('Не удалось войти в полноэкранный режим'));
        } else {
            document.exitFullscreen().then(() => {
                icon.className = 'fas fa-expand';
                showNotification('Обычный режим');
            });
        }
    }

    function showHelp() {
        const vis = el.instructions.style.display !== 'flex';
        el.instructions.style.display = vis ? 'flex' : 'none';
        if (vis) showQuote('Запомни инструкцию, солдат!');
    }

    // ── Спавн ──
    function spawnInitialBurgers() {
        const n = CONFIG.MIN_BURGERS + Math.floor(Math.random() * (CONFIG.MAX_BURGERS - CONFIG.MIN_BURGERS));
        for (let i = 0; i < n; i++) spawnBurger(Math.floor(Math.random() * CONFIG.BURGER_TYPES.length));
        state.lastSpawnTime = Date.now();
    }

    function spawnBurger(typeIndex, pattern) {
        if (!state.gameRunning || state.burgers.length >= CONFIG.MAX_BURGERS) return;
        const idx = typeIndex ?? Math.floor(Math.random() * CONFIG.BURGER_TYPES.length);
        state.burgers.push(new Burger(idx, undefined, undefined, pattern));
    }

    // ── Обновление UI ──
    function updateScore() {
        el.score.textContent = state.score;
        el.score.classList.add('pulse');
        setTimeout(() => el.score.classList.remove('pulse'), 300);
        if (state.score % 100 === 0) saveSettings();
    }

    function updateBurgerCount() {
        el.burgerCount.textContent = state.burgersEaten;
        el.burgerCount.classList.add('pulse');
        setTimeout(() => el.burgerCount.classList.remove('pulse'), 300);
    }

    // ── Цитаты ──
    function showRandomQuote() { showQuote(getRandomQuote()); }

    function showQuote(text) {
        el.quote.textContent = text;
        el.quote.parentElement.classList.add('pulse');
        setTimeout(() => el.quote.parentElement.classList.remove('pulse'), 400);
        if (state.ttsEnabled && state.soundEnabled && Math.random() < 0.5) {
            setTimeout(() => speakQuote(text), 500);
        }
    }

    function speakCurrentQuote() {
        if (!state.ttsEnabled || !state.soundEnabled) {
            return showNotification('TTS недоступен или звук выключен');
        }
        speakQuote(el.quote.textContent);
        showNotification('Озвучено');
    }

    // ── Звук откусывания ──
    function playBiteSound() {
        if (!state.soundEnabled) return;
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain); gain.connect(ac.destination);
            osc.frequency.setValueAtTime(800, ac.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.1);
            osc.start(); osc.stop(ac.currentTime + 0.1);
        } catch (_) { }
    }

    // ── Уведомления ──
    function showNotification(msg, dur = 2500) {
        el.notification.textContent = msg;
        el.notification.classList.add('show');
        setTimeout(() => el.notification.classList.remove('show'), dur);
    }

    // ── Игровой цикл ──
    function gameLoop(ts) {
        const dt = ts - state.lastTime || 0;
        state.lastTime = ts;
        if (!state.gamePaused && state.gameRunning) {
            state.burgers.forEach(b => b.update(dt));
            if (Date.now() - state.lastSpawnTime > CONFIG.BURGER_SPAWN_INTERVAL) {
                if (state.burgers.length < CONFIG.MAX_BURGERS) spawnBurger();
                state.lastSpawnTime = Date.now();
            }
            if (Date.now() - state.lastQuoteTime > CONFIG.QUOTE_INTERVAL) {
                if (Math.random() < 0.7) showRandomQuote();
                state.lastQuoteTime = Date.now();
            }
        }
        requestAnimationFrame(gameLoop);
    }

    // ── Cleanup ──
    function cleanup() {
        state.burgers.forEach(b => b.element.remove());
        state.burgers = [];
        state.gameRunning = false;
        state.gamePaused = false;
        el.startBtn.style.display = '';
        el.instructions.style.display = 'flex';
        showQuote('Игра остановлена. Готов к новому штурму?');
    }

    window.addEventListener('beforeunload', () => { if (state.gameRunning) saveSettings(); });

    // ── Старт ──
    init();

    // ── Debug API ──
    window.debugGame = {
        addBurger: (t = 0, p = null) => spawnBurger(t, p),
        removeAll: () => { state.burgers.forEach(b => b.element.remove()); state.burgers = []; },
        addScore: (n = 100) => { state.score += n; updateScore(); },
        getState: () => ({ ...state, count: state.burgers.length }),
        getPatterns: () => CONFIG.MOVEMENT_PATTERNS,
        cleanup
    };
});
