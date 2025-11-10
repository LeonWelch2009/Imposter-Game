let players = [];
let currentPlayerIndex = 0;
let imposterIndex;
let selectedCategory = '';
let word = '';
let gameStarted = false;
let categories = {};
let trollRound = false;
let showHint = false;

document.getElementById("addPlayerBtn").addEventListener("click", addPlayer);
document.getElementById("startGameBtn").addEventListener("click", startGame);
document.getElementById("nextPlayerBtn").addEventListener("click", nextPlayer);
document.getElementById("exitBtn").addEventListener("click", confirmExit);
document.getElementById("cardFlipper").addEventListener("click", flipCard);

async function loadWords() {
  const response = await fetch("words.txt");
  const text = await response.text();
  const lines = text.trim().split("\n");

  let currentCategory = "";
  lines.forEach(line => {
    line = line.trim();
    if (line && !line.includes(" ")) {
      // Category line
      const parts = line.split(" ");
      currentCategory = parts[0];
      showHint = parts[1] === "h";
      categories[currentCategory] = { words: [], hint: showHint };
    } else if (line) {
      categories[currentCategory].words.push(line);
    }
  });

  displayCategories();
}

function displayCategories() {
  const categoryList = document.getElementById("categoryList");
  categoryList.innerHTML = "";

  Object.keys(categories).forEach(cat => {
    const div = document.createElement("div");
    div.classList.add("category-checkbox");
    div.innerHTML = `
      <label>
        <input type="checkbox" value="${cat}">
        ${cat}
      </label>
    `;
    categoryList.appendChild(div);
  });
}

function addPlayer() {
  const nameInput = document.getElementById("playerName");
  const name = nameInput.value.trim();
  if (name && !players.includes(name)) {
    players.push(name);
    updatePlayerList();
    nameInput.value = "";
  }
}

function updatePlayerList() {
  const list = document.getElementById("playerList");
  list.innerHTML = "";
  players.forEach((player, i) => {
    const li = document.createElement("li");
    li.classList.add("player-item");
    li.innerHTML = `
      ${player}
      <button class="remove-player" onclick="removePlayer(${i})">×</button>
    `;
    list.appendChild(li);
  });
}

function removePlayer(index) {
  players.splice(index, 1);
  updatePlayerList();
}

function startGame() {
  const checked = Array.from(document.querySelectorAll("input[type='checkbox']:checked")).map(
    c => c.value
  );
  if (players.length < 3 || checked.length === 0) {
    alert("Add at least 3 players and select a category!");
    return;
  }

  selectedCategory = checked[Math.floor(Math.random() * checked.length)];
  const categoryObj = categories[selectedCategory];
  word = categoryObj.words[Math.floor(Math.random() * categoryObj.words.length)];
  showHint = categoryObj.hint;

  trollRound = Math.random() < 1 / 18; // ~1 in 18 chance
  imposterIndex = Math.floor(Math.random() * players.length);
  currentPlayerIndex = 0;
  gameStarted = true;

  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
  document.getElementById("whoStarts").textContent = "";
  document.getElementById("exitBtn").style.display = "block";

  showCardBack();
}

function showCardBack() {
  const flipper = document.getElementById("cardFlipper");
  const front = document.getElementById("cardFront");
  const back = document.getElementById("cardBack");
  const nextBtn = document.getElementById("nextPlayerBtn");

  front.style.display = "flex";
  back.style.display = "none";
  flipper.classList.remove("flipped");
  nextBtn.style.display = "none"; // hidden until flip
  document.getElementById("cardFlipper").style.display = "block";
  document.getElementById("playerPrompt").textContent = `${players[currentPlayerIndex]}, tap to see your word`;
}

function flipCard() {
  const flipper = document.getElementById("cardFlipper");
  const front = document.getElementById("cardFront");
  const back = document.getElementById("cardBack");
  const nextBtn = document.getElementById("nextPlayerBtn");

  if (flipper.classList.contains("flipped")) return;

  flipper.classList.add("flipped");
  setTimeout(() => {
    front.style.display = "none";
    back.style.display = "flex";

    // Determine text to show
    if (trollRound) {
      back.textContent = "You are the IMPOSTER 🤫";
    } else if (currentPlayerIndex === imposterIndex) {
      back.textContent = showHint
        ? `You are the IMPOSTER 🤫\nThe word starts with '${word[0].toUpperCase()}'`
        : "You are the IMPOSTER 🤫";
    } else {
      back.textContent = word;
    }

    // Show Next Player button only after flip
    nextBtn.style.display = "block";
  }, 400);
}

function nextPlayer() {
  currentPlayerIndex++;
  if (currentPlayerIndex < players.length) {
    showCardBack();
  } else {
    // All players have seen their word
    const starter = players[Math.floor(Math.random() * players.length)];
    document.getElementById("playerPrompt").textContent = `${starter} starts the game! 🎯`;
    document.getElementById("nextPlayerBtn").style.display = "none";
    document.getElementById("exitBtn").style.display = "none";
    document.getElementById("cardFlipper").style.display = "none";
  }
}

function confirmExit() {
  if (confirm("Do you want to go back to the main menu?")) {
    document.getElementById("gameScreen").style.display = "none";
    document.getElementById("mainMenu").style.display = "block";
    gameStarted = false;
  }
}

loadWords();
