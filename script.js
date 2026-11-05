window.addEventListener('load', () => {
    const { db, ref, set, onValue, update } = window.gameDB;
    
    const mapSize = 10;
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';

    // Создаём карту
    for (let i = 0; i < mapSize * mapSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = `cell-${i}`;
        cell.textContent = '·';
        
        // Добавляем клик по клетке
        cell.addEventListener('click', () => {
            movePlayer(i);
        });

        mapContainer.appendChild(cell);
    }

    // Спрашиваем имя
    let playerName = prompt("Введите имя вашего волшебника:");
    if (!playerName) playerName = "Безымянный";

    const playerRef = ref(db, 'players/' + playerName);

    // Создаем или обновляем игрока при входе
    set(playerRef, {
        name: playerName,
        level: 1,
        hp: 10,
        maxHp: 10,
        tickets: 0,
        crystals: 0,
        position: 0, // Пока на нулевой клетке
        lastSeen: Date.now()
    });

    // Функция движения
    function movePlayer(targetIndex) {
        // Получаем текущие данные игрока из базы, чтобы узнать, где он
        onValue(playerRef, (snapshot) => {
            const p = snapshot.val();
            if (!p) return;

            const currentPos = p.position;
            
            // Проверяем, что ходим только на соседние клетки (вверх, вниз, влево, вправо)
            // Нельзя ходить по диагонали и телепортироваться
            const row = Math.floor(currentPos / mapSize);
            const col = currentPos % mapSize;
            
            const targetRow = Math.floor(targetIndex / mapSize);
            const targetCol = targetIndex % mapSize;

            // Разница по строкам и столбцам не должна быть больше 1
            const rowDiff = Math.abs(row - targetRow);
            const colDiff = Math.abs(col - targetCol);

            // Если разница (1,0) или (0,1) - это соседняя клетка (можно ходить)
            if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
                // Обновляем позицию в базе
                update(playerRef, { position: targetIndex });
            } else {
                // Если клетка не соседняя - не двигаемся (можно вывести сообщение)
                console.log("Слишком далеко! Ходить можно только на соседние клетки.");
            }
        }, { onlyOnce: true }); // onlyOnce, чтобы не было утечек памяти
    }

    // Отрисовка игроков на карте
    onValue(ref(db, 'players'), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Очищаем все клетки
        document.querySelectorAll('.cell').forEach(c => {
            c.textContent = '·';
            c.style.color = '#888';
            c.style.fontWeight = 'normal';
        });

        // Рисуем игроков
        for (let key in data) {
            const p = data[key];
            const cell = document.getElementById(`cell-${p.position}`);
            if (cell) {
                cell.textContent = (p.name === playerName) ? 'Я' : p.name[0].toUpperCase();
                cell.style.color = (p.name === playerName) ? '#ffcc00' : '#00ccff';
                cell.style.fontWeight = 'bold';
            }
        }
    });

    // --- ЗАГЛУШКИ КНОПОК ---
    window.showInventory = () => alert('Инвентарь пока пуст');
    window.showQuests = () => alert('Заданий пока нет');
    window.refreshGame = () => alert('Обновление...');
    window.showMenu = () => alert('Вы уже в игре');
});
