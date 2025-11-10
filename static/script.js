// static/script.js
document.addEventListener("DOMContentLoaded", () => {
  // State
  let players = [];
  let currentPlayerIndex = 0;
  let imposterIndices = [];
  let categories = {}; // loaded from /categories (keys include optional ' h')
  let availableCategories = [];
  let currentCategoryRaw = ""; // the raw key (may include ' h')
  let currentWord = "";
  let starterIndex = null;
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
  const starterDisplay = document.getElementById("starterDisplay");
  const exitBtn = document.getElementById("exitBtn");

  // Prevent mobile double-tap zoom (extra precaution)
  document.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // === Load categories from server ===
  fetch("/categories")
    .then((res) => res.json())
    .then((data) => {
      categories = data || {};
      renderCategoryCheckboxes();
    })
    .catch((err) => {
      console.error("Failed to load categories:", err);
      categories = {};
      renderCategoryCheckboxes();
    });

  // === Render categories (menu shows names WITHOUT trailing 'h') ===
  function renderCategoryCheckboxes() {
    categoriesContainer.innerHTML = "";
    Object.keys(categories).forEach((rawKey) => {
      // displayKey removes trailing ' h' or ' H'
      const displayKey = rawKey.replace(/\s+[hH]$/, "").trim();
      const saved = localStorage.getItem(`cat_${rawKey}`);
      const checked = saved === null ? true : saved === "true";
      const div = document.createElement("div");
      div.className = "category-checkbox";
      const formatted = displayKey
        .toLowerCase()
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");
      div.innerHTML = `<input type="checkbox" value="${rawKey}" ${checked ? "checked" : ""}><label>${formatted}</label>`;
      categoriesContainer.appendChild(div);
    });

    // save checkbox changes
    categoriesContainer.querySelectorAll("input[type='checkbox']").forEach((inp) => {
      inp.addEventListener("change", () => {
        localStorage.setItem(`cat_${inp.value}`, inp.checked ? "true" : "false");
      });
    });
  }

  // Toggle categories panel
  showCategoriesBtn.addEventListener("click", () => {
    const isHidden = window.getComputedStyle(categoriesContainer).display === "none";
    categoriesContainer.style.display = isHidden ? "block" : "none";
  });

  // === Player management ===
  addPlayerBtn.addEventListener("click", addPlayer);
  playerNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addPlayer();
  });

  function addPlayer() {
    const name = playerNameInput.value.trim();
    if (!name) return;
    const formatted = name
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
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
    if (players.length < 3) {
      alert("Minimum 3 players required!");
      return;
    }

    // selected categories (raw keys)
    const checked = Array.from(document.querySelectorAll("#categories input:checked")).map((i) => i.value);
    if (!checked.length) {
      alert("Select at least one category!");
      return;
    }
    availableCategories = checked.slice();
    localStorage.setItem("selected_categories", JSON.stringify(availableCategories));

    // Choose imposters: 1 normally, 2 if 6+
    imposterIndices = [];
    const imposterCount = players.length >= 6 ? 2 : 1;
    while (imposterIndices.length < imposterCount) {
      const idx = Math.floor(Math.random() * players.length);
      if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
    }

    // Troll round chance: denominator random between 15..20
    const denom = Math.floor(Math.random() * 6) + 15; // 15..20
    if (Math.random() < 1 / denom) {
      imposterIndices = players.map((_, i) => i); // everyone is imposter
      // small notification (non-blocking)
      console.info("Troll round! Everyone is the imposter this round.");
    }

    // pick a random starter (used after all players have seen their words)
    starterIndex = Math.floor(Math.random() * players.length);

    // reset indexes and UI
    currentPlayerIndex = 0;
    imposterDisplay.textContent = "";
    starterDisplay.textContent = "";
    revealImposterBtn.style.display = "none";
    restartBtn.style.display = "none";

    // show game screen, hide setup
    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    flipContainer.style.display = "block";

    // hide next until flip
    nextPlayerBtn.style.display = "none";
    // show exit while in player reveal phase
    exitBtn.style.display = "inline-block";

    // pick first word & render
    pickWordForCurrentPlayer();
    updateCard();
  });

  // Pick a random category & word for the current player
  function pickWordForCurrentPlayer() {
    const cats = JSON.parse(localStorage.getItem("selected_categories")) || availableCategories;
    if (!cats || !cats.length) {
      currentCategoryRaw = "";
      currentWord = "";
      return;
    }
    currentCategoryRaw = cats[Math.floor(Math.random() * cats.length)]; // raw key possibly with ' h'
    const words = categories[currentCategoryRaw] || [];
    currentWord = words[Math.floor(Math.random() * words.length)] || "";
  }

  // Update the visible card content (front/back)
  function updateCard() {
    const displayCategory = (currentCategoryRaw || "").replace(/\s+[hH]$/, "").trim();
    cardFront.textContent = players[currentPlayerIndex] || "";
    if (imposterIndices.includes(currentPlayerIndex)) {
      // if category has h, imposter gets first letter only
      if (/\s+[hH]$/.test(currentCategoryRaw)) {
        cardBack.textContent = `IMPOSTER\n(Hint: ${displayCategory})\nStarts with '${(currentWord || "").charAt(0).toUpperCase()}'`;
      } else {
        cardBack.textContent = `IMPOSTER\n(Hint: ${displayCategory})`;
      }
    } else {
      cardBack.textContent = currentWord || "";
    }

    // ensure it's front side and next button hidden until flip
    flipper.classList.remove("flipped");
    nextPlayerBtn.style.display = "none";
  }

  // Flip behavior: flip only once per player; show next button once flipped.
  function flipCurrentCard() {
    if (flipper.classList.contains("flipped")) return; // already flipped for this player
    flipper.classList.add("flipped");
    // show next button after a tiny delay so flip animation can start
    setTimeout(() => {
      nextPlayerBtn.style.display = "inline-block";
    }, 80);
  }

  // clicking/touch to flip
  flipper.addEventListener("click", (e) => {
    // only allow flipping when card visible
    if (flipContainer.style.display === "none") return;
    flipCurrentCard();
  });

  // support touchstart to avoid accidental double-tap zoom interference
  flipper.addEventListener("touchstart", (e) => {
    e.preventDefault();
    flipCurrentCard();
  }, { passive: false });

  // Next player
  nextPlayerBtn.addEventListener("click", () => {
    // advance to next player
    currentPlayerIndex++;
    if (currentPlayerIndex >= players.length) {
      // everyone done seeing their cards
      nextPlayerBtn.style.display = "none";
      flipContainer.style.display = "none";
      revealImposterBtn.style.display = "inline-block";
      // show who starts (above card)
      starterDisplay.textContent = `${players[starterIndex]} starts the game!`;
      // hide exit since no longer needed
      exitBtn.style.display = "none";
      return;
    }
    // pick next word & update
    pickWordForCurrentPlayer();
    updateCard();
  });

  // Reveal imposters
  revealImposterBtn.addEventListener("click", () => {
    const names = imposterIndices.map(i => players[i]).join(", ");
    imposterDisplay.textContent = `IMPOSTER(s): ${names}`;
    revealImposterBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
  });

  // Restart
  restartBtn.addEventListener("click", () => {
    // reset to setup state and keep categories in localStorage as-is
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

  // Exit button — confirm and return to main menu (setup)
  exitBtn.addEventListener("click", () => {
    if (confirm("Return to main menu? Progress will be lost.")) {
      // reload page to clear state (keeps category preferences in localStorage)
      location.reload();
    }
  });

  // Keyboard: Enter flips / advances during game; Enter adds player in setup
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    // if setup screen visible and focused on input -> add player
    const setupHidden = setupScreen.style.display === "none";
    if (!setupHidden) {
      // if playerName input is focused, add player (also handles enter)
      if (document.activeElement === playerNameInput) {
        addPlayer();
        e.preventDefault();
        return;
      }
      // If start button is visible and players >=3, pressing enter will start the game
      // (optional convenience)
      if (players.length >= 3) {
        startGameBtn.focus();
        startGameBtn.click();
        e.preventDefault();
        return;
      }
    } else {
      // during game:
      const cardVisible = flipContainer.style.display !== "none";
      if (cardVisible) {
        if (!flipper.classList.contains("flipped")) {
          // flip
          flipCurrentCard();
        } else {
          // advance
          nextPlayerBtn.click();
        }
        e.preventDefault();
      } else {
        // if card not visible (e.g. after all seen), pressing enter could reveal imposters
        if (revealImposterBtn.style.display !== "none") {
          revealImposterBtn.click();
          e.preventDefault();
        }
      }
    }
  }, true);

  // expose a couple globals for debugging if needed (optional)
  window._imposterIndices = () => imposterIndices.slice();
  window._players = () => players.slice();
});
