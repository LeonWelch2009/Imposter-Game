let players = [];
let currentPlayerIndex = 0;
let imposterIndexes = [];
let currentCategory = "";
let currentWord = "";
let allPlayersSeen = false;
let categories = {};
let availableCategories = [];
let lastSelectedCategories = JSON.parse(localStorage.getItem("selectedCategories")) || [];

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
const imposterCountSelect = document.getElementById("imposterCount");

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

// Render category checkboxes
function renderCategoryCheckboxes() {
    categoriesContainer.innerHTML = "";
    Object.keys(categories).forEach(cat => {
        const checked = lastSelectedCategories.includes(cat) ? "checked" : "";
        const div = document.createElement("div");
        div.classList.add("category-checkbox");
        div.innerHTML = `<label><input type="checkbox" value="${cat}" ${checked}> ${cat}</label>`;
        categoriesContainer.appendChild(div);
    });
}

// Start game
startGameBtn.onclick = () => {
    if (players.length < 3) {
        alert("Minimum 3 players required!");
        return;
    }

    // Get selected categories
    availableCategories = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
    if (!availableCategories.length) {
        alert("Select at least one category!");
        return;
    }

    // Save selected categories to local storage
    localStorage.setItem("selectedCategories", JSON.stringify(availableCategories));

    // Hide main menu
    setupScreen.style.display = "none";

    // Initialize game state
    currentPlayerIndex = 0;
    const imposterCount = parseInt(imposterCountSelect.value);

    imposterIndexes = [];
    while (imposterIndexes.length < imposterCount) {
        const randomIndex = Math.floor(Math.random() * players.length);
        if (!imposterIndexes.includes(randomIndex)) imposterIndexes.push(randomIndex);
    }

    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const words = categories[currentCategory];
    currentWord = words[Math.floor(Math.random() * words.length)];

    allPlayersSeen = false;

    // Show game screen
    gameScreen.style.display = "block";
    revealBtn.style.display = "inline-block";
    nextPlayerBtn.style.display = "inline-block";
    document.getElementById("endControls").style.display = "none";

    // Show first player
    gameMessage.textContent = `Player: ${players[currentPlayerIndex]}`;
};

// Reveal word (hold)
revealBtn.addEventListener("mousedown", revealWord);
revealBtn.addEventListener("touchstart", revealWord);
revealBtn.addEventListener("mouseup", hideWord);
revealBtn.addEventListener("mouseleave", hideWord);
revealBtn.addEventListener("touchend", hideWord);

function revealWord() {
    if (imposterIndexes.includes(currentPlayerIndex)) {
        gameMessage.textContent = `${players[currentPlayerIndex]} (IMPOSTER) - Category: ${currentCategory}`;
    } else {
        gameMessage.textContent = `${players[currentPlayerIndex]} - Word: ${currentWord}`;
    }
}

function hideWord() {
    gameMessage.textContent = `Player: ${players[currentPlayerIndex]}`;
}

// Next player
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
        gameMessage.textContent = `Player: ${players[currentPlayerIndex]}`;
    }
};

// Reveal imposters
showImposterBtn.onclick = () => {
    const imposters = imposterIndexes.map(i => players[i]).join(", ");
    gameMessage.textContent = `The IMPOSTER${imposterIndexes.length > 1 ? "S" : ""}: ${imposters}`;
};

// Restart game
restartBtn.onclick = () => {
    gameScreen.style.display = "none";
    setupScreen.style.display = "block";
    revealBtn.style.display = "inline-block";
    nextPlayerBtn.style.display = "inline-block";
    document.getElementById("endControls").style.display = "none";
    currentPlayerIndex = 0;
    imposterIndexes = [];
    currentCategory = "";
    currentWord = "";
    allPlayersSeen = false;
    gameMessage.textContent = "Add players and select categories to start";
};

// Audit button
auditBtn.onclick = () => {
    const auditInfo = `
Players: ${players.join(", ")}
Categories Selected: ${availableCategories.join(", ")}
Current Category: ${currentCategory || "None yet"}
Current Word: ${currentWord || "Not chosen"}
Imposter Count: ${imposterIndexes.length}
`;
    alert(auditInfo);
};

addPlayerBtn.onclick = addPlayer;
playerNameInput.addEventListener("keypress", (e) => { if (e.key === "Enter") addPlayer(); });
