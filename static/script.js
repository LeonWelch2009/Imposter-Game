let players = [];
let currentPlayerIndex = 0;
let imposterIndices = [];
let categories = {};
let currentCategory = "";
let currentWord = "";
let revealMode = false;

const playerInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const playerList = document.getElementById("playerList");
const categoriesContainer = document.getElementById("categories");
const startBtn = document.getElementById("startBtn");
const clearBtn = document.getElementById("clearBtn");
const gameScreen = document.getElementById("game-screen");
const setupScreen = document.getElementById("setup-screen");
const gameMessage = document.getElementById("gameMessage");
const revealBtn = document.getElementById("revealBtn");
const nextBtn = document.getElementById("nextBtn");

async function fetchCategories() {
    const res = await fetch("/categories");
    categories = await res.json();
    renderCategoryCheckboxes();
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

addPlayerBtn.addEventListener("click", () => {
    const name = playerInput.value.trim();
    if (!name) return;
    players.push(name);
    playerInput.value = "";
    renderPlayers();
});

function renderPlayers() {
    playerList.innerHTML = "";
    players.forEach((p, i) => {
        const li = document.createElement("li");
        li.className = "player-item";
        li.innerHTML = `${p} <button class="remove-player" data-index="${i}">x</button>`;
        playerList.appendChild(li);
    });

    document.querySelectorAll(".remove-player").forEach(btn => {
        btn.addEventListener("click", () => {
            players.splice(btn.dataset.index, 1);
            renderPlayers();
        });
    });
}

clearBtn.addEventListener("click", () => {
    players = [];
    renderPlayers();
});

startBtn.addEventListener("click", startGame);

function startGame() {
    const selectedCategories = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
    if (selectedCategories.length === 0 || players.length < 3) {
        alert("Need at least 3 players and 1 category!");
        return;
    }

    currentCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
    const words = categories[currentCategory] || [];
    currentWord = words[Math.floor(Math.random() * words.length)];
    imposterIndices = [Math.floor(Math.random() * players.length)];

    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    currentPlayerIndex = 0;
    revealMode = false;
    updateGameMessage();
}

function updateGameMessage() {
    if (currentPlayerIndex >= players.length) {
        gameMessage.textContent = "All players have seen their word!";
        revealBtn.style.display = "none";
        nextBtn.style.display = "none";
        return;
    }
    gameMessage.textContent = `${players[currentPlayerIndex]}, click reveal to see your word.`;
}

revealBtn.addEventListener("click", () => {
    if (revealMode) return;
    revealNow();
});

function revealNow() {
    if (imposterIndices.includes(currentPlayerIndex)) {
        gameMessage.textContent = `${players[currentPlayerIndex]} — IMPOSTER! Category: ${currentCategory}`;
    } else {
        gameMessage.textContent = `${players[currentPlayerIndex]} — ${currentWord}`;
    }
    revealMode = true;
}

nextBtn.addEventListener("click", () => {
    if (!revealMode) return;
    currentPlayerIndex++;
    revealMode = false;
    updateGameMessage();
});

fetchCategories();
