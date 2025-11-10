// static/script.js
document.addEventListener("DOMContentLoaded", () => {
  // State
  let players = [];
  let currentPlayerIndex = 0;
  let imposterIndices = [];
  let categories = {}; 
  let availableCategories = [];
  let currentCategoryRaw = "";
  let currentWord = "";
  let starterIndex = null;

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
  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    },
    { passive: false }
  );

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

  // === Render categories (UI shows names without trailing 'h') ===
  function renderCategoryCheckboxes() {
    categoriesContainer.innerHTML = "";
    Object.keys(categories).forEach((rawKey) => {
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
      div.innerHTML = `<input type="checkbox" value="${rawKey}" ${
        checked ? "checked" : ""
      }><label>${formatted}</label>`;
      categoriesContainer.appendChild(div);
    });

    categoriesContainer.querySelectorAll("input[type='checkbox']").forEach((inp) => {
      inp.addEventListener("change", () => {
        localStorage.setItem(`cat_${inp.value}`, inp.checked ? "true" : "false");
      });
    });
  }

  // === Toggle category list ===
  showCategoriesBtn.addEventListener("click", () => {
    const isHidden = window.getComputedStyle(categoriesContainer).display === "none";
    categoriesContainer.style.display = isHidden ? "block" : "none";
  });

  // === Add player ===
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

  // === Start Game ===
  startGameBtn.addEventListener("click", () => {
    if (players.length < 3) {
      alert("Minimum 3 players required!");
      return;
    }

    const checked = Array.from(document.querySelectorAll("#categories input:checked")).map(
      (i) => i.value
    );
    if (!checked.length) {
      alert("Select at least one category!");
      return;
    }
    availableCategories = checked.slice();
    localStorage.setItem("selected_categories", JSON.stringify(availableCategories));

    // Pick imposters
    imposterIndices = [];
    const imposterCount = players.length >= 6 ? 2 : 1;
    while (imposterIndices.length < imposterCount) {
      const idx = Math.floor(Math.random() * players.length);
      if (!imposterIndices.includes(idx)) imposterIndices.push(idx);
    }

    // Troll round chance (1 in 15–20)
    const denom = Math.floor(Math.random() * 6) + 15;
    if (Math.random() < 1 / denom) {
      imposterIndices = players.map((_, i) => i);
      console.info("Troll round! Everyone is imposter.");
    }

    starterIndex = Math.floor(Math.random() * players.length);
    currentPlayerIndex = 0;
    imposterDisplay.textContent = "";
    starterDisplay.textContent = "";
    revealImposterBtn.style.display = "none";
    restartBtn.style.display = "none";

    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    flipContainer.style.display = "block";
    nextPlayerBtn.style.display = "none";
    exitBtn.style.display = "inline-block";

    pickWordForCurrentPlayer();
    updateCard();
  });

  // === Pick word and category ===
  function pickWordForCurrentPlayer() {
    const cats =
      JSON.parse(localStorage.getItem("selected_categories")) || availableCategories;
    if (!cats || !cats.length) {
      currentCategoryRaw = "";
      currentWord = "";
      return;
    }
    currentCategoryRaw = cats[Math.floor(Math.random() * cats.length)];
    const words = categories[currentCategoryRaw] || [];
    currentWord = words[Math.floor(Math.random() * words.length)] || "";
  }

  // === Update card display ===
  function updateCard() {
    const displayCategory = (currentCategoryRaw || "").replace(/\s+[hH]$/, "").trim();
    cardFront.textContent = players[currentPlayerIndex] || "";

    const isImposter = imposterIndices.includes(currentPlayerIndex);
    const hasH = /\s+[hH]$/.test(currentCategoryRaw);

    if (isImposter) {
      // NEW LOGIC: 'h' = no hint, otherwise give first letter
      if (hasH) {
        cardBack.textContent = `IMPOSTER\n(Hint: ${displayCategory})`;
      } else {
        cardBack.textContent = `IMPOSTER\n(Hint: ${displayCategory})\nStarts with '${(
          currentWord || ""
        )
          .charAt(0)
          .toUpperCase()}'`;
      }
    } else {
      cardBack.textContent = currentWord || "";
    }

    flipper.classList.remove("flipped");
    nextPlayerBtn.style.display = "none";
  }

  // === Flip ===
  function flipCurrentCard() {
    if (flipper.classList.contains("flipped")) return;
    flipper.classList.add("flipped");
    setTimeout(() => {
      nextPlayerBtn.style.display = "inline-block";
    }, 80);
  }

  flipper.addEventListener("click", (e) => {
    if (flipContainer.style.display === "none") return;
    flipCurrentCard();
  });

  flipper.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      flipCurrentCard();
    },
    { passive: false }
  );

  // === Next Player ===
  nextPlayerBtn.addEventListener("click", () => {
    currentPlayerIndex++;
    if (currentPlayerIndex >= players.length) {
      nextPlayerBtn.style.display = "none";
      flipContainer.style.display = "none";
      revealImposterBtn.style.display = "inline-block";
      starterDisplay.textContent = `${players[starterIndex]} starts the game!`;
      exitBtn.style.display = "none";
      return;
    }
    pickWordForCurrentPlayer();
    updateCard();
  });

  // === Reveal imposters ===
  revealImposterBtn.addEventListener("click", () => {
    const names = imposterIndices.map((i) => players[i]).join(", ");
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

  // === Exit ===
  exitBtn.addEventListener("click", () => {
    if (confirm("Return to main menu? Progress will be lost.")) location.reload();
  });

  // === Keyboard support (Enter flips or advances) ===
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter") return;
      const inSetup = setupScreen.style.display !== "none";

      if (inSetup) {
        if (document.activeElement === playerNameInput) {
          addPlayer();
          e.preventDefault();
          return;
        }
        if (players.length >= 3) {
          startGameBtn.focus();
          startGameBtn.click();
          e.preventDefault();
        }
      } else {
        const cardVisible = flipContainer.style.display !== "none";
        if (cardVisible) {
          if (!flipper.classList.contains("flipped")) flipCurrentCard();
          else nextPlayerBtn.click();
          e.preventDefault();
        } else if (revealImposterBtn.style.display !== "none") {
          revealImposterBtn.click();
          e.preventDefault();
        }
      }
    },
    true
  );
});
