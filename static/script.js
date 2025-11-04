let players = [];
let categories = {};
let availableCategories = [];
let currentPlayerIndex = 0;
let imposterIndex = -1;
let currentCategory = "";
let currentWord = "";
let allPlayersSeen = false;

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

async function loadCategories() {
    try {
        const res = await fetch("/get_words");
        categories = await res.json();
        availableCategories = Object.keys(categories);
        if (availableCategories.length === 0) {
            setupInfo.innerText = "No categories found!";
        } else {
            setupInfo.innerText = `Loaded ${availableCategories.length} categories.`;
        }
    } catch (err) {
        console.error("Error loading categories:", err);
        setupInfo.innerText = "Failed to load categories.";
    }
}

function startGame() {
    if (players.length < 3) {
        setupInfo.innerText = "Need at least 3 players!";
        return;
    }
    if (availableCategories.length === 0) {
        setupInfo.innerText = "No categories available!";
        return;
    }

    imposterIndex = Math.floor(Math.random() * players.length);
    currentPlayerIndex = 0;

    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    currentWord = categories[currentCategory][Math.floor(Math.random() * categories[currentCategory].length)];

    allPlayersSeen = false;

    setupScreen.style.display = "none";
    gameScreen.style.display = "block";

    currentPlayerText.innerText = `Current Player: ${players[currentPlayerIndex]}`;
    gameInfo.innerText = "Press 'Reveal Word' to see your word.";

    revealBtn.style.display = "inline-block";
    nextBtn.style.display = "inline-block";
}

function revealWord() {
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayerIndex === imposterIndex) {
        gameInfo
