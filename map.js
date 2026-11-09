// map.js
const mapSize = 30;
const mapContainer = document.getElementById('map');

window.renderWorld = function(worldData, playersData, myName, myData) {
    try {
        if (!mapContainer) return;
        mapContainer.innerHTML = '';
        
        if (myData) {
            document.getElementById('player-level').textContent = `Ур. ${myData.level || 1}/50`;
            document.getElementById('player-hp').textContent = `${myData.hp || 10}/${myData.maxHp || 10} HP`;
            document.getElementById('player-tickets').textContent = `🎫 ${myData.tickets || 0}`;
            document.getElementById('player-crystals').textContent = `💎 ${myData.crystals || 0}`;
        }

        for (let i = 0; i < mapSize * mapSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = `cell-${i}`;
            const cellData = (worldData && worldData[i]) ? worldData[i] : {type: 'empty'};
            
            if (cellData.type === 'obstacle') cell.textContent = '🌲';
            else if (cellData.type === 'chest') cell.textContent = '🎁';
            else if (cellData.type === 'monster') cell.textContent = cellData.monsterType || '👹';
            else if (cellData.type === 'cashier') cell.textContent = '🎪';
            else cell.textContent = '·';
            
            cell.addEventListener('click', () => window.attemptMove(i, cellData, myData));
            mapContainer.appendChild(cell);
        }

        if (playersData) {
            for (let key in playersData) {
                const p = playersData[key];
                const cell = document.getElementById(`cell-${p.position}`);
                if (cell) {
                    cell.textContent = (p.name === myName) ? (myData.avatar || 'Я') : p.name[0].toUpperCase();
                    cell.style.color = (p.name === myName) ? '#ffcc00' : '#00ccff';
                    cell.style.fontWeight = 'bold';
                    cell.style.fontSize = '14px';
                }
            }
        }
    } catch (e) {
        console.error("ОШИБКА В РЕНДЕРЕ КАРТЫ:", e);
    }
};

window.attemptMove = async function(targetIndex, cellData, myData) {
    try {
        const { ref, update, db } = window.game;
        if (!myData) return;
        const playerRef = ref(db, 'players/' + window.game.playerName);
        
        if (myData.position === targetIndex) {
            if (cellData.type === 'monster') window.openBattle(targetIndex, cellData.monsterType, myData);
            if (cellData.type === 'obstacle') window.cutObstacle(targetIndex, myData);
            if (cellData.type === 'chest') window.openChest(targetIndex, myData);
            if (cellData.type === 'cashier') window.showCashier();
            return;
        }

        const currentPos = myData.position;
        const row = Math.floor(currentPos / mapSize), col = currentPos % mapSize;
        const targetRow = Math.floor(targetIndex / mapSize), targetCol = targetIndex % mapSize;
        
        if (Math.abs(row - targetRow) > 1 || Math.abs(col - targetCol) > 1) {
            if (cellData.type === 'obstacle') {
                if (confirm("Побежать и разобрать завал?")) window.startPathfinding(targetIndex, myData, true);
                return;
            }
            if (confirm("Побежать к этой клетке?")) window.startPathfinding(targetIndex, myData);
            return;
        }

        if (cellData.type === 'obstacle' && (!myData.inventory || myData.inventory.axe <= 0)) { 
            if(window.showNotification) window.showNotification("Нужен топор! Купите в лавке.", 'damage'); 
            return; 
        }
        if (cellData.type === 'monster') { window.openBattle(targetIndex, cellData.monsterType, myData); return; }
        
        if (cellData.type === 'empty' || cellData.type === 'chest' || cellData.type === 'cashier' || cellData.type === 'obstacle') {
            update(playerRef, { position: targetIndex });
            if (cellData.type === 'chest') window.openChest(targetIndex, myData);
            if (cellData.type === 'cashier') window.showCashier();
            if (cellData.type === 'obstacle') window.cutObstacle(targetIndex, myData);
        }
    } catch (e) {
        console.error("ОШИБКА ПРИ ДВИЖЕНИИ:", e);
    }
};

window.startPathfinding = function(targetIndex, myData, autoAction = false) {
    try {
        const { ref, get, update, db } = window.game;
        get(ref(db, 'world')).then((snap) => {
            const world = snap.val();
            if (!world) return;
            
            const start = myData.position;
            const queue = [[start]];
            const visited = new Set([start]);
            let path = null;
            
            while (queue.length > 0) {
                const currentPath = queue.shift();
                const currPos = currentPath[currentPath.length - 1];
                if (currPos === targetIndex) { path = currentPath; break; }
                const r = Math.floor(currPos / mapSize), c = currPos % mapSize;
                const neighbors = [(r > 0) ? currPos - mapSize : null, (r < mapSize - 1) ? currPos + mapSize : null, (c > 0) ? currPos - 1 : null, (c < mapSize - 1) ? currPos + 1 : null];
                for (let n of neighbors) {
                    if (n !== null && !visited.has(n)) {
                        const cellType = world[n] ? world[n].type : 'empty';
                        if (cellType === 'empty' || (autoAction && n === targetIndex)) { 
                            visited.add(n); queue.push([...currentPath, n]); 
                        }
                    }
                }
            }
            if (path) {
                let step = 0;
                const interval = setInterval(() => {
                    if (step >= path.length - 1) { 
                        clearInterval(interval); 
                        if (autoAction) {
                            const finalCell = world[targetIndex];
                            if (finalCell && finalCell.type === 'obstacle') window.cutObstacle(targetIndex, myData);
                        }
                        return; 
                    }
                    step++; update(ref(db, 'players/' + window.game.playerName), { position: path[step] });
                }, 300);
            } else {
                if(window.showNotification) window.showNotification("Путь заблокирован!", 'damage');
            }
        });
    } catch (e) {
        console.error("ОШИБКА ПРИ ПОИСКЕ ПУТИ:", e);
    }
};

// --- СЛУШАТЕЛЬ БАЗЫ ДАННЫХ (ИСПРАВЛЕНО: одно объявление) ---
const { ref, onValue, db } = window.game;

onValue(ref(db, 'world'), (worldSnap) => {
    onValue(ref(db, 'players'), (playersSnap) => {
        const playersData = playersSnap.val();
        const myData = playersData ? playersData[window.game.playerName] : null;
        window.renderWorld(worldSnap.val(), playersData, window.game.playerName, myData);
    });
});
