let players = [];
let currentPlayerIndex = 0;
let imposterIndex = -1;
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
const revealBtn = document.getElementById("revealBtn");
const nextPlayerBtn = document.getElementById("nextPlayerBtn");
const showImposterBtn = document.getElementById("showImposterBtn");
const restartBtn = document.getElementById("restartBtn");
const categoriesContainer = document.getElementById("categories");
const showCategoriesBtn = document.getElementById("showCategoriesBtn");
const auditBtn = document.getElementById("auditBtn");

// Hide categories by default
categoriesContainer.style.display = "none";

// Fetch categories from Flask
fetch("/categories")
    .then(res => res.json())
    .then(data => {
        categories = data;
        availableCategories = Object.keys(categories);
        renderCategoryCheckboxes();
    })
    .catch(err => console.error("Failed to load categories:", err));

// Toggle category list
showCategoriesBtn.onclick = () => {
    categoriesContainer.style.display =
        categoriesContainer.style.display === "none" ? "block" : "none";
};

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

// ===== CATEGORY CHECKBOXES =====
function renderCategoryCheckboxes() {
    categoriesContainer.innerHTML = "";
    Object.keys(categories).forEach(cat => {
        const checked = localStorage.getItem(`cat_${cat}`) === "true";
        const div = document.createElement("div");
        div.classList.add("category-checkbox");
        div.innerHTML = `
      <label>
        <input type="checkbox" value="${cat}" ${checked ? "checked" : ""}>
        ${cat}
      </label>`;
        categoriesContainer.appendChild(div);
    });

    // Save state when changed
    document.querySelectorAll("#categories input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
            localStorage.setItem(`cat_${cb.value}`, cb.checked);
        });
    });
}

// ===== START GAME =====
startGameBtn.onclick = () => {
    if (players.length < 3) {
        alert("Minimum 3 players required!");
        return;
    }

    // Get selected categories
    availableCategories = Array.from(
        document.querySelectorAll("#categories input:checked")
    ).map(i => i.value);

    if (!availableCategories.length) {
        alert("Select at least one category!");
        return;
    }

    // Save selected categories to memory
    availableCategories.forEach(cat => localStorage.setItem(`cat_${cat}`, true));

    // Hide setup, show game
    setupScreen.style.display = "none";
    gameScreen.style.display = "block";

    // Initialize game
    currentPlayerIndex = 0;
    imposterIndex = Math.floor(Math.random() * players.length);
    currentCategory =
        availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const words = categories[currentCategory];
    currentWord = words[Math.floor(Math.random() * words.length)];
    allPlayersSeen = false;

    // Reset controls
    revealBtn.style.display = "inline-block";
    nextPlayerBtn.style.display = "inline-block";
    document.getElementById("endControls").style.display = "none";

    gameMessage.textContent = `Current Player: ${players[currentPlayerIndex]}`;
};

// ===== REVEAL WORD ON HOLD =====
function showWord() {
    if (currentPlayerIndex === imposterIndex) {
        gameMessage.textContent = `${players[currentPlayerIndex]} (Imposter) - Category: ${currentCategory}`;
    } else {
        gameMessage.textContent = `${players[currentPlayerIndex]} - Word: ${currentWord}`;
    }
}

function hideWord() {
    gameMessage.textContent = `Current Player: ${players[currentPlayerIndex]}`;
}

revealBtn.addEventListener("mousedown", showWord);
revealBtn.addEventListener("mouseup", hideWord);
revealBtn.addEventListener("mouseleave", hideWord);
revealBtn.addEventListener("touchstart", e => {
    e.preventDefault();
    showWord();
});
revealBtn.addEventListener("touchend", e => {
    e.preventDefault();
    hideWord();
});

// ===== NEXT PLAYER =====
nextPlayerBtn.onclick = () => {
    if (currentPlayerIndex === players.length - 1) {
        allPlayersSeen = true;

        const randomStarter = players[Math.floor(Math.random() * players.length)];
        gameMessage.textContent = `${randomStarter} starts the conversation!`;

        revealBtn.style.display = "none";
        nextPlayerBtn.style.display = "none";
        document.getElementById("endControls").style.display = "flex";
    } else {
        currentPlayerIndex++;
        gameMessage.textContent = `Current Player: ${players[currentPlayerIndex]}`;
    }
};

// ===== REVEAL IMPOSTER =====
showImposterBtn.onclick = () => {
    gameMessage.textContent = `The IMPOSTER is: ${players[imposterIndex]}`;
};

// ===== RESTART =====
restartBtn.onclick = () => {
    gameScreen.style.display = "none";
    setupScreen.style.display = "block";
    gameMessage.textContent = "Add players and select categories to start";

    currentPlayerIndex = 0;
    imposterIndex = -1;
    currentCategory = "";
    currentWord = "";
    allPlayersSeen = false;
};

// ===== AUDIT BUTTON =====
auditBtn.onclick = () => {
    if (!currentWord) {
        alert("No game running yet!");
    } else {
        alert(`Category: ${currentCategory}\nWord: ${currentWord}\nImposter: ${players[imposterIndex]}`);
    }
};

addPlayerBtn.onclick = addPlayer;
playerNameInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addPlayer();
});
