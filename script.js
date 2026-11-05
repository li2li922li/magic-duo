window.addEventListener('load', () => {
    const { db, ref, set, onValue, update, get } = window.gameDB;
    
    const mapSize = 30;
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';

    // --- СИСТЕМА УВЕДОМЛЕНИЙ ---
    // Создаем контейнер для уведомлений
    const notifContainer = document.createElement('div');
    notifContainer.id = 'notif-container';
    notifContainer.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        display: flex; flex-direction: column; gap: 8px; z-index: 1000;
        pointer-events: none; width: 90%; max-width: 400px;
    `;
    document.body.appendChild(notifContainer);

    function showNotification(text, type) {
        const el = document.createElement('div');
        el.textContent = text;
        let bgColor = '#90ee90'; // Нежно-зеленый по умолчанию
        let borderColor = '#5cb85c';

        if (type === 'obstacle') { bgColor = '#ffb347'; borderColor = '#d98c3a'; } // Оранжевый (завал)
        if (type === 'crystal') { bgColor = '#87ceeb'; borderColor = '#4682b4'; }  // Голубой (кристаллы)
        if (type === 'damage') { bgColor = '#ff6b6b'; borderColor = '#d13c3c'; }   // Красный (урон)
        if (type === 'player') { bgColor = '#ffb6c1'; borderColor = '#d17b8a'; }   // Розовый (встреча)

        el.style.cssText = `
            background: ${bgColor}; color: #111; padding: 10px 15px;
            border-radius: 5px; border: 2px solid ${borderColor};
            font-weight: bold; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.5);
            opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
            transform: translateY(20px); font-size: 14px;
        `;
        
        notifContainer.appendChild(el);
        setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 10);

        setTimeout(() => {
            el.style.opacity = '0'; el.style.transform = 'translateY(20px)';
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }

    // --- ВХОД В ИГРУ ---
    let playerName = prompt("Введите имя вашего волшебника:");
    if (!playerName) playerName = "Безымянный";
    playerName = playerName.trim();

    document.getElementById('player-name').textContent = playerName;

    const playerRef = ref(db, 'players/' + playerName);
    const worldRef = ref(db, 'world');

    // 1. ИНИЦИАЛИЗАЦИЯ ИГРОКА
    get(playerRef).then((snapshot) => {
        if (!snapshot.exists()) {
            set(playerRef, {
                name: playerName, level: 1, hp: 10, maxHp: 10,
                tickets: 0, crystals: 0, position: 0, lastSeen: Date.now()
            });
        }
    });

    // 2. ГЕНЕРАЦИЯ МИРА (Ограничиваем количество объектов)
    get(worldRef).then((snapshot) => {
        if (!snapshot.exists()) {
            const worldData = {};
            let chestCount = 0;
            let obstacleCount = 0;
            let bossCount = 0;

            for (let i = 0; i < mapSize * mapSize; i++) {
                let type = 'empty';
                const rand = Math.random();
                
                if (i === 0) {
                    type = 'empty';
                } else if (rand < 0.10 && obstacleCount < 150) { // Ограничили завалы до 150 штук
                    type = 'obstacle'; obstacleCount++;
                } else if (rand < 0.15 && chestCount < 20) { // ОГРАНИЧИЛИ СУНДУКИ ДО 20
                    type = 'chest'; chestCount++;
                } else if (rand < 0.16 && bossCount < 5) { // 5 боссов на карту
                    type = 'boss'; bossCount++;
                }
                
                worldData[i] = { type: type };
            }
            set(worldRef, worldData);
        }
    });

    // 3. ОТРИСОВКА И ЛОГИКА
    function renderWorld(worldData, playersData, myName, myData) {
        mapContainer.innerHTML = '';
        
        // Обновляем верхнюю панель
        if (myData) {
            document.getElementById('player-level').textContent = `Ур. ${myData.level || 1}`;
            document.getElementById('player-hp').textContent = `${myData.hp || 10}/${myData.maxHp || 10} HP`;
            document.getElementById('player-tickets').textContent = `🎫 ${myData.tickets || 0}`;
            document.getElementById('player-crystals').textContent = `💎 ${myData.crystals || 0}`;
        }

        for (let i = 0; i < mapSize * mapSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = `cell-${i}`;
            
            const cellType = worldData && worldData[i] ? worldData[i].type : 'empty';
            
            if (cellType === 'obstacle') cell.textContent = '🌲';
            else if (cellType === 'chest') cell.textContent = '🎁';
            else if (cellType === 'boss') cell.textContent = '👹';
            else cell.textContent = '·';

            cell.addEventListener('click', () => attemptMove(i, cellType, myData));
            mapContainer.appendChild(cell);
        }

        // Отрисовка игроков
        if (playersData) {
            for (let key in playersData) {
                const p = playersData[key];
                // Если мы наступили на клетку другого игрока - показываем уведомление
                if (myData && p.name !== myName && p.position === myData.position) {
                    showNotification(`Вы встретили ${p.name}!`, 'player');
                }

                const cell = document.getElementById(`cell-${p.position}`);
                if (cell) {
                    cell.textContent = (p.name === myName) ? 'Я' : p.name[0].toUpperCase();
                    cell.style.color = (p.name === myName) ? '#ffcc00' : '#00ccff';
                    cell.style.fontWeight = 'bold';
                    cell.style.fontSize = '12px';
                }
            }
        }
    }

    // Логика движения
    function attemptMove(targetIndex, cellType, myData) {
        if (cellType === 'obstacle') {
            showNotification("Тут завал! Нужно расчистить.", 'obstacle');
            return;
        }

        // Ходить можно только на соседние клетки
        const currentPos = myData.position;
        const row = Math.floor(currentPos / mapSize);
        const col = currentPos % mapSize;
        const targetRow = Math.floor(targetIndex / mapSize);
        const targetCol = targetIndex % mapSize;

        const rowDiff = Math.abs(row - targetRow);
        const colDiff = Math.abs(col - targetCol);

        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            update(playerRef, { position: targetIndex });

            // Если наступили на сундук
            if (cellType === 'chest') {
                const newCrystals = (myData.crystals || 0) + 5;
                update(playerRef, { crystals: newCrystals });
                update(ref(db, `world/${targetIndex}`), { type: 'empty' }); // Убираем сундук
                showNotification("Вы нашли сундук! +5 кристаллов 💎", 'crystal');
            }
            
            // Если наступили на босса (пока просто урон)
            if (cellType === 'boss') {
                const newHp = Math.max(0, (myData.hp || 10) - 2);
                update(playerRef, { hp: newHp });
                showNotification("Босс ударил вас! -2 HP ❤️", 'damage');
            }

        } else {
            showNotification("Слишком далеко! Ходите по одной клетке.", 'other');
        }
    }

    // Слушаем изменения (игроки и мир)
    onValue(worldRef, (worldSnap) => {
        onValue(ref(db, 'players'), (playersSnap) => {
            const playersData = playersSnap.val();
            const myData = playersData ? playersData[playerName] : null;
            renderWorld(worldSnap.val(), playersData, playerName, myData);
        });
    });

    // Заглушки для кнопок
    window.showInventory = () => showNotification('Инвентарь пока пуст', 'other');
    window.showQuests = () => showNotification('Заданий пока нет', 'other');
    window.refreshGame = () => location.reload();
    window.showMenu = () => showNotification('Вы уже в игре', 'other');
});
