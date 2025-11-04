// ====================
// Imposter Word Game JS
// ====================

// Game state
let players = [];
let playerIndex = 0;
let imposterIndex = -1;
let currentCategory = "";
let currentWord = "";
let allPlayersSeen = false;
let categories = {};
let availableCategories = [];

// DOM elements
const playerInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const playerList = document.getElementById("playerList");
const startBtn = document.getElementById("startGameBtn");
const revealBtn = document.getElementById("revealBtn");
const nextBtn = document.getElementById("nextPlayerBtn");
const messageDiv = document.getElementById("message");
const categoriesDiv = document.getElementById("categories");
const showImposterBtn = document.getElementById("showImposterBtn");
const restartBtn = document.getElementById("restartBtn");

// ====================
// Fetch categories from backend
// ====================
fetch("/get_words")
    .then(res => res.json())
    .then(data => {
        categories = data;
        createCategoryCheckboxes();
    });

// ====================
// UI Helpers
// ====================
function showMessage(msg, color = "#5c2a2a") {
    messageDiv.innerText = msg;
    messageDiv.style.color = color;
}

function capitalizeName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// ====================
// Players
// ====================
addPlayerBtn.addEventListener("click", () => {
    let name = capitalizeName(playerInput.value.trim());
    if (!name) return;
    if (players.includes(name)) {
        showMessage(`Player "${name}" already added!`, "#e94e77");
        return;
    }
    players.push(name);
    updatePlayerList();
    playerInput.value = "";
});

function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach((p, i) => {
        const li = document.createElement("li");
        li.innerText = p;

        const removeBtn = document.createElement("button");
        removeBtn.className = "removeBtn";
        removeBtn.innerText = "×";
        removeBtn.onclick = () => {
            players.splice(i, 1);
            updatePlayerList();
        };
        li.appendChild(removeBtn);
        playerList.appendChild(li);
    });
}

// Auto add player on Enter key
playerInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addPlayerBtn.click();
});

// ====================
// Categories
// ====================
function createCategoryCheckboxes() {
    categoriesDiv.innerHTML = "";
    availableCategories = Object.keys(categories);
    availableCategories.forEach(cat => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.onchange = updateAvailableCategories;

        const span = document.createElement("span");
        span.innerText = cat;

        label.appendChild(checkbox);
        label.appendChild(span);
        categoriesDiv.appendChild(label);
    });
}


function updateAvailableCategories() {
    availableCategories = [];
    const labels = categoriesDiv.querySelectorAll("label");
    labels.forEach(label => {
        const checkbox = label.querySelector("input");
        if (checkbox.checked) availableCategories.push(label.innerText.trim());
    });
}

// ====================
// Game Flow
// ====================
startBtn.addEventListener("click", () => {
    if (players.length < 3) {
        showMessage("Minimum 3 players required!", "#e94e77");
        return;
    }
    updateAvailableCategories();
    if (availableCategories.length === 0) {
        showMessage("Select at least one category!", "#e94e77");
        return;
    }

    // Hide setup elements
    document.getElementById("setupScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";

    // Select imposter
    imposterIndex = Math.floor(Math.random() * players.length);
    playerIndex = 0;
    allPlayersSeen = false;

    // Pick random category and word
    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    currentWord = categories[currentCategory][Math.floor(Math.random() * categories[currentCategory].length)];

    showMessage(`Game started! Current Player: ${players[playerIndex]}`);
});

revealBtn.addEventListener("click", () => {
    if (allPlayersSeen) return;

    if (playerIndex === imposterIndex) {
        showMessage(`${players[playerIndex]} is IMPOSTER! Category: ${currentCategory}`, "#4ecdc4");
    } else {
        showMessage(`${players[playerIndex]} sees the word: ${capitalizeName(currentWord)}`, "#ff6b6b");
    }

    revealBtn.disabled = true;
});

nextBtn.addEventListener("click", () => {
    if (playerIndex >= players.length - 1) {
        allPlayersSeen = true;
        document.getElementById("gameControls").style.display = "none";
        document.getElementById("endControls").style.display = "flex";
        showMessage("All players have seen their word!");
        logGame({
            players: players,
            category: currentCategory,
            word: currentWord,
            imposter: players[imposterIndex]
        });
    } else {
        playerIndex++;
        showMessage(`Next Player: ${players[playerIndex]}`);
        revealBtn.disabled = false;
    }
});

showImposterBtn.addEventListener("click", () => {
    if (!allPlayersSeen) {
        showMessage("All players must see their word first!", "#e94e77");
        return;
    }
    showMessage(`The IMPOSTER is: ${players[imposterIndex]}`, "#4ecdc4");
});

restartBtn.addEventListener("click", () => {
    // Reset game
    playerIndex = 0;
    imposterIndex = -1;
    allPlayersSeen = false;
    currentCategory = "";
    currentWord = "";
    revealBtn.disabled = false;

    document.getElementById("setupScreen").style.display = "block";
    document.getElementById("gameScreen").style.display = "none";
    document.getElementById("endControls").style.display = "none";
    showMessage("New game ready! Players are kept.");
});

// ====================
// Audit logging
// ====================
function logGame(data) {
    fetch("/log_game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}
