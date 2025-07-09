// Log to confirm app.js is loaded
console.log('app.js loaded');

// Global state variables
let words = []; // Array to store JSON data
let wotdIndex = 0; // Index for Word of the Day
let flashcardIndex = 0; // Current flashcard index
let quizIndex = 0; // Current quiz question index
let quizCorrectAnswer = ''; // Correct answer for multiple-choice quiz
let flashcardFlipped = false; // Tracks if flashcard is flipped
let quizType = 'multiple-choice'; // Current quiz type
let matchingWords = []; // Words for matching quiz
let selectedNgas = null; // Selected Ngas word in matching quiz
let selectedEnglish = null; // Selected English word in matching quiz
let matchedPairs = []; // Tracks matched pairs in matching quiz

// Toggles the sidebar visibility
function toggleSidebar() {
    try {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('backdrop');
        if (!sidebar || !backdrop) throw new Error('Sidebar or backdrop element not found');
        sidebar.classList.toggle('active');
        backdrop.classList.toggle('active');
        console.log('Sidebar toggled:', sidebar.classList.contains('active') ? 'Open' : 'Closed');
    } catch (error) {
        console.error('Sidebar toggle error:', error);
    }
}

// Loads JSON data with retry
async function loadData(retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Fetching /data.json (attempt ${attempt}/${retries})...`);
            const response = await fetch('/data.json', { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}, URL: ${response.url}`);
            words = await response.json();
            if (!Array.isArray(words) || words.length === 0) throw new Error('Invalid or empty JSON data');
            console.log('Data loaded:', words.length, 'words');
            initApp();
            return;
        } catch (error) {
            console.error(`Load data error (attempt ${attempt}):`, error);
            if (attempt === retries) {
                alert('Failed to load vocabulary data after multiple attempts. Please try again later.');
            } else {
                await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retry
            }
        }
    }
}

// Initializes the app
function initApp() {
    console.log('Initializing app...');
    // Word of the Day
    wotdIndex = Math.floor(Math.random() * words.length);
    const wotd = words[wotdIndex];
    document.getElementById('wotd-ngas').textContent = wotd.Ngas_Word || '';
    document.getElementById('wotd-english').textContent = wotd.English || '';
    document.getElementById('wotd-meaning').textContent = wotd.Meaning || '';
    document.getElementById('wotd-example').textContent = wotd.Example || '';
    document.getElementById('wotd-audio').src = wotd.Audio || '';
    document.getElementById('wotd-image').src = wotd.Image || '';
    document.getElementById('wotd-video').src = wotd.Video || '';

    // Populate category filter
    const categories = [...new Set(words.map(w => w.Category).filter(c => c))];
    const categoryFilter = document.getElementById('category-filter');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    // Display word list
    displayWords(words);
}

// Shows a specific screen
function showScreen(screenId) {
    try {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        const screen = document.getElementById(screenId);
        if (!screen) throw new Error(`Screen ${screenId} not found`);
        screen.classList.remove('hidden');
        if (screenId === 'flashcards') startFlashcards();
        if (screenId === 'quiz') startQuiz(quizType);
        console.log(`Showing screen: ${screenId}`);
    } catch (error) {
        console.error('Show screen error:', error);
    }
}

// Displays vocabulary list
function displayWords(wordList) {
    const wordListDiv = document.getElementById('word-list');
    wordListDiv.innerHTML = '';
    wordList.forEach((word, index) => {
        const card = document.createElement('div');
        card.className = 'word-card';
        card.innerHTML = `
            <h3>${word.Ngas_Word || ''}</h3>
            <p>${word.English || ''}</p>
            <audio controls src="${word.Audio || ''}"></audio>
        `;
        card.onclick = () => showWordDetail(index);
        wordListDiv.appendChild(card);
    });
}

// Filters words
function filterWords() {
    const search = document.getElementById('search').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const filtered = words.filter(word => 
        (word.Ngas_Word?.toLowerCase().includes(search) || 
         word.English?.toLowerCase().includes(search) || 
         word.Meaning?.toLowerCase().includes(search)) &&
        (!category || word.Category === category)
    );
    displayWords(filtered);
}

// Shows word details
function showWordDetail(index) {
    const word = words[index];
    document.getElementById('detail-ngas').textContent = word.Ngas_Word || '';
    document.getElementById('detail-english').textContent = word.English || '';
    document.getElementById('detail-pos').textContent = word.Part_of_Speech || '';
    document.getElementById('detail-meaning').textContent = word.Meaning || '';
    document.getElementById('detail-example').textContent = word.Example || '';
    document.getElementById('detail-usage').textContent = word.Usage || '';
    document.getElementById('detail-notes').textContent = word.Notes || '';
    document.getElementById('detail-plural').textContent = word.Plural || '';
    document.getElementById('detail-synonyms').textContent = word.Synonyms || '';
    document.getElementById('detail-opposite').textContent = word.Opposite || '';
    document.getElementById('detail-dialect').textContent = word.Dialect || '';
    document.getElementById('detail-tone').textContent = word.Tone || '';
    document.getElementById('detail-audio').src = word.Audio || '';
    document.getElementById('detail-image').src = word.Image || '';
    document.getElementById('detail-video').src = word.Video || '';
    showScreen('word-detail');
}

// Starts flashcards
function startFlashcards() {
    flashcardIndex = 0;
    flashcardFlipped = false;
    showFlashcard();
}

// Displays current flashcard
function showFlashcard() {
    const word = words[flashcardIndex];
    document.getElementById('flashcard-word').textContent = word.Ngas_Word || '';
    document.getElementById('flashcard-back').textContent = `${word.English || ''} - ${word.Meaning || ''}`;
    document.getElementById('flashcard-audio').src = word.Audio || '';
    document.getElementById('flashcard-back').classList.add('hidden');
    document.getElementById('flashcard-audio').classList.add('hidden');
    flashcardFlipped = false;
}

// Flips flashcard
function flipFlashcard() {
    flashcardFlipped = !flashcardFlipped;
    document.getElementById('flashcard-back').classList.toggle('hidden', !flashcardFlipped);
    document.getElementById('flashcard-audio').classList.toggle('hidden', !flashcardFlipped);
}

// Next flashcard
function nextFlashcard() {
    flashcardIndex = (flashcardIndex + 1) % words.length;
    showFlashcard();
}

// Mark flashcard as known
function markKnown() {
    nextFlashcard();
}

// Mark flashcard as unknown
function markUnknown() {
    nextFlashcard();
}

// Starts quiz
function startQuiz(type) {
    quizType = type;
    quizIndex = 0;
    matchedPairs = [];
    selectedNgas = null;
    selectedEnglish = null;
    document.getElementById('multiple-choice-quiz').classList.toggle('hidden', type !== 'multiple-choice');
    document.getElementById('matching-quiz').classList.toggle('hidden', type !== 'matching');
    if (type === 'multiple-choice') {
        showQuizQuestion();
    } else {
        startMatchingQuiz();
    }
}

// Displays multiple-choice quiz question
function showQuizQuestion() {
    const word = words[quizIndex];
    quizCorrectAnswer = word.English;
    document.getElementById('quiz-question').textContent = `What is "${word.Ngas_Word || ''}" in English?`;
    const options = [word.English];
    while (options.length < 4) {
        const randomWord = words[Math.floor(Math.random() * words.length)].English;
        if (!options.includes(randomWord)) options.push(randomWord);
    }
    shuffleArray(options);
    const optionsDiv = document.getElementById('quiz-options');
    optionsDiv.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt || '';
        btn.onclick = () => selectAnswer(opt);
        optionsDiv.appendChild(btn);
    });
    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('quiz-submit').classList.remove('hidden');
    document.getElementById('quiz-submit').textContent = 'Submit';
    document.getElementById('quiz-submit').onclick = submitAnswer;
}

// Handles multiple-choice answer
function selectAnswer(answer) {
    const buttons = document.getElementById('quiz-options').getElementsByTagName('button');
    for (let btn of buttons) btn.disabled = true;
    document.getElementById('quiz-feedback').textContent = 
        answer === quizCorrectAnswer ? 'Correct!' : `Wrong! Correct answer: ${quizCorrectAnswer}`;
    document.getElementById('quiz-feedback').classList.remove('hidden');
    document.getElementById('quiz-submit').textContent = 'Next';
    document.getElementById('quiz-submit').onclick = () => {
        quizIndex = (quizIndex + 1) % words.length;
        showQuizQuestion();
    };
}

// Starts word matching quiz
function startMatchingQuiz() {
    matchingWords = getRandomWords(5);
    matchedPairs = [];
    selectedNgas = null;
    selectedEnglish = null;
    displayMatchingQuiz();
    document.getElementById('matching-feedback').classList.add('hidden');
}

// Selects random words for matching quiz
function getRandomWords(count) {
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, words.length));
}

// Displays word matching quiz
function displayMatchingQuiz() {
    const ngasDiv = document.getElementById('ngas-words');
    const englishDiv = document.getElementById('english-words');
    ngasDiv.innerHTML = '';
    englishDiv.innerHTML = '';

    const shuffledEnglish = [...matchingWords].sort(() => 0.5 - Math.random());
    
    matchingWords.forEach((word, index) => {
        const ngasWord = document.createElement('div');
        ngasWord.className = 'matching-word';
        ngasWord.textContent = word.Ngas_Word || '';
        ngasWord.dataset.index = index;
        ngasWord.onclick = () => selectMatchingWord(ngasWord, word, 'ngas');
        ngasDiv.appendChild(ngasWord);
    });

    shuffledEnglish.forEach((word, index) => {
        const englishWord = document.createElement('div');
        englishWord.className = 'matching-word';
        englishWord.textContent = word.English || '';
        englishWord.dataset.index = index;
        englishWord.onclick = () => selectMatchingWord(englishWord, word, 'english');
        englishDiv.appendChild(englishWord);
    });
}

// Handles word selection in matching quiz
function selectMatchingWord(element, word, type) {
    if (type === 'ngas') {
        selectedNgas = { element, word, index: element.dataset.index };
        element.classList.add('selected');
        if (word.Audio) {
            const audio = new Audio(word.Audio);
            audio.play().catch(err => console.error('Audio error:', err));
        }
    } else {
        selectedEnglish = { element, word, index: element.dataset.index };
        element.classList.add('selected');
    }

    document.querySelectorAll('.matching-word').forEach(el => {
        if (el !== selectedNgas?.element && el !== selectedEnglish?.element) {
            el.classList.remove('selected');
        }
    });

    if (selectedNgas && selectedEnglish) {
        checkMatch();
    }
}

// Checks matching quiz pairs
function checkMatch() {
    const feedback = document.getElementById('matching-feedback');
    const isCorrect = selectedNgas.word.English === selectedEnglish.word.English;
    
    selectedNgas.element.classList.remove('selected');
    selectedEnglish.element.classList.remove('selected');
    selectedNgas.element.classList.add(isCorrect ? 'correct' : 'incorrect');
    selectedEnglish.element.classList.add(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
        matchedPairs.push(selectedNgas.index);
        selectedNgas.element.style.pointerEvents = 'none';
        selectedEnglish.element.style.pointerEvents = 'none';
    }

    feedback.textContent = isCorrect ? 'Correct match!' : 'Incorrect match, try again!';
    feedback.classList.remove('hidden');

    selectedNgas = null;
    selectedEnglish = null;

    if (matchedPairs.length === Math.min(5, words.length)) {
        feedback.textContent = 'All matches correct! Loading new set...';
        setTimeout(startMatchingQuiz, 2000);
    } else if (!isCorrect) {
        setTimeout(() => {
            document.querySelectorAll('.matching-word').forEach(el => {
                el.classList.remove('incorrect');
            });
            feedback.classList.add('hidden');
        }, 1000);
    }
}

// Shuffles array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize app
loadData();
