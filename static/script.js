let players = [];
let currentPlayerIndex = 0;
let imposterIndices = [];
let currentCategory = "";
let currentWord = "";
let allPlayersSeen = false;
let categories = {};
let availableCategories = [];

const playerNameInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const playerList = document.getElementById("playerList");
const startGameBtn = document.getElementById("startGameBtn");
const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");
const gameMessage = document.getElementById("gameMessage");
const nextPlayerBtn = document.getElementById("nextPlayerBtn");
const showImposterBtn = document.getElementById("showImposterBtn");
const restartBtn = document.getElementById("restartBtn");
const categoriesContainer = document.getElementById("categories");
const showCategoriesBtn = document.getElementById("showCategoriesBtn");
const auditBtn = document.getElementById("auditBtn");

// Flip card
const flipCard = document.getElementById("flipCard");
const cardFront = document.getElementById("cardFront");
const cardBack = document.getElementById("cardBack");

// Fetch categories from Flask
fetch("/categories")
    .then(res => res.json())
    .then(data => {
        categories = data || {};
        availableCategories = Object.keys(categories);
        renderCategoryCheckboxes();
    })
    .catch(err => console.error("Failed to load categories:", err));

// Toggle categories
showCategoriesBtn.addEventListener("click", () => {
    if (categoriesContainer.style.display === "none") {
        categoriesContainer.style.display = "block";
    } else {
        categoriesContainer.style.display = "none";
    }
});

// Add player
function addPlayer() {
    let name = playerNameInput.value.trim();
    if (!name) return;
    name = name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    if (!players.includes(name)) {
        players.push(name);
        updatePlayerList();
        playerNameInput.value = "";
    }
}

addPlayerBtn.addEventListener("click", addPlayer);
playerNameInput.addEventListener("keypress", e => { if (e.key === "Enter") addPlayer(); });

function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach((p, idx) => {
        const li = document.createElement("li");
        li.className = "player-item";
        li.innerHTML = `<span>${p}</span><button class="remove-player">×</button>`;
        li.querySelector(".remove-player").addEventListener("click", () => removePlayer(idx));
        playerList.appendChild(li);
    });
}

function removePlayer(i) {
    players.splice(i, 1);
    updatePlayerList();
}

function renderCategoryCheckboxes() {
    categoriesContainer.innerHTML = "";
    Object.keys(categories).forEach(cat => {
        const div = document.createElement("div");
        div.className = "category-checkbox";
        div.innerHTML = `<label><input type="checkbox" value="${cat}" checked> ${cat}</label>`;
        categoriesContainer.appendChild(div);
    });
}

// Start game
startGameBtn.addEventListener("click", () => {
    if (players.length < 3) { alert("Minimum 3 players required!"); return; }
    const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
    if (!checked.length) { alert("Select at least one category!"); return; }
    availableCategories = checked;

    const imposterCount = players.length >= 6 ? 2 : 1;
    imposterIndices = [];
    while (imposterIndices.length < imposterCount) {
        const idx = Math.floor(Math.random() * players.length);
        if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
    }

    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const words = categories[currentCategory];
    currentWord = words[Math.floor(Math.random() * words.length)];

    currentPlayerIndex = 0;
    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    nextPlayerBtn.style.display = "inline-block";

    showCardForPlayer();
});

function showCardForPlayer() {
    flipCard.classList.remove("flipped");
    cardFront.textContent = players[currentPlayerIndex];
    cardBack.textContent = imposterIndices.includes(currentPlayerIndex)
        ? `IMPOSTER\nHint: ${currentCategory}`
        : currentWord;
    gameMessage.textContent = "";
}

flipCard.addEventListener("click", () => {
    flipCard.classList.toggle("flipped");
});

// Next player
nextPlayerBtn.addEventListener("click", () => {
    if (currentPlayerIndex >= players.length - 1) {
        allPlayersSeen = true;
        flipCard.style.display = "none";
        nextPlayerBtn.style.display = "none";
        document.getElementById("endControls").style.display = "flex";
        gameMessage.textContent = `${players[Math.floor(Math.random() * players.length)]} starts the conversation!`;
        logGame();
    } else {
        currentPlayerIndex++;
        showCardForPlayer();
    }
});

showImposterBtn.addEventListener("click", () => {
    const names = imposterIndices.map(i => players[i]).join(", ");
    gameMessage.textContent = `IMPOSTER(s): ${names}`;
});

restartBtn.addEventListener("click", () => {
    players = [];
    imposterIndices = [];
    currentWord = "";
    currentCategory = "";
    currentPlayerIndex = 0;
    allPlayersSeen = false;

    gameScreen.style.display = "none";
    setupScreen.style.display = "block";
    flipCard.style.display = "block";
    document.getElementById("endControls").style.display = "none";
    updatePlayerList();
    renderCategoryCheckboxes();
});

function logGame() {
    fetch("/log_game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            players,
            imposters: imposterIndices.map(i => players[i]),
            category: currentCategory,
            word: currentWord
        })
    }).catch(err => console.error("Failed to log:", err));
}

// Audit
auditBtn.addEventListener("click", () => {
    fetch("/audit")
        .then(res => res.json())
        .then(logs => {
            if (!logs.length) alert("No previous logs.");
            else alert("Previous Game Logs:\n" + logs.join("\n"));
        })
        .catch(err => alert("Failed to fetch audit logs."));
});

window.addEventListener("load", () => {
    renderCategoryCheckboxes();
    updatePlayerList();
});
