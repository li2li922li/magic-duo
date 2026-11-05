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
        if (rand < 0.5) {
            const xpGain = Math.floor(Math.random() * 15) + 5;
            processXP(myData, xpGain);
            update(playerRef, { crystals: (myData.crystals || 0) + 5 });
            update(ref(db, `world/${index}`), { type: 'empty', monsterType: null });
            showNotification(`+5 кристаллов 💎 и +${xpGain} XP`, 'crystal');
        } else {
            const gifts = ['👑', '🕶', '👒', '💐', '🍱', '🏆', '🎮', '📱', '⌚️', '📷'];
            askGiftAction(index, gifts[Math.floor(Math.random() * gifts.length)], myData);
        }
    }

    // --- УРОВНИ И ОПЫТ ---
    function processXP(myData, xpGain) {
        let newXp = (myData.xp || 0) + xpGain;
        let newLevel = myData.level || 1;
        let leveledUp = false;
        let newMaxHp = myData.maxHp || 10;
        let newCrystals = myData.crystals || 0;
        let newInv = myData.inventory ? { ...myData.inventory } : {};

        while (true) {
            const requiredXP = newLevel * 100;
            if (newXp >= requiredXP && newLevel < 50) {
                newXp -= requiredXP;
                newLevel++;
                leveledUp = true;
                const reward = levelRewards[newLevel];
                if (reward) {
                    if (reward.type === 'hp') newMaxHp += reward.hp;
                    else if (reward.type === 'hp_crystals') { newMaxHp += reward.hp; newCrystals += reward.crystals; }
                    else if (reward.type === 'arrows') newInv.arrows = (newInv.arrows || 0) + reward.count;
                    else if (reward.type === 'combo') {
                        newCrystals += reward.crystals;
                        reward.items.forEach(item => newInv[item] = (newInv[item] || 0) + 1);
                    }
                }
            } else break;
        }

        if (leveledUp) {
            update(playerRef, { xp: newXp, level: newLevel, maxHp: newMaxHp, hp: newMaxHp, crystals: newCrystals, inventory: newInv });
            showNotification(`🎉 Новый уровень: ${newLevel}!`, 'player');
        } else {
            update(playerRef, { xp: newXp, crystals: newCrystals, inventory: newInv });
        }
    }

    // --- ПОДАРКИ ---
    function askGiftAction(targetIndex, gift, myData) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay'; overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="modal-content" style="text-align:center; border-color:#9370db;">
                <h2 style="color:#dda0dd;">Вы нашли: ${gift}</h2>
                <p>Что сделать?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button id="btn-sell" style="background:#4a6a4a; padding:10px;">Продать (10 💎)</button>
                    <button id="btn-gift" style="background:#6a4a8a; padding:10px;">Подарить</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('btn-sell').onclick = () => {
            update(playerRef, { crystals: (myData.crystals || 0) + 10 });
            update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
            showNotification("Продано за 10 💎", 'crystal');
            overlay.remove();
        };
        document.getElementById('btn-gift').onclick = () => {
            get(ref(db, 'players')).then((snap) => {
                const players = snap.val(); let partner = null;
                for (let key in players) if (key !== playerName) partner = key;
                if (partner) {
                    set(ref(db, `players/${partner}/gifts`).push(), { item: gift, from: playerName });
                    showNotification(`Подарок отправлен!`, 'gift');
                } else {
                    update(playerRef, { crystals: (myData.crystals || 0) + 10 });
                }
                update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
                overlay.remove();
            });
        };
    }

    onValue(ref(db, `players/${playerName}/gifts`), (snap) => {
        const gifts = snap.val();
        if (gifts) {
            for (let key in gifts) {
                showNotification(`Вам подарок от ${gifts[key].from}: ${gifts[key].item}!`, 'gift');
                set(ref(db, `players/${playerName}/gifts/${key}`), null);
            }
        }
    });

    // --- БОЙ ---
    let currentBattle = { targetIndex: null, monsterHp: 10, monsterMaxHp: 10, monsterType: '👹', monsterName: 'Монстр', previousPos: 0 };
    const monsterDescriptions = {
        '👹': { name: 'Огр', desc: 'Огромный, но медленный.', hp: 15, magic: 'Топот (урон 3)' },
        '👺': { name: 'Гоблин', desc: 'Хитрый и быстрый.', hp: 8, magic: 'Яд (урон 1)' },
        '🤖': { name: 'Древний Голем', desc: 'Машина из прошлого.', hp: 20, magic: 'Лазер (урон 4)' },
        '🎃': { name: 'Тыквоголовый', desc: 'Светится в темноте.', hp: 10, magic: 'Страх (пропуск хода)' },
        '🧙🏻': { name: 'Темный Маг', desc: 'Изгнанный волшебник.', hp: 12, magic: 'Огненный шар (урон 5)' },
        '🧌': { name: 'Тролль', desc: 'Регенерирует.', hp: 18, magic: 'Регенерация (+3 HP)' },
        '🧛🏻‍♂️': { name: 'Вампир', desc: 'Пьет кровь.', hp: 14, magic: 'Вампиризм (урон 2)' }
    };

    function openBattle(index, monsterType, myData) {
        const info = monsterDescriptions[monsterType] || { name: 'Неизвестный', desc: '...', hp: 10, magic: '...' };
        currentBattle = { targetIndex: index, monsterHp: info.hp, monsterMaxHp: info.hp, monsterType: monsterType, monsterName: info.name, magic: info.magic, previousPos: myData.position };

        document.getElementById('monster-name').textContent = `${monsterType} ${info.name}`;
        document.getElementById('monster-desc').innerHTML = `<b>История:</b> ${info.desc}<br><b>Магия:</b> ${info.magic}`;
        document.getElementById('battle-log').innerHTML = 'Бой начался!';
        renderBattleInventory(myData);
        updateBattleHpUI();
        document.getElementById('modal-overlay').style.display = 'flex';
    }

    function renderBattleInventory(myData) {
        const invDiv = document.getElementById('battle-inventory');
        invDiv.innerHTML = '';
        const inv = myData.inventory || {};
        
        let items = [];
        if (inv.arrows > 0) items.push({ id: 'bow', name: `🏹 Лук (Стрелы: ${inv.arrows})`, action: "attackMonster('bow')" });
        if (inv.evasionPotion > 0) items.push({ id: 'evasionPotion', name: `💨 Зелье уклонения (x${inv.evasionPotion})`, action: `useItemInBattle('evasionPotion')` });
        if (inv.cookies > 0) items.push({ id: 'cookies', name: `🍪 Печенье (x${inv.cookies})`, action: `useItemInBattle('cookies')` });
        if (inv.milk > 0) items.push({ id: 'milk', name: `🥛 Молоко (x${inv.milk})`, action: `useItemInBattle('milk')` });
        
        // Оружие (если куплено)
        if (inv.staff > 0) items.push({ id: 'staff', name: `🪄 Посох`, action: "attackMonster('staff')" });
        if (inv.club > 0) items.push({ id: 'club', name: `🏏 Дубинка`, action: "attackMonster('club')" });
        if (inv.dagger > 0) items.push({ id: 'dagger', name: `🗡 Кинжал`, action: "attackMonster('dagger')" });

        if (items.length === 0) invDiv.innerHTML = '<p style="font-size:12px; text-align:center; color:#aaa;">Нет предметов для боя</p>';
        else {
            items.forEach(item => {
                invDiv.innerHTML += `<button class="battle-btn" style="width:100%; margin-bottom:5px;" onclick="${item.action}">${item.name}</button>`;
            });
        }
    }

    function updateBattleHpUI() {
        document.getElementById('monster-hp').textContent = `HP: ${currentBattle.monsterHp} / ${currentBattle.monsterMaxHp}`;
    }

    window.closeBattle = (retreat = false) => {
        if (retreat) {
            update(playerRef, { position: currentBattle.previousPos });
            showNotification("Вы отступили!", 'other');
        }
        document.getElementById('modal-overlay').style.display = 'none';
    };

    // Нанесение урона (1 раз за ход)
    let turnInProgress = false;
    window.attackMonster = (weapon) => {
        if (turnInProgress) return; // Защита от спама
        turnInProgress = true;

        get(playerRef).then((snap) => {
            const myData = snap.val();
            const log = document.getElementById('battle-log');
            let damage = 0;
            let newInv = { ...myData.inventory };

            if (weapon === 'bow') {
                if (newInv.arrows <= 0) { log.innerHTML += '<br>Нет стрел!'; turnInProgress = false; return; }
                newInv.arrows -= 1; damage = 1;
                log.innerHTML += `<br>Вы выстрелили из лука! (-1 HP)`;
            } else if (weapon === 'staff') { damage = 2; log.innerHTML += `<br>Вы ударили посохом! (-2 HP)`; }
            else if (weapon === 'club') { damage = 3; log.innerHTML += `<br>Вы ударили дубинкой! (-3 HP)`; }
            else if (weapon === 'dagger') { damage = 4; log.innerHTML += `<br>Вы ударили кинжалом! (-4 HP)`; }

            currentBattle.monsterHp -= damage;
            update(playerRef, { inventory: newInv });
            updateBattleHpUI();

            if (currentBattle.monsterHp <= 0) {
                const xpGain = Math.floor(Math.random() * 15) + 5;
                processXP(myData, xpGain);
                log.innerHTML += `<br>Вы победили! +5 💎 и +${xpGain} XP.`;
                update(playerRef, { crystals: (myData.crystals || 0) + 5 });
                update(ref(db, `world/${currentBattle.targetIndex}`), { type: 'empty', monsterType: null });
                setTimeout(() => { window.closeBattle(false); turnInProgress = false; }, 2000);
                return;
            }

            setTimeout(() => {
                monsterTurn(myData);
                turnInProgress = false;
            }, 1000);
        });
    };

    function monsterTurn(myData) {
        const log = document.getElementById('battle-log');
        let damage = 0;

        if (myData.invulnTurns > 0) {
            log.innerHTML += `<br>Монстр атакует, но зелье защищает вас!`;
            update(playerRef, { invulnTurns: myData.invulnTurns - 1 });
        } else {
            if (Math.random() < 0.3) {
                damage = Math.floor(Math.random() * 3) + 2;
                log.innerHTML += `<br>Монстр использует МАГИЮ! (-${damage} HP)`;
            } else {
                damage = 1;
                log.innerHTML += `<br>Монстр бьет вас! (-${damage} HP)`;
            }
            const newHp = Math.max(0, (myData.hp || 10) - damage);
            update(playerRef, { hp: newHp });
            if (newHp <= 0) {
                log.innerHTML += `<br>Вы проиграли... Возвращаетесь домой.`;
                update(playerRef, { hp: 10, position: 0 });
                setTimeout(() => window.closeBattle(false), 2000);
            }
        }
    }

    window.useItemInBattle = (type) => {
        if (turnInProgress) return;
        turnInProgress = true;

        get(playerRef).then((snap) => {
            const myData = snap.val();
            const log = document.getElementById('battle-log');
            let inv = { ...myData.inventory };
            let used = false;

            if (type === 'evasionPotion' && inv.evasionPotion > 0) {
                inv.evasionPotion -= 1;
                update(playerRef, { inventory: inv, invulnTurns: 2 });
                log.innerHTML += `<br>Вы выпили зелье уклонения! (2 хода)`;
                used = true;
            } else if (type === 'cookies' && inv.cookies > 0) {
                inv.cookies -= 1;
                update(playerRef, { inventory: inv, hp: Math.min((myData.hp + 3), myData.maxHp) });
                log.innerHTML += `<br>Вы съели печенье! (+3 HP)`;
                used = true;
            } else if (type === 'milk' && inv.milk > 0) {
                inv.milk -= 1;
                update(playerRef, { inventory: inv, hp: Math.min((myData.hp + 2), myData.maxHp) });
                log.innerHTML += `<br>Вы выпили молоко! (+2 HP)`;
                used = true;
            }

            if (used) {
                renderBattleInventory({ ...myData, inventory: inv });
                setTimeout(() => { monsterTurn(myData); turnInProgress = false; }, 1000);
            } else {
                log.innerHTML += `<br>Нет предмета!`;
                turnInProgress = false;
            }
        });
    };

    // --- ИНВЕНТАРЬ ---
    window.showInventory = () => {
        get(playerRef).then((snap) => {
            const myData = snap.val();
            const inv = myData.inventory || {};
            const list = document.getElementById('inventory-list');
            list.innerHTML = '';
            const items = [
                { name: '🪓 Топор', count: inv.axe, desc: `Прочность: ${inv.axe}/10` },
                { name: '🏹 Стрелы', count: inv.arrows, desc: 'Урон 1' },
                { name: '💨 Зелье уклонения', count: inv.evasionPotion, desc: '2 хода без урона' },
                { name: '🍪 Печенье', count: inv.cookies, desc: '+3 HP' },
                { name: '🥛 Молоко', count: inv.milk, desc: '+2 HP' },
                { name: '🪄 Боевой посох', count: inv.staff, desc: 'Урон 2' },
                { name: '🏏 Дубинка', count: inv.club, desc: 'Урон 3' },
                { name: '🗡 Кинжал', count: inv.dagger, desc: 'Урон 4' }
            ];
            for (let key in inv) {
                if (!items.find(i => i.name.includes(key)) && typeof inv[key] === 'number' && inv[key] > 0) {
                    items.push({ name: key, count: inv[key], desc: 'Предмет' });
                }
            }

            items.forEach(item => {
                if (item.count > 0) {
                    list.innerHTML += `<div class="inv-item"><div><b>${item.name}</b><br><span style="font-size:10px; color:#aaa;">${item.desc} (x${item.count})</span></div></div>`;
                }
            });
            if (list.innerHTML === '') list.innerHTML = '<p style="text-align:center;">Пусто...</p>';
            document.getElementById('inventory-modal').style.display = 'flex';
        });
    };

    window.closeInventory = () => document.getElementById('inventory-modal').style.display = 'none';

    // --- ПЕРСОНАЖ ---
    window.showCharacter = () => {
        get(playerRef).then((snap) => {
            const myData = snap.val();
            document.getElementById('char-avatar').textContent = myData.avatar || '🥷🏻';
            document.getElementById('char-name').textContent = myData.name;
            document.getElementById('char-level').textContent = myData.level;

            const nextLevelXP = (myData.level) * 100;
            const currentXP = myData.xp || 0;
            const xpPercent = Math.min((currentXP / nextLevelXP) * 100, 100);
            
            document.getElementById('xp-bar').style.width = `${xpPercent}%`;
            document.getElementById('xp-text').textContent = `${currentXP} / ${nextLevelXP} XP`;

            const avatarList = document.getElementById('avatar-list');
            avatarList.innerHTML = '';
            avatarOptions.forEach(av => {
                const div = document.createElement('div');
                div.className = `avatar-option ${av === myData.avatar ? 'selected' : ''}`;
                div.textContent = av;
                div.onclick = () => { update(playerRef, { avatar: av }); showCharacter(); };
                avatarList.appendChild(div);
            });
            document.getElementById('character-modal').style.display = 'flex';
        });
    };

    window.closeCharacter = () => document.getElementById('character-modal').style.display = 'none';

    // --- ЛАВКА ---
    window.showShop = () => {
        get(playerRef).then((snap) => {
            const myData = snap.val();
            document.getElementById('shop-crystals').textContent = myData.crystals || 0;
            const shopList = document.getElementById('shop-list');
            shopList.innerHTML = '';

            const shopItems = [
                { id: 'arrows', name: '🏹 Деревянные стрелы (x5)', price: 5, levelReq: 1, desc: 'Боеприпас' },
                { id: 'evasionPotion', name: '💨 Зелье уклонения', price: 15, levelReq: 1, desc: '2 хода без урона' },
                { id: 'cookies', name: '🍪 Печенье', price: 10, levelReq: 1, desc: '+3 HP' },
                { id: 'milk', name: '🥛 Молоко', price: 5, levelReq: 1, desc: '+2 HP' },
                { id: 'axe', name: '🪓 Топор', price: 10, levelReq: 1, desc: 'Разбирает завалы' },
                { id: 'staff', name: '🪄 Боевой посох', price: 20, levelReq: 2, desc: 'Урон 2' },
                { id: 'wine', name: '🍷 Вино', price: 15, levelReq: 5, desc: '+5 HP' },
                { id: 'club', name: '🏏 Дубинка', price: 30, levelReq: 11, desc: 'Урон 3' },
                { id: 'cheese', name: '🧀 Сырная тарелка', price: 25, levelReq: 14, desc: '+10 HP' },
                { id: 'dagger', name: '🗡 Кинжал', price: 40, levelReq: 21, desc: 'Урон 4' },
                { id: 'chocolate', name: '🍫 Шоколад', price: 35, levelReq: 22, desc: '+20 HP' },
                { id: 'whip', name: '🪢 Кнут', price: 60, levelReq: 31, desc: 'Урон 5' },
                { id: 'beer', name: '🍺 Пиво', price: 45, levelReq: 32, desc: '+30 HP' },
                { id: 'hammer', name: '🔨 Молот', price: 80, levelReq: 41, desc: 'Урон 6' },
                { id: 'meat', name: '🥩 Мясная нарезка', price: 60, levelReq: 42, desc: '+40 HP' }
            ];

            shopItems.forEach(item => {
                if ((myData.level || 1) >= item.levelReq) {
                    shopList.innerHTML += `
                        <div class="inv-item">
                            <div><b>${item.name}</b><br><span style="font-size:10px; color:#aaa;">${item.desc} (с ${item.levelReq} ур.)</span></div>
                            <button class="shop-btn" onclick="buyItem('${item.id}', ${item.price})">${item.price} 💎</button>
                        </div>
                    `;
                } else {
                    shopList.innerHTML += `
                        <div class="inv-item" style="opacity: 0.4;">
                            <div><b>🔒 ${item.name}</b><br><span style="font-size:10px; color:#aaa;">Откроется на ${item.levelReq} ур.</span></div>
                        </div>
                    `;
                }
            });
            document.getElementById('shop-modal').style.display = 'flex';
        });
    };

    window.buyItem = (itemId, price) => {
        get(playerRef).then((snap) => {
            const myData = snap.val();
            if ((myData.crystals || 0) < price) { showNotification("Недостаточно кристаллов!", 'damage'); return; }
            let inv = myData.inventory ? { ...myData.inventory } : {};
            const newCrystals = myData.crystals - price;
            
            if (itemId === 'arrows') inv.arrows = (inv.arrows || 0) + 5;
            else inv[itemId] = (inv[itemId] || 0) + 1;

            update(playerRef, { crystals: newCrystals, inventory: inv });
            showNotification(`Куплено! (-${price} 💎)`, 'crystal');
            showShop();
        });
    };

    window.closeShop = () => document.getElementById('shop-modal').style.display = 'none';

    // --- ЗАДАНИЯ ---
    window.showQuests = () => {
        const list = document.getElementById('quests-list');
        list.innerHTML = '';
        questsList.forEach(q => {
            list.innerHTML += `
                <div class="quest-item">
                    <div>${q.name}</div>
                    <button class="shop-btn" onclick="sendQuest('${q.id}', ${q.tickets})">+${q.tickets} 🎫</button>
                </div>
            `;
        });
        document.getElementById('quests-modal').style.display = 'flex';
    };

    window.sendQuest = (questId, tickets) => {
        get(ref(db, 'players')).then((snap) => {
            const players = snap.val();
            let partner = null;
            for (let key in players) if (key !== playerName) partner = key;
            
            if (partner) {
                set(ref(db, `players/${partner}/quests`).push(), { questId, tickets, from: playerName });
                showNotification(`Задание отправлено на проверку!`, 'gift');
                closeQuests();
            } else {
                showNotification("Партнер не найден!", 'damage');
            }
        });
    };

    window.closeQuests = () => document.getElementById('quests-modal').style.display = 'none';

    // Слушаем задания на подтверждение
    onValue(ref(db, `players/${playerName}/quests`), (snap) => {
        const quests = snap.val();
        if (quests) {
            for (let key in quests) {
                const q = quests[key];
                const questName = questsList.find(x => x.id === q.questId)?.name || 'Задание';
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay'; overlay.style.display = 'flex';
                overlay.innerHTML = `
                    <div class="modal-content" style="text-align:center;">
                        <h2>Подтверждение</h2>
                        <p>Игрок <b>${q.from}</b> выполнил: "${questName}"</p>
                        <p>Подтвердить за +${q.tickets} 🎫?</p>
                        <div style="display:flex; gap:10px; justify-content:center;">
                            <button id="btn-yes" style="background:#4a6a4a;">Да</button>
                            <button id="btn-no" style="background:#6a2a2a;">Нет</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);

                document.getElementById('btn-yes').onclick = () => {
                    get(ref(db, `players/${q.from}`)).then((snap) => {
                        const pData = snap.val();
                        update(ref(db, `players/${q.from}`), { tickets: (pData.tickets || 0) + q.tickets });
                        showNotification(`Подтверждено!`, 'player');
                    });
                    set(ref(db, `players/${playerName}/quests/${key}`), null);
                    overlay.remove();
                };
                document.getElementById('btn-no').onclick = () => {
                    set(ref(db, `players/${playerName}/quests/${key}`), null);
                    overlay.remove();
                };
            }
        }
    });

    // --- КАССА ---
    window.showCashier = () => {
        get(playerRef).then((snap) => {
            const myData = snap.val();
            document.getElementById('cashier-tickets').textContent = myData.tickets || 0;
            const list = document.getElementById('cashier-list');
            list.innerHTML = '';
            cashierItems.forEach(item => {
                list.innerHTML += `
                    <div class="inv-item">
                        <div>${item.name}</div>
                        <button class="shop-btn" onclick="buyCashier('${item.id}', ${item.price}, '${item.type}', ${item.value || 0})">${item.price} 🎫</button>
                    </div>
                `;
            });
            document.getElementById('cashier-modal').style.display = 'flex';
        });
    };

    window.buyCashier = (id, price, type, value) => {
        get(playerRef).then((snap) => {
            const myData = snap.val();
            if ((myData.tickets || 0) < price) { showNotification("Недостаточно билетиков!", 'damage'); return; }
            
            if (type === 'crystals') {
                update(playerRef, { tickets: myData.tickets - price, crystals: (myData.crystals || 0) + value });
                showNotification(`Обменяно! +${value} 💎`, 'crystal');
            } else {
                update(playerRef, { tickets: myData.tickets - price });
                showNotification(`Куплено: ${id}!`, 'player');
            }
            showCashier();
        });
    };

    window.closeCashier = () => document.getElementById('cashier-modal').style.display = 'none';

    // --- СЛУШАТЕЛИ ---
    onValue(worldRef, (worldSnap) => {
        onValue(ref(db, 'players'), (playersSnap) => {
            const playersData = playersSnap.val();
            const myData = playersData ? playersData[playerName] : null;
            renderWorld(worldSnap.val(), playersData, playerName, myData);
        });
    });
});
