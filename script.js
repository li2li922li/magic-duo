window.addEventListener('load', () => {
    const { db, ref, set, onValue, update, get } = window.gameDB;
    const mapSize = 30;
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';

    // --- УВЕДОМЛЕНИЯ ---
    const notifContainer = document.createElement('div');
    notifContainer.style.cssText = `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 1000; pointer-events: none; width: 90%; max-width: 400px;`;
    document.body.appendChild(notifContainer);

    function showNotification(text, type) {
        const el = document.createElement('div');
        el.textContent = text;
        let bgColor = '#90ee90', borderColor = '#5cb85c';
        if (type === 'obstacle') { bgColor = '#ffb347'; borderColor = '#d98c3a'; }
        if (type === 'crystal') { bgColor = '#87ceeb'; borderColor = '#4682b4'; }
        if (type === 'damage') { bgColor = '#ff6b6b'; borderColor = '#d13c3c'; }
        if (type === 'player') { bgColor = '#ffb6c1'; borderColor = '#d17b8a'; }
        if (type === 'gift') { bgColor = '#dda0dd'; borderColor = '#9370db'; }

        el.style.cssText = `background: ${bgColor}; color: #111; padding: 10px 15px; border-radius: 5px; border: 2px solid ${borderColor}; font-weight: bold; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.5); opacity: 0; transition: all 0.3s ease; transform: translateY(20px); font-size: 14px;`;
        notifContainer.appendChild(el);
        setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 10);
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; setTimeout(() => el.remove(), 300); }, 4000);
    }

    // --- ВХОД ---
    let playerName = prompt("Введите имя вашего волшебника:");
    if (!playerName) playerName = "Безымянный";
    document.getElementById('player-name').textContent = playerName;

    const playerRef = ref(db, 'players/' + playerName);
    const worldRef = ref(db, 'world');

    const startingInventory = { axe: 10, arrows: 20, evasionPotion: 2, cookies: 3, milk: 2 };
    const avatarOptions = ['🥷🏻', '🧚🏻‍♀️', '🧚🏻', '🧚🏻‍♂️', '🧜🏻‍♀️', '🧜🏻‍♂️', '👸🏻', '🤴🏻'];

    const levelRewards = {
        2: { type: 'weapon', name: 'Боевой посох' },
        3: { type: 'potion', name: 'Масло скользкости' },
        4: { type: 'hp_crystals', hp: 5, crystals: 10 },
        5: { type: 'food', name: 'Вино' },
        6: { type: 'hp', hp: 5 },
        7: { type: 'hp_crystals', hp: 5, crystals: 10 },
        8: { type: 'hp', hp: 5 },
        9: { type: 'hp_crystals', hp: 5, crystals: 10 },
        10: { type: 'combo', items: ['wine'], crystals: 10 },
        11: { type: 'weapon', name: 'Дубинка' },
        12: { type: 'spell', name: 'Водяная сфера' },
        13: { type: 'hp_crystals', hp: 10, crystals: 10 },
        14: { type: 'food', name: 'Сырная тарелка' },
        15: { type: 'hp', hp: 10 },
        16: { type: 'hp_crystals', hp: 10, crystals: 10 },
        17: { type: 'arrows', count: 10 },
        18: { type: 'spell', name: 'Власть над ветрами' },
        19: { type: 'hp_crystals', hp: 10, crystals: 10 },
        20: { type: 'combo', items: ['windSpell'], crystals: 20 },
        21: { type: 'weapon', name: 'Кинжал' },
        22: { type: 'food', name: 'Шоколад' },
        23: { type: 'potion', name: 'Зелье уменьшения' },
        24: { type: 'hp_crystals', hp: 15, crystals: 20 },
        25: { type: 'spell', name: 'Власть над водами' },
        26: { type: 'hp', hp: 15 },
        27: { type: 'hp_crystals', hp: 15, crystals: 20 },
        28: { type: 'potion', name: 'Ядовитое зелье' },
        29: { type: 'hp', hp: 15 },
        30: { type: 'combo', items: ['chocolate', 'poisonPotion'], crystals: 30 },
        31: { type: 'weapon', name: 'Кнут' },
        32: { type: 'food', name: 'Пиво' },
        33: { type: 'potion', name: 'Зелье силы великана' },
        34: { type: 'hp_crystals', hp: 20, crystals: 30 },
        35: { type: 'spell', name: 'Власть над огнём' },
        36: { type: 'hp', hp: 20 },
        37: { type: 'hp_crystals', hp: 20, crystals: 30 },
        38: { type: 'hp', hp: 20 },
        39: { type: 'hp_crystals', hp: 20, crystals: 30 },
        40: { type: 'combo', items: ['healingPotion', 'wine', 'beer'], crystals: 40 },
        41: { type: 'weapon', name: 'Молот' },
        42: { type: 'food', name: 'Мясная нарезка' },
        43: { type: 'potion', name: 'Зелье неуязвимости' },
        44: { type: 'hp_crystals', hp: 25, crystals: 50 },
        45: { type: 'spell', name: 'Вспышка мечей' },
        46: { type: 'hp', hp: 25 },
        47: { type: 'hp_crystals', hp: 25, crystals: 50 },
        48: { type: 'food', name: 'Куриный шашлычок' },
        49: { type: 'hp_crystals', hp: 25, crystals: 50 },
        50: { type: 'combo', items: ['randomPotion'], crystals: 50 }
    };

    // ЗАДАНИЯ
    const questsList = [
        { id: 'dishes', name: 'Помыть посуду', tickets: 1 },
        { id: 'trash', name: 'Вынести мусор', tickets: 1 },
        { id: 'package', name: 'Забрать посылку', tickets: 1 },
        { id: 'zhkh_transfer', name: 'Передать показания ЖКХ', tickets: 1 },
        { id: 'zhkh_pay', name: 'Оплатить ЖКХ', tickets: 1 },
        { id: 'laundry_start', name: 'Запустить стирку', tickets: 2 },
        { id: 'laundry_hang', name: 'Развесить белье', tickets: 1 },
        { id: 'laundry_fold', name: 'Разобрать белье', tickets: 1 },
        { id: 'bed', name: 'Поменять постельное белье', tickets: 2 },
        { id: 'dust', name: 'Протереть пыль в 1 комнате', tickets: 3 },
        { id: 'floors', name: 'Помыть полы в 1 комнате', tickets: 3 },
        { id: 'groceries', name: 'Закупиться продуктами', tickets: 3 },
        { id: 'lunch', name: 'Приготовить обед', tickets: 5 },
        { id: 'dinner', name: 'Приготовить ужин', tickets: 5 },
        { id: 'massage', name: 'Сделать массаж', tickets: 5 },
        { id: 'flowers', name: 'Подарить цветы просто так', tickets: 10 },
        { id: 'gift', name: 'Подарить подарок просто так', tickets: 10 },
        { id: 'bake', name: 'Испечь пирожки/торт', tickets: 20 },
        { id: 'table', name: 'Убрать со стола', tickets: 1 },
        { id: 'water_flowers', name: 'Полить цветы', tickets: 2 }
    ].sort((a, b) => a.tickets - b.tickets);

    // КАССА
    const cashierItems = [
        { id: 'crystals_10', name: 'Обменять 1 билет на 10 кристаллов', price: 1, type: 'crystals', value: 10 },
        { id: 'delay', name: 'Отсрочка домашнего дела на 1 день', price: 1, type: 'effect' },
        { id: 'walk', name: 'Прогулка', price: 5, type: 'real' },
        { id: 'massage', name: 'Получить массаж', price: 5, type: 'real' },
        { id: 'beer', name: 'Пиво до 1л (1 раз в день)', price: 5, type: 'real' },
        { id: 'hookah', name: 'Поход в кальянную', price: 10, type: 'real' },
        { id: 'cinema', name: 'Поход в кино', price: 15, type: 'real' },
        { id: 'sushi', name: 'Заказ роллов/суши', price: 15, type: 'real' },
        { id: 'pizza', name: 'Заказ пиццы', price: 15, type: 'real' },
        { id: 'restaurant', name: 'Поход в ресторан', price: 20, type: 'real' },
        { id: 'lazy_day', name: 'Целый день ничего неделания', price: 10, type: 'real' },
        { id: 'small_gift', name: 'Небольшой недорогой подарочек', price: 10, type: 'real' },
        { id: 'romantic_dinner', name: 'Романтический ужин', price: 10, type: 'real' },
        { id: 'unusual_date', name: 'Необычное свидание', price: 50, type: 'real' },
        { id: 'trip', name: 'Поездка в другой город', price: 100, type: 'real' }
    ];

    get(playerRef).then((snapshot) => {
        if (!snapshot.exists()) {
            set(playerRef, {
                name: playerName, level: 1, xp: 0, hp: 10, maxHp: 10,
                tickets: 0, crystals: 0, position: 0, lastSeen: Date.now(),
                inventory: startingInventory, invulnTurns: 0, avatar: '🥷🏻'
            });
        }
    });

    // --- ГЕНЕРАЦИЯ МИРА ---
    get(worldRef).then((snapshot) => {
        if (!snapshot.exists()) {
            const worldData = {};
            let chestCount = 0, obstacleCount = 0, bossCount = 0;
            const monsters = ['👹', '👺', '🤖', '🎃', '🧙🏻', '🧌', '🧛🏻‍♂️'];

            for (let i = 0; i < mapSize * mapSize; i++) {
                let type = 'empty', monsterType = null;
                const rand = Math.random();
                
                if (i === 0) type = 'empty';
                else if (i === 1) type = 'cashier'; // Касса на второй клетке
                else if (rand < 0.10 && obstacleCount < 150) { type = 'obstacle'; obstacleCount++; }
                else if (rand < 0.15 && chestCount < 20) { type = 'chest'; chestCount++; }
                else if (rand < 0.18 && bossCount < 15) { type = 'monster'; monsterType = monsters[Math.floor(Math.random() * monsters.length)]; bossCount++; }
                worldData[i] = { type: type, monsterType: monsterType };
            }
            set(worldRef, worldData);
        }
    });

    // --- ОТРИСОВКА ---
    function renderWorld(worldData, playersData, myName, myData) {
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
            
            const cellData = worldData && worldData[i] ? worldData[i] : {type: 'empty'};
            
            if (cellData.type === 'obstacle') cell.textContent = '🌲';
            else if (cellData.type === 'chest') cell.textContent = '🎁';
            else if (cellData.type === 'monster') cell.textContent = cellData.monsterType || '👹';
            else if (cellData.type === 'cashier') cell.textContent = '🎪';
            else cell.textContent = '·';

            cell.addEventListener('click', () => attemptMove(i, cellData, myData));
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
    }

    // --- АВТОПУТЬ И ДВИЖЕНИЕ ---
    async function attemptMove(targetIndex, cellData, myData) {
        if (!myData) return;
        if (myData.position === targetIndex) {
            // Мы уже стоим тут, значит хотим взаимодействовать
            if (cellData.type === 'monster') openBattle(targetIndex, cellData.monsterType, myData);
            if (cellData.type === 'obstacle') cutObstacle(targetIndex, myData);
            if (cellData.type === 'chest') openChest(targetIndex, myData);
            if (cellData.type === 'cashier') showCashier();
            return;
        }

        // Если клетка далеко - спрашиваем, бежать ли
        const currentPos = myData.position;
        const row = Math.floor(currentPos / mapSize), col = currentPos % mapSize;
        const targetRow = Math.floor(targetIndex / mapSize), targetCol = targetIndex % mapSize;

        if (Math.abs(row - targetRow) > 1 || Math.abs(col - targetCol) > 1) {
            if (confirm("Побежать к этой клетке?")) {
                startPathfinding(targetIndex, myData);
            }
            return;
        }

        // Если клетка соседняя
        if (cellData.type === 'obstacle' && myData.inventory.axe <= 0) {
            showNotification("Нужен топор!", 'damage'); return;
        }
        if (cellData.type === 'monster') {
            openBattle(targetIndex, cellData.monsterType, myData); return;
        }

        // Двигаемся
        update(playerRef, { position: targetIndex });
        if (cellData.type === 'chest') openChest(targetIndex, myData);
        if (cellData.type === 'cashier') showCashier();
    }

    // Поиск пути (упрощенный BFS для обхода препятствий)
    function startPathfinding(targetIndex, myData) {
        get(worldRef).then((snap) => {
            const world = snap.val();
            const start = myData.position;
            const queue = [[start]];
            const visited = new Set([start]);
            let path = null;

            // Обход в ширину (ищем кратчайший путь)
            while (queue.length > 0) {
                const currentPath = queue.shift();
                const currPos = currentPath[currentPath.length - 1];

                if (currPos === targetIndex) {
                    path = currentPath;
                    break;
                }

                const r = Math.floor(currPos / mapSize);
                const c = currPos % mapSize;
                const neighbors = [
                    (r > 0) ? currPos - mapSize : null,
                    (r < mapSize - 1) ? currPos + mapSize : null,
                    (c > 0) ? currPos - 1 : null,
                    (c < mapSize - 1) ? currPos + 1 : null
                ];

                for (let n of neighbors) {
                    if (n !== null && !visited.has(n)) {
                        const cellType = world[n] ? world[n].type : 'empty';
                        // Идем только по пустым и сундукам (препятствия и монстры блокируют)
                        if (cellType === 'empty' || cellType === 'chest') {
                            visited.add(n);
                            queue.push([...currentPath, n]);
                        }
                    }
                }
            }

            if (path) {
                // Начинаем анимацию движения
                let step = 0;
                const interval = setInterval(() => {
                    if (step >= path.length - 1) {
                        clearInterval(interval);
                        // Дошли до места, взаимодействуем
                        const finalCell = world[targetIndex] || { type: 'empty' };
                        if (finalCell.type === 'chest') openChest(targetIndex, myData);
                        return;
                    }
                    step++;
                    update(playerRef, { position: path[step] });
                }, 300);
            } else {
                showNotification("Путь заблокирован!", 'damage');
            }
        });
    }

    // --- ВЗАИМОДЕЙСТВИЯ ---
    function cutObstacle(index, myData) {
        if (myData.inventory.axe > 0) {
            const newInv = { ...myData.inventory, axe: myData.inventory.axe - 1 };
            processXP(myData, Math.floor(Math.random() * 10) + 1);
            update(playerRef, { inventory: newInv });
            update(ref(db, `world/${index}`), { type: 'empty', monsterType: null });
            showNotification(`Завал разобран! Топор: ${newInv.axe}/10`, 'obstacle');
        } else {
            showNotification("Топор сломался!", 'damage');
        }
    }

    function openChest(index, myData) {
        const rand = Math.random();
       
