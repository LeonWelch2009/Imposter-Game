document.addEventListener("DOMContentLoaded", () => {
    let players = [];
    let currentPlayerIndex = 0;
    let imposterIndices = [];
    let currentCategory = "";
    let currentWord = "";
    let categories = {};
    let availableCategories = [];
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
    const starterDisplay = document.getElementById("starterDisplay");
    const exitBtn = document.getElementById("exitBtn");

    // Prevent mobile double-tap zoom
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) event.preventDefault();
    }, { passive: false });

    // === Load categories from server ===
    fetch("/categories")
      .then(res => res.json())
      .then(data => {
        categories = data || {};
        renderCategoryCheckboxes();
      })
      .catch(err => console.error("Failed to load categories:", err));

    function renderCategoryCheckboxes() {
        categoriesContainer.innerHTML = "";
        Object.keys(categories).forEach(cat => {
            const saved = localStorage.getItem(`cat_${cat}`);
            const checkedAttr = saved === "true" || saved === null ? "checked" : "";
            const div = document.createElement("div");
            div.className = "category-checkbox";
            // Remove 'h' for display
            const displayName = cat.replace(/ h$/, "");
            const formattedCat = displayName.toLowerCase().split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
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

    showCategoriesBtn.addEventListener("click", () => {
        const isHidden = window.getComputedStyle(categoriesContainer).display === "none";
        categoriesContainer.style.display = isHidden ? "block" : "none";
    });

    // === Player Management ===
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

        availableCategories = checked.slice();
        localStorage.setItem("selected_categories", JSON.stringify(availableCategories));

        // Troll round (~1 in 17 chance)
        const trollRound = Math.random() < 1/17;
        imposterIndices = [];
        if (trollRound) {
            imposterIndices = players.map((_, i) => i);
        } else {
            const imposterCount = players.length >= 6 ? 2 : 1;
            while (imposterIndices.length < imposterCount) {
                const idx = Math.floor(Math.random() * players.length);
                if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
            }
        }

        currentPlayerIndex = 0;
        pickWord();
        starterAnnounced = false;

        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        flipContainer.style.display = "block";
        nextPlayerBtn.style.display = "none";
        revealImposterBtn.style.display = "none";
        imposterDisplay.textContent = "";
        starterDisplay.textContent = "";
        updateCard();
    });

    function pickWord() {
        const catList = JSON.parse(localStorage.getItem("selected_categories")) || availableCategories;
        const catChoice = catList[Math.floor(Math.random() * catList.length)];
        const words = categories[catChoice] || [];
        currentCategory = catChoice.replace(/ h$/, ""); // remove 'h' for display
        const word = words[Math.floor(Math.random() * words.length)] || "";

        // Imposter sees first letter if category has 'h'
        if (imposterIndices.includes(currentPlayerIndex) && / h$/.test(catChoice)) {
            currentWord = word[0] + "…";
        } else {
            currentWord = word;
        }
    }

    function updateCard(direction = null) {
        cardFront.textContent = players[currentPlayerIndex];
        cardBack.textContent = imposterIndices.includes(currentPlayerIndex)
            ? `IMPOSTER\n(Hint: ${currentCategory})`
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

    // === Card Flip ===
    flipper.addEventListener("mousedown", () => {
        flipper.classList.add("flipped");
        nextPlayerBtn.style.display = "inline-block";
    });
    flipper.addEventListener("mouseup", () => flipper.classList.remove("flipped"));
    flipper.addEventListener("mouseleave", () => flipper.classList.remove("flipped"));
    flipper.addEventListener("touchstart", e => { 
        e.preventDefault(); 
        flipper.classList.add("flipped"); 
        nextPlayerBtn.style.display = "inline-block"; 
    });
    flipper.addEventListener("touchend", e => { e.preventDefault(); flipper.classList.remove("flipped"); });

    // === Next Player ===
    nextPlayerBtn.addEventListener("click", () => {
        if (currentPlayerIndex >= players.length - 1) {
            nextPlayerBtn.style.display = "none";
            flipContainer.style.display = "none";
            revealImposterBtn.style.display = "inline-block";

            if (!starterAnnounced) {
                const starterIndex = Math.floor(Math.random() * players.length);
                starterDisplay.textContent = `${players[starterIndex]} starts the discussion!`;
                starterAnnounced = true;
            }
        } else {
            currentPlayerIndex++;
            pickWord();
            flipper.classList.remove("flipped");
            updateCard("right");
            nextPlayerBtn.style.display = "none";
        }
    });

    // === Reveal Imposters ===
    revealImposterBtn.addEventListener("click", () => {
        const names = imposterIndices.map(i => players[i]).join(", ");
        imposterDisplay.textContent = `IMPOSTER(s): ${names}`;
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "inline-block";
    });

    // === Restart ===
    restartBtn.addEventListener("click", () => {
        gameScreen.style.display = "none";
        setupScreen.style.display = "block";
        flipContainer.style.display = "block";
        nextPlayerBtn.style.display = "inline-block";
        revealImposterBtn.style.display = "none";
        restartBtn.style.display = "none";
        imposterDisplay.textContent = "";
        starterDisplay.textContent = "";
        currentPlayerIndex = 0;
        updatePlayerList();
        renderCategoryCheckboxes();
    });

    // === Exit Button ===
    exitBtn.addEventListener("click", () => {
        if (confirm("Return to main menu? Progress will be lost.")) {
            gameScreen.style.display = "none";
            setupScreen.style.display = "block";
            flipContainer.style.display = "block";
            nextPlayerBtn.style.display = "inline-block";
            revealImposterBtn.style.display = "none";
            restartBtn.style.display = "none";
            imposterDisplay.textContent = "";
            starterDisplay.textContent = "";
            currentPlayerIndex = 0;
            updatePlayerList();
            renderCategoryCheckboxes();
        }
    });
});
