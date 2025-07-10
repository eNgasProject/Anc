// Learn Ngas - Main Application Script
// Global state variables
const appState = {
  words: [],               // Array to store vocabulary data
  wotdIndex: 0,            // Index for Word of the Day
  flashcardIndex: 0,       // Current flashcard index
  quizIndex: 0,            // Current quiz question index
  quizCorrectAnswer: '',   // Correct answer for current quiz question
  flashcardFlipped: false, // Tracks flashcard flip state
  quizType: 'multiple-choice', // Current quiz type
  matchingWords: [],       // Words for matching quiz
  selectedNgas: null,      // Selected Ngas word in matching quiz
  selectedEnglish: null,   // Selected English word in matching quiz
  matchedPairs: []         // Correctly matched pairs in matching quiz
};

// DOM Elements
const domElements = {
  sidebar: null,
  backdrop: null,
  // We'll initialize these in initDOMElements()
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  loadData()
    .then(() => {
      console.log('Application initialized successfully');
    })
    .catch(error => {
      console.error('Failed to initialize application:', error);
      showError('Failed to load application. Please refresh the page.');
    });
});

// Initialize DOM element references
function initDOMElements() {
  domElements.sidebar = document.getElementById('sidebar');
  domElements.backdrop = document.getElementById('backdrop');
  // Add more element references as needed
}

// Load vocabulary data from JSON file
async function loadData() {
  try {
    const response = await fetch('https://engasproject.github.io/Anc/data.json');
    if (!response.ok) throw new Error("Failed to fetch data");
        words = await response.json();
        console.log("Data loaded successfully.");
    } catch (error) {
        console.error("Error loading data:", error);
    }
}
/*async function loadData() {
  try {
    const response = await fetch("https://engasproject.github.io/Anc/data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    appState.words = await response.json();
    initApp();
  } catch (error) {
    console.error('Error loading vocabulary data:', error);
    throw error; // Re-throw to be caught by the caller
  }
}*/

// Initialize application after data is loaded
function initApp() {
  if (!appState.words || appState.words.length === 0) {
    throw new Error('No vocabulary data loaded');
  }

  // Initialize Word of the Day
  initWordOfTheDay();
  
  // Initialize category filter
  initCategoryFilter();
  
  // Display initial word list
  displayWords(appState.words);
  
  // Register service worker for offline support
  registerServiceWorker();
}

// Initialize Word of the Day
function initWordOfTheDay() {
  appState.wotdIndex = Math.floor(Math.random() * appState.words.length);
  const wotd = appState.words[appState.wotdIndex];
  
  document.getElementById('wotd-ngas').textContent = wotd.Ngas_Word;
  document.getElementById('wotd-english').textContent = wotd.English;
  document.getElementById('wotd-meaning').textContent = wotd.Meaning || 'No meaning available';
  document.getElementById('wotd-example').textContent = wotd.Example || 'No example available';
  
  // Set media elements only if they exist
  if (wotd.Audio) {
    document.getElementById('wotd-audio').src = wotd.Audio;
  }
  if (wotd.Image) {
    document.getElementById('wotd-image').src = wotd.Image;
  }
  if (wotd.Video) {
    document.getElementById('wotd-video').src = wotd.Video;
  }
}

// Initialize category filter dropdown
function initCategoryFilter() {
  const categories = [...new Set(appState.words.map(word => word.Category))];
  const categoryFilter = document.getElementById('category-filter');
  
  // Clear existing options
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  
  // Add category options
  categories.forEach(category => {
    if (category) { // Skip empty categories
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    }
  });
}

// Toggle sidebar visibility
function toggleSidebar() {
  domElements.sidebar.classList.toggle('active');
  domElements.backdrop.classList.toggle('active');
}

// Show a specific screen and hide others
function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  
  // Show requested screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.remove('hidden');
    
    // Initialize screen-specific functionality
    switch (screenId) {
      case 'flashcards':
        startFlashcards();
        break;
      case 'quiz':
        startQuiz(appState.quizType);
        break;
    }
  } else {
    console.error(`Screen with ID ${screenId} not found`);
  }
}

// Display vocabulary words in the list
function displayWords(wordList) {
  const wordListDiv = document.getElementById('word-list');
  wordListDiv.innerHTML = ''; // Clear existing list
  
  wordList.forEach((word, index) => {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.innerHTML = `
      <h3>${word.Ngas_Word}</h3>
      <p>${word.English}</p>
      ${word.Audio ? `<audio controls src="${word.Audio}"></audio>` : ''}
    `;
    card.addEventListener('click', () => showWordDetail(index));
    wordListDiv.appendChild(card);
  });
}

// Filter words based on search and category
function filterWords() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const category = document.getElementById('category-filter').value;
  
  const filtered = appState.words.filter(word => {
    const matchesSearch = 
      word.Ngas_Word.toLowerCase().includes(searchTerm) || 
      word.English.toLowerCase().includes(searchTerm) ||
      (word.Meaning && word.Meaning.toLowerCase().includes(searchTerm));
    
    const matchesCategory = !category || word.Category === category;
    
    return matchesSearch && matchesCategory;
  });
  
  displayWords(filtered);
}

// Show detailed view for a word
function showWordDetail(index) {
  const word = appState.words[index];
  
  // Set text content
  document.getElementById('detail-ngas').textContent = word.Ngas_Word;
  document.getElementById('detail-english').textContent = word.English;
  document.getElementById('detail-pos').textContent = word.Part_of_Speech || 'N/A';
  
  // Set optional fields with fallbacks
  const setDetail = (id, value, fallback = 'N/A') => {
    document.getElementById(id).textContent = value || fallback;
  };
  
  setDetail('detail-meaning', word.Meaning);
  setDetail('detail-example', word.Example);
  setDetail('detail-usage', word.Usage);
  setDetail('detail-notes', word.Notes);
  setDetail('detail-plural', word.Plural);
  setDetail('detail-synonyms', word.Synonyms);
  setDetail('detail-opposite', word.Opposite);
  setDetail('detail-dialect', word.Dialect);
  setDetail('detail-tone', word.Tone);
  
  // Set media elements
  const audioElement = document.getElementById('detail-audio');
  audioElement.src = word.Audio || '';
  audioElement.style.display = word.Audio ? 'block' : 'none';
  
  const imgElement = document.getElementById('detail-image');
  imgElement.src = word.Image || '';
  imgElement.style.display = word.Image ? 'block' : 'none';
  
  const videoElement = document.getElementById('detail-video');
  videoElement.src = word.Video || '';
  videoElement.style.display = word.Video ? 'block' : 'none';
  
  showScreen('word-detail');
}

// Flashcard functionality
function startFlashcards() {
  appState.flashcardIndex = 0;
  appState.flashcardFlipped = false;
  showFlashcard();
}

function showFlashcard() {
  const word = appState.words[appState.flashcardIndex];
  const flashcardWord = document.getElementById('flashcard-word');
  const flashcardBack = document.getElementById('flashcard-back');
  const flashcardAudio = document.getElementById('flashcard-audio');
  
  flashcardWord.textContent = word.Ngas_Word;
  flashcardBack.textContent = `${word.English} - ${word.Meaning || 'No meaning available'}`;
  flashcardAudio.src = word.Audio || '';
  
  flashcardBack.classList.add('hidden');
  flashcardAudio.classList.add('hidden');
  appState.flashcardFlipped = false;
}

function flipFlashcard() {
  appState.flashcardFlipped = !appState.flashcardFlipped;
  document.getElementById('flashcard-back').classList.toggle('hidden', !appState.flashcardFlipped);
  document.getElementById('flashcard-audio').classList.toggle('hidden', !appState.flashcardFlipped);
}

function nextFlashcard() {
  appState.flashcardIndex = (appState.flashcardIndex + 1) % appState.words.length;
  showFlashcard();
}

function markKnown() {
  // In a more advanced version, we would track known words
  nextFlashcard();
}

function markUnknown() {
  // In a more advanced version, we would track difficult words
  nextFlashcard();
}

// Quiz functionality
function startQuiz(type) {
  appState.quizType = type;
  appState.quizIndex = 0;
  appState.matchedPairs = [];
  appState.selectedNgas = null;
  appState.selectedEnglish = null;
  
  document.getElementById('multiple-choice-quiz').classList.toggle('hidden', type !== 'multiple-choice');
  document.getElementById('matching-quiz').classList.toggle('hidden', type !== 'matching');
  
  if (type === 'multiple-choice') {
    showQuizQuestion();
  } else {
    startMatchingQuiz();
  }
}

function showQuizQuestion() {
  const word = appState.words[appState.quizIndex];
  appState.quizCorrectAnswer = word.English;
  
  document.getElementById('quiz-question').textContent = `What is "${word.Ngas_Word}" in English?`;
  
  // Generate options (1 correct + 3 random)
  const options = [word.English];
  while (options.length < 4) {
    const randomWord = appState.words[Math.floor(Math.random() * appState.words.length)].English;
    if (!options.includes(randomWord)) {
      options.push(randomWord);
    }
  }
  
  // Shuffle options
  shuffleArray(options);
  
  // Display options
  const optionsDiv = document.getElementById('quiz-options');
  optionsDiv.innerHTML = '';
  
  options.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option;
    button.addEventListener('click', () => selectAnswer(option));
    optionsDiv.appendChild(button);
  });
  
  // Reset UI state
  document.getElementById('quiz-feedback').classList.add('hidden');
  const submitButton = document.getElementById('quiz-submit');
  submitButton.textContent = 'Submit';
  submitButton.onclick = submitAnswer;
}

function selectAnswer(answer) {
  const buttons = document.getElementById('quiz-options').querySelectorAll('button');
  buttons.forEach(button => {
    button.disabled = true;
  });
  
  const feedback = document.getElementById('quiz-feedback');
  feedback.textContent = answer === appState.quizCorrectAnswer 
    ? 'Correct!' 
    : `Wrong! The correct answer is: ${appState.quizCorrectAnswer}`;
  feedback.classList.remove('hidden');
  
  const submitButton = document.getElementById('quiz-submit');
  submitButton.textContent = 'Next';
  submitButton.onclick = () => {
    appState.quizIndex = (appState.quizIndex + 1) % appState.words.length;
    showQuizQuestion();
  };
}

function submitAnswer() {
  // This is just a placeholder - actual submission handled in selectAnswer
  console.log('Answer submitted');
}

// Matching quiz functions
function startMatchingQuiz() {
  appState.matchingWords = getRandomWords(5);
  appState.matchedPairs = [];
  appState.selectedNgas = null;
  appState.selectedEnglish = null;
  displayMatchingQuiz();
  document.getElementById('matching-feedback').classList.add('hidden');
}

function getRandomWords(count) {
  // Get unique random words
  const shuffled = [...appState.words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, appState.words.length));
}

function displayMatchingQuiz() {
  const ngasDiv = document.getElementById('ngas-words');
  const englishDiv = document.getElementById('english-words');
  
  ngasDiv.innerHTML = '';
  englishDiv.innerHTML = '';
  
  // Shuffle English words separately
  const shuffledEnglish = [...appState.matchingWords].sort(() => Math.random() - 0.5);
  
  // Display Ngas words
  appState.matchingWords.forEach((word, index) => {
    const element = createMatchingWordElement(word.Ngas_Word, index, 'ngas');
    ngasDiv.appendChild(element);
  });
  
  // Display English words
  shuffledEnglish.forEach((word, index) => {
    const element = createMatchingWordElement(word.English, index, 'english');
    englishDiv.appendChild(element);
  });
}

function createMatchingWordElement(text, index, type) {
  const element = document.createElement('div');
  element.className = 'matching-word';
  element.textContent = text;
  element.dataset.index = index;
  
  element.addEventListener('click', () => {
    const word = appState.matchingWords[index];
    selectMatchingWord(element, word, type);
  });
  
  return element;
}

function selectMatchingWord(element, word, type) {
  // Clear previous selection of the same type
  if (type === 'ngas') {
    if (appState.selectedNgas) {
      appState.selectedNgas.element.classList.remove('selected');
    }
    appState.selectedNgas = { element, word, index: element.dataset.index };
    element.classList.add('selected');
    
    // Play audio if available
    if (word.Audio) {
      new Audio(word.Audio).play().catch(e => console.error('Audio error:', e));
    }
  } else {
    if (appState.selectedEnglish) {
      appState.selectedEnglish.element.classList.remove('selected');
    }
    appState.selectedEnglish = { element, word, index: element.dataset.index };
    element.classList.add('selected');
  }
  
  // If both selections are made, check for a match
  if (appState.selectedNgas && appState.selectedEnglish) {
    checkMatch();
  }
}

function checkMatch() {
  const isCorrect = appState.selectedNgas.word.English === appState.selectedEnglish.word.English;
  const feedback = document.getElementById('matching-feedback');
  
  // Visual feedback
  appState.selectedNgas.element.classList.remove('selected');
  appState.selectedEnglish.element.classList.remove('selected');
  
  if (isCorrect) {
    appState.selectedNgas.element.classList.add('correct');
    appState.selectedEnglish.element.classList.add('correct');
    appState.matchedPairs.push(appState.selectedNgas.index);
    
    // Disable matched elements
    appState.selectedNgas.element.style.pointerEvents = 'none';
    appState.selectedEnglish.element.style.pointerEvents = 'none';
    
    feedback.textContent = 'Correct match!';
  } else {
    appState.selectedNgas.element.classList.add('incorrect');
    appState.selectedEnglish.element.classList.add('incorrect');
    feedback.textContent = 'Incorrect match, try again!';
  }
  
  feedback.classList.remove('hidden');
  
  // Clear selections
  appState.selectedNgas = null;
  appState.selectedEnglish = null;
  
  // Check if all pairs are matched
  if (isCorrect && appState.matchedPairs.length === appState.matchingWords.length) {
    feedback.textContent = 'All matches correct! Loading new set...';
    setTimeout(startMatchingQuiz, 2000);
  } else if (!isCorrect) {
    // Reset incorrect selections after delay
    setTimeout(() => {
      document.querySelectorAll('.matching-word.incorrect').forEach(el => {
        el.classList.remove('incorrect');
      });
      feedback.classList.add('hidden');
    }, 1000);
  }
}

// Utility functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showError(message) {
  // In a real app, you'd have a proper error display system
  alert(message);
}

// Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful:', registration);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  }
}
