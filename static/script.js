document.addEventListener("DOMContentLoaded", () => {
    let players = [];
    let currentPlayerIndex = 0;
    let imposterIndices = [];
    let currentCategory = "";
    let currentWord = "";
    let categories = {};
    let availableCategories = [];
    let starterIndex = null;
    let trollRound = false;

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

    document.addEventListener('touchstart', e => { if(e.touches.length>1)e.preventDefault(); }, {passive:false});

    fetch("/categories").then(res => res.json()).then(data => { categories = data || {}; renderCategoryCheckboxes(); });

    function renderCategoryCheckboxes() {
        categoriesContainer.innerHTML = "";
        Object.keys(categories).forEach(cat => {
            const saved = localStorage.getItem(`cat_${cat}`);
            const checkedAttr = saved === "true" || saved === null ? "checked" : "";
            const displayName = cat.replace(/ h$/, "");
            const formatted = displayName.toLowerCase().split(" ").map(w=>w[0].toUpperCase()+w.slice(1)).join(" ");
            const div = document.createElement("div");
            div.className="category-checkbox";
            div.innerHTML=`<input type="checkbox" value="${cat}" ${checkedAttr}><label>${formatted}</label>`;
            categoriesContainer.appendChild(div);
        });
        categoriesContainer.querySelectorAll("input[type='checkbox']").forEach(inp => {
            inp.addEventListener("change", () => localStorage.setItem(`cat_${inp.value}`, inp.checked?"true":"false"));
        });
    }

    showCategoriesBtn.addEventListener("click",()=>categoriesContainer.style.display=categoriesContainer.style.display==="block"?"none":"block");
    addPlayerBtn.addEventListener("click", addPlayer);
    playerNameInput.addEventListener("keypress", e => { if(e.key==="Enter") addPlayer(); });

    function addPlayer() {
        const name = playerNameInput.value.trim();
        if(!name) return;
        const formatted = name.split(/\s+/).map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(" ");
        if(!players.includes(formatted)){ players.push(formatted); playerNameInput.value=""; updatePlayerList(); }
    }

    function updatePlayerList() {
        playerList.innerHTML="";
        players.forEach((p, idx)=>{
            const li=document.createElement("li");
            li.className="player-item";
            li.innerHTML=`<span>${p}</span><button class="remove-player">×</button>`;
            li.querySelector("button").addEventListener("click", ()=>{ players.splice(idx,1); updatePlayerList(); });
            playerList.appendChild(li);
        });
    }

    startGameBtn.addEventListener("click", ()=>{
        if(players.length<3)return alert("Minimum 3 players required!");
        availableCategories=Array.from(document.querySelectorAll("#categories input:checked")).map(i=>i.value);
        if(!availableCategories.length)return alert("Select at least one category!");
        trollRound=Math.random()<1/17;
        imposterIndices=[];
        if(trollRound){ imposterIndices=players.map((_,i)=>i); }
        else{ const count = players.length>=6?2:1; while(imposterIndices.length<count){ const idx=Math.floor(Math.random()*players.length); if(!imposterIndices.includes(idx)) imposterIndices.push(idx); } }
        starterIndex=Math.floor(Math.random()*players.length);
        currentPlayerIndex=0;
        showPlayerCard();
        setupScreen.style.display="none";
        gameScreen.style.display="block";
        flipContainer.style.display="block";
        nextPlayerBtn.style.display="none";
        revealImposterBtn.style.display="none";
        imposterDisplay.textContent="";
        starterDisplay.textContent="";
    });

    function showPlayerCard(){
        const catChoice = availableCategories[Math.floor(Math.random()*availableCategories.length)];
        const words = categories[catChoice] || [];
        const word = words[Math.floor(Math.random()*words.length)] || "";
        currentCategory=catChoice.replace(/ h$/,"");
        cardFront.textContent=players[currentPlayerIndex];
        if(imposterIndices.includes(currentPlayerIndex)){
            currentWord=/ h$/.test(catChoice)?word[0]+"…":`IMPOSTER\n(Hint: ${currentCategory})`;
            cardBack.textContent=currentWord;
        }else{ cardBack.textContent=word; }
        flipper.classList.remove("flipped");
        nextPlayerBtn.style.display="none";
    }

    flipper.addEventListener("click", ()=>{
        flipper.classList.toggle("flipped");
        nextPlayerBtn.style.display="inline-block";
    });

    nextPlayerBtn.addEventListener("click", ()=>{
        currentPlayerIndex++;
        if(currentPlayerIndex>=players.length){
            flipContainer.style.display="none";
            revealImposterBtn.style.display="inline-block";
            starterDisplay.textContent=`${players[starterIndex]} starts the game!`;
        }else showPlayerCard();
    });

    revealImposterBtn.addEventListener("click", ()=>{
        const names=imposterIndices.map(i=>players[i]).join(", ");
        imposterDisplay.textContent=`IMPOSTER(s): ${names}`;
        revealImposterBtn.style.display="none";
        restartBtn.style.display="inline-block";
    });

    restartBtn.addEventListener("click", ()=>location.reload());
    exitBtn.addEventListener("click", ()=>{ if(confirm("Return to main menu? Progress will be lost.")) location.reload(); });
});
