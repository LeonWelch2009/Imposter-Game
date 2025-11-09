document.addEventListener("DOMContentLoaded", () => {
  let players = [];
  let currentPlayerIndex = 0;
  let imposterIndices = [];
  let currentCategory = "";
  let currentWord = "";
  let categories = {};
  let availableCategories = [];
  let imposterHint = null;
  let starterAnnounced = false;

  // Elements
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

  // === Load categories ===
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
      const checkedAttr = "checked";
      const div = document.createElement("div");
      div.className = "category-checkbox";
      const formattedCat = cat.replace(" H", "").replace("h", "");
      div.innerHTML = `
        <input type="checkbox" value="${cat}" ${checkedAttr}>
        <label>${formattedCat}</label>
      `;
      categoriesContainer.appendChild(div);
    });
  }

  showCategoriesBtn.addEventListener("click", () => {
    const isHidden = window.getComputedStyle(categoriesContainer).display === "none";
    categoriesContainer.style.display = isHidden ? "block" : "none";
  });

  // === Add player ===
  addPlayerBtn.addEventListener("click", addPlayer);
  playerNameInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addPlayer();
  });

  function addPlayer() {
    const name = playerNameInput.value.trim();
    if (!name) return;
    const formatted = name
      .split(/\s+/)
      .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
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
    imposterIndices = [];
    const imposterCount = players.length >= 6 ? 2 : 1;
    while (imposterIndices.length < imposterCount) {
      const idx = Math.floor(Math.random() * players.length);
      if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
    }

    pickWord();

    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    nextPlayerBtn.style.display = "none";
    revealImposterBtn.style.display = "none";
    imposterDisplay.textContent = "";
    flipContainer.style.display = "block";
    updateCard();
  });

  function pickWord() {
    const chosen = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const hintMode = /\bh\b/i.test(chosen);
    currentCategory = chosen.replace(/\bh\b/i, "").trim();
    const words = categories[chosen] || [];
    currentWord = words[Math.floor(Math.random() * words.length)] || "";
    imposterHint = hintMode && currentWord ? currentWord[0].toUpperCase() : null;
  }

  function updateCard() {
    nextPlayerBtn.style.display = "none";
    cardFront.textContent = players[currentPlayerIndex];
    cardBack.textContent = imposterIndices.includes(currentPlayerIndex)
      ? imposterHint
        ? `IMPOSTER\n(Hint: ${currentCategory}, starts with '${imposterHint}')`
        : `IMPOSTER\n(Hint: ${currentCategory})`
      : currentWord;
  }

  // === Card flipping ===
  function showNextButton() {
    nextPlayerBtn.style.display = "inline-block";
  }

  flipper.addEventListener("mousedown", () => {
    flipper.classList.add("flipped");
    showNextButton();
  });
  flipper.addEventListener("mouseup", () => flipper.classList.remove("flipped"));
  flipper.addEventListener("mouseleave", () => flipper.classList.remove("flipped"));
  flipper.addEventListener("touchstart", e => {
    e.preventDefault();
    flipper.classList.add("flipped");
    showNextButton();
  });
  flipper.addEventListener("touchend", e => {
    e.preventDefault();
    flipper.classList.remove("flipped");
  });

  // === Next player ===
  nextPlayerBtn.addEventListener("click", () => {
    if (currentPlayerIndex >= players.length - 1) {
      flipContainer.style.display = "none";
      nextPlayerBtn.style.display = "none";
      revealImposterBtn.style.display = "inline-block";

      // announce who starts only now
      if (!starterAnnounced) {
        const starterIndex = Math.floor(Math.random() * players.length);
        setTimeout(() => {
          alert(`${players[starterIndex]} starts the discussion!`);
        }, 300);
        starterAnnounced = true;
      }
    } else {
      currentPlayerIndex++;
      updateCard();
    }
  });

  // === Reveal imposter(s) ===
  revealImposterBtn.addEventListener("click", () => {
    const names = imposterIndices.map(i => players[i]).join(", ");
    imposterDisplay.textContent = `IMPOSTER(s): ${names}`;
    revealImposterBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
  });

  // === Restart game ===
  restartBtn.addEventListener("click", resetToMainMenu);
  exitBtn.addEventListener("click", () => {
    if (confirm("Return to main menu? Progress will be lost.")) resetToMainMenu();
  });

  function resetToMainMenu() {
    gameScreen.style.display = "none";
    setupScreen.style.display = "block";
    flipContainer.style.display = "block";
    nextPlayerBtn.style.display = "none";
    revealImposterBtn.style.display = "none";
    restartBtn.style.display = "none";
    imposterDisplay.textContent = "";
    currentPlayerIndex = 0;
    starterAnnounced = false;
    updatePlayerList();
    renderCategoryCheckboxes();
  }
});
