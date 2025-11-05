document.addEventListener("DOMContentLoaded", () => {
    const setupScreen = document.getElementById("setupScreen");
    const gameScreen = document.getElementById("gameScreen");
    const playerInput = document.getElementById("playerName");
    const addPlayerBtn = document.getElementById("addPlayerBtn");
    const playerList = document.getElementById("playerList");
    const startGameBtn = document.getElementById("startGameBtn");
    const revealBtn = document.getElementById("revealBtn");
    const nextPlayerBtn = document.getElementById("nextPlayerBtn");
    const showImposterBtn = document.getElementById("showImposterBtn");
    const restartBtn = document.getElementById("restartBtn");
    const message = document.getElementById("message");

    let players = [];
    let currentPlayerIndex = 0;
    let imposterIndex = null;
    let chosenWord = "";

    // Add Player
    addPlayerBtn.addEventListener("click", () => {
        const name = playerInput.value.trim();
        if (name) {
            const li = document.createElement("li");
            li.classList.add("player-item");
            li.innerHTML = `
                <span>${name.charAt(0).toUpperCase() + name.slice(1)}</span>
                <button class="remove-player">×</button>
            `;
            li.querySelector(".remove-player").addEventListener("click", () => {
                li.remove();
                players = players.filter(p => p !== name);
            });
            playerList.appendChild(li);
            players.push(name);
            playerInput.value = "";
        }
    });

    // Start Game
    startGameBtn.addEventListener("click", () => {
        if (players.length < 3) {
            alert("You need at least 3 players!");
            return;
        }
        setupScreen.style.display = "none";
        gameScreen.style.display = "block";
        currentPlayerIndex = 0;
        imposterIndex = Math.floor(Math.random() * players.length);
        chosenWord = "Apple"; // You can randomize this later using your txt categories
        message.textContent = `${players[currentPlayerIndex]}, press Reveal to see your word.`;
    });

    // Reveal Word
    revealBtn.addEventListener("click", () => {
        const currentPlayer = players[currentPlayerIndex];
        if (currentPlayerIndex === imposterIndex) {
            message.textContent = `${currentPlayer}, your word is: ???`;
        } else {
            message.textContent = `${currentPlayer}, your word is: ${chosenWord}`;
        }
    });

    // Next Player
    nextPlayerBtn.addEventListener("click", () => {
        currentPlayerIndex++;
        if (currentPlayerIndex < players.length) {
            message.textContent = `${players[currentPlayerIndex]}, press Reveal to see your word.`;
        } else {
            message.textContent = `${players[Math.floor(Math.random() * players.length)]} starts the conversation!`;
            revealBtn.style.display = "none";
            nextPlayerBtn.style.display = "none";
            showImposterBtn.style.display = "inline-block";
        }
    });

    // Show Imposter
    showImposterBtn.addEventListener("click", () => {
        message.textContent = `The imposter was ${players[imposterIndex]}!`;
        showImposterBtn.style.display = "none";
        restartBtn.style.display = "inline-block";
    });

    // Restart Game
    restartBtn.addEventListener("click", () => {
        gameScreen.style.display = "none";
        setupScreen.style.display = "block";
        message.textContent = "Add players and select categories to start";
        playerList.innerHTML = "";
        players = [];
        revealBtn.style.display = "inline-block";
        nextPlayerBtn.style.display = "inline-block";
        showImposterBtn.style.display = "none";
        restartBtn.style.display = "none";
    });
});
