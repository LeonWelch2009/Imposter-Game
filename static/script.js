let wordsData = {};
let selectedCategories = JSON.parse(localStorage.getItem("selectedCategories")) || [];
let currentCategory = "";
let currentWord = "";
let players = [];
let imposters = [];

async function loadCategories() {
    const res = await fetch("/get_words");
    wordsData = await res.json();

    const container = document.getElementById("categoryContainer");
    container.innerHTML = "";

    for (const category in wordsData) {
        const div = document.createElement("div");
        div.classList.add("category-item");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = category;
        checkbox.checked = selectedCategories.includes(category);
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                selectedCategories.push(category);
            } else {
                selectedCategories = selectedCategories.filter(c => c !== category);
            }
            localStorage.setItem("selectedCategories", JSON.stringify(selectedCategories));
        });

        const label = document.createElement("label");
        label.textContent = category;

        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    }
}

function startGame() {
    if (selectedCategories.length === 0) {
        alert("Please select at least one category!");
        return;
    }

    const numPlayers = parseInt(document.getElementById("numPlayers").value);
    const numImposters = parseInt(document.getElementById("numImposters").value);

    if (numImposters >= numPlayers) {
        alert("Imposters must be fewer than players!");
        return;
    }

    const allPlayers = Array.from({ length: numPlayers }, (_, i) => `Player ${i + 1}`);
    players = allPlayers;
    imposters = [];

    while (imposters.length < numImposters) {
        const imposter = allPlayers[Math.floor(Math.random() * allPlayers.length)];
        if (!imposters.includes(imposter)) imposters.push(imposter);
    }

    const category = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
    const words = wordsData[category];
    const word = words[Math.floor(Math.random() * words.length)];

    currentCategory = category;
    currentWord = word;

    displayCards(allPlayers, imposters, word, category);
}

function displayCards(allPlayers, imposters, word, category) {
    const container = document.getElementById("cardsContainer");
    container.innerHTML = "";

    allPlayers.forEach(player => {
        const card = document.createElement("div");
        card.classList.add("card");

        const inner = document.createElement("div");
        inner.classList.add("card-inner");

        const front = document.createElement("div");
        front.classList.add("card-front");
        front.textContent = player;

        const back = document.createElement("div");
        back.classList.add("card-back");
        back.textContent = imposters.includes(player)
            ? "IMPOSTER"
            : `${category}\n${word}`;

        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);

        // Flip only when holding down
        card.addEventListener("mousedown", () => card.classList.add("hold"));
        card.addEventListener("mouseup", () => card.classList.remove("hold"));
        card.addEventListener("mouseleave", () => card.classList.remove("hold"));
        card.addEventListener("touchstart", () => card.classList.add("hold"));
        card.addEventListener("touchend", () => card.classList.remove("hold"));

        container.appendChild(card);
    });

    document.getElementById("nextRound").style.display = "inline-block";
}

function nextRound() {
    startGame();
}

document.getElementById("loadCategories").addEventListener("click", loadCategories);
document.getElementById("startGame").addEventListener("click", startGame);
document.getElementById("nextRound").addEventListener("click", nextRound);

window.addEventListener("DOMContentLoaded", loadCategories);
