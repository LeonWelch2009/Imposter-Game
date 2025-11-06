// === Reverted working script.js (single imposter, category memory, hold-to-reveal) ===

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

// Start with categories hidden
if (categoriesContainer) categoriesContainer.style.display = "none";

// Fetch categories from Flask endpoint /categories
fetch("/categories")
    .then(res => res.json())
    .then(data => {
        categories = data || {};
        availableCategories = Object.keys(categories);
        renderCategoryCheckboxes();
    })
    .catch(err => {
        console.error("Failed to load categories:", err);
    });

// Toggle categories list
if (showCategoriesBtn) {
    showCategoriesBtn.addEventListener("click", () => {
        if (!categoriesContainer) return;
        categoriesContainer.style.display =
            categoriesContainer.style.display === "none" ? "block" : "none";
    });
}

// Add player
function addPlayer() {
    if (!playerNameInput) return;
    let name = playerNameInput.value.trim();
    if (!name) return;
    // Auto-capitalize properly
    name = name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    if (!players.includes(name)) {
        players.push(name);
        updatePlayerList();
        playerNameInput.value = "";
    } else {
        // optional feedback
        console.log("Player already added:", name);
    }
}

// Update players UI
function updatePlayerList() {
    if (!playerList) return;
    playerList.innerHTML = "";
    players.forEach((p, idx) => {
        const li = document.createElement("li");
        li.className = "player-item";
        li.innerHTML = `
      <span class="player-name">${p}</span>
      <button class="remove-player" type="button" title="Remove player">×</button>
    `;
        const btn = li.querySelector(".remove-player");
        btn.addEventListener("click", () => {
            removePlayer(idx);
        });
        playerList.appendChild(li);
    });
}

// Remove player by index
function removePlayer(index) {
    if (index < 0 || index >= players.length) return;
    players.splice(index, 1);
    updatePlayerList();
}

// Render category checkboxes and restore saved states from localStorage
function renderCategoryCheckboxes() {
    if (!categoriesContainer) return;
    categoriesContainer.innerHTML = "";
    const keys = Object.keys(categories);
    keys.forEach(cat => {
        const saved = localStorage.getItem(`cat_${cat}`);
        const checkedAttr = saved === null ? "checked" : (saved === "true" ? "checked" : "");
        const wrapper = document.createElement("div");
        wrapper.className = "category-checkbox";
        wrapper.innerHTML = `<label><input type="checkbox" value="${cat}" ${checkedAttr}> ${cat}</label>`;
        categoriesContainer.appendChild(wrapper);
    });

    // Wire change handlers to save state
    const inputs = categoriesContainer.querySelectorAll("input[type='checkbox']");
    inputs.forEach(inp => {
        inp.addEventListener("change", () => {
            localStorage.setItem(`cat_${inp.value}`, inp.checked ? "true" : "false");
        });
    });
}

// Start the game
if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
        if (players.length < 3) {
            alert("Minimum 3 players required!");
            return;
        }

        // Gather selected category names
        const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
        if (!checked.length) {
            alert("Select at least one category!");
            return;
        }
        availableCategories = checked.slice();

        // Select imposter and a category/word (but don't reveal yet)
        imposterIndex = Math.floor(Math.random() * players.length);
        currentPlayerIndex = 0;
        currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const words = categories[currentCategory] || [];
        currentWord = words.length ? words[Math.floor(Math.random() * words.length)] : "";

        // Switch UI
        if (setupScreen) setupScreen.style.display = "none";
        if (gameScreen) gameScreen.style.display = "block";

        // Hide end controls and ensure reveal/next appear for gameplay
        const endControls = document.getElementById("endControls");
        if (endControls) endControls.style.display = "none";

        // Show reveal/next now that round started
        if (revealBtn) revealBtn.style.display = "inline-block";
        if (nextPlayerBtn) nextPlayerBtn.style.display = "inline-block";

        // Initial player shown (name only)
        if (gameMessage) gameMessage.textContent = `${players[currentPlayerIndex]}`;
    });
}

// Reveal word only while hold (desktop + mobile)
function revealNow() {
    if (!gameMessage) return;
    if (currentPlayerIndex === imposterIndex) {
        gameMessage.textContent = `${players[currentPlayerIndex]} — IMPOSTER! Category: ${currentCategory}`;
    } else {
        gameMessage.textContent = `${players[currentPlayerIndex]} — ${currentWord}`;
    }
}
function hideNow() {
    if (!gameMessage) return;
    if (!allPlayersSeen) {
        gameMessage.textContent = `${players[currentPlayerIndex]}`;
    } else {
        // If round finished, keep final message
    }
}

// Wire hold behavior (if button exists)
if (revealBtn) {
    // Desktop
    revealBtn.addEventListener("mousedown", (e) => { e.preventDefault(); revealNow(); });
    revealBtn.addEventListener("mouseup", (e) => { e.preventDefault(); hideNow(); });
    revealBtn.addEventListener("mouseleave", (e) => { e.preventDefault(); hideNow(); });

    // Touch (mobile)
    revealBtn.addEventListener("touchstart", (e) => { e.preventDefault(); revealNow(); }, { passive: false });
    revealBtn.addEventListener("touchend", (e) => { e.preventDefault(); hideNow(); }, { passive: false });
}

// Next player
if (nextPlayerBtn) {
    nextPlayerBtn.addEventListener("click", () => {
        if (currentPlayerIndex >= players.length - 1) {
            allPlayersSeen = true;
            const starter = players[Math.floor(Math.random() * players.length)];
            if (gameMessage) gameMessage.textContent = `${starter} starts the conversation!`;

            // hide reveal/next, show end controls
            if (revealBtn) revealBtn.style.display = "none";
            if (nextPlayerBtn) nextPlayerBtn.style.display = "none";
            const endControls = document.getElementById("endControls");
            if (endControls) endControls.style.display = "flex";
        } else {
            currentPlayerIndex++;
            if (gameMessage) gameMessage.textContent = `${players[currentPlayerIndex]}`;
        }
    });
}

// Reveal imposter (end)
if (showImposterBtn) {
    showImposterBtn.addEventListener("click", () => {
        if (gameMessage) gameMessage.textContent = `The IMPOSTER is: ${players[imposterIndex]}`;
    });
}

// Restart game but keep players and category selections (main menu)
if (restartBtn) {
    restartBtn.addEventListener("click", () => {
        if (gameScreen) gameScreen.style.display = "none";
        if (setupScreen) setupScreen.style.display = "block";

        // Reset state
        currentPlayerIndex = 0;
        imposterIndex = -1;
        currentCategory = "";
        currentWord = "";
        allPlayersSeen = false;

        // Restore checkboxes from localStorage (they were saved on change)
        renderCategoryCheckboxes();

        if (gameMessage) gameMessage.textContent = "Add players and select categories to start";
    });
}

// Audit button — shows current game info
if (auditBtn) {
    auditBtn.addEventListener("click", () => {
        if (!currentWord) {
            alert("No game running yet.");
            return;
        }
        const info = `Category: ${currentCategory}\nWord: ${currentWord}\nImposter: ${players[imposterIndex]}`;
        alert(info);
    });
}

// Wire add player and Enter key
if (addPlayerBtn) addPlayerBtn.addEventListener("click", addPlayer);
if (playerNameInput) playerNameInput.addEventListener("keypress", (e) => { if (e.key === "Enter") addPlayer(); });

// Initial render (if categories already loaded)
function initAfterLoad() {
    renderCategoryCheckboxes();
    updatePlayerList();
}
window.addEventListener("load", initAfterLoad);
