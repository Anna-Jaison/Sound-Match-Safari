const animals = [
    { name: 'Lion', sound: 'roar', image: 'https://placehold.co/100x100/FFD700/000000?text=Lion', audio: 'https://cdn.pixabay.com/audio/2021/09/03/audio_0b7b309ab2.mp3' },
    { name: 'Elephant', sound: 'trumpet', image: 'https://placehold.co/100x100/808080/FFFFFF?text=Elephant',  audio: 'https://cdn.pixabay.com/audio/2022/02/07/audio_eb70c024b0.mp3' },
    { name: 'Monkey', sound: 'chatter', image: 'https://placehold.co/100x100/A0522D/FFFFFF?text=Monkey', audio: 'https://cdn.pixabay.com/audio/2022/02/01/audio_4c60ee694b.mp3' },
    { name: 'Bird', sound: 'chirp', image: 'https://placehold.co/100x100/ADD8E6/000000?text=Bird', audio: 'https://cdn.pixabay.com/audio/2022/03/15/audio_fdf6acb4e1.mp3'},
    { name: 'Dog', sound: 'bark', image: 'https://placehold.co/100x100/F0E68C/000000?text=Dog', audio: 'https://cdn.pixabay.com/audio/2022/03/15/audio_75f78f3dc2.mp3'  },
    { name: 'Cat', sound: 'meow', image: 'https://placehold.co/100x100/FFB6C1/000000?text=Cat',audio: 'https://cdn.pixabay.com/audio/2022/03/15/audio_444b3f7b0a.mp3'}
];

const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const gameContainer = document.getElementById("game-container");

let gameBoard = document.getElementById('game-board');
let messageBox = document.getElementById('message-box');
let resetButton = document.getElementById('reset-button');
let hintButton = document.getElementById('hint-button');
let scoreDisplay = document.getElementById('score-display');
let timerDisplay = document.getElementById('timer-display');
let winModalOverlay = document.getElementById('win-modal-overlay');
let winMessage = document.getElementById('win-message');
let playAgainButton = document.getElementById('play-again-button');

let cards = []; // Array to hold all card elements
let flippedCards = []; // Stores currently flipped cards
let matchedPairs = 0; // Counts successfully matched pairs
let canFlip = true; // Controls if cards can be flipped
let score = 0; // Player's score
let timerInterval; // Interval ID for the timer
let startTime; // Timestamp when the game started
let isGameStarted = false; // Flag to track if the game (and timer) has started

// Function to create a sound (simple text-to-speech for prototype)
function playSound(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.8; // Further increased rate for a more pronounced baby/cartoon effect
    utterance.pitch = 2.0; // Maxed out pitch for a very high-pitched baby/cartoon effect
    window.speechSynthesis.speak(utterance);
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to create a single card element
function createCard(animal) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card', 'rounded-xl', 'shadow-md', 'flex', 'flex-col', 'items-center', 'justify-center');
    cardElement.dataset.name = animal.name; // Store animal name for matching
    cardElement.dataset.sound = animal.sound; // Store sound for hint

    // Image element (initially hidden)
    const imgElement = document.createElement('img');
    imgElement.src = animal.image;
    imgElement.alt = animal.name;
    imgElement.classList.add('w-24', 'h-24', 'object-contain', 'rounded-lg');
    cardElement.appendChild(imgElement);

    // Overlay text for initial state
    const overlayText = document.createElement('span');
    overlayText.classList.add('overlay-text');
    overlayText.textContent = 'Tap to Hear';
    cardElement.appendChild(overlayText);

    // Sound button
    const soundButton = document.createElement('button');
    soundButton.classList.add('sound-button', 'rounded-lg', 'font-bold', 'text-white', 'flex', 'items-center', 'justify-center');
    soundButton.innerHTML = `
        <svg class="sound-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 1L8 5H4C2.9 5 2 5.9 2 7V17C2 18.1 2.9 19 4 19H8L12 23V1ZM14 7C14 8.7 13.3 10.2 12.2 11.3L13.6 12.7C15.1 11.2 16 9.2 16 7H14ZM14 17C14 15.3 13.3 13.8 12.2 12.7L13.6 11.3C15.1 12.8 16 14.8 16 17H14ZM19 12C19 9.8 17.8 7.9 16 6.7V17.3C17.8 16.1 19 14.2 19 12Z"/>
        </svg>
        <span>Hear Sound</span>
    `;
    soundButton.onclick = (event) => {
        event.stopPropagation(); // Prevent card flip when clicking the sound button
        playSound(animal.sound);
        messageBox.textContent = `You heard a ${animal.sound}!`;
    };
    cardElement.appendChild(soundButton);

    // Card click handler for flipping
    cardElement.addEventListener('click', () => {
        if (!canFlip || cardElement.classList.contains('flipped') || cardElement.classList.contains('matched')) {
            return; // Do nothing if not flippable, already flipped, or matched
        }

        // Start the game timer only on the very first flip
        if (!isGameStarted) {
            isGameStarted = true;
            startTime = Date.now();
            startTimer();
            messageBox.textContent = 'Game started! Find the matches!';
            playSound('Game started! Find the matches!');
        }

        cardElement.classList.add('flipped');
        flippedCards.push(cardElement);
        playSound(`Flipped ${animal.name}`); // Announce the flipped card

        if (flippedCards.length === 2) {
            canFlip = false; // Disable flipping until check is complete
            setTimeout(checkForMatch, 1000); // Check for match after a short delay
        }
    });

    // Add keyboard accessibility
    cardElement.tabIndex = 0; // Make card focusable
    cardElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            cardElement.click(); // Simulate click on Enter or Space
        }
    });

    return cardElement;
}

// Function to initialize the game board
function initializeGame() {
    gameBoard.innerHTML = ''; // Clear existing cards
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    canFlip = true;
    score = 0;
    updateScoreDisplay();
    stopTimer(); // Stop any running timer
    timerDisplay.textContent = '00:00'; // Set timer to 00:00 initially
    messageBox.textContent = 'Click on a card to hear a sound!';
    winModalOverlay.classList.remove('show'); // Hide win modal
    isGameStarted = false; // Reset game started flag

    // Duplicate animals to create pairs
    const gameAnimals = [...animals, ...animals];
    shuffle(gameAnimals); // Shuffle the pairs

    gameAnimals.forEach(animal => {
        const card = createCard(animal);
        gameBoard.appendChild(card);
        cards.push(card);
    });

    // Timer will now only start on the first flip
}

// Function to update the score display
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}

// Function to start the game timer
function startTimer() {
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// Function to stop the game timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Function to check if two flipped cards match
function checkForMatch() {
    const [card1, card2] = flippedCards;
    const name1 = card1.dataset.name;
    const name2 = card2.dataset.name;

    if (name1 === name2) {
        // Match found!
        card1.classList.add('matched');
        card2.classList.add('matched');
        messageBox.textContent = `It's a match! You found the ${name1}s!`;
        playSound(`You found a match for ${name1}!`);
        score += 10; // Award points for a match
        updateScoreDisplay();
        matchedPairs++;

        // Remove click listeners from matched cards to prevent further interaction
        card1.removeEventListener('click', card1.onclick);
        card2.removeEventListener('click', card2.onclick);

        if (matchedPairs === animals.length) {
            handleWin();
        }
    } else {
        // Not a match, flip them back
        card1.classList.add('incorrect'); // Temporarily highlight as incorrect
        card2.classList.add('incorrect');
        messageBox.textContent = 'Not a match. Try again!';
        playSound('Not a match. Try again!');
        score = Math.max(0, score - 2); // Deduct points for incorrect match, don't go below 0
        updateScoreDisplay();

        setTimeout(() => {
            card1.classList.remove('flipped', 'incorrect');
            card2.classList.remove('flipped', 'incorrect');
        }, 800); // Short delay before flipping back
    }

    flippedCards = []; // Clear flipped cards
    canFlip = true; // Re-enable flipping
}

// Function to handle game win
function handleWin() {
    stopTimer();
    const finalTime = timerDisplay.textContent; // Get current time from display
    // Updated text content for the modal
    winMessage.textContent = `You won! Congrats! You completed the safari in ${finalTime} with a score of ${score}!`;
    winModalOverlay.classList.add('show');
    // Updated spoken message to include "Wow" and "Time finished"
    playSound(`Wow! You won! Congrats! Time finished. Your score is ${score}. You completed the safari in ${finalTime}.`);
}

// Function for hint button
function getHint() {
    const unmatchedCards = cards.filter(card => !card.classList.contains('matched') && !card.classList.contains('flipped'));
    if (unmatchedCards.length > 0) {
        const randomCard = unmatchedCards[Math.floor(Math.random() * unmatchedCards.length)];
        const animalName = randomCard.dataset.name;
        const animalSound = randomCard.dataset.sound;
        messageBox.textContent = `Hint: Listen closely! This card sounds like a ${animalSound}.`;
        playSound(`This card sounds like a ${animalSound}.`);
        // Optionally, briefly highlight the card or its sound button
        randomCard.querySelector('.sound-button').focus(); // Focus the sound button for accessibility
    } else {
        messageBox.textContent = 'No hints available, all cards are matched or flipped!';
    }
}

// Event listener for the reset button
resetButton.addEventListener('click', initializeGame);

// Event listener for the hint button
hintButton.addEventListener('click', getHint);

// Event listener for the play again button in the win modal
playAgainButton.addEventListener('click', initializeGame);

// Initialize the game when the page loads
window.onload = () => {
    startBtn.addEventListener("click", () => {
        startScreen.style.display = "none";
        gameContainer.classList.remove("hidden");
        initializeGame();
        playSound("Welcome to Sound Match Safari!");
    });
};


// Better - trigger after button click
document.getElementById("start-btn").addEventListener("click", () => {
  speak("Welcome to Sound Match Safari!");
});
