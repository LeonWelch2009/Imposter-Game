function updatePlayerList() {
    playerList.innerHTML = "";
    players.forEach((name, index) => {
        const li = document.createElement("li");
        li.classList.add("player-item");

        // Player name
        const span = document.createElement("span");
        span.innerText = name;
        li.appendChild(span);

        // Remove button
        const removeBtn = document.createElement("button");
        removeBtn.innerText = "×";
        removeBtn.classList.add("remove-btn");
        removeBtn.addEventListener("click", () => {
            players.splice(index, 1);
            updatePlayerList();
            setupInfo.innerText = `Removed player: ${name}`;
        });

        li.appendChild(removeBtn);
        playerList.appendChild(li);
    });
}
