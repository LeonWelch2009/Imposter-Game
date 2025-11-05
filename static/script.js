// ----- Game State -----
let players = [];
let categories = {};
let availableCategories = [];
let currentPlayerIndex = 0;
let imposterIndex = -1;
let currentCategory = '';
let currentWord = '';
let allPlayersSeen = false;

// DOM elements
const messageEl = document.getElementById('message');
const playerNameInput = document.getElementById('playerName');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const playerListEl = document.getElementById('playerList');
const categoriesEl = document.getElementById('categories');
const startGameBtn = document.getElementById('startGameBtn');
const revealBtn = document.getElementById('revealBtn');
const nextPlayerBtn = document.getElementById('nextPlayerBtn');
const showImposterBtn = document.getElementById('showImposterBtn');
const restartBtn = document.getElementById('restartBtn');
const backMenuBtn = document.getElementById('backMenuBtn');
const toggleCategoriesBtn = document.getElementById('toggleCategoriesBtn');
const auditBtn = document.getElementById('auditBtn');
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const endControls = document.getElementById('endControls');
const gameControls = document.getElementById('gameControls');

// ----- Initialize -----
window.addEventListener('load', () => {
    fetchCategories();
});

// ----- Fetch Categories from Server -----
function fetchCategories() {
    fetch('/get_categories')
        .then(res => res.json())
        .then(data => {
            categories = data;
            availableCategories = Object.keys(categories);
            renderCategoryCheckboxes();
        });
}

// ----- Render Category Checkboxes -----
function renderCategoryCheckboxes() {
    categoriesEl.innerHTML = '';
    for (let cat in categories) {
        const div = document.createElement('div');
        div.className = 'category-checkbox';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = true;
        input.id = `cat-${cat}`;
        input.addEventListener('change', () => updateAvailableCategories());
        const label = document.createElement('label');
        label.htmlFor = `cat-${cat}`;
        label.innerText = cat;
        div.appendChild(input);
        div.appendChild(label);
        categoriesEl.appendChild(div);
    }
}

// ----- Update Available Categories -----
function updateAvailableCategories() {
    availableCategories = [];
    for (let cat in categories) {
        const checked = document.getElementById(`cat-${cat}`).checked;
        if (checked) availableCategories.push(cat);
    }
}

// ----- Add Player -----
function addPlayer() {
    let name = playerNameInput.value.trim();
    if (!name) return;
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    if (!players.includes(name)) {
        players.push(name);
        renderPlayer(name);
        playerNameInput.value = '';
        messageEl.innerText = `Added player: ${name}`;
    } else {
        messageEl.innerText = `Player ${name} already exists`;
    }
}

// ----- Render Player in List -----
function renderPlayer(name) {
    const li = document.createElement('li');
    li.innerText = name;

    const removeBtn = document.createElement('button');
    removeBtn.innerText = '×';
    removeBtn.className = 'remove-player-btn';
    removeBtn.onclick = () => removePlayer(name, li);

    li.appendChild(removeBtn);
    playerListEl.appendChild(li);
}

// ----- Remove Player -----
function removePlayer(name, li) {
    players = players.filter(p => p !== name);
    playerListEl.removeChild(li);
    messageEl.innerText = `Removed player: ${name}`;
}

// ----- Start Game -----
function startGame() {
    if (players.length < 3) {
        messageEl.innerText = "Add at least 3 players to start!";
        return;
    }

    updateAvailableCategories();
    if (availableCategories.length === 0) {
        messageEl.innerText = "Select at least 1 category!";
        return;
    }

    // Random imposter
    imposterIndex = Math.floor(Math.random() * players.length);
    currentPlayerIndex = 0;
    allPlayersSeen = false;

    // Random category and word
    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const wordList = categories[currentCategory];
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];

    // Switch screens
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    gameControls.style.display = 'flex';
    endControls.style.display = 'none';

    messageEl.innerText = `Game started! Press "Reveal Word" for ${players[currentPlayerIndex]}.`;

    // Record start to server
    fetch('/record_start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            players,
            availableCategories,
            currentCategory,
            currentWord,
            imposter: players[imposterIndex]
        })
    });
}

// ----- Reveal Word -----
function revealWord() {
    const player = players[currentPlayerIndex];
    if (currentPlayerIndex === imposterIndex) {
        messageEl.innerText = `${player} is the IMPOSTER! Category: ${currentCategory}`;
    } else {
        messageEl.innerText = `${player}: ${currentWord}`;
    }
}

// ----- Next Player -----
function nextPlayer() {
    if (currentPlayerIndex >= players.length - 1) {
        allPlayersSeen = true;
        gameControls.style.display = 'none';
        endControls.style.display = 'flex';

        // Random player to start
        const starter = players[Math.floor(Math.random() * players.length)];
        messageEl.innerText = `${starter} starts the conversation!`;

        // Record game end
        fetch('/record_end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imposter: players[imposterIndex], word: currentWord })
        });
        return;
    }

    currentPlayerIndex++;
    messageEl.innerText = `Next player: ${players[currentPlayerIndex]}. Press "Reveal Word"`;
}

// ----- Reveal Imposter -----
function revealImposter() {
    messageEl.innerText = `The IMPOSTER is: ${players[imposterIndex]}`;
}

// ----- Restart Game -----
function restartGame() {
    // Reset state
    currentPlayerIndex = 0;
    imposterIndex = -1;
    currentCategory = '';
    currentWord = '';
    allPlayersSeen = false;

    // Reset screens
    gameScreen.style.display = 'none';
    setupScreen.style.display = 'block';
    playerNameInput.value = '';
    messageEl.innerText = "Add players and select categories to start";
}

// ----- Back to Main Menu -----
function backToMenu() {
    restartGame();
}

// ----- Event Listeners -----
addPlayerBtn.addEventListener('click', addPlayer);
playerNameInput.addEventListener('keypress', e => { if (e.key === 'Enter') addPlayer(); });
startGameBtn.addEventListener('click', startGame);
revealBtn.addEventListener('click', revealWord);
nextPlayerBtn.addEventListener('click', nextPlayer);
showImposterBtn.addEventListener('click', revealImposter);
restartBtn.addEventListener('click', restartGame);
backMenuBtn.addEventListener('click', backToMenu);
toggleCategoriesBtn.addEventListener('click', () => {
    categoriesEl.classList.toggle('show');
});
auditBtn.addEventListener('click', () => {
    window.open('/audit', '_blank');
});
