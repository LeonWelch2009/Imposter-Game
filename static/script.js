document.addEventListener("DOMContentLoaded", () => {
    let players = [];
    let currentPlayerIndex = 0;
    let imposterIndices = [];
    let currentCategory = "";
    let currentWord = "";
    let currentHint = ""; 
    let categories = {};
    let availableCategories = [];
    let trollModeHints = [];
    let gameStarted = false; // NEW: Track if the distribution phase has started

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
    const prevPlayerBtn = document.getElementById("prevPlayerBtn"); // NEW: Previous Player Button
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

    // === Render category selection (GRID BUTTON STYLE) ===
    function renderCategoryCheckboxes() {
        categoriesContainer.innerHTML = "";
        Object.keys(categories).forEach((cat, index) => {
            const saved = localStorage.getItem(`cat_${cat}`);
            const checkedAttr = saved === "true" || saved === null ? "checked" : "";
            
            // Unique ID is needed for the label to trigger the input
            const uniqueId = `cat_checkbox_${index}`;
            const formattedCat = cat.toLowerCase().split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

            // Container div
            const wrapper = document.createElement("div");
            wrapper.className = "category-option";

            // 1. The Input (Hidden by CSS)
            // 2. The Label (Styled as the Button)
            wrapper.innerHTML = `
                <input type="checkbox" id="${uniqueId}" value="${cat}" class="category-input" ${checkedAttr}>
                <label for="${uniqueId}" class="category-tile">${formattedCat}</label>
            `;
            categoriesContainer.appendChild(wrapper);
        });

        // Listener to save state
        categoriesContainer.querySelectorAll("input").forEach(inp => {
            inp.addEventListener("change", () => {
                localStorage.setItem(`cat_${inp.value}`, inp.checked);
            });
        });
    }

    showCategoriesBtn.addEventListener("click", () => {
        const isHidden = categoriesContainer.style.display === "none";
        categoriesContainer.style.display = isHidden ? "grid" : "none"; // Use 'grid' display
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

    // --- START GAME ---
    startGameBtn.addEventListener("click", () => {
        if (players.length < 3) return alert("Minimum 3 players required!");
        const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
        if (!checked.length) return alert("Select at least one category!");

        availableCategories = checked;
        localStorage.setItem("selected_categories", JSON.stringify(availableCategories));

        imposterIndices = [];
        trollModeHints = [];
        
        // Troll Mode: 1 in 15 chance
        const isTrollRound = Math.random() < (1/15);

        if (isTrollRound) {
            console.log("😈 Troll Mode Activated");
            imposterIndices = players.map((_, index) => index);
            
            // Generate unique random hints/categories for every player
            for (let i = 0; i < players.length; i++) {
                trollModeHints.push(pickRandomWordAndCategory(availableCategories));
            }
        } else {
            const imposterCount = players.length >= 6 ? 2 : 1;
            while (imposterIndices.length < imposterCount) {
                const idx = Math.floor(Math.random() * players.length);
                if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
            }
            // Standard game: Pick one set of word/hint for the round
            const roundDetails = pickRandomWordAndCategory(availableCategories);
            currentCategory = roundDetails.category;
            currentWord = roundDetails.word;
            currentHint = roundDetails.hint;
        }

        currentPlayerIndex = 0;
        gameStarted = true; // Set game started flag

        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        revealImposterBtn.style.display = "none";
        imposterDisplay.textContent = "";
        flipContainer.style.display = "block";
        updateCard();
        updateButtonVisibility(); // NEW: Check button visibility on start
    });

    // Function to pick a random word/category/hint set
    function pickRandomWordAndCategory(categoryList) {
        const selectedCategory = categoryList[Math.floor(Math.random() * categoryList.length)];
        const wordsList = categories[selectedCategory] || [];
        
        const selection = wordsList[Math.floor(Math.random() * wordsList.length)];
        
        let word = "Error";
        let hint = "Error";

        if (selection) {
            word = selection.word;
            const hints = selection.hints || [];
            if (hints.length > 0) {
                hint = hints[Math.floor(Math.random() * hints.length)];
            } else {
                hint = selectedCategory;
            }
        }
        
        return { category: selectedCategory, word: word, hint: hint };
    }

    // === Update Card ===
    function updateCard(direction = null) {
        cardFront.textContent = players[currentPlayerIndex];
        
        if (imposterIndices.includes(currentPlayerIndex)) {
            let playerCategory, playerHint;

            if (imposterIndices.length === players.length) { 
                // Troll Mode: Get specific random hint for this player
                const playerDetails = trollModeHints[currentPlayerIndex];
                playerCategory = playerDetails.category;
                playerHint = playerDetails.hint;
            } else {
                // Standard Imposter Mode: Get the round's standard hint/category
                playerCategory = currentCategory;
                playerHint = currentHint;
            }

            cardBack.innerHTML = `
                <div class="imposter-title">⚠️ Imposter</div>
                <div class="imposter-category">${playerCategory}</div>
                <div class="imposter-hint-label">Your Hint</div>
                <div class="imposter-hint-text">${playerHint}</div>
            `;
        } else {
            // Innocent View
            cardBack.innerHTML = `
                <div style="font-size: 24px; font-weight: bold;">${currentWord}</div>
            `;
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
        updateButtonVisibility(); // Always check visibility after moving
    }
    
    // NEW: Function to handle button visibility logic
    function updateButtonVisibility() {
        const isLastPlayer = currentPlayerIndex >= players.length - 1;
        const isFirstPlayer = currentPlayerIndex === 0;

        // Next Player Button
        nextPlayerBtn.style.display = isLastPlayer ? "none" : "inline-block";
        
        // Previous Player Button
        prevPlayerBtn.style.display = isFirstPlayer || !gameStarted ? "none" : "inline-block";

        // Flip Container visibility
        if (gameStarted) {
            if (isLastPlayer) {
                flipContainer.style.display = "none";
                revealImposterBtn.style.display = "inline-block";
                nextPlayerBtn.style.display = "none"; // Ensure next is hidden
            } else {
                flipContainer.style.display = "block";
                revealImposterBtn.style.display = "none";
            }
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
        if (currentPlayerIndex < players.length - 1) {
            currentPlayerIndex++;
            updateCard("right");
        }
    });
    
    // NEW: Previous player
    prevPlayerBtn.addEventListener("click", () => {
        if (currentPlayerIndex > 0) {
            // If we are looking at the reveal button, go back to the last player
            if (flipContainer.style.display === "none" && revealImposterBtn.style.display === "inline-block") {
                flipContainer.style.display = "block";
                revealImposterBtn.style.display = "none";
            }
            
            currentPlayerIndex--;
            updateCard("left");
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
        updateButtonVisibility(); // Hide prev/next buttons after revealing
    });

    function resetGame() {
        gameStarted = false; // Reset game started flag
        gameScreen.style.display = "none";
        setupScreen.style.display = "block";
        flipContainer.style.display = "block";
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "none";
        imposterDisplay.textContent = "";
        currentPlayerIndex = 0;
        flipper.classList.remove("flipped");
        updatePlayerList();
        renderCategoryCheckboxes();
        updateButtonVisibility(); // Reset button states
    }

    restartBtn.addEventListener("click", resetGame);
    exitGameBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to quit to the main menu?")) {
            resetGame();
        }
    });

    // Initialize button visibility on load
    updateButtonVisibility();
});