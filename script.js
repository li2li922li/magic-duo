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
    const playerName = window.game.playerName;
    const worldRef = ref(db, 'world');

    // Генерация мира (игрок уже создан в index.html)
    get(worldRef).then((snapshot) => {
        if (!snapshot.exists()) {
            console.log("Создаем мир...");
            const mapSize = 30;
            const worldData = {};
            const totalCells = mapSize * mapSize;
            for (let i = 0; i < totalCells; i++) {
                worldData[i] = { type: 'empty', monsterType: null };
            }
            worldData[1].type = 'cashier';
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
                    worldData[idx].type = 'monster'; worldData[idx].monsterType = monsters[Math.floor(Math.random() * monsters.length)]; placedMon++; 
                }
            }
            const flowerTypes = ['🌼', '🌸', '🌺', '🌻', '🍀'];
            let placedFlowers = 0;
            while (placedFlowers < 40) {
                let idx = Math.floor(Math.random() * totalCells);
                if (idx > 1 && idx !== 10 && idx !== 50 && worldData[idx].type === 'empty') { 
                    worldData[idx].type = 'flower'; worldData[idx].flowerType = flowerTypes[Math.floor(Math.random() * flowerTypes.length)]; placedFlowers++; 
                }
            }
            set(worldRef, worldData);
        } else {
            console.log("Мир уже есть.");
        }
    });
});
