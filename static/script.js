document.addEventListener("DOMContentLoaded", () => {
    // State
    let players = [];
    let currentPlayerIndex = 0;
    let imposterIndices = [];
    let categories = {};
    let availableCategories = [];
    let currentCategory = "";
    let currentWord = "";
    let currentHintLetter = null; // first letter shown to imposters when category marked with 'h'
    let starterAnnounced = false;

    // DOM
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
    const exitBtn = document.getElementById("exitBtn");

    // Load categories from server
    fetch("/categories")
        .then(res => res.json())
        .then(data => {
            categories = data || {};
            renderCategoryCheckboxes();
        })
        .catch(err => {
            console.error("Failed to load categories:", err);
            categories = {};
            renderCategoryCheckboxes();
        });

    // Render category checkboxes (preserve original menu appearance)
    function renderCategoryCheckboxes() {
        categoriesContainer.innerHTML = "";
        Object.keys(categories).forEach(catKey => {
            // Display name without trailing "h" marker
            const displayName = catKey.replace(/\s+[hH]$/, "").trim();
            const saved = localStorage.getItem(`cat_${catKey}`);
            const checked = (saved === null) ? "checked" : (saved === "true" ? "checked" : "");
            const div = document.createElement("div");
            div.className = "category-checkbox";
            div.innerHTML = `
                <input type="checkbox" value="${catKey}" ${checked}>
                <label>${displayName}</label>
            `;
            categoriesContainer.appendChild(div);
        });

        // Save changes to localStorage
        categoriesContainer.querySelectorAll("input[type='checkbox']").forEach(inp => {
            inp.addEventListener("change", () => {
                localStorage.setItem(`cat_${inp.value}`, inp.checked ? "true" : "false");
            });
        });
    }

    // Show/hide categories
    showCategoriesBtn.addEventListener("click", () => {
        const isHidden = window.getComputedStyle(categoriesContainer).display === "none";
        categoriesContainer.style.display = isHidden ? "block" : "none";
    });

    // Add player
    addPlayerBtn.addEventListener("click", addPlayer);
    playerNameInput.addEventListener("keypress", e => {
        if (e.key === "Enter") addPlayer();
    });

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

    // Start game
    startGameBtn.addEventListener("click", () => {
        if (players.length < 3) {
            alert("Minimum 3 players required!");
            return;
        }
        const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
        if (!checked.length) {
            alert("Select at least one category!");
            return;
        }

        availableCategories = checked.slice();
        localStorage.setItem("selected_categories", JSON.stringify(availableCategories));

        // Choose imposters (1 normally, 2 if 6+ players)
        imposterIndices = [];
        const imposterCount = players.length >= 6 ? 2 : 1;
        while (imposterIndices.length < imposterCount) {
            const idx = Math.floor(Math.random() * players.length);
            if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
        }

        // Troll round chance: random denominator between 15 and 20
        const denom = Math.floor(Math.random() * 6) + 15; // 15..20
        if (Math.random() < (1 / denom)) {
            imposterIndices = [...Array(players.length).keys()]; // everyone is imposter
            alert("😈 Troll Round! Everyone is the imposter!");
        }

        // prepare first word
        currentPlayerIndex = 0;
        pickWord();
        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        nextPlayerBtn.style.display = "none";
        revealImposterBtn.style.display = "none";
        imposterDisplay.textContent = "";
        flipContainer.style.display = "block";
        starterAnnounced = false;
        updateCard();
    });

    // Pick a random category and word
    function pickWord() {
        const catList = JSON.parse(localStorage.getItem("selected_categories")) || availableCategories;
        if (!catList || !catList.length) {
            currentCategory = "";
            currentWord = "";
            currentHintLetter = null;
            return;
        }
        const chosen = catList[Math.floor(Math.random() * catList.length)];
        currentCategory = chosen.replace(/\s+[hH]$/, "").trim(); // display-friendly
        const words = categories[chosen] || [];
        currentWord = words[Math.floor(Math.random() * words.length)] || "";
        // hint mode if the chosen key ends with 'h' (case-insensitive)
        const hintMode = /\s[hH]$/.test(chosen);
        currentHintLetter = (hintMode && currentWord.length > 0) ? currentWord[0].toUpperCase() : null;
    }

    // Update card for the current player
    function updateCard(direction = null) {
        // hide next button until flipped
        nextPlayerBtn.style.display = "none";
        cardFront.textContent = players[currentPlayerIndex];
        if (imposterIndices.includes(currentPlayerIndex)) {
            cardBack.textContent = currentHintLetter
                ? `IMPOSTER\n(Hint: ${currentCategory}, starts with '${currentHintLetter}')`
                : `IMPOSTER\n(Hint: ${currentCategory})`;
        } else {
            cardBack.textContent = currentWord;
        }

        // simple slide animation if direction given
        if (direction) {
            const offset = direction === "left" ? "-100%" : "100%";
            flipContainer.style.transition = "none";
            flipContainer.style.transform = `translateX(${offset})`;
            requestAnimationFrame(() => {
                flipContainer.style.transition = "transform 0.35s ease";
                flipContainer.style.transform = "translateX(0)";
            });
        }
    }

    // Flip: on click -> flip and show next button
    flipper.addEventListener("click", () => {
        // if already flipped, do nothing (user should press Next to continue)
        if (!flipper.classList.contains("flipped")) {
            flipper.classList.add("flipped");
            nextPlayerBtn.style.display = "inline-block";
        }
    });

    // Touch handlers to prevent default double-tap zoom behavior interaction
    flipper.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (!flipper.classList.contains("flipped")) {
            flipper.classList.add("flipped");
            nextPlayerBtn.style.display = "inline-block";
        }
    });

    // Next player
    nextPlayerBtn.addEventListener("click", () => {
        // If this was the last player:
        if (currentPlayerIndex >= players.length - 1) {
            // hide next and card, show reveal
            nextPlayerBtn.style.display = "none";
            flipContainer.style.display = "none";
            revealImposterBtn.style.display = "inline-block";

            // announce who starts now (only once)
            if (!starterAnnounced) {
                const starterIndex = Math.floor(Math.random() * players.length);
                // small delay so UI reflects reveal button first
                setTimeout(() => alert(`${players[starterIndex]} starts the discussion!`), 200);
                starterAnnounced = true;
            }
            return;
        }

        // move to next player
        currentPlayerIndex++;
        // pick a new word for the next player
        pickWord();
        // reset flip visually
        flipper.classList.remove("flipped");
        updateCard("right");
    });

    // Reveal imposters
    revealImposterBtn.addEventListener("click", () => {
        const names = imposterIndices.map(i => players[i]).join(", ");
        imposterDisplay.textContent = `IMPOSTER(s): ${names}`;
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "inline-block";
    });

    // Restart / New Game
    restartBtn.addEventListener("click", resetToMainMenu);

    // Exit X button -> confirm and reset to main menu
    exitBtn.addEventListener("click", () => {
        if (confirm("Return to main menu? Progress will be lost.")) {
            resetToMainMenu();
        }
    });

    function resetToMainMenu() {
        // reset state but keep categories saved in localStorage
        gameScreen.style.display = "none";
        setupScreen.style.display = "block";
        flipContainer.style.display = "block";
        nextPlayerBtn.style.display = "inline-block";
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "none";
        imposterDisplay.textContent = "";
        currentPlayerIndex = 0;
        imposterIndices = [];
        currentCategory = "";
        currentWord = "";
        currentHintLetter = null;
        starterAnnounced = false;
        updatePlayerList();
        renderCategoryCheckboxes();
    }
});
