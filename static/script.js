document.addEventListener("DOMContentLoaded", () => {
    let players = [];
    let currentPlayerIndex = 0;
    let imposterIndices = [];
    let currentCategory = "";
    let currentWord = "";
    let categories = {};
    let availableCategories = [];
    let categoryHints = {}; // to store if category has 'h'
    let trollRound = false;

    // DOM elements
    const playerNameInput = document.getElementById("playerName");
    const addPlayerBtn = document.getElementById("addPlayerBtn");
    const playerList = document.getElementById("playerList");
    const startGameBtn = document.getElementById("startGameBtn");
    const setupScreen = document.getElementById("setupScreen");
    const gameScreen = document.getElementById("gameScreen");
    const showCategoriesBtn = document.getElementById("showCategoriesBtn");
    const categoriesContainer = document.getElementById("categories");
    const flipContainer = document.getElementById("flipContainer");
    const flipper = document.getElementById("flipper");
    const cardFront = document.getElementById("cardFront");
    const cardBack = document.getElementById("cardBack");
    const nextPlayerBtn = document.getElementById("nextPlayerBtn");
    const revealImposterBtn = document.getElementById("revealImposterBtn");
    const imposterDisplay = document.getElementById("imposterDisplay");
    const restartBtn = document.getElementById("restartBtn");

    // New elements
    const startText = document.createElement("div");
    startText.id = "startText";
    startText.style.fontWeight = "bold";
    startText.style.marginBottom = "10px";
    gameScreen.insertBefore(startText, flipContainer);

    const exitBtn = document.createElement("button");
    exitBtn.id = "exitBtn";
    exitBtn.textContent = "X";
    exitBtn.style.position = "absolute";
    exitBtn.style.top = "10px";
    exitBtn.style.right = "10px";
    exitBtn.style.width = "30px";
    exitBtn.style.height = "30px";
    exitBtn.style.borderRadius = "50%";
    exitBtn.style.background = "#ff4d4d";
    exitBtn.style.color = "#fff";
    exitBtn.style.fontWeight = "bold";
    exitBtn.style.border = "none";
    exitBtn.style.cursor = "pointer";
    exitBtn.style.zIndex = "10";
    exitBtn.style.display = "none";
    gameScreen.appendChild(exitBtn);

    exitBtn.addEventListener("click", () => {
        if(confirm("Go back to main menu?")) {
            resetGame();
        }
    });

    // === Load categories from server ===
    fetch("/categories")
      .then(res => res.json())
      .then(data => {
        categories = data || {};
        Object.keys(categories).forEach(cat => {
            // Check if category has 'h' at the end
            if(cat.endsWith(" h")) {
                categoryHints[cat] = false; // imposter does NOT get first letter
            } else {
                categoryHints[cat] = true;  // imposter DOES get first letter
            }
        });
        renderCategoryCheckboxes();
      })
      .catch(err => console.error("Failed to load categories:", err));

    // === Render category checkboxes ===
    function renderCategoryCheckboxes() {
        categoriesContainer.innerHTML = "";
        Object.keys(categories).forEach(cat => {
            const saved = localStorage.getItem(`cat_${cat}`);
            const checkedAttr = saved === "true" || saved === null ? "checked" : "";
            const div = document.createElement("div");
            div.className = "category-checkbox";
            const formattedCat = cat.replace(/ h$/, "").toLowerCase().split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
            div.innerHTML = `<input type="checkbox" value="${cat}" ${checkedAttr}><label>${formattedCat}</label>`;
            categoriesContainer.appendChild(div);
        });
        categoriesContainer.querySelectorAll("input[type='checkbox']").forEach(inp => {
            inp.addEventListener("change", () => {
                localStorage.setItem(`cat_${inp.value}`, inp.checked ? "true" : "false");
            });
        });
    }

    // === Show / Hide categories button ===
    showCategoriesBtn.addEventListener("click", () => {
        const isHidden = window.getComputedStyle(categoriesContainer).display === "none";
        categoriesContainer.style.display = isHidden ? "block" : "none";
    });

    // === Add player ===
    addPlayerBtn.addEventListener("click", addPlayer);
    playerNameInput.addEventListener("keypress", e => { if(e.key === "Enter") addPlayer(); });

    function addPlayer() {
        const name = playerNameInput.value.trim();
        if(!name) return;
        const formatted = name.split(/\s+/).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        if(!players.includes(formatted)) {
            players.push(formatted);
            playerNameInput.value = "";
            updatePlayerList();
        }
    }

    function updatePlayerList() {
        playerList.innerHTML = "";
        players.forEach((p, idx) => {
            const li = document.createElement("li");
            li.className = "player-item";
            li.innerHTML = `<span>${p}</span><button class="remove-player">×</button>`;
            li.querySelector("button").addEventListener("click", () => {
                players.splice(idx,1);
                updatePlayerList();
            });
            playerList.appendChild(li);
        });
    }

    // === Start game ===
    startGameBtn.addEventListener("click", startGame);

    function startGame() {
        if(players.length < 3) return alert("Minimum 3 players required!");
        const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
        if(!checked.length) return alert("Select at least one category!");

        availableCategories = checked.slice();
        localStorage.setItem("selected_categories", JSON.stringify(availableCategories));

        // Troll round
        trollRound = Math.random() < 0.065; // ~1 in 15 chance

        // Assign imposters
        imposterIndices = [];
        if(trollRound) {
            imposterIndices = players.map((_, i) => i); // everyone is imposter
        } else {
            const imposterCount = players.length >= 6 ? 2 : 1;
            while(imposterIndices.length < imposterCount) {
                const idx = Math.floor(Math.random() * players.length);
                if(!imposterIndices.includes(idx)) imposterIndices.push(idx);
            }
        }

        // Randomize who starts
        const starterIndex = Math.floor(Math.random() * players.length);
        startText.textContent = `${players[starterIndex]} starts the game`;

        currentPlayerIndex = 0;
        pickWord();

        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        nextPlayerBtn.style.display = "none"; // hidden until flipped
        revealImposterBtn.style.display = "none";
        imposterDisplay.textContent = "";
        flipContainer.style.display = "block";
        exitBtn.style.display = "inline-block";
        updateCard();
    }

    function pickWord() {
        const catList = JSON.parse(localStorage.getItem("selected_categories")) || availableCategories;
        currentCategory = catList[Math.floor(Math.random() * catList.length)];
        const words = categories[currentCategory] || [];
        currentWord = words[Math.floor(Math.random() * words.length)] || "";
    }

    function updateCard() {
        cardFront.textContent = players[currentPlayerIndex];
        if(imposterIndices.includes(currentPlayerIndex)) {
            const showLetter = categoryHints[currentCategory] ? currentWord[0] : "";
            cardBack.textContent = `IMPOSTER\n${showLetter}`;
        } else {
            cardBack.textContent = currentWord;
        }
        flipper.classList.remove("flipped");
        nextPlayerBtn.style.display = "none";
    }

    // === Flip card ===
    flipper.addEventListener("click", () => {
        flipper.classList.toggle("flipped");
        if(flipper.classList.contains("flipped")) {
            nextPlayerBtn.style.display = "inline-block";
        }
    });

    // === Next Player ===
    nextPlayerBtn.addEventListener("click", () => {
        if(currentPlayerIndex >= players.length - 1) {
            nextPlayerBtn.style.display = "none";
            flipContainer.style.display = "none";
            exitBtn.style.display = "none";
            revealImposterBtn.style.display = "inline-block";
        } else {
            currentPlayerIndex++;
            pickWord();
            updateCard();
        }
    });

    // === Reveal Imposter(s) ===
    revealImposterBtn.addEventListener("click", () => {
        const names = imposterIndices.map(i => players[i]).join(", ");
        imposterDisplay.textContent = `IMPOSTER(s): ${names}`;
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "inline-block";
    });

    // === Reset Game ===
    function resetGame() {
        gameScreen.style.display = "none";
        setupScreen.style.display = "block";
        flipContainer.style.display = "block";
        nextPlayerBtn.style.display = "inline-block";
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "none";
        exitBtn.style.display = "none";
        imposterDisplay.textContent = "";
        currentPlayerIndex = 0;
        startText.textContent = "";
        updatePlayerList();
        renderCategoryCheckboxes();
    }

    restartBtn.addEventListener("click", resetGame);
});
