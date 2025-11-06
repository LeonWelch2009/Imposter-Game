let players = [];
let currentPlayerIndex = 0;
let imposterIndex = -1;
let currentCategory = "";
let currentWord = "";
let allPlayersSeen = false;
let gameCount = 0;
let categories = {};
let availableCategories = [];

const playerNameInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const playerList = document.getElementById("playerList");
const startGameBtn = document.getElementById("startGameBtn");
const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");
const gameMessage = document.getElementById("gameMessage");
const revealBtn = document.getElementById("revealBtn");
const nextPlayerBtn = document.getElementById("nextPlayerBtn");
const showImposterBtn = document.getElementById("showImposterBtn");
const restartBtn = document.getElementById("restartBtn");
const categoriesContainer = document.getElementById("categories");

// Fetch categories from Flask
fetch("/categories")
    .then(res => res.json())
    .then(data => {
        categories = data;
        availableCategories = Object.keys(categories);
        renderCategoryCheckboxes();
    })
    .catch(err => console.error("Failed to load categories:", err));

// Add player
function addPlayer() {
    let name = playerNameInput.value.trim();
    if (!name) return;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (!players.includes(name)) {
        players.push(name);
        updatePlayerList();
        playerNameInput.value = "";
    }
}

function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach((p, i) => {
        const li = document.createElement("li");
        li.classList.add("player-item");
        li.innerHTML = `${p} <button class="remove-player" onclick="removePlayer(${i})">×</button>`;
        playerList.appendChild(li);
    });
}

function removePlayer(index) {
    players.splice(index, 1);
    updatePlayerList();
}

// Render checkboxes
function renderCategoryCheckboxes() {
    categoriesContainer.innerHTML = "";
    Object.keys(categories).forEach(cat => {
        const div = document.createElement("div");
        div.classList.add("category-checkbox");
        div.innerHTML = `<label><input type="checkbox" value="${cat}" checked> ${cat}</label>`;
        categoriesContainer.appendChild(div);
    });
}

// Start game
function startGame() {
    if (players.length < 3) {
        alert("Minimum 3 players required!");
        return;
    }
    availableCategories = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
    if (!availableCategories.length) {
        alert("Select at least one category!");
        return;
    }

    imposterIndex = Math.floor(Math.random() * players.length);
    currentPlayerIndex = 0;
    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const words = categories[currentCategory];
    currentWord = words[Math.floor(Math.random() * words.length)];

    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    allPlayersSeen = false;
    gameMessage.textContent = `Current Player: ${players[currentPlayerIndex]}`;
}

// Reveal word
revealBtn.onclick = () => {
    if (currentPlayerIndex === imposterIndex) {
        gameMessage.textContent = `${players[currentPlayerIndex]} (Imposter) - Category: ${currentCategory}`;
    } else {
        gameMessage.textContent = `${players[currentPlayerIndex]} - Word: ${currentWord}`;
    }
};

// Next player
nextPlayerBtn.onclick = () => {
    if (currentPlayerIndex === players.length - 1) {
        allPlayersSeen = true;
        // Random player starts conversation
        const randomStarter = players[Math.floor(Math.random() * players.length)];
        gameMessage.textContent = `${randomStarter} starts the conversation!`;
        revealBtn.style.display = "none";
        nextPlayerBtn.style.display = "none";
        showImposterBtn.parentElement.style.display = "flex";
    } else {
        currentPlayerIndex++;
        gameMessage.textContent = `Current Player: ${players[currentPlayerIndex]}`;
    }
};

// Reveal imposter
showImposterBtn.onclick = () => {
    gameMessage.textContent = `The IMPOSTER is: ${players[imposterIndex]}`;
};

// Restart game
restartBtn.onclick = () => {
    gameScreen.style.display = "none";
    setupScreen.style.display = "block";
    revealBtn.style.display = "inline-block";
    nextPlayerBtn.style.display = "inline-block";
    showImposterBtn.parentElement.style.display = "none";
};
addPlayerBtn.onclick = addPlayer;
playerNameInput.addEventListener("keypress", (e) => { if (e.key === "Enter") addPlayer(); });
