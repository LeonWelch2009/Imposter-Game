// Elements
const playerNameInput = document.getElementById("playerName");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const playerList = document.getElementById("playerList");
const startGameBtn = document.getElementById("startGameBtn");
const revealBtn = document.getElementById("revealBtn");
const nextPlayerBtn = document.getElementById("nextPlayerBtn");
const showImposterBtn = document.getElementById("showImposterBtn");
const restartBtn = document.getElementById("restartBtn");
const exitBtn = document.getElementById("exitBtn");

const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");
const message = document.getElementById("message");

let players = [];
let categories = {};
let chosenCategories = [];
let currentPlayerIndex = 0;
let imposter = null;
let currentWord = "";

// Auto-capitalize player names
function formatName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Update player list with remove buttons
function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach((name, index) => {
        const li = document.createElement("li");
        li.classList.add("player-item");

        const span = document.createElement("span");
        span.innerText = name;
        li.appendChild(span);

        const removeBtn = document.createElement("button");
        removeBtn.innerText = "×";
        removeBtn.classList.add("remove-btn");
        removeBtn.addEventListener("click", () => {
            players.splice(index, 1);
            updatePlayerList();
            message.innerText = `${name} removed.`;
        });

        li.appendChild(removeBtn);
        playerList.appendChild(li);
    });
}

// Add player
addPlayerBtn.addEventListener("click", () => {
    const name = playerNameInput.value.trim();
    if (name && !players.includes(formatName(name))) {
        players.push(formatName(name));
        playerNameInput.value = "";
        updatePlayerList();
    } else {
        message.innerText = "Enter a unique name.";
    }
});

// Fetch categories from server
fetch("/get_categories")
    .then(res => res.json())
    .then(data => {
        categories = data;
        const categoriesDiv = document.getElementById("categories");
        for (const category in data) {
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = category;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(category));
            categoriesDiv.appendChild(label);
        }
    });

// Start game
startGameBtn.addEventListener("click", () => {
    chosenCategories = Array.from(document.querySelectorAll("#categories input:checked")).map(cb => cb.value);
    if (players.length < 3) {
        message.innerText = "At least 3 players are required.";
        return;
    }
    if (chosenCategories.length === 0) {
        message.innerText = "Select at least one category.";
        return;
    }

    // Choose random imposter
    imposter = players[Math.floor(Math.random() * players.length)];

    // Pick random word
    const randomCategory = chosenCategories[Math.floor(Math.random() * chosenCategories.length)];
    const wordList = categories[randomCategory];
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];

    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    message.innerText = `${players[currentPlayerIndex]}, press "Reveal Word" to see your word.`;
});

// Reveal word
revealBtn.addEventListener("click", () => {
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer === imposter) {
        message.innerText = `${currentPlayer}, your word is: ??? (You are the Imposter!)`;
    } else {
        message.innerText = `${currentPlayer}, your word is: ${currentWord}`;
    }
    revealBtn.disabled = true;
    nextPlayerBtn.disabled = false;
});

// Next player
nextPlayerBtn.addEventListener("click", () => {
    currentPlayerIndex++;
    if (currentPlayerIndex < players.length) {
        revealBtn.disabled = false;
        nextPlayerBtn.disabled = true;
        message.innerText = `${players[currentPlayerIndex]}, press "Reveal Word" to see your word.`;
    } else {
        revealBtn.style.display = "none";
        nextPlayerBtn.style.display = "none";
        showImposterBtn.parentElement.style.display = "flex";
        message.innerText = `${players[Math.floor(Math.random() * players.length)]} starts the conversation!`;
    }
});

// Reveal imposter
showImposterBtn.addEventListener("click", () => {
    message.innerText = `The imposter was ${imposter}! The word was "${currentWord}".`;
    showImposterBtn.style.display = "none";
    restartBtn.style.display = "block";
});

// Restart
restartBtn.addEventListener("click", () => {
    players = [];
    chosenCategories = [];
    currentPlayerIndex = 0;
    imposter = null;
    currentWord = "";
    updatePlayerList();
    document.querySelectorAll("#categories input").forEach(cb => cb.checked = false);
    setupScreen.style.display = "block";
    gameScreen.style.display = "none";
    message.innerText = "Add players and select categories to start";
});

// Exit to main menu
exitBtn.addEventListener("click", () => {
    if (confirm("Return to main menu?")) {
        players = [];
        chosenCategories = [];
        currentPlayerIndex = 0;
        imposter = null;
        currentWord = "";
        updatePlayerList();
        document.querySelectorAll("#categories input").forEach(cb => cb.checked = false);
        setupScreen.style.display = "block";
        gameScreen.style.display = "none";
        message.innerText = "Add players and select categories to start";
    }
});
