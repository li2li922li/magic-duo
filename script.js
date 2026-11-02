// Пока просто заглушки для кнопок и генерация карты
const mapSize = 10;
const mapContainer = document.getElementById('map');

// Генерируем карту 10х10
for (let i = 0; i < mapSize * mapSize; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.id = `cell-${i}`;
    cell.textContent = '·'; // Пустая клетка
    mapContainer.appendChild(cell);
}

// Заглушки функций
function showInventory() { alert('Инвентарь пока пуст'); }
function showQuests() { alert('Заданий пока нет'); }
function refreshGame() { alert('Обновление...'); }
function showMenu() { alert('Вы уже в игре'); }
