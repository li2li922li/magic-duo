// Ждём, пока Firebase загрузится (он подключается в index.html)
window.addEventListener('load', () => {
    const { db, ref, set, onValue } = window.gameDB;
    
    // Создаём карту 10х10
    const mapSize = 10;
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = ''; // Очищаем

    for (let i = 0; i < mapSize * mapSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = `cell-${i}`;
        cell.textContent = '·';
        mapContainer.appendChild(cell);
    }

    // --- ЛОГИКА ИГРОКА ---
    // Спрашиваем имя при входе (пока просто для теста)
    let playerName = prompt("Введите имя вашего волшебника:");
    if (!playerName) playerName = "Безымянный";

    // Ссылка на нашего игрока в базе данных Firebase
    // Мы используем имя как ключ, чтобы не перезаписывать друг друга
    const playerRef = ref(db, 'players/' + playerName);

    // Отправляем данные в базу
    set(playerRef, {
        name: playerName,
        level: 1,
        hp: 10,
        maxHp: 10,
        tickets: 0,
        crystals: 0,
        position: 0, // Пока стоим на 0-й клетке
        lastSeen: Date.now()
    });

    // Слушаем изменения из базы (чтобы видеть второго игрока)
    onValue(ref(db, 'players'), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Очищаем карту от старых игроков
        document.querySelectorAll('.cell').forEach(c => c.textContent = '·');

        // Рисуем всех игроков на карте
        for (let key in data) {
            const p = data[key];
            const cell = document.getElementById(`cell-${p.position}`);
            if (cell) {
                // Если это мы - рисуем "Я", если другой - первую букву имени
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
