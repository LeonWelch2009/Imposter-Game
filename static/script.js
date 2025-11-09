document.addEventListener("DOMContentLoaded", () => {
    let players = [];
    let currentPlayerIndex = 0;
    let imposterIndices = [];
    let currentCategory = "";
    let currentWord = "";
    let categories = {};
    let availableCategories = [];
    let currentHintLetter = null; // for categories marked with 'h'
    let starterAnnounced = false;

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
    const exitBtn = document.getElementById("exitBtn");

    // === Load categories from server ===
    fetch("/categories")
      .then(res => res.json())
      .then(data => {
        categories = data || {};
        renderCategoryCheckboxes();
      })
      .catch(err => console.error("Failed to load categories:", err));

    // === Render category checkboxes ===
    function renderCategoryCheckboxes() {
        categoriesContainer.innerHTML = "";
        Object.keys(categories).forEach(cat => {
            // strip trailing 'h' marker (case-insensitive) for display only
            const displayKey = cat.replace(/\s+[hH]$/, "").trim();
            const saved = localStorage.getItem(`cat_${cat}`);
            const checkedAttr = saved === "true" || saved === null ? "checked" : "";
            const div = document.createElement("div");
            div.className = "category-checkbox";
            // Format category nicely (capitalize first letter of each word)
            const formattedCat = displayKey.toLowerCase().split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
            div.innerHTML = `
                <input type="checkbox" value="${cat}" ${checkedAttr}>
                <label>${formattedCat}</label>
            `;
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

    // === Start game ===
    startGameBtn.addEventListener("click", () => {
        if (players.length < 3) return alert("Minimum 3 players required!");

        const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(i => i.value);
        if (!checked.length) return alert("Select at least one category!");

        availableCategories = checked.slice();
        localStorage.setItem("selected_categories", JSON.stringify(availableCategories));

        imposterIndices = [];
        const imposterCount = players.length >= 6 ? 2 : 1;
        while (imposterIndices.length < imposterCount) {
            const idx = Math.floor(Math.random() * players.length);
            if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
        }

        // Troll round: random denominator between 15 and 20 inclusive
        const denom = Math.floor(Math.random() * 6) + 15; // 15..20
        if (Math.random() < (1 / denom)) {
            imposterIndices = [...Array(players.length).keys()]; // everyone is imposter
            alert("😈 Troll Round! Everyone is the imposter!");
        }

        currentPlayerIndex = 0;
        pickWord();

        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        nextPlayerBtn.style.display = "none"; // hide until flip
        revealImposterBtn.style.display = "none";
        imposterDisplay.textContent = "";
        flipContainer.style.display = "block";
        starterAnnounced = false;
        updateCard();
    });

    function pickWord() {
        const catList = JSON.parse(localStorage.getItem("selected_categories")) || availableCategories;
        currentCategory = catList[Math.floor(Math.random() * catList.length)];
        // The "currentCategory" here is the raw key like "FRUIT" or "FRUIT h"
        const words = categories[currentCategory] || [];
        currentWord = words[Math.floor(Math.random() * words.length)] || "";

        // hint mode if category string ends with 'h' (case-insensitive)
        const hintMode = /\s[hH]$/.test(currentCategory);
        currentHintLetter = (hintMode && currentWord.length > 0) ? currentWord[0].toUpperCase() : null;
    }

    function updateCard(direction = null) {
        // hide next button until flipped
        nextPlayerBtn.style.display = "none";

        // Display player name on front
        cardFront.textContent = players[currentPlayerIndex];

        // If current category key had 'h' then show imposter hint letter only to imposter
        const displayCategory = (currentCategory || "").replace(/\s+[hH]$/, "").trim();

        cardBack.textContent = imposterIndices.includes(currentPlayerIndex)
            ? currentHintLetter
                ? `IMPOSTER\n(Hint: ${displayCategory}, starts with '${currentHintLetter}')`
                : `IMPOSTER\n(Hint: ${displayCategory})`
            : currentWord;

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

    // Flip card on hold (original behaviour preserved) — next button appears only after flip.
    flipper.addEventListener("mousedown", () => {
        flipper.classList.add("flipped");
        nextPlayerBtn.style.display = "inline-block";
    });
    flipper.addEventListener("mouseup", () => flipper.classList.remove("flipped"));
    flipper.addEventListener("mouseleave", () => flipper.classList.remove("flipped"));
    // touch handlers: prevent default to avoid double-tap zoom and to simulate hold-to-flip
    flipper.addEventListener("touchstart", e => { e.preventDefault(); flipper.classList.add("flipped"); nextPlayerBtn.style.display = "inline-block"; });
    flipper.addEventListener("touchend", e => { e.preventDefault(); flipper.classList.remove("flipped"); });

    // Next player with swipe animation
    nextPlayerBtn.addEventListener("click", () => {
        if (currentPlayerIndex >= players.length - 1) {
            nextPlayerBtn.style.display = "none";
            flipContainer.style.display = "none";
            revealImposterBtn.style.display = "inline-block";

            // announce who starts now (after everyone has seen)
            if (!starterAnnounced) {
                const starterIndex = Math.floor(Math.random() * players.length);
                setTimeout(() => alert(`${players[starterIndex]} starts the discussion!`), 200);
                starterAnnounced = true;
            }
        } else {
            currentPlayerIndex++;
            pickWord();
            // ensure card is reset (not flipped)
            flipper.classList.remove("flipped");
            updateCard("right");
        }
    });

    // Reveal imposter
    revealImposterBtn.addEventListener("click", () => {
        const names = imposterIndices.map(i => players[i]).join(", ");
        imposterDisplay.textContent = `IMPOSTER(s): ${names}`;
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "inline-block";
    });

    // Restart game
    restartBtn.addEventListener("click", () => {
        gameScreen.style.display = "none";
        setupScreen.style.display = "block";
        flipContainer.style.display = "block";
        nextPlayerBtn.style.display = "inline-block";
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "none";
        imposterDisplay.textContent = "";
        currentPlayerIndex = 0;
        updatePlayerList();
        renderCategoryCheckboxes();
    });

    // Exit X button -> confirm and reset to main menu
    exitBtn.addEventListener("click", () => {
        if (confirm("Return to main menu? Progress will be lost.")) {
            gameScreen.style.display = "none";
            setupScreen.style.display = "block";
            flipContainer.style.display = "block";
            nextPlayerBtn.style.display = "inline-block";
            revealImposterBtn.style.display = "none";
            restartBtn.style.display = "none";
            imposterDisplay.textContent = "";
            currentPlayerIndex = 0;
            updatePlayerList();
            renderCategoryCheckboxes();
        }
    });
});
