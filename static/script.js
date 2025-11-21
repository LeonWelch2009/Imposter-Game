document.addEventListener("DOMContentLoaded", () => {
    let players = [];
    let currentPlayerIndex = 0;
    let imposterIndices = [];
    let currentCategory = "";
    let currentWord = "";
    let currentHint = "";
    let categories = {};
    let availableCategories = [];

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
    const exitGameBtn = document.getElementById("exitGameBtn");

    // === Load categories ===
    fetch("/categories")
        .then(res => res.json())
        .then(data => {
            categories = data || {};
            renderCategoryCheckboxes();
        })
        .catch(err => console.error("Failed to load categories:", err));

    // === Render category selection ===
    function renderCategoryCheckboxes() {
        categoriesContainer.innerHTML = "";
        Object.keys(categories).forEach(cat => {
            const saved = localStorage.getItem(`cat_${cat}`);
            const checkedAttr = saved === "true" || saved === null ? "checked" : "";
            const div = document.createElement("div");
            div.className = "category-checkbox";

            const formattedCat = cat.toLowerCase().split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

            div.innerHTML = `
                <input type="checkbox" value="${cat}" ${checkedAttr}>
                <label>${formattedCat}</label>
            `;
            categoriesContainer.appendChild(div);
        });

        categoriesContainer.querySelectorAll("input").forEach(inp => {
            inp.addEventListener("change", () => {
                localStorage.setItem(`cat_${inp.value}`, inp.checked);
            });
        });
    }

    showCategoriesBtn.addEventListener("click", () => {
        const isHidden = categoriesContainer.style.display === "none";
        categoriesContainer.style.display = isHidden ? "block" : "none";
        showCategoriesBtn.textContent = isHidden ? "Hide Categories" : "Show Categories";
    });

    // === Add player ===
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

    // === Start Game ===
    startGameBtn.addEventListener("click", () => {
        if (players.length < 3) return alert("Minimum 3 players required!");
        const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
        if (!checked.length) return alert("Select at least one category!");

        availableCategories = checked;
        localStorage.setItem("selected_categories", JSON.stringify(availableCategories));

        imposterIndices = [];

        // Troll Mode: 1 in 15 chance
        const isTrollRound = Math.random() < (1 / 15);

        if (isTrollRound) {
            console.log("😈 Troll Mode Activated");
            imposterIndices = players.map((_, index) => index);
        } else {
            const imposterCount = players.length >= 6 ? 2 : 1;
            while (imposterIndices.length < imposterCount) {
                const idx = Math.floor(Math.random() * players.length);
                if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
            }
        }

        currentPlayerIndex = 0;
        pickWord();

        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        nextPlayerBtn.style.display = "inline-block";
        revealImposterBtn.style.display = "none";
        imposterDisplay.textContent = "";
        flipContainer.style.display = "block";
        updateCard();
    });

    function pickWord() {
        const catList = JSON.parse(localStorage.getItem("selected_categories")) || availableCategories;
        currentCategory = catList[Math.floor(Math.random() * catList.length)];
        const wordsList = categories[currentCategory] || [];

        const selection = wordsList[Math.floor(Math.random() * wordsList.length)];

        if (selection) {
            currentWord = selection.word;
            // Pick ONE random hint from the list of 3
            const hints = selection.hints || [];
            if (hints.length > 0) {
                currentHint = hints[Math.floor(Math.random() * hints.length)];
            } else {
                currentHint = currentCategory;
            }
        } else {
            currentWord = "Error";
            currentHint = "Error";
        }
    }

    function updateCard(direction = null) {
        cardFront.textContent = players[currentPlayerIndex];

        if (imposterIndices.includes(currentPlayerIndex)) {
            // Imposter sees the hint
            cardBack.innerHTML = `<span style="font-size:0.8em; color:#ff4d4d;">IMPOSTER</span><br><br>Hint:<br>${currentHint}`;
        } else {
            // Innocent sees the word
            cardBack.textContent = currentWord;
        }

        flipper.classList.remove("flipped");

        if (direction) {
            const offset = direction === "left" ? "-100%" : "100%";
            flipContainer.style.transition = "none";
            flipContainer.style.transform = `translateX(${offset})`;
            requestAnimationFrame(() => {
                flipContainer.style.transition = "transform 0.4s ease";
                flipContainer.style.transform = "translateX(0)";
            });
        }
    }

    // Hold to flip
    flipper.addEventListener("mousedown", () => flipper.classList.add("flipped"));
    flipper.addEventListener("mouseup", () => flipper.classList.remove("flipped"));
    flipper.addEventListener("mouseleave", () => flipper.classList.remove("flipped"));
    flipper.addEventListener("touchstart", e => { e.preventDefault(); flipper.classList.add("flipped"); });
    flipper.addEventListener("touchend", e => { e.preventDefault(); flipper.classList.remove("flipped"); });

    // Next player
    nextPlayerBtn.addEventListener("click", () => {
        if (currentPlayerIndex >= players.length - 1) {
            nextPlayerBtn.style.display = "none";
            flipContainer.style.display = "none";
            revealImposterBtn.style.display = "inline-block";
        } else {
            currentPlayerIndex++;
            updateCard("right");
        }
    });

    // Reveal
    revealImposterBtn.addEventListener("click", () => {
        const names = imposterIndices.map(i => players[i]).join(", ");
        if (imposterIndices.length === players.length) {
            imposterDisplay.innerHTML = `EVERYONE was the Imposter!<br>😈 TROLL MODE 😈`;
        } else {
            imposterDisplay.textContent = `IMPOSTER(s): ${names}`;
        }
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "inline-block";
    });

    function resetGame() {
        gameScreen.style.display = "none";
        setupScreen.style.display = "block";
        flipContainer.style.display = "block";
        nextPlayerBtn.style.display = "inline-block";
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "none";
        imposterDisplay.textContent = "";
        currentPlayerIndex = 0;
        flipper.classList.remove("flipped");
        updatePlayerList();
        renderCategoryCheckboxes();
    }

    restartBtn.addEventListener("click", resetGame);
    exitGameBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to quit to the main menu?")) {
            resetGame();
        }
    });
});