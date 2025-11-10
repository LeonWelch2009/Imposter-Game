document.addEventListener("DOMContentLoaded", () => {
    let players = [];
    let currentPlayerIndex = 0;
    let imposterIndices = [];
    let currentCategory = "";
    let currentWord = "";
    let categories = {};
    let availableCategories = [];
    let starter = "";
    let trollRound = false;

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
    const starterDisplay = document.getElementById("starterDisplay");
    const exitBtn = document.getElementById("exitBtn");

    // Load categories
    fetch("/categories")
        .then(res => res.json())
        .then(data => {
            categories = data || {};
            renderCategoryCheckboxes();
        })
        .catch(err => console.error(err));

    function renderCategoryCheckboxes() {
        categoriesContainer.innerHTML = "";
        Object.keys(categories).forEach(cat => {
            const saved = localStorage.getItem(`cat_${cat}`);
            const checkedAttr = saved === "true" || saved === null ? "checked" : "";
            const div = document.createElement("div");
            div.className = "category-checkbox";
            const formattedCat = cat.toLowerCase().split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
            div.innerHTML = `<input type="checkbox" value="${cat}" ${checkedAttr}><label>${formattedCat}</label>`;
            categoriesContainer.appendChild(div);
        });
        categoriesContainer.querySelectorAll("input[type='checkbox']").forEach(inp => {
            inp.addEventListener("change", () => {
                localStorage.setItem(`cat_${inp.value}`, inp.checked ? "true" : "false");
            });
        });
    }

    showCategoriesBtn.addEventListener("click", () => {
        categoriesContainer.style.display = categoriesContainer.style.display === "none" ? "block" : "none";
    });

    addPlayerBtn.addEventListener("click", addPlayer);
    playerNameInput.addEventListener("keypress", e => { if (e.key === "Enter") addPlayer(); });

    function addPlayer() {
        const name = playerNameInput.value.trim();
        if (!name) return;
        const formatted = name.split(/\s+/).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        if (!players.includes(formatted)) {
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
                players.splice(idx, 1);
                updatePlayerList();
            });
            playerList.appendChild(li);
        });
    }

    startGameBtn.addEventListener("click", () => {
        if (players.length < 3) return alert("Minimum 3 players required!");
        const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
        if (!checked.length) return alert("Select at least one category!");
        availableCategories = checked.slice();
        localStorage.setItem("selected_categories", JSON.stringify(availableCategories));

        imposterIndices = [];
        trollRound = Math.random() < 1/17;
        const imposterCount = trollRound ? players.length : (players.length >= 6 ? 2 : 1);
        while (imposterIndices.length < imposterCount) {
            const idx = Math.floor(Math.random() * players.length);
            if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
        }

        currentPlayerIndex = 0;
        pickWord();

        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        nextPlayerBtn.style.display = "none";
        revealImposterBtn.style.display = "none";
        starterDisplay.textContent = "";
        imposterDisplay.textContent = "";
        flipContainer.style.display = "block";
        exitBtn.style.display = "inline-block";
        updateCard();
    });

    function pickWord() {
        const catList = JSON.parse(localStorage.getItem("selected_categories")) || availableCategories;
        currentCategory = catList[Math.floor(Math.random() * catList.length)];
        const words = categories[currentCategory].words || [];
        currentWord = words[Math.floor(Math.random() * words.length)] || "";
    }

    function updateCard() {
        cardFront.textContent = players[currentPlayerIndex];
        const catInfo = categories[currentCategory];
        if (imposterIndices.includes(currentPlayerIndex)) {
            const showHint = !catInfo.hidden_hint && !trollRound;
            cardBack.textContent = `IMPOSTER${showHint ? `\n(Hint: ${currentWord[0]})` : ''}`;
        } else {
            cardBack.textContent = currentWord;
        }
        flipper.classList.remove("flipped");
        nextPlayerBtn.style.display = "none";
    }

    // Flip card
    flipper.addEventListener("click", () => {
        flipper.classList.toggle("flipped");
        if (flipper.classList.contains("flipped")) nextPlayerBtn.style.display = "inline-block";
    });

    nextPlayerBtn.addEventListener("click", () => {
        if (currentPlayerIndex >= players.length - 1) {
            flipContainer.style.display = "none";
            nextPlayerBtn.style.display = "none";
            starter = players[Math.floor(Math.random() * players.length)];
            starterDisplay.textContent = `${starter} starts the game!`;
            revealImposterBtn.style.display = "inline-block";
            exitBtn.style.display = "none";
        } else {
            currentPlayerIndex++;
            pickWord();
            updateCard();
        }
    });

    revealImposterBtn.addEventListener("click", () => {
        const names = imposterIndices.map(i => players[i]).join(", ");
        imposterDisplay.textContent = `IMPOSTER(s): ${names}`;
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "inline-block";
    });

    restartBtn.addEventListener("click", resetGame);
    exitBtn.addEventListener("click", () => {
        if (confirm("Return to main menu?")) resetGame();
    });

    function resetGame() {
        gameScreen.style.display = "none";
        setupScreen.style.display = "block";
        flipContainer.style.display = "block";
        nextPlayerBtn.style.display = "inline-block";
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "none";
        exitBtn.style.display = "none";
        starterDisplay.textContent = "";
        imposterDisplay.textContent = "";
        currentPlayerIndex = 0;
        players = [];
        imposterIndices = [];
        updatePlayerList();
        renderCategoryCheckboxes();
    }
});
