// Defensive DOM lookups (fail gracefully if structure differs)
const el = id => document.getElementById(id);

// Screens & messages
const setupScreen = el('setupScreen');
const gameScreen = el('gameScreen');
const setupMessage = el('setupMessage');
const gameMessage = el('gameMessage');

// Controls / inputs
const startGameBtn = el('startGameBtn');
const addPlayerBtn = el('addPlayerBtn');
const playerNameInput = el('playerName');
const playerList = el('playerList');
const categoriesContainer = el('categories');

const revealBtn = el('revealBtn');
const nextPlayerBtn = el('nextPlayerBtn');
const showImposterBtn = el('showImposterBtn');
const restartBtn = el('restartBtn');
const backMenuBtn = el('backMenuBtn');
const toggleCategoriesBtn = el('toggleCategoriesBtn');
const auditBtn = el('auditBtn');
const endControls = el('endControls'); // container for end controls

// Data
let players = [];
let categories = {
    Fruits: ['Apple', 'Banana', 'Orange', 'Grapes', 'Mango', 'Strawberry', 'Pineapple', 'Watermelon', 'Peach', 'Cherry'],
    Meals: ['Pizza', 'Burger', 'Pasta', 'Sushi', 'Taco', 'Salad', 'Steak', 'Curry', 'Sandwich', 'Omelette'],
    Places: ['Supermarket', 'Cinema', 'Police Station', 'Hospital', 'School', 'Park', 'Bank', 'Library', 'Restaurant', 'Airport']
};
let selectedCategories = Object.keys(categories);

// Game state
let currentPlayerIndex = 0;
let imposterIndex = -1;
let currentCategory = '';
let currentWord = '';
let allPlayersSeen = false;

// --- Utility / UI helpers ---
function safeSetText(node, text) {
    if (!node) return;
    node.textContent = text;
}

function clearChildren(parent) {
    if (!parent) return;
    while (parent.firstChild) parent.removeChild(parent.firstChild);
}

// render players list from players[]
function renderPlayerList() {
    if (!playerList) return;
    clearChildren(playerList);
    players.forEach((name, idx) => {
        const li = document.createElement('li');
        li.className = 'player-item';

        const span = document.createElement('span');
        span.textContent = name;
        span.style.flex = '1';

        const btn = document.createElement('button');
        btn.className = 'remove-player-btn';
        btn.type = 'button';
        btn.title = `Remove ${name}`;
        btn.textContent = '×';
        btn.onclick = () => {
            players = players.filter(p => p !== name);
            renderPlayerList();
            safeSetText(setupMessage, `Removed player: ${name}`);
            // If we removed player during a running game, adjust indexes safely
            if (currentPlayerIndex >= players.length) currentPlayerIndex = Math.max(0, players.length - 1);
            if (imposterIndex >= players.length) imposterIndex = -1;
        };

        li.appendChild(span);
        li.appendChild(btn);
        playerList.appendChild(li);
    });
}

// render category checkboxes from categories object
function renderCategoryCheckboxes() {
    if (!categoriesContainer) return;
    clearChildren(categoriesContainer);
    Object.keys(categories).forEach((cat, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-checkbox';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = selectedCategories.includes(cat);
        input.dataset.cat = cat;
        input.onchange = updateSelectedCategories;

        const label = document.createElement('label');
        label.textContent = cat;

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        categoriesContainer.appendChild(wrapper);
    });
    updateSelectedCategories();
}

// read checked categories into selectedCategories
function updateSelectedCategories() {
    if (!categoriesContainer) return;
    const checks = categoriesContainer.querySelectorAll('input[type="checkbox"]');
    selectedCategories = [];
    checks.forEach((c) => {
        if (c.checked && c.dataset && c.dataset.cat) selectedCategories.push(c.dataset.cat);
    });
    safeSetText(setupMessage, `${selectedCategories.length} categories selected`);
}

// pick random element from array
function randItem(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- Game functions ---
function addPlayer() {
    if (!playerNameInput) return;
    const raw = playerNameInput.value.trim();
    if (!raw) {
        safeSetText(setupMessage, 'Please enter a name.');
        return;
    }
    // Auto-capitalize each word
    const formatted = raw.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    if (players.includes(formatted)) {
        safeSetText(setupMessage, `${formatted} already added.`);
        playerNameInput.value = '';
        return;
    }
    players.push(formatted);
    renderPlayerList();
    playerNameInput.value = '';
    safeSetText(setupMessage, `Added player: ${formatted}`);
}

function startGame() {
    if (players.length < 3) {
        safeSetText(setupMessage, 'Need at least 3 players to start.');
        return;
    }
    updateSelectedCategories();
    if (!selectedCategories || selectedCategories.length === 0) {
        safeSetText(setupMessage, 'Select at least one category.');
        return;
    }

    // choose imposter and word
    imposterIndex = Math.floor(Math.random() * players.length);
    currentPlayerIndex = 0;
    allPlayersSeen = false;

    currentCategory = randItem(selectedCategories);
    const list = categories[currentCategory];
    currentWord = randItem(list);

    // show game screen
    if (setupScreen) setupScreen.style.display = 'none';
    if (gameScreen) gameScreen.style.display = 'block';

    // reset control visibility/state
    if (revealBtn) { revealBtn.style.display = ''; revealBtn.disabled = false; }
    if (nextPlayerBtn) { nextPlayerBtn.style.display = ''; nextPlayerBtn.disabled = true; }
    if (endControls) endControls.style.display = 'none';

    safeSetText(gameMessage, `${players[currentPlayerIndex]} — press "Reveal Word"`);
}

function revealWord() {
    if (currentPlayerIndex < 0 || currentPlayerIndex >= players.length) return;
    const player = players[currentPlayerIndex];
    if (currentPlayerIndex === imposterIndex) {
        safeSetText(gameMessage, `${player} — IMPOSTER! Category: ${currentCategory}`);
    } else {
        safeSetText(gameMessage, `${player}: ${currentWord}`);
    }
    if (revealBtn) revealBtn.disabled = true;
    if (nextPlayerBtn) nextPlayerBtn.disabled = false;
}

function nextPlayer() {
    currentPlayerIndex++;
    if (currentPlayerIndex >= players.length) {
        // all done
        allPlayersSeen = true;
        const starter = randItem(players);
        safeSetText(gameMessage, `${starter} starts the conversation!`);
        if (endControls) endControls.style.display = 'flex';
        if (revealBtn) revealBtn.style.display = 'none';
        if (nextPlayerBtn) nextPlayerBtn.style.display = 'none';
        return;
    }
    // continue
    if (revealBtn) { revealBtn.disabled = false; revealBtn.style.display = ''; }
    if (nextPlayerBtn) { nextPlayerBtn.disabled = true; nextPlayerBtn.style.display = ''; }
    safeSetText(gameMessage, `${players[currentPlayerIndex]} — press "Reveal Word"`);
}

function revealImposter() {
    if (imposterIndex < 0 || imposterIndex >= players.length) {
        safeSetText(gameMessage, 'No imposter found.');
        return;
    }
    safeSetText(gameMessage, `The IMPOSTER is: ${players[imposterIndex]}`);
}

function newGameKeepPlayers() {
    // keep players, reset game state and show setup screen
    currentPlayerIndex = 0;
    imposterIndex = -1;
    currentCategory = '';
    currentWord = '';
    allPlayersSeen = false;

    if (gameScreen) gameScreen.style.display = 'none';
    if (setupScreen) setupScreen.style.display = 'block';
    if (endControls) endControls.style.display = 'none';
    if (revealBtn) { revealBtn.style.display = ''; revealBtn.disabled = false; }
    if (nextPlayerBtn) { nextPlayerBtn.style.display = ''; nextPlayerBtn.disabled = true; }
    safeSetText(setupMessage, 'Add players and select categories to start');
    safeSetText(gameMessage, '');
}

// toggle categories panel display
function toggleCategories() {
    if (!categoriesContainer) return;
    categoriesContainer.style.display = (categoriesContainer.style.display === 'none') ? 'flex' : 'none';
}

// audit handler (simple: open /audit route or alert)
function showAudit() {
    // if running under Flask, open the audit route; otherwise show an alert
    const url = '/audit';
    // attempt to open in new tab
    try {
        window.open(url, '_blank');
    } catch (e) {
        alert('Audit: (unable to open) — check server.');
    }
}

// --- Event wiring (safe) ---
if (addPlayerBtn) addPlayerBtn.addEventListener('click', addPlayer);
if (playerNameInput) playerNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });
if (startGameBtn) startGameBtn.addEventListener('click', startGame);
if (revealBtn) revealBtn.addEventListener('click', revealWord);
if (nextPlayerBtn) nextPlayerBtn.addEventListener('click', nextPlayer);
if (showImposterBtn) showImposterBtn.addEventListener('click', revealImposter);
if (restartBtn) restartBtn.addEventListener('click', newGameKeepPlayers);
if (backMenuBtn) backMenuBtn.addEventListener('click', newGameKeepPlayers);
if (toggleCategoriesBtn) toggleCategoriesBtn.addEventListener('click', toggleCategories);
if (auditBtn) auditBtn.addEventListener('click', showAudit);

// initial render
renderPlayerList();
renderCategoryCheckboxes();
