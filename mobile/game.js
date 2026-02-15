// GameBurger2d Mobile - Адаптивная мобильная версия
document.addEventListener('DOMContentLoaded', function() {
    console.log('GameBurger2d Mobile загружается...');
    
    // Конфигурация игры для мобильных устройств
    const CONFIG = {
        FPS: 60,
        MAX_BURGERS: 4, // Меньше для мобильных
        MIN_BURGERS: 2,
        BURGER_TYPES: [
            { 
                name: 'small', 
                pieces: 3, 
                size: () => Math.min(80, window.innerWidth * 0.15), // Адаптивный размер
                speed: 1.5, 
                color: '#8B4513', 
                img: 'images/burger_small.svg' 
            },
            { 
                name: 'medium', 
                pieces: 5, 
                size: () => Math.min(100, window.innerWidth * 0.18),
                speed: 1.2, 
                color: '#CD853F', 
                img: 'images/burger_medium.svg' 
            },
            { 
                name: 'large', 
                pieces: 8, 
                size: () => Math.min(120, window.innerWidth * 0.22),
                speed: 0.8, 
                color: '#D2691E', 
                img: 'images/burger_large.svg' 
            }
        ],
        MOVEMENT_PATTERNS: ['linear', 'sine', 'circle', 'spiral', 'figure8', 'zigzag'],
        FIELD_WIDTH: 0, // Будет вычисляться динамически
        FIELD_HEIGHT: 0,
        QUOTE_INTERVAL: 15000, // Больше интервал для мобильных
        BURGER_SPAWN_INTERVAL: 2500, // Меньше спавн для мобильных
        SOUND_ENABLED: true,
        TOUCH_ENABLED: true,
        MIN_FIELD_RATIO: 0.7 // Минимум 70% экрана
    };
    
    // Состояние игры
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
        ttsEnabled: true,
        touchActive: false
    };
    
    // DOM элементы
    const elements = {
        gameField: document.getElementById('game-field'),
        gameFieldContainer: document.querySelector('.game-field-container'),
        scoreElement: document.getElementById('score'),
        burgerCountElement: document.getElementById('burger-count'),
        startBtn: document.getElementById('start-btn'),
        pauseBtn: document.getElementById('pause-btn'),
        soundBtn: document.getElementById('sound-btn'),
        helpBtn: document.getElementById('help-btn'),
        instructions: document.getElementById('instructions'),
        quoteDisplay: document.getElementById('current-quote'),
        nextQuoteBtn: document.getElementById('next-quote-btn'),
        speakBtn: document.getElementById('speak-btn'),
        notification: document.getElementById('notification')
    };
    
    // Класс Гамбургер (оптимизированный для мобильных)
    class Burger {
        constructor(typeIndex, x, y, pattern = null) {
            const type = CONFIG.BURGER_TYPES[typeIndex];
            this.typeIndex = typeIndex;
            this.type = type;
            this.totalPieces = type.pieces;
            this.piecesLeft = type.pieces;
            this.size = typeof type.size === 'function' ? type.size() : type.size;
            this.speed = type.speed;
            this.color = type.color;
            
            // Сохраняем переданные координаты (если есть)
            this.x = x;
            this.y = y;
            this.customPosition = (x !== undefined && y !== undefined);
            
            // Выбор паттерна движения
            if (pattern && CONFIG.MOVEMENT_PATTERNS.includes(pattern)) {
                this.pattern = pattern;
            } else {
                this.pattern = CONFIG.MOVEMENT_PATTERNS[Math.floor(Math.random() * CONFIG.MOVEMENT_PATTERNS.length)];
            }
            this.time = 0;
            
            // Инициализация позиции и направления
            this.initPositionAndDirection();
            
            // Инициализация параметров паттерна
            this.patternParams = this.initPatternParams();
            
            // DOM элемент
            this.element = document.createElement('div');
            this.element.className = 'burger';
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            this.element.setAttribute('data-burger-id', Date.now() + Math.random());
            
            // Внутренний SVG
            this.img = document.createElement('img');
            this.img.src = type.img;
            this.img.className = 'burger-img';
            this.img.draggable = false;
            this.img.loading = 'lazy';
            this.element.appendChild(this.img);
            
            // Обработчики событий для мобильных
            this.element.addEventListener('click', (e) => this.handleInteraction(e));
            this.element.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
            this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            
            // Добавляем на поле
            elements.gameField.appendChild(this.element);
            
            // Обновляем визуальное состояние
            this.updateVisual();
        }
        
        initPositionAndDirection() {
            const margin = 30; // Меньше отступ для мобильных
            const fieldWidth = CONFIG.FIELD_WIDTH;
            const fieldHeight = CONFIG.FIELD_HEIGHT;
            
            // Если позиция задана извне, не меняем её
            const positionFixed = this.customPosition;
            
            switch(this.pattern) {
                case 'linear':
                    if (!positionFixed) {
                        // Линейное движение от края к краю
                        // Взвешенный выбор стороны: снизу чаще (40%), остальные по 20%
                        const rand = Math.random();
                        let side;
                        if (rand < 0.4) {
                            side = 3; // снизу
                        } else if (rand < 0.6) {
                            side = 0; // слева
                        } else if (rand < 0.8) {
                            side = 1; // справа
                        } else {
                            side = 2; // сверху
                        }
                        
                        switch(side) {
                            case 0: // слева
                                this.x = -this.size;
                                this.y = Math.random() * (fieldHeight - this.size);
                                this.dx = Math.random() * 2 * this.speed + 0.8;
                                this.dy = (Math.random() - 0.5) * 1.5 * this.speed;
                                break;
                            case 1: // справа
                                this.x = fieldWidth;
                                this.y = Math.random() * (fieldHeight - this.size);
                                this.dx = -(Math.random() * 2 * this.speed + 0.8);
                                this.dy = (Math.random() - 0.5) * 1.5 * this.speed;
                                break;
                            case 2: // сверху
                                this.x = Math.random() * (fieldWidth - this.size);
                                this.y = -this.size;
                                this.dx = (Math.random() - 0.5) * 1.5 * this.speed;
                                this.dy = Math.random() * 2 * this.speed + 0.8;
                                break;
                            case 3: // снизу (чаще всего - для движения снизу вверх)
                                this.x = Math.random() * (fieldWidth - this.size);
                                this.y = fieldHeight;
                                this.dx = (Math.random() - 0.5) * 1.5 * this.speed;
                                this.dy = -(Math.random() * 2 * this.speed + 0.8);
                                break;
                        }
                    } else {
                        // Позиция задана, устанавливаем направление
                        if (this.dx === undefined) this.dx = (Math.random() - 0.5) * 1.5 * this.speed;
                        if (this.dy === undefined) this.dy = (Math.random() - 0.5) * 1.5 * this.speed;
                    }
                    break;
                    
                case 'sine':
                case 'circle':
                case 'spiral':
                case 'figure8':
                    // Для паттернов с центром
                    if (!positionFixed) {
                        // Случайный центр в пределах поля
                        this.centerX = margin + Math.random() * (fieldWidth - 2 * margin);
                        this.centerY = margin + Math.random() * (fieldHeight - 2 * margin);
                        // Начальная позиция - около центра
                        this.x = this.centerX + (Math.random() - 0.5) * 80;
                        this.y = this.centerY + (Math.random() - 0.5) * 80;
                    } else {
                        // Позиция задана, используем её как центр
                        this.centerX = this.x;
                        this.centerY = this.y;
                    }
                    this.dx = 0;
                    this.dy = 0;
                    break;
                    
                case 'zigzag':
                    if (!positionFixed) {
                        // Зигзаг: горизонтальное движение с вертикальными колебаниями
                        if (Math.random() > 0.5) {
                            this.x = -this.size;
                            this.dx = Math.random() * 2 * this.speed + 0.8;
                        } else {
                            this.x = fieldWidth;
                            this.dx = -(Math.random() * 2 * this.speed + 0.8);
                        }
                        this.y = Math.random() * (fieldHeight - this.size);
                    } else {
                        if (this.dx === undefined) {
                            this.dx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2 * this.speed + 0.8);
                        }
                    }
                    this.dy = 0;
                    break;
                    
                default:
                    if (!positionFixed) {
                        this.x = Math.random() * (fieldWidth - this.size);
                        this.y = Math.random() * (fieldHeight - this.size);
                        this.dx = (Math.random() - 0.5) * 3 * this.speed;
                        this.dy = (Math.random() - 0.5) * 3 * this.speed;
                    } else {
                        if (this.dx === undefined) this.dx = (Math.random() - 0.5) * 1.5 * this.speed;
                        if (this.dy === undefined) this.dy = (Math.random() - 0.5) * 1.5 * this.speed;
                    }
            }
            
            // Ограничиваем скорость для мобильных
            const minSpeed = 0.3;
            const maxSpeed = 3.0;
            if (this.dx !== undefined) {
                this.dx = Math.max(-maxSpeed, Math.min(maxSpeed, this.dx));
                if (Math.abs(this.dx) < minSpeed) this.dx = minSpeed * (this.dx < 0 ? -1 : 1);
            }
            if (this.dy !== undefined) {
                this.dy = Math.max(-maxSpeed, Math.min(maxSpeed, this.dy));
                if (Math.abs(this.dy) < minSpeed) this.dy = minSpeed * (this.dy < 0 ? -1 : 1);
            }
        }
        
        initPatternParams() {
            const params = {};
            params.centerX = this.centerX !== undefined ? this.centerX : CONFIG.FIELD_WIDTH / 2;
            params.centerY = this.centerY !== undefined ? this.centerY : CONFIG.FIELD_HEIGHT / 2;
            
            // Уменьшенные амплитуды для мобильных экранов
            switch(this.pattern) {
                case 'linear':
                    params.amplitude = 0;
                    break;
                case 'sine':
                    params.amplitudeX = Math.random() * 80 + 40;
                    params.amplitudeY = Math.random() * 80 + 40;
                    params.frequencyX = Math.random() * 0.008 + 0.004;
                    params.frequencyY = Math.random() * 0.008 + 0.004;
                    params.phaseX = Math.random() * Math.PI * 2;
                    params.phaseY = Math.random() * Math.PI * 2;
                    break;
                case 'circle':
                    params.radius = Math.random() * 80 + 40;
                    params.angularSpeed = Math.random() * 0.015 + 0.008;
                    params.angle = Math.random() * Math.PI * 2;
                    break;
                case 'spiral':
                    params.radius = Math.random() * 40 + 20;
                    params.angularSpeed = Math.random() * 0.02 + 0.01;
                    params.spiralSpeed = Math.random() * 0.3 + 0.15;
                    params.angle = Math.random() * Math.PI * 2;
                    break;
                case 'figure8':
                    params.amplitudeX = Math.random() * 60 + 30;
                    params.amplitudeY = Math.random() * 30 + 15;
                    params.frequencyX = Math.random() * 0.012 + 0.004;
                    params.frequencyY = params.frequencyX * 2;
                    params.phase = Math.random() * Math.PI * 2;
                    break;
                case 'zigzag':
                    params.amplitude = Math.random() * 80 + 40;
                    params.frequency = Math.random() * 0.015 + 0.005;
                    params.phase = Math.random() * Math.PI * 2;
                    break;
                default:
                    params.amplitude = 0;
            }
            return params;
        }
        
        // Обработка взаимодействия (клик/тап)
        handleInteraction(e) {
            e.preventDefault();
            e.stopPropagation();
            this.bite();
        }
        
        // Обработка касания (для мобильных)
        handleTouch(e) {
            if (CONFIG.TOUCH_ENABLED) {
                e.preventDefault();
                this.element.style.transform = 'translate(-50%, -50%) scale(1.1)';
                state.touchActive = true;
            }
        }
        
        handleTouchEnd(e) {
            if (CONFIG.TOUCH_ENABLED && state.touchActive) {
                e.preventDefault();
                this.element.style.transform = 'translate(-50%, -50%) scale(1)';
                this.bite();
                state.touchActive = false;
            }
        }
        
        // Откусить кусочек
        bite() {
            if (!state.gameRunning || state.gamePaused || this.piecesLeft <= 0) return;
            
            this.piecesLeft--;
            state.score++;
            updateScore();
            
            // Визуальный эффект для мобильных
            this.element.classList.add('pulse');
            setTimeout(() => this.element.classList.remove('pulse'), 300);
            
            // Обновляем визуальное состояние
            this.updateVisual();
            
            // Проигрываем звук откусывания
            playBiteSound();
            
            // Случайная реплика майора Пейна при откусывании (25% шанс)
            if (Math.random() < 0.25) {
                showRandomQuote();
            }
            
            // Если гамбургер съеден
            if (this.piecesLeft <= 0) {
                this.eat();
            }
            
            // Уведомление (только если много очков)
            if (state.score % 10 === 0) {
                showNotification(`+1 очко! Всего: ${state.score}`, 1500);
            }
        }
        
        // Съесть гамбургер полностью
        eat() {
            state.burgersEaten++;
            updateBurgerCount();
            
            this.element.classList.add('eaten');
            this.element.style.opacity = '0.5';
            this.element.style.cursor = 'default';
            this.element.style.pointerEvents = 'none';
            
            // Удаляем через анимацию
            setTimeout(() => {
                if (this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
                
                // Удаляем из массива
                const index = state.burgers.indexOf(this);
                if (index > -1) {
                    state.burgers.splice(index, 1);
                }
                
                // Особенная реплика при съедании
                if (Math.random() < 0.5) {
                    showQuote("Гамбургер уничтожен! Отличная работа, солдат!");
                }
            }, 500);
        }
        
        // Обновить визуальное состояние
        updateVisual() {
            const piecesEaten = this.totalPieces - this.piecesLeft;
            const opacity = 1 - (piecesEaten / this.totalPieces) * 0.7;
            this.img.style.opacity = opacity;
            
            if (piecesEaten > 0) {
                const clipPercentage = (piecesEaten / this.totalPieces) * 50;
                this.img.style.clipPath = `inset(0 ${clipPercentage}% 0 0)`;
            } else {
                this.img.style.clipPath = '';
            }
        }
        
        // Обновить позицию
        update(deltaTime) {
            if (state.gamePaused) return;
            
            // Увеличиваем время для анимаций
            this.time += deltaTime * 0.001;
            
            // Вычисляем новую позицию
            this.calculatePosition(deltaTime);
            
            // Обработка границ
            this.handleBoundaries();
            
            // Применяем позицию
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            
            // Вращение
            this.applyRotation();
        }
        
        calculatePosition(deltaTime) {
            const params = this.patternParams;
            const centerX = params.centerX;
            const centerY = params.centerY;
            
            switch(this.pattern) {
                case 'linear':
                    this.x += this.dx * deltaTime * 0.1;
                    this.y += this.dy * deltaTime * 0.1;
                    break;
                    
                case 'sine':
                    this.x = centerX + Math.sin(this.time * params.frequencyX + params.phaseX) * params.amplitudeX;
                    this.y = centerY + Math.sin(this.time * params.frequencyY + params.phaseY) * params.amplitudeY;
                    break;
                    
                case 'circle':
                    params.angle += params.angularSpeed * deltaTime * 0.1;
                    this.x = centerX + Math.cos(params.angle) * params.radius;
                    this.y = centerY + Math.sin(params.angle) * params.radius;
                    break;
                    
                case 'spiral':
                    params.angle += params.angularSpeed * deltaTime * 0.1;
                    params.radius += params.spiralSpeed * deltaTime * 0.1;
                    if (params.radius > 200) params.radius = 40; // Сброс спирали
                    this.x = centerX + Math.cos(params.angle) * params.radius;
                    this.y = centerY + Math.sin(params.angle) * params.radius;
                    break;
                    
                case 'figure8':
                    const t = this.time * params.frequencyX + params.phase;
                    this.x = centerX + Math.sin(t) * params.amplitudeX;
                    this.y = centerY + Math.sin(2 * t) * params.amplitudeY;
                    break;
                    
                case 'zigzag':
                    this.x += this.dx * deltaTime * 0.1;
                    this.y = centerY + Math.sin(this.time * params.frequency + params.phase) * params.amplitude;
                    break;
                    
                default:
                    this.x += this.dx * deltaTime * 0.1;
                    this.y += this.dy * deltaTime * 0.1;
            }
        }
        
        handleBoundaries() {
            // Wrap-around для всех паттернов
            if (this.x < -this.size) this.x = CONFIG.FIELD_WIDTH;
            if (this.x > CONFIG.FIELD_WIDTH) this.x = -this.size;
            if (this.y < -this.size) this.y = CONFIG.FIELD_HEIGHT;
            if (this.y > CONFIG.FIELD_HEIGHT) this.y = -this.size;
        }
        
        applyRotation() {
            let rotation = 0;
            
            switch(this.pattern) {
                case 'circle':
                case 'spiral':
                    rotation = this.patternParams.angle * (180 / Math.PI);
                    break;
                    
                case 'figure8':
                    rotation = Math.sin(this.time * 0.005) * 30;
                    break;
                    
                case 'zigzag':
                    rotation = Math.sin(this.time * 0.01) * 10;
                    break;
                    
                default:
                    rotation = Math.sin(this.time * 0.001 + this.x * 0.01) * 1.5;
            }
            
            this.element.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        }
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ИГРЫ ==========
    
    // Обновить размеры игрового поля
    function updateFieldSize() {
        if (!elements.gameFieldContainer) return;
        
        const containerRect = elements.gameFieldContainer.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Минимально 70% экрана
        const minWidth = windowWidth * CONFIG.MIN_FIELD_RATIO;
        const minHeight = windowHeight * CONFIG.MIN_FIELD_RATIO;
        
        // Используем реальные размеры контейнера или минимум
        CONFIG.FIELD_WIDTH = Math.max(containerRect.width, minWidth);
        CONFIG.FIELD_HEIGHT = Math.max(containerRect.height, minHeight);
        
        // Устанавливаем размеры игрового поля
        elements.gameField.style.width = `${CONFIG.FIELD_WIDTH}px`;
        elements.gameField.style.height = `${CONFIG.FIELD_HEIGHT}px`;
        
        console.log(`Размер поля: ${CONFIG.FIELD_WIDTH}x${CONFIG.FIELD_HEIGHT}, окно: ${windowWidth}x${windowHeight}`);
    }
    
    // Загрузить настройки
    function loadSettings() {
        const savedScore = localStorage.getItem('gameburger_mobile_score');
        const savedBurgers = localStorage.getItem('gameburger_mobile_burgers');
        const savedSound = localStorage.getItem('gameburger_mobile_sound');
        
        if (savedScore) state.score = parseInt(savedScore, 10);
        if (savedBurgers) state.burgersEaten = parseInt(savedBurgers, 10);
        if (savedSound) state.soundEnabled = savedSound === 'true';
        
        updateScore();
        updateBurgerCount();
        updateSoundButton();
    }
    
    // Сохранить настройки
    function saveSettings() {
        localStorage.setItem('gameburger_mobile_score', state.score.toString());
        localStorage.setItem('gameburger_mobile_burgers', state.burgersEaten.toString());
        localStorage.setItem('gameburger_mobile_sound', state.soundEnabled.toString());
    }
    
    // Инициализировать TTS
    function initTTS() {
        if (!isTTSSupported()) {
            console.warn('TTS не поддерживается');
            state.ttsEnabled = false;
            if (elements.speakBtn) {
                elements.speakBtn.disabled = true;
                elements.speakBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Нет TTS';
            }
        }
    }
    
    // Запустить игру
    function startGame() {
        if (state.gameRunning) return;
        
        state.gameRunning = true;
        state.gamePaused = false;
        elements.startBtn.disabled = true;
        elements.startBtn.innerHTML = '<i class="fas fa-play"></i> ИДЁТ';
        elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> ПАУЗА';
        elements.instructions.style.display = 'none';
        
        // Создаём начальные гамбургеры
        spawnInitialBurgers();
        
        // Мотивационная цитата
        showQuote("Игра началась! Уничтожай гамбургеры, солдат!");
        
        // Вибрация (если поддерживается)
        if ('vibrate' in navigator && state.soundEnabled) {
            navigator.vibrate(100);
        }
    }
    
    // Создать начальные гамбургеры
    function spawnInitialBurgers() {
        const count = CONFIG.MIN_BURGERS + Math.floor(Math.random() * (CONFIG.MAX_BURGERS - CONFIG.MIN_BURGERS));
        
        for (let i = 0; i < count; i++) {
            const typeIndex = Math.floor(Math.random() * CONFIG.BURGER_TYPES.length);
            spawnBurger(typeIndex);
        }
        
        state.lastSpawnTime = Date.now();
    }
    
    // Создать гамбургер
    function spawnBurger(typeIndex = null, pattern = null) {
        if (!state.gameRunning) return;
        
        if (state.burgers.length >= CONFIG.MAX_BURGERS) {
            return;
        }
        
        const index = typeIndex !== null ? typeIndex : Math.floor(Math.random() * CONFIG.BURGER_TYPES.length);
        const burger = new Burger(index, undefined, undefined, pattern);
        state.burgers.push(burger);
    }
    
    // Переключить паузу
    function togglePause() {
        if (!state.gameRunning) return;
        
        state.gamePaused = !state.gamePaused;
        
        if (state.gamePaused) {
            elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i> ПРОДОЛЖИТЬ';
            showQuote("Игра на паузе. Но гамбургеры ждать не будут!");
        } else {
            elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> ПАУЗА';
            showQuote("Продолжаем уничтожение!");
        }
    }
    
    // Переключить звук
    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        updateSoundButton();
        saveSettings();
        
        showNotification(`Звук ${state.soundEnabled ? 'включён' : 'выключен'}`, 2000);
    }
    
    // Обновить кнопку звука
    function updateSoundButton() {
        if (!elements.soundBtn) return;
        
        if (state.soundEnabled) {
            elements.soundBtn.innerHTML = '<i class="fas fa-volume-up"></i> ЗВУК ВКЛ';
            elements.soundBtn.style.background = 'linear-gradient(135deg, #4A00E0, #8E2DE2)';
        } else {
            elements.soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i> ЗВУК ВЫКЛ';
            elements.soundBtn.style.background = 'linear-gradient(135deg, #666, #999)';
        }
    }
    
    // Показать справку
    function showHelp() {
        const isVisible = elements.instructions.style.display !== 'none';
        elements.instructions.style.display = isVisible ? 'none' : 'flex';
        
        if (!isVisible) {
            showQuote("Запомни инструкцию, солдат!");
        }
    }
    
    // Обновить счёт
    function updateScore() {
        if (!elements.scoreElement) return;
        
        elements.scoreElement.textContent = state.score;
        elements.scoreElement.classList.add('pulse');
        setTimeout(() => elements.scoreElement.classList.remove('pulse'), 300);
        
        // Автосохранение
        if (state.score % 50 === 0) {
            saveSettings();
        }
    }
    
    // Обновить счётчик съеденных гамбургеров
    function updateBurgerCount() {
        if (!elements.burgerCountElement) return;
        
        elements.burgerCountElement.textContent = state.burgersEaten;
        elements.burgerCountElement.classList.add('bounce');
        setTimeout(() => elements.burgerCountElement.classList.remove('bounce'), 300);
    }
    
    // Показать случайную цитату
    function showRandomQuote() {
        const quote = getRandomQuote();
        showQuote(quote);
    }
    
    // Показать цитату
    function showQuote(text) {
        if (!elements.quoteDisplay) return;
        
        elements.quoteDisplay.textContent = text;
        elements.quoteDisplay.classList.add('pulse');
        setTimeout(() => elements.quoteDisplay.classList.remove('pulse'), 500);
        
        // Авто-озвучивание
        if (state.ttsEnabled && state.soundEnabled && Math.random() < 0.4) {
            setTimeout(() => speakQuote(text, 1.0, 1.0), 800);
        }
    }
    
    // Озвучить текущую цитату
    function speakCurrentQuote() {
        if (!state.ttsEnabled || !state.soundEnabled) {
            showNotification('TTS недоступен или звук выключен', 2000);
            return;
        }
        
        const text = elements.quoteDisplay.textContent;
        speakQuote(text, 1.0, 1.0);
        showNotification('Цитата озвучена', 1500);
    }
    
    // Проиграть звук откусывания (оптимизированный для мобильных)
    function playBiteSound() {
        if (!state.soundEnabled) return;
        
        try {
            // Используем Web Audio API если доступно
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const audioContext = new AudioContext();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.08);
                
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.08);
                
                // Закрываем контекст после использования
                setTimeout(() => {
                    if (audioContext.state !== 'closed') {
                        audioContext.close();
                    }
                }, 100);
            }
        } catch (e) {
            // Web Audio не поддерживается, игнорируем
        }
    }
    
    // Показать уведомление
    function showNotification(message, duration = 3000) {
        if (!elements.notification) return;
        
        elements.notification.textContent = message;
        elements.notification.classList.add('show');
        
        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, duration);
    }
    
    // Игровой цикл
    function gameLoop(timestamp) {
        const deltaTime = timestamp - state.lastTime || 0;
        state.lastTime = timestamp;
        
        // Обновляем гамбургеры
        if (!state.gamePaused && state.gameRunning) {
            // Обновляем каждый гамбургер
            state.burgers.forEach(burger => burger.update(deltaTime));
            
            // Спавн новых гамбургеров
            if (Date.now() - state.lastSpawnTime > CONFIG.BURGER_SPAWN_INTERVAL) {
                if (state.burgers.length < CONFIG.MAX_BURGERS) {
                    spawnBurger();
                }
                state.lastSpawnTime = Date.now();
            }
            
            // Смена цитат со временем
            if (Date.now() - state.lastQuoteTime > CONFIG.QUOTE_INTERVAL) {
                if (Math.random() < 0.6) {
                    showRandomQuote();
                }
                state.lastQuoteTime = Date.now();
            }
        }
        
        // Продолжаем цикл
        requestAnimationFrame(gameLoop);
    }
    
    // Очистка игры
    function cleanup() {
        // Удаляем все гамбургеры
        state.burgers.forEach(burger => {
            if (burger.element.parentNode) {
                burger.element.parentNode.removeChild(burger.element);
            }
        });
        
        state.burgers = [];
        state.gameRunning = false;
        state.gamePaused = false;
        
        if (elements.startBtn) {
            elements.startBtn.disabled = false;
            elements.startBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ';
        }
        
        if (elements.instructions) {
            elements.instructions.style.display = 'flex';
        }
        
        showQuote("Игра остановлена. Готов к новому штурму?");
    }
    
    // Обработка изменения ориентации и размера
    function handleResize() {
        updateFieldSize();
        
        // Обновляем размеры существующих гамбургеров
        state.burgers.forEach(burger => {
            if (burger.element && burger.type) {
                const newSize = typeof burger.type.size === 'function' ? burger.type.size() : burger.type.size;
                burger.size = newSize;
                burger.element.style.width = `${newSize}px`;
                burger.element.style.height = `${newSize}px`;
            }
        });
        
        // Пересчитываем позиции для паттернов с центром
        state.burgers.forEach(burger => {
            if (burger.patternParams && burger.patternParams.centerX) {
                burger.patternParams.centerX = CONFIG.FIELD_WIDTH / 2;
                burger.patternParams.centerY = CONFIG.FIELD_HEIGHT / 2;
            }
        });
    }
    
    // Предотвращение масштабирования при дабл-тапе
    function preventDoubleTapZoom(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }
    
    // Инициализация игры
    function init() {
        console.log('Инициализация мобильной версии...');
        
        // Устанавливаем размеры игрового поля
        updateFieldSize();
        
        // Обработчики событий
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        document.addEventListener('touchstart', preventDoubleTapZoom, { passive: false });
        
        // Загружаем сохранённые настройки
        loadSettings();
        
        // Инициализируем TTS
        initTTS();
        
        // Настройка кнопок
        if (elements.startBtn) elements.startBtn.addEventListener('click', startGame);
        if (elements.pauseBtn) elements.pauseBtn.addEventListener('click', togglePause);
        if (elements.soundBtn) elements.soundBtn.addEventListener('click', toggleSound);
        if (elements.helpBtn) elements.helpBtn.addEventListener('click', showHelp);
        if (elements.nextQuoteBtn) elements.nextQuoteBtn.addEventListener('click', showRandomQuote);
        if (elements.speakBtn) elements.speakBtn.addEventListener('click', speakCurrentQuote);
        
        // Оптимизация для мобильных: предзагрузка звуков
        if (state.soundEnabled) {
            setTimeout(() => {
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (AudioContext) {
                        new AudioContext();
                    }
                } catch (e) {
                    // Игнорируем ошибки
                }
            }, 1000);
        }
        
        // Показываем первую цитату
        showRandomQuote();
        
        // Запускаем игровой цикл
        requestAnimationFrame(gameLoop);
        
        console.log('Мобильная версия готова!');
    }
    
    // Обработка закрытия страницы
    window.addEventListener('beforeunload', () => {
        if (state.gameRunning) {
            saveSettings();
        }
    });
    
    // Обработка видимости страницы (пауза при сворачивании)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.gameRunning && !state.gamePaused) {
            state.gamePaused = true;
            if (elements.pauseBtn) {
                elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i> ПРОДОЛЖИТЬ';
            }
            showQuote("Игра приостановлена (вкладка неактивна)");
        }
    });
    
    // Запуск инициализации
    init();
    
    // Глобальные функции для отладки
    window.debugGame = {
        addBurger: (type = 0, pattern = null) => spawnBurger(type, pattern),
        addBurgerWithPattern: (type = 0, pattern = 'linear') => spawnBurger(type, pattern),
        removeAllBurgers: () => {
            state.burgers.forEach(b => {
                if (b.element.parentNode) b.element.parentNode.removeChild(b.element);
            });
            state.burgers = [];
        },
        addScore: (points = 100) => {
            state.score += points;
            updateScore();
        },
        getState: () => ({ ...state, burgersCount: state.burgers.length }),
        getConfig: () => ({ ...CONFIG }),
        getPatterns: () => CONFIG.MOVEMENT_PATTERNS,
        cleanup: cleanup,
        updateFieldSize: updateFieldSize
    };
    
    console.log('GameBurger2d Mobile готов. Используйте debugGame в консоли для отладки.');
});