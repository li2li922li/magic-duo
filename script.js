// script.js
import './task.js';
import './map.js';
import './card.js';
import './economy.js';
import './game.js';
import './level.js';

window.addEventListener('load', async () => {
    const { ref, set, get, db } = window.game;
    
    // Ввод имени
    let playerName = prompt("Введите имя вашего волшебника:");
    if (!playerName) playerName = "Безымянный";
    playerName = playerName.trim();
    document.getElementById('player-name').textContent = playerName;
    window.game.playerName = playerName;

    const playerRef = ref(db, 'players/' + playerName);
    const worldRef = ref(db, 'world');

    const startingInventory = { axe: 10, arrows: 20, evasionPotion: 2, cookies: 3, milk: 2 };

    // Создание игрока (если нет)
    get(playerRef).then((snapshot) => {
        if (!snapshot.exists()) {
            set(playerRef, {
                name: playerName, level: 1, xp: 0, hp: 10, maxHp: 10,
                tickets: 0, crystals: 0, position: 0, lastSeen: Date.now(),
                inventory: startingInventory, invulnTurns: 0, avatar: '🥷🏻'
            });
        }
    });

    // Генерация мира (если нет)
    get(worldRef).then((snapshot) => {
        if (!snapshot.exists()) {
            const mapSize = 30;
            const worldData = {};
            const totalCells = mapSize * mapSize;
            for (let i = 0; i < totalCells; i++) worldData[i] = { type: 'empty', monsterType: null };
            worldData[1].type = 'cashier';

            const placeRandom = (count, type, maxMonster = null) => {
                let placed = 0;
                while (placed < count) {
                    const idx = Math.floor(Math.random() * totalCells);
                    if (idx > 1 && worldData[idx].type === 'empty') {
                        worldData[idx].type = type;
                        if (type === 'monster' && maxMonster) worldData[idx].monsterType = maxMonster[Math.floor(Math.random() * maxMonster.length)];
                        placed++;
                    }
                }
            };
            placeRandom(150, 'obstacle');
            placeRandom(20, 'chest');
            placeRandom(15, 'monster', ['👹', '👺', '🤖', '🎃', '🧙🏻', '🧌', '🧛🏻‍♂️']);
            set(worldRef, worldData);
        }
    });
});
