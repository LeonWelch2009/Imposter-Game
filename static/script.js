// === Imposter Game ===

// DOM references
const screens = {
    main: document.getElementById("mainMenu"),
    game: document.getElementById("gameScreen")
};
const playerInput = document.getElementById("playerName");
const playerList = document.getElementById("playerList");
const startBtn = document.getElementById("startBtn");
const revealBtn = document.getElementById("revealWordBtn");
const nextBtn = document.getElementById("nextPlayerBtn");
const revealImposterBtn = document.getElementById("revealImposterBtn");
const newGameBtn = document.getElementById("newGameBtn");
const gameCard = document.getElementById("gameCard");
const message = document.querySelector(".message");
const categoriesDiv = document.getElementById("categories");
const showCategoriesBtn = document.getElementById("showCategoriesBtn");
const auditBtn = document.getElementById("auditBtn");

let players = [];
let words = {};
let selectedCategory = null;
let currentWord = "";
let imposter = "";
let currentIndex = 0;
let gameStarted = false;

// ====== INITIAL SETUP ======
fetch("words.txt")
    .then(res => res.text())
    .then(text => {
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        let currentCat = null;
        lines.forEach(line => {
            if (line.startsWith("#")) {
                currentCat = line.slice(1).trim();
                words[currentCat] = [];
            } else if (currentCat) {
                words[currentCat].push(line);
            }
        });
        renderCategories();
    });

// ====== CATEGORY SETUP ======
function renderCategories() {
    categoriesDiv.innerHTML = "";
    Object.keys(words).forEach(cat => {
        const div = document.createElement("div");
        div.className = "category-checkbox";
        div.innerHTML = `
      <label>
        <input type="checkbox" value="${cat}" ${loadCategoryState(cat) ? "checked" : ""}>
        ${cat}
      </label>`;
        categoriesDiv.appendChild(div);
    });
}

function loadCategoryState(cat) {
    return localStorage.getItem("cat_" + cat) === "true";
}

function saveCategoryState(cat, state) {
    localStorage.setItem("cat_" + cat, state);
}

// ====== PLAYER HANDLING ======
function addPlayer(name) {
    if (!name.trim() || players.includes(name)) return;
    players.push(name);
    updatePlayerList();
    playerInput.value = "";
}

function removePlayer(name) {
    players = players.filter(p => p !== name);
    updatePlayerList();
}

function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = `
      ${p}
      <button class="remove-player" onclick="removePlayer('${p}')">×</button>
    `;
        playerList.appendChild(li);
    });
}

// ====== GAME FLOW ======
function startGame() {
    const checkedCats = Array.from(categoriesDiv.querySelectorAll("input[type=checkbox]:checked")).map(i => i.value);
    if (!checkedCats.length) {
        alert("Please select at least one category!");
        return;
    }
    if (players.length < 3) {
        alert("Need at least 3 players!");
        return;
    }

    // Save category state
    checkedCats.forEach(cat => saveCategoryState(cat, true));
    Object.keys(words).forEach(cat => {
        if (!checkedCats.includes(cat)) saveCategoryState(cat, false);
    });

    // Pick random category and word
    selectedCategory = checkedCats[Math.floor(Math.random() * checkedCats.length)];
    const wordList = words[selectedCategory];
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];
    imposter = players[Math.floor(Math.random() * players.length)];
    currentIndex = 0;

    // UI updates
    screens.main.style.display = "none";
    screens.game.style.display = "flex";
    message.style.display = "none";
    revealBtn.style.display = "none";
    nextBtn.style.display = "none";
    revealImposterBtn.style.display = "none";
    newGameBtn.style.display = "none";
    showCategoriesBtn.style.display = "inline-block";
    auditBtn.style.display = "inline-block";

    gameCard.textContent = `${players[currentIndex]}`;
    gameStarted = true;

    // Delay a bit then show reveal button for first player
    setTimeout(() => {
        revealBtn.style.display = "inline-block";
    }, 400);
}

function revealWord() {
    const currentPlayer = players[currentIndex];
    if (currentPlayer === imposter) {
        gameCard.textContent = "IMPOSTER";
    } else {
        gameCard.textContent = currentWord;
    }
    gameCard.classList.add("flipped");
}

function hideWord() {
    gameCard.classList.remove("flipped");
    gameCard.textContent = players[currentIndex];
}

function nextPlayer() {
    currentIndex++;
    if (currentIndex < players.length) {
        gameCard.textContent = players[currentIndex];
    } else {
        revealBtn.style.display = "none";
        nextBtn.style.display = "none";
        revealImposterBtn.style.display = "inline-block";

        const randomStarter = players[Math.floor(Math.random() * players.length)];
        message.textContent = `${randomStarter} starts the conversation!`;
        message.style.display = "block";
    }
}

function revealImposter() {
    message.textContent = `The imposter was ${imposter}!`;
    revealImposterBtn.style.display = "none";
    newGameBtn.style.display = "inline-block";
}

function newGame() {
    screens.main.style.display = "flex";
    screens.game.style.display = "none";
    message.style.display = "none";
    gameStarted = false;
}

// ====== EVENT LISTENERS ======
playerInput.addEventListener("keydown", e => {
    if (e.key === "Enter") addPlayer(playerInput.value);
});

startBtn.addEventListener("click", startGame);

revealBtn.addEventListener("mousedown", revealWord);
revealBtn.addEventListener("mouseup", hideWord);
revealBtn.addEventListener("mouseleave", hideWord);
revealBtn.addEventListener("touchstart", e => {
    e.preventDefault();
    revealWord();
});
revealBtn.addEventListener("touchend", e => {
    e.preventDefault();
    hideWord();
});

nextBtn.addEventListener("click", nextPlayer);
revealImposterBtn.addEventListener("click", revealImposter);
newGameBtn.addEventListener("click", newGame);

showCategoriesBtn.addEventListener("click", () => {
    categoriesDiv.style.display = categoriesDiv.style.display === "none" ? "flex" : "none";
});

auditBtn.addEventListener("click", () => {
    alert(`Word: ${currentWord}\nImposter: ${imposter}\nCategory: ${selectedCategory}`);
});
