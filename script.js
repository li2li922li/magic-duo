// script.js
import './task.js';
import './map.js';
import './card.js';
import './economy.js';
import './game.js';
import './level.js';
import './quest.js';

window.addEventListener('load', () => {
    const { ref, set, get, db } = window.game;
    
    let playerName = prompt("Введите имя вашего волшебника:");
    if (!playerName) playerName = "Безымянный";
    playerName = playerName.trim();
    document.getElementById('player-name').textContent = playerName;
    window.game.playerName = playerName;

    const playerRef = ref(db, 'players/' + playerName);
    const worldRef = ref(db, 'world');
    const startingInventory = { axe: 10, arrows: 20, evasionPotion: 2, cookies: 3, milk: 2, chocolate: 1, waterSphere: 1, waterPower: 1 };

    get(playerRef).then((snapshot) => {
        if (!snapshot.exists()) {
            set(playerRef, {
                name: playerName, level: 1, xp: 0, hp: 10, maxHp: 10,
                tickets: 0, crystals: 100, position: 0, lastSeen: Date.now(),
                inventory: startingInventory, invulnTurns: 0, avatar: '🥷🏻',
                questsProgress: {}
            });
        }
    });

    get(worldRef).then((snapshot) => {
        if (!snapshot.exists()) {
            const mapSize = 30;
            const worldData = {};
            const totalCells = mapSize * mapSize;
            for (let i = 0; i < totalCells; i++) {
                worldData[i] = { type: 'empty', monsterType: null };
            }
            worldData[1].type = 'cashier';
            
            // Ставим жителей на карту
            worldData[10] = { type: 'artiste', monsterType: null };
            worldData[50] = { type: 'sage', monsterType: null };
            
            let placedObs = 0;
            while (placedObs < 150) {
                let idx = Math.floor(Math.random() * totalCells);
                if (idx > 1 && idx !== 10 && idx !== 50 && worldData[idx].type === 'empty') { worldData[idx].type = 'obstacle'; placedObs++; }
            }
            
            let placedChests = 0;
            while (placedChests < 20) {
                let idx = Math.floor(Math.random() * totalCells);
                if (idx > 1 && idx !== 10 && idx !== 50 && worldData[idx].type === 'empty') { worldData[idx].type = 'chest'; placedChests++; }
            }
            
            const monsters = ['👹', '👺', '🤖', '🎃', '🧙🏻', '🧌', '🧛🏻‍♂️'];
            let placedMon = 0;
            while (placedMon < 15) {
                let idx = Math.floor(Math.random() * totalCells);
                if (idx > 1 && idx !== 10 && idx !== 50 && worldData[idx].type === 'empty') { 
                    worldData[idx].type = 'monster'; 
                    worldData[idx].monsterType = monsters[Math.floor(Math.random() * monsters.length)]; 
                    placedMon++; 
                }
            }
            set(worldRef, worldData);
        }
    });
});
