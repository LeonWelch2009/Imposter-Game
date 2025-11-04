// -------------------- Game State --------------------
let players = [];
let categories = {};
let availableCategories = [];
let currentPlayerIndex = 0;
let imposterIndex = -1;
let currentCategory = "";
let currentWord = "";
let allPlayersSeen = false;

// -------------------- HTML Elements --------------------
const playerEntry = document.getElementById("playerEntry");
const addBtn = document.getElementById("addBtn");
const startBtn = document.getElementById("startBtn");
const playerList = document.getElementById("playerList");
const setupInfo = document.getElementById("infoText");

const gameScreen = document.getElementById("gameScreen");
const setupScreen = document.getElementById("setupScreen");
const currentPlayerText = document.getElementById("currentPlayer");
const gameInfo = document.getElementById("infoTextGame");
const revealBtn = document.getElementById("revealBtn");
const nextBtn = document.getElementById("nextBtn");
const endControls = document.getElementById("endControls");
const showImposterBtn = document.getElementById("showImposterBtn");
const restartBtn = document.getElementById("restartBtn");

// -------------------- Helper Functions --------------------
function capitalizeName(name) {
    return name.replace(/\b\w/g, char => char.toUpperCase());
}

function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach(name => {
        const li = document.createElement("li");
        li.innerText = name;
        playerList.appendChild(li);
    });
}

function addPlayer() {
    const name = capitalizeName(playerEntry.value.trim());
    if (!name) return;
    if (players.includes(name)) {
        setupInfo.innerText = `Player ${name} already added!`;
        return;
    }
    players.push(name);
    updatePlayerList();
    playerEntry.value = "";
    setupInfo.innerText = `Added player: ${name}`;
}

// Load categories from server
async function loadCategories() {
    const res = await fetch("/get_words");
    categories = await res.json();
    availableCategories = Object.keys(categories);
    setupInfo.innerText = availableCategories.length
        ? `Loaded ${availableCategories.length} categories`
        : "No categories found!";
}

// Start Game
function startGame() {
    if (players.length < 3) {
        setupInfo.innerText = "Need at least 3 players!";
        return;
    }
    if (availableCategories.length === 0) {
        setupInfo.innerText = "No categories available!";
        return;
    }

    // Random imposter and word
    imposterIndex = Math.floor(Math.random() * players.length);
    currentPlayerIndex = 0;
    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    currentWord = categories[currentCategory][Math.floor(Math.random() * categories[currentCategory].length)];

    allPlayersSeen = false;

    // Switch screens
    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    currentPlayerText.innerText = `Current Player: ${players[currentPlayerIndex]}`;
    gameInfo.innerText = "Press 'Reveal Word' to see your word.";
    revealBtn.style.display = "inline-block";
    nextBtn.style.display = "inline-block";

    // Record game on server
    fetch("/record_game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            players,
            category: currentCategory,
            word: currentWord,
            imposter: players[imposterIndex]
        })
    });
}

// Reveal Word
function revealWord() {
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayerIndex === imposterIndex) {
        gameInfo.innerText = `${currentPlayer} is the IMPOSTER! Category: ${currentCategory}`;
    } else {
        gameInfo.innerText = `${currentPlayer}: ${currentWord}`;
    }
}

// Next Player
function nextPlayer() {
    if (currentPlayerIndex === players.length - 1) {
        allPlayersSeen = true;
        gameInfo.innerText = "All players have seen their word!";
        currentPlayerText.innerText = "";
        revealBtn.style.display = "none";
        nextBtn.style.display = "none";
        endControls.style.display = "flex";
    } else {
        currentPlayerIndex++;
        currentPlayerText.innerText = `Current Player: ${players[currentPlayerIndex]}`;
        gameInfo.innerText = "Press 'Reveal Word' to see your word.";
    }
}

// Show Imposter
function showImposter() {
    if (!allPlayersSeen) {
        gameInfo.innerText = "Not all players have finished yet!";
        return;
    }
    gameInfo.innerText = `The IMPOSTER is: ${players[imposterIndex]}`;
}

// Restart Game
function restartGame() {
    currentPlayerIndex = 0;
    imposterIndex = -1;
    currentCategory = "";
    currentWord = "";
    allPlayersSeen = false;

    setupScreen.style.display = "block";
    gameScreen.style.display = "none";
    endControls.style.display = "none";
    setupInfo.innerText = "Add players and select categories to start";
}

// -------------------- Event Listeners --------------------
addBtn.addEventListener("click", addPlayer);
playerEntry.addEventListener("keypress", e => { if (e.key === "Enter") addPlayer(); });
startBtn.addEventListener("click", startGame);
revealBtn.addEventListener("click", revealWord);
nextBtn.addEventListener("click", nextPlayer);
showImposterBtn.addEventListener("click", showImposter);
restartBtn.addEventListener("click", restartGame);

// -------------------- Initialize --------------------
window.addEventListener("DOMContentLoaded", loadCategories);
