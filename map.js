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
            else if (cellData.type === 'artiste') cell.textContent = '🤹🏻‍♀️';
            else if (cellData.type === 'sage') cell.textContent = '🧘🏼‍♂️';
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

window.showRunPrompt = function(targetIndex, myData, isObstacle = false) {
    const oldPrompt = document.getElementById('run-prompt');
    if (oldPrompt) oldPrompt.remove();

    const prompt = document.createElement('div');
    prompt.id = 'run-prompt';
    prompt.style.cssText = `
        position: fixed; bottom: 20%; left: 50%; transform: translateX(-50%);
        background: rgba(0, 50, 0, 0.95); border: 2px solid #00ff00; 
        color: #fff; padding: 15px; border-radius: 8px; z-index: 2000;
        text-align: center; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        width: 200px;
    `;
    prompt.innerHTML = `
        <p style="margin: 0 0 10px 0;">${isObstacle ? 'Побежать и разобрать?' : 'Побежать к этой клетке?'}</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="run-yes" style="background: #006400; color: white; border: 1px solid #00ff00; padding: 5px 15px; border-radius: 4px; cursor: pointer;">Да</button>
            <button id="run-no" style="background: #4a0000; color: white; border: 1px solid #ff0000; padding: 5px 15px; border-radius: 4px; cursor: pointer;">Нет</button>
        </div>
    `;
    document.body.appendChild(prompt);

    document.getElementById('run-yes').onclick = () => {
        prompt.remove();
        window.startPathfinding(targetIndex, myData, isObstacle);
    };
    document.getElementById('run-no').onclick = () => {
        prompt.remove();
    };
};

window.attemptMove = async function(targetIndex, cellData, myData) {
    try {
        const { ref, update, db, get } = window.game;
        if (!myData) return;
        const playerRef = ref(db, 'players/' + window.game.playerName);
        
        // Если мы уже на этой клетке
        if (myData.position === targetIndex) {
            if (cellData.type === 'monster') window.openBattle(targetIndex, cellData.monsterType, myData);
            if (cellData.type === 'obstacle') window.cutObstacle(targetIndex, myData);
            if (cellData.type === 'chest') window.openChest(targetIndex, myData);
            if (cellData.type === 'cashier') window.showCashier();
            
            // Обработка жителей
            if (cellData.type === 'artiste') {
                get(ref(db, `players/${window.game.playerName}/questsProgress/artiste`)).then((snap) => {
                    const progress = snap.val();
                    const stageIndex = progress ? progress.stage : 0;
                    if (stageIndex < 5) window.openQuest('artiste', stageIndex, myData);
                    else window.showNotification("Я уже всё рассказал. Спасибо тебе!", 'player');
                });
            }
            if (cellData.type === 'sage') {
                get(ref(db, `players/${window.game.playerName}/questsProgress/sage`)).then((snap) => {
                    const progress = snap.val();
                    const stageIndex = progress ? progress.stage : 0;
                    if (stageIndex < 3) window.openQuest('sage', stageIndex, myData);
                    else window.showNotification("Вода всегда найдёт путь. И ты тоже.", 'player');
                });
            }
            return;
        }

        const currentPos = myData.position;
        const row = Math.floor(currentPos / mapSize), col = currentPos % mapSize;
        const targetRow = Math.floor(targetIndex / mapSize), targetCol = targetIndex % mapSize;
        
        // Если клетка далеко
        if (Math.abs(row - targetRow) > 1 || Math.abs(col - targetCol) > 1) {
            if (cellData.type === 'obstacle') {
                window.showRunPrompt(targetIndex, myData, true);
                return;
            }
            window.showRunPrompt(targetIndex, myData, false);
            return;
        }

        // Если клетка соседняя
        if (cellData.type === 'obstacle' && (!myData.inventory || myData.inventory.axe <= 0)) { 
            if(window.showNotification) window.showNotification("Нужен топор! Купите в лавке.", 'damage'); 
            return; 
        }
        if (cellData.type === 'monster') { window.openBattle(targetIndex, cellData.monsterType, myData); return; }
        
        // Двигаемся (на пустые, сундуки, кассу, жителей или завал)
        if (cellData.type === 'empty' || cellData.type === 'chest' || cellData.type === 'cashier' || cellData.type === 'obstacle' || cellData.type === 'artiste' || cellData.type === 'sage') {
            update(playerRef, { position: targetIndex });
            if (cellData.type === 'chest') window.openChest(targetIndex, myData);
            if (cellData.type === 'cashier') window.showCashier();
            if (cellData.type === 'obstacle') window.cutObstacle(targetIndex, myData);
            if (cellData.type === 'artiste' || cellData.type === 'sage') {
                // Если наступили на клетку с жителем - сразу открываем квест
                if (cellData.type === 'artiste') {
                    get(ref(db, `players/${window.game.playerName}/questsProgress/artiste`)).then((snap) => {
                        const progress = snap.val();
                        const stageIndex = progress ? progress.stage : 0;
                        if (stageIndex < 5) window.openQuest('artiste', stageIndex, myData);
                        else window.showNotification("Я уже всё рассказал. Спасибо тебе!", 'player');
                    });
                }
                if (cellData.type === 'sage') {
                    get(ref(db, `players/${window.game.playerName}/questsProgress/sage`)).then((snap) => {
                        const progress = snap.val();
                        const stageIndex = progress ? progress.stage : 0;
                        if (stageIndex < 3) window.openQuest('sage', stageIndex, myData);
                        else window.showNotification("Вода всегда найдёт путь. И ты тоже.", 'player');
                    });
                }
            }
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
                        // Идем только по пустым, либо если это цель
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

const { ref, onValue, db } = window.game;

onValue(ref(db, 'world'), (worldSnap) => {
    onValue(ref(db, 'players'), (playersSnap) => {
        const playersData = playersSnap.val();
        const myData = playersData ? playersData[window.game.playerName] : null;
        window.renderWorld(worldSnap.val(), playersData, window.game.playerName, myData);
    });
});
