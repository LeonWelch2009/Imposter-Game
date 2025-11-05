// DOM elements
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const startGameBtn = document.getElementById('startGameBtn');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const revealBtn = document.getElementById('revealBtn');
const nextPlayerBtn = document.getElementById('nextPlayerBtn');
const showImposterBtn = document.getElementById('showImposterBtn');
const restartBtn = document.getElementById('restartBtn');
const backMenuBtn = document.getElementById('backMenuBtn');
const toggleCategoriesBtn = document.getElementById('toggleCategoriesBtn');
const auditBtn = document.getElementById('auditBtn');

const playerNameInput = document.getElementById('playerName');
const playerList = document.getElementById('playerList');
const categoriesContainer = document.getElementById('categories');

const setupMessage = document.getElementById('setupMessage');
const gameMessage = document.getElementById('gameMessage');

let players = [];
let categories = {
    Fruits: ['Apple', 'Banana', 'Orange', 'Grapes', 'Mango', 'Strawberry', 'Pineapple', 'Watermelon', 'Peach', 'Cherry'],
    Meals: ['Pizza', 'Burger', 'Pasta', 'Sushi', 'Taco', 'Salad', 'Steak', 'Curry', 'Sandwich', 'Omelette'],
    Places: ['Supermarket', 'Cinema', 'Police Station', 'Hospital', 'School', 'Park', 'Bank', 'Library', 'Restaurant', 'Airport'],
    Singers: ['Beyonce', 'Adele', 'Drake', 'Taylor Swift', 'Ed Sheeran', 'Ariana Grande', 'Justin Bieber', 'Rihanna', 'Bruno Mars', 'Shakira'],
    Characters: ['Harry Potter', 'Sherlock Holmes', 'Elsa', 'Darth Vader', 'Spider-Man', 'Iron Man', 'Simba', 'Frodo', 'Homer Simpson', 'Mickey Mouse'],
    Actors: ['Tom Hanks', 'Leonardo DiCaprio', 'Emma Watson', 'Will Smith', 'Robert Downey Jr', 'Jennifer Lawrence', 'Brad Pitt', 'Angelina Jolie', 'Johnny Depp', 'Scarlett Johansson'],
    Historical: ['Albert Einstein', 'Napoleon', 'Cleopatra', 'Abraham Lincoln', 'Martin Luther King Jr', 'Winston Churchill', 'Julius Caesar', 'Marie Curie', 'Leonardo da Vinci', 'Galileo']
};
let availableCategories = [];
let currentPlayerIndex = 0;
let imposterIndex = -1;
let currentCategory = '';
let currentWord = '';
let allPlayersSeen = false;

// --- Utility Functions ---

function capitalize(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function createPlayerItem(name) {
    const li = document.createElement('li');
    li.textContent = name;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'remove-player-btn';
    removeBtn.onclick = () => {
        players = players.filter(p => p !== name);
        playerList.removeChild(li);
        setupMessage.textContent = `${name} removed.`;
    };

    li.appendChild(removeBtn);
    playerList.appendChild(li);
}

function createCategoryCheckboxes() {
    categoriesContainer.innerHTML = '';
    availableCategories = [];

    Object.keys(categories).forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-checkbox';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = true;

        input.onchange = () => {
            updateAvailableCategories();
        };

        const label = document.createElement('label');
        label.textContent = cat;

        div.appendChild(input);
        div.appendChild(label);
        categoriesContainer.appendChild(div);
    });

    updateAvailableCategories();
}

function updateAvailableCategories() {
    availableCategories = [];
    const checkboxes = categoriesContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((box, i) => {
        if (box.checked) {
            availableCategories.push(Object.keys(categories)[i]);
        }
    });
    setupMessage.textContent = `${availableCategories.length} categories selected.`;
}

// --- Event Handlers ---

addPlayerBtn.onclick = () => {
    let name = capitalize(playerNameInput.value.trim());
    if (name && !players.includes(name)) {
        players.push(name);
        createPlayerItem(name);
        playerNameInput.value = '';
        setupMessage.textContent = `Added player: ${name}`;
    } else if (!name) {
        setupMessage.textContent = 'Enter a name.';
    } else {
        setupMessage.textContent = `${name} already added!`;
    }
};

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPlayerBtn.click();
});

startGameBtn.onclick = () => {
    if (players.length < 3) {
        setupMessage.textContent = 'Add at least 3 players to start.';
        return;
    }

    if (availableCategories.length === 0) {
        setupMessage.textContent = 'Select at least one category.';
        return;
    }

    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    currentPlayerIndex = 0;
    imposterIndex = Math.floor(Math.random() * players.length);

    // Pick random category and word
    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    currentWord = categories[currentCategory][Math.floor(Math.random() * categories[currentCategory].length)];

    allPlayersSeen = false;
    gameMessage.textContent = `${players[currentPlayerIndex]} press "Reveal Word"`;
    revealBtn.disabled = false;
    nextPlayerBtn.disabled = true;
};

revealBtn.onclick = () => {
    if (currentPlayerIndex === imposterIndex) {
        gameMessage.textContent = `${players[currentPlayerIndex]} is the IMPOSTER! Category: ${currentCategory}`;
    } else {
        gameMessage.textContent = `${players[currentPlayerIndex]}: ${currentWord}`;
    }
    revealBtn.disabled = true;
    nextPlayerBtn.disabled = false;
};

nextPlayerBtn.onclick = () => {
    if (currentPlayerIndex === players.length - 1) {
        allPlayersSeen = true;
        gameMessage.textContent = `${players[Math.floor(Math.random() * players.length)]} starts the conversation!`;
        revealBtn.style.display = 'none';
        nextPlayerBtn.style.display = 'none';
        document.getElementById('endControls').style.display = 'flex';
    } else {
        currentPlayerIndex++;
        gameMessage.textContent = `${players[currentPlayerIndex]} press "Reveal Word"`;
        revealBtn.disabled = false;
        nextPlayerBtn.disabled = true;
    }
};

showImposterBtn.onclick = () => {
    gameMessage.textContent = `The IMPOSTER is: ${players[imposterIndex]}`;
};

restartBtn.onclick = () => {
    gameScreen.style.display = 'none';
    setupScreen.style.display = 'block';
    gameMessage.textContent = '';
    revealBtn.style.display = 'inline-block';
    nextPlayerBtn.style.display = 'inline-block';
    document.getElementById('endControls').style.display = 'none';
    currentPlayerIndex = 0;
    imposterIndex = -1;
    allPlayersSeen = false;
};

backMenuBtn.onclick = () => {
    restartBtn.click();
};

toggleCategoriesBtn.onclick = () => {
    categoriesContainer.style.display = categoriesContainer.style.display === 'none' ? 'flex' : 'none';
};

// Initialize categories
createCategoryCheckboxes();
