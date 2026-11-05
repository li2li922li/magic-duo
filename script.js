window.addEventListener('load', () => {
    const { db, ref, set, onValue, update, get } = window.gameDB;
    
    const mapSize = 30; // Теперь карта 30х30
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';

    let playerName = prompt("Введите имя вашего волшебника:");
    if (!playerName) playerName = "Безымянный";

    const playerRef = ref(db, 'players/' + playerName);
    const worldRef = ref(db, 'world');

    // 1. ИНИЦИАЛИЗАЦИЯ ИГРОКА
    // Проверяем, есть ли игрок в базе. Если нет - создаем.
    get(playerRef).then((snapshot) => {
        if (!snapshot.exists()) {
            set(playerRef, {
                name: playerName,
                level: 1,
                hp: 10,
                maxHp: 10,
                tickets: 0,
                crystals: 0,
                position: 0, // Начинаем в левом верхнем углу
                lastSeen: Date.now()
            });
        }
    });

    // 2. ГЕНЕРАЦИЯ МИРА (Если мир еще не создан)
    get(worldRef).then((snapshot) => {
        if (!snapshot.exists()) {
            const worldData = {};
            // Проходим по всем 900 клеткам
            for (let i = 0; i < mapSize * mapSize; i++) {
                let type = 'empty';
                const rand = Math.random();
                
                if (i === 0) {
                    type = 'empty'; // Стартовая клетка всегда пустая
                } else if (rand < 0.15) {
                    type = 'obstacle'; // 15% шанс, что это завал
                } else if (rand < 0.25) {
                    type = 'chest';    // 10% шанс, что это сундук
                } else if (rand < 0.28) {
                    type = 'boss';     // 3% шанс, что это босс
                }
                
                worldData[i] = { type: type };
            }
            // Сохраняем сгенерированный мир в базу
            set(worldRef, worldData);
        }
    });

    // 3. ОТРИСОВКА КАРТЫ И ПЕРЕМЕЩЕНИЕ
    function renderWorld(worldData, playersData, myName) {
        mapContainer.innerHTML = ''; // Очищаем
        
        for (let i = 0; i < mapSize * mapSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = `cell-${i}`;
            
            // Берем тип клетки из базы (если нет - пусто)
            const cellType = worldData && worldData[i] ? worldData[i].type : 'empty';
            
            // Ставим иконку в зависимости от типа
            if (cellType === 'obstacle') cell.textContent = '🌲';
            else if (cellType === 'chest') cell.textContent = '🎁';
            else if (cellType === 'boss') cell.textContent = '👹';
            else cell.textContent = '·';

            // Клик по клетке
            cell.addEventListener('click', () => {
                attemptMove(i, cellType);
            });

            mapContainer.appendChild(cell);
        }

        // Рисуем игроков поверх карты
        if (playersData) {
            for (let key in playersData) {
                const p = playersData[key];
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
    function attemptMove(targetIndex, cellType) {
        if (cellType === 'obstacle') {
            alert("Тут завал! Нужно расчистить путь.");
            return;
        }

        get(playerRef).then((snapshot) => {
            const p = snapshot.val();
            if (!p) return;

            const currentPos = p.position;
            const row = Math.floor(currentPos / mapSize);
            const col = currentPos % mapSize;
            const targetRow = Math.floor(targetIndex / mapSize);
            const targetCol = targetIndex % mapSize;

            const rowDiff = Math.abs(row - targetRow);
            const colDiff = Math.abs(col - targetCol);

            // Ходить можно только на соседнюю клетку (вверх, вниз, влево, вправо)
            if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
                update(playerRef, { position: targetIndex });
                
                // Если наступили на сундук - собираем кристаллы (пока просто заглушка)
                if (cellType === 'chest') {
                    update(playerRef, { crystals: (p.crystals || 0) + 5 });
                    // Убираем сундук с карты
                    update(ref(db, `world/${targetIndex}`), { type: 'empty' });
                    alert("Вы нашли сундук! +5 кристаллов 💎");
                }
            } else {
                console.log("Слишком далеко! Ходить можно только на соседние клетки.");
            }
        });
    }

    // Слушаем изменения мира и игроков, чтобы обновлять экран
    onValue(worldRef, (worldSnap) => {
        onValue(ref(db, 'players'), (playersSnap) => {
            renderWorld(worldSnap.val(), playersSnap.val(), playerName);
        });
    });

    // Заглушки для кнопок
    window.showInventory = () => alert('Инвентарь пока пуст');
    window.showQuests = () => alert('Заданий пока нет');
    window.refreshGame = () => location.reload(); // Теперь кнопка "Обновить" перезагружает страницу
    window.showMenu = () => alert('Вы уже в игре');
});
