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
const revealBtn = document.getElementById("revealBtn");
const nextPlayerBtn = document.getElementById("nextPlayerBtn");
const showImposterBtn = document.getElementById("showImposterBtn");
const restartBtn = document.getElementById("restartBtn");
const categoriesContainer = document.getElementById("categories");
const showCategoriesBtn = document.getElementById("showCategoriesBtn");
const auditBtn = document.getElementById("auditBtn");

if (categoriesContainer) categoriesContainer.style.display = "none";

// Fetch categories
fetch("/categories")
    .then(res => res.json())
    .then(data => {
        categories = data || {};
        availableCategories = Object.keys(categories);
        renderCategoryCheckboxes();
    })
    .catch(err => console.error("Failed to load categories:", err));

// Toggle category list
if (showCategoriesBtn) {
    showCategoriesBtn.addEventListener("click", () => {
        if (!categoriesContainer) return;
        categoriesContainer.style.display =
            categoriesContainer.style.display === "none" ? "block" : "none";
    });
}

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

function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach((p, idx) => {
        const li = document.createElement("li");
        li.className = "player-item";
        li.innerHTML = `
            <span class="player-name">${p}</span>
            <button class="remove-player" type="button" title="Remove player">×</button>
        `;
        li.querySelector(".remove-player").addEventListener("click", () => removePlayer(idx));
        playerList.appendChild(li);
    });
}

function removePlayer(index) {
    players.splice(index, 1);
    updatePlayerList();
}

// Render categories (ignore hint flag visually)
function renderCategoryCheckboxes() {
    if (!categoriesContainer) return;
    categoriesContainer.innerHTML = "";

    Object.entries(categories).forEach(([cat, data]) => {
        const saved = localStorage.getItem(`cat_${cat}`);
        const checkedAttr = saved === null ? "checked" : (saved === "true" ? "checked" : "");
        const div = document.createElement("div");
        div.className = "category-checkbox";
        div.innerHTML = `<label><input type="checkbox" value="${cat}" ${checkedAttr}> ${cat}</label>`;
        categoriesContainer.appendChild(div);
    });

    categoriesContainer.querySelectorAll("input[type='checkbox']").forEach(inp => {
        inp.addEventListener("change", () => {
            localStorage.setItem(`cat_${inp.value}`, inp.checked ? "true" : "false");
        });
    });
}

// Start game
startGameBtn.addEventListener("click", () => {
    if (players.length < 3) { alert("Minimum 3 players required!"); return; }

    const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
    if (!checked.length) { alert("Select at least one category!"); return; }
    availableCategories = checked.slice();

    // Imposter selection
    imposterIndices = [];
    const imposterCount = players.length >= 6 ? 2 : 1;
    while (imposterIndices.length < imposterCount) {
        const idx = Math.floor(Math.random() * players.length);
        if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
    }

    currentPlayerIndex = 0;
    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const catData = categories[currentCategory] || { words: [], hint: false };
    const words = catData.words || [];
    currentWord = words.length ? words[Math.floor(Math.random() * words.length)] : "";

    setupScreen.style.display = "none";
    gameScreen.style.display = "block";

    document.getElementById("endControls").style.display = "none";
    revealBtn.style.display = "inline-block";
    nextPlayerBtn.style.display = "inline-block";

    gameMessage.textContent = players[currentPlayerIndex];
});

// Reveal word logic with hint feature
function revealNow() {
    const catData = categories[currentCategory] || { hint: false };
    const isHinted = catData.hint === true;

    if (imposterIndices.includes(currentPlayerIndex)) {
        if (isHinted && currentWord) {
            const firstLetter = currentWord.charAt(0).toUpperCase();
            gameMessage.textContent = `${players[currentPlayerIndex]} — IMPOSTER! Hint: ${firstLetter}... (${currentCategory})`;
        } else {
            gameMessage.textContent = `${players[currentPlayerIndex]} — IMPOSTER! Category: ${currentCategory}`;
        }
    } else {
        gameMessage.textContent = `${players[currentPlayerIndex]} — ${currentWord}`;
    }
}

function hideNow() {
    if (!allPlayersSeen) gameMessage.textContent = players[currentPlayerIndex];
}

// Reveal button interactions
revealBtn.addEventListener("mousedown", e => { e.preventDefault(); revealNow(); });
revealBtn.addEventListener("mouseup", e => { e.preventDefault(); hideNow(); });
revealBtn.addEventListener("mouseleave", e => { e.preventDefault(); hideNow(); });
revealBtn.addEventListener("touchstart", e => { e.preventDefault(); revealNow(); }, { passive: false });
revealBtn.addEventListener("touchend", e => { e.preventDefault(); hideNow(); }, { passive: false });

// Log game
function logGame() {
    const payload = {
        players: players,
        imposters: imposterIndices.map(i => players[i]),
        category: currentCategory,
        word: currentWord
    };
    fetch("/log_game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Failed to log game:", err));
}

// Next player
nextPlayerBtn.addEventListener("click", () => {
    if (currentPlayerIndex >= players.length - 1) {
        allPlayersSeen = true;

        // 🧠 Pick random non-imposter starter
        const nonImposters = players.filter((_, idx) => !imposterIndices.includes(idx));
        const starter = nonImposters[Math.floor(Math.random() * nonImposters.length)];

        gameMessage.textContent = `${starter} starts the conversation!`;
        revealBtn.style.display = "none";
        nextPlayerBtn.style.display = "none";
        document.getElementById("endControls").style.display = "flex";
        logGame();
    } else {
        currentPlayerIndex++;
        gameMessage.textContent = players[currentPlayerIndex];
    }
});

// Reveal imposters
showImposterBtn.addEventListener("click", () => {
    const names = imposterIndices.map(i => players[i]).join(", ");
    gameMessage.textContent = `IMPOSTER(s): ${names}`;
});

// Restart
restartBtn.addEventListener("click", () => {
    gameScreen.style.display = "none";
    setupScreen.style.display = "block";
    currentPlayerIndex = 0;
    imposterIndices = [];
    currentCategory = "";
    currentWord = "";
    allPlayersSeen = false;
    renderCategoryCheckboxes();
    gameMessage.textContent = "Add players and select categories to start";
});

// Audit
auditBtn.addEventListener("click", () => {
    fetch("/audit")
        .then(res => res.json())
        .then(logs => {
            if (!logs.length) { alert("No previous game logs."); return; }
            alert("Previous Game Logs:\n" + logs.join("\n"));
        })
        .catch(err => alert("Failed to fetch audit logs."));
});

addPlayerBtn.addEventListener("click", addPlayer);
playerNameInput.addEventListener("keypress", e => { if (e.key === "Enter") addPlayer(); });

window.addEventListener("load", () => { renderCategoryCheckboxes(); updatePlayerList(); });
