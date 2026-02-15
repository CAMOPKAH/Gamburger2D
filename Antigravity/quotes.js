// Реплики майора Пейна для озвучки TTS
const majorPayneQuotes = [
    "Сегодня отличный день для уничтожения гамбургера!",
    "Гамбургер — твой враг, солдат! Уничтожь его!",
    "Я не сплю, пока гамбургеры не будут съедены!",
    "Откусывай, как будто от этого зависит твоя жизнь!",
    "Гамбургеры не едят себя сами, солдат!",
    "Каждый кусочек — шаг к победе над врагом!",
    "Ты рождён, чтобы жевать гамбургеры!",
    "Не останавливайся, пока не съешь всё до последнего кусочка!",
    "Гамбургер бессилен перед твоим железным аппетитом!",
    "Это не еда, это боевая миссия по уничтожению!",
    "Жуй быстрее, солдат! Время работает против нас!",
    "Твои зубы — оружие массового поражения гамбургеров!",
    "Ни один гамбургер не уйдёт целым с этого поля боя!",
    "Ты — боевая машина по поеданию гамбургеров!",
    "Съешь это, прежде чем это съест твою волю к победе!",
    "Гамбургеры трепещут от одного твоего клика!",
    "Покажи им, кто здесь главный едок на этом полигоне!",
    "Ты — гроза всех гамбургеров, ураган аппетита!",
    "За каждый откусанный кусочек — звёздочка на погоны!",
    "Уничтожай гамбургеры без пощады и без остановки!",
    "Гамбургер — это не пища, это цель для ликвидации!",
    "Хруст — это музыка победы над гамбургером!",
    "Твоя мышь — это штурмовая винтовка, а клик — выстрел!",
    "Не дай гамбургеру уйти целым — это позор для дивизии!",
    "Жуй так, чтобы гамбургеры молили о пощаде!",
    "Твой желудок — это утилизатор вражеских гамбургеров!",
    "Каждый съеденный гамбургер — удар по вражеской логистике!",
    "Гамбургеры должны бояться твоего курсора как огня!",
    "Это не игра в еду — это спецоперация по зачистке!",
    "Откуси так, чтобы эхо разнеслось по всем фронтам!"
];

// Функция для получения случайной реплики
function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * majorPayneQuotes.length);
    return majorPayneQuotes[randomIndex];
}

// Функция для получения нескольких случайных реплик (без повторений)
function getRandomQuotes(count) {
    if (count > majorPayneQuotes.length) {
        count = majorPayneQuotes.length;
    }
    
    const shuffled = [...majorPayneQuotes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Функция озвучки через Web Speech API
function speakQuote(text, rate = 1.0, pitch = 1.0) {
    if ('speechSynthesis' in window) {
        // Отменяем текущее озвучивание
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = 1.0;
        
        // Попробуем найти мужской голос
        const voices = speechSynthesis.getVoices();
        const russianVoice = voices.find(voice => 
            voice.lang.startsWith('ru') && voice.name.includes('Male')
        );
        
        if (russianVoice) {
            utterance.voice = russianVoice;
        }
        
        speechSynthesis.speak(utterance);
        return true;
    }
    return false;
}

// Функция для проверки поддержки TTS
function isTTSSupported() {
    return 'speechSynthesis' in window;
}

// Экспорт для использования в game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        majorPayneQuotes,
        getRandomQuote,
        getRandomQuotes,
        speakQuote,
        isTTSSupported
    };
}