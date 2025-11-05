document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const playerNameInput = document.getElementById("playerName");
    const addPlayerBtn = document.getElementById("addPlayerBtn");
    const playerList = document.getElementById("playerList");
    const startGameBtn = document.getElementById("startGameBtn");
    const revealBtn = document.getElementById("revealBtn");
    const nextPlayerBtn = document.getElementById("nextPlayerBtn");
    const showImposterBtn = document.getElementById("showImposterBtn");
    const restartBtn = document.getElementById("restartBtn");
    const backMenuBtn = document.getElementById("backMenuBtn");
    const message = document.getElementById("message");
    const categoriesDiv = document.getElementById("categories");
    const setupScreen = document.getElementById("setupScreen");
    const gameScreen = document.getElementById("gameScreen");
    const toggleCategoriesBtn = document.getElementById("toggleCategoriesBtn");
    const auditBtn = document.getElementById("auditBtn");

    // Game variables
    let players = [];
    let categories = {};
    let availableCategories = [];
    let currentPlayerIndex = 0;
    let imposterIndex = -1;
    let currentCategory = "";
    let currentWord = "";
    let allPlayersSeen = false;

    // Fetch categories from backend
    fetch("/get_categories")
        .then(res => res.json())
        .then(data => {
            categories = data;
            Object.keys(categories).forEach(cat => {
                const label = document.createElement("label");
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = cat;
                checkbox.checked = true;
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(cat));
                categoriesDiv.appendChild(label);
            });
        });

    // Add player
    function addPlayer() {
        const name = playerNameInput.value.trim();
        if (!name) return;
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        if (players.includes(formattedName)) {
            message.textContent = `Player ${formattedName} already added!`;
            return;
        }
        players.push(formattedName);

        const li = document.createElement("li");
        li.classList.add("player-item");
        li.innerHTML = `<span>${formattedName}</span><button class="remove-btn">×</button>`;
        li.querySelector(".remove-btn").addEventListener("click", () => {
            players = players.filter(p => p !== formattedName);
            li.remove();
        });
        playerList.appendChild(li);

        playerNameInput.value = "";
        message.textContent = `Added player: ${formattedName}`;
    }

    addPlayerBtn.addEventListener("click", addPlayer);
    playerNameInput.addEventListener("keydown", e => { if (e.key === "Enter") addPlayer(); });

    // Toggle categories
    toggleCategoriesBtn.addEventListener("click", () => {
        categoriesDiv.style.display = categoriesDiv.style.display === "none" ? "flex" : "none";
    });

    // Audit button
    auditBtn.addEventListener("click", () => {
        window.open("/audit", "_blank"); // Flask route serving audit.txt
    });

    // Start game
    startGameBtn.addEventListener("click", () => {
        if (players.length < 3) { alert("At least 3 players required!"); return; }
        availableCategories = Array.from(categoriesDiv.querySelectorAll("input:checked")).map(cb => cb.value);
        if (!availableCategories.length) { alert("Select at least one category!"); return; }

        // Select imposter and word
        imposterIndex = Math.floor(Math.random() * players.length);
        currentPlayerIndex = 0;
        allPlayersSeen = false;

        currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const wordList = categories[currentCategory];
        currentWord = wordList[Math.floor(Math.random() * wordList.length)];

        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        revealBtn.disabled = false;
        nextPlayerBtn.disabled = true;
        showImposterBtn.style.display = "none";
        backMenuBtn.style.display = "none";

        message.textContent = `${players[currentPlayerIndex]}, press "Reveal Word" to see your word.`;

        // Record start to audit
        fetch("/record_start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                players, availableCategories, currentCategory, currentWord, imposter: players[imposterIndex]
            })
        });
    });

    // Reveal word
    revealBtn.addEventListener("click", () => {
        const currentPlayer = players[currentPlayerIndex];
        if (currentPlayerIndex === imposterIndex) {
            message.textContent = `${currentPlayer} (IMPOSTER!) Category: ${currentCategory}`;
        } else {
            message.textContent = `${currentPlayer}: ${currentWord}`;
        }
        revealBtn.disabled = true;
        nextPlayerBtn.disabled = false;
    });

    // Next player
    nextPlayerBtn.addEventListener("click", () => {
        currentPlayerIndex++;
        if (currentPlayerIndex < players.length) {
            message.textContent = `${players[currentPlayerIndex]}, press "Reveal Word" to see your word.`;
            revealBtn.disabled = false;
            nextPlayerBtn.disabled = true;
        } else {
            allPlayersSeen = true;
            revealBtn.style.display = "none";
            nextPlayerBtn.style.display = "none";
            showImposterBtn.style.display = "inline-block";
            backMenuBtn.style.display = "inline-block";

            const randomStarter = players[Math.floor(Math.random() * players.length)];
            message.textContent = `${randomStarter} starts the conversation!`;

            // Record game end to audit
            fetch("/record_end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imposter: players[imposterIndex],
                    word: currentWord
                })
            });
        }
    });

    // Reveal imposter
    showImposterBtn.addEventListener("click", () => {
        message.textContent = `The IMPOSTER is ${players[imposterIndex]}! The word was "${currentWord}".`;
        showImposterBtn.style.display = "none";
    });

    // Back to main menu
    backMenuBtn.addEventListener("click", () => {
        gameScreen.style.display = "none";
        setupScreen.style.display = "block";

        message.textContent = "Add players and select categories to start";
        revealBtn.style.display = "inline-block";
        revealBtn.disabled = false;
        nextPlayerBtn.style.display = "inline-block";
        nextPlayerBtn.disabled = true;
        showImposterBtn.style.display = "none";
        backMenuBtn.style.display = "none";
    });
});
