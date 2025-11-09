let players = [];
let currentIndex = 0;
let imposterIndex = null;
let wordsData = {};
let selectedCategories = [];
let chosenCategory = null;
let startingPlayer = null;

async function loadWords() {
  const response = await fetch("/words.txt");
  const text = await response.text();
  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);

  let currentCategory = null;
  let currentLetter = null;

  for (const line of lines) {
    const match = line.match(/^([A-Z\s]+)\s+([a-z])$/);
    if (match) {
      currentCategory = match[1].trim();
      currentLetter = match[2].toLowerCase();
      wordsData[currentCategory] = { letter: currentLetter, words: [] };
    } else if (currentCategory) {
      wordsData[currentCategory].words.push(line);
    }
  }

  renderCategories();
}

function renderCategories() {
  const container = document.getElementById("categoryList");
  container.innerHTML = "";
  for (const category in wordsData) {
    const div = document.createElement("div");
    div.classList.add("category-checkbox");
    div.innerHTML = `
      <input type="checkbox" id="${category}" value="${category}">
      <label for="${category}">${category}</label>
    `;
    container.appendChild(div);
  }
}

function addPlayer() {
  const input = document.getElementById("playerName");
  const name = input.value.trim();
  if (name === "") return;
  players.push(name);
  input.value = "";
  renderPlayerList();
}

function removePlayer(index) {
  players.splice(index, 1);
  renderPlayerList();
}

function renderPlayerList() {
  const list = document.getElementById("playerList");
  list.innerHTML = players.map((player, i) => `
    <div class="player-item">
      <span>${player}</span>
      <button class="remove-player" onclick="removePlayer(${i})">×</button>
    </div>
  `).join("");
}

function startGame() {
  selectedCategories = Array.from(document.querySelectorAll("#categoryList input:checked")).map(cb => cb.value);
  if (selectedCategories.length === 0 || players.length < 3) {
    alert("Select at least one category and add at least 3 players.");
    return;
  }

  chosenCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
  const { letter, words } = wordsData[chosenCategory];
  imposterIndex = Math.floor(Math.random() * players.length);
  startingPlayer = players[Math.floor(Math.random() * players.length)];

  document.getElementById("categoryDisplay").innerText = `${chosenCategory} (starts with '${letter.toUpperCase()}')`;
  document.getElementById("setupScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";

  currentIndex = 0;
  document.getElementById("playerWord").innerText = "";
  document.getElementById("playerNameDisplay").innerText = players[currentIndex];
  document.getElementById("endControls").style.display = "none";
  setFlipper(false);
}

function flipCard() {
  const flipper = document.querySelector(".flipper");

  // Flip forward
  if (!flipper.classList.contains("flipped")) {
    flipper.classList.add("flipped");
    showWord();
  } else {
    // Flip back and move to next player
    flipper.classList.remove("flipped");
    setTimeout(nextPlayer, 600);
  }
}

function showWord() {
  const wordDisplay = document.getElementById("playerWord");
  if (currentIndex === imposterIndex) {
    wordDisplay.innerText = "You are the IMPOSTER!";
  } else {
    const { words } = wordsData[chosenCategory];
    const chosenWord = words[Math.floor(Math.random() * words.length)];
    wordDisplay.innerText = chosenWord;
  }
}

function nextPlayer() {
  currentIndex++;
  if (currentIndex < players.length) {
    document.getElementById("playerNameDisplay").innerText = players[currentIndex];
    document.getElementById("playerWord").innerText = "";
    setFlipper(false);
  } else {
    endRevealPhase();
  }
}

function endRevealPhase() {
  document.getElementById("playerNameDisplay").innerText = "All players are ready!";
  document.getElementById("playerWord").innerText = `🎲 ${startingPlayer} starts the game!`;
  document.getElementById("endControls").style.display = "block";
  setFlipper(false);
}

function setFlipper(flipped) {
  const flipper = document.querySelector(".flipper");
  flipper.classList.toggle("flipped", flipped);
}

function restartGame() {
  players = [];
  currentIndex = 0;
  imposterIndex = null;
  selectedCategories = [];
  chosenCategory = null;
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("setupScreen").style.display = "block";
  renderPlayerList();
}

function exitGame() {
  if (confirm("Exit the game and go back to setup?")) {
    restartGame();
  }
}

window.onload = loadWords;
