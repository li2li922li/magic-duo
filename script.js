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

    // --- ВХОД И СТАРТОВЫЕ ДАННЫЕ ---
    let playerName = prompt("Введите имя вашего волшебника:");
    if (!playerName) playerName = "Безымянный";
    document.getElementById('player-name').textContent = playerName;

    const playerRef = ref(db, 'players/' + playerName);
    const worldRef = ref(db, 'world');

    const startingInventory = { axe: 10, bow: 1, arrows: 20, invulnPotion: 1, pie: 1, cookies: 3 };
    const avatarOptions = ['🧙‍♂️', '🧙‍♀️', '🧝‍♂️', '🧝‍♀️', '🧛‍♂️', '🧛‍♀️', '👻', '🤖', '🧚‍♀️', '🧜‍♂️'];

    // Хранилище уровней и наград
    const levelRewards = {
        2: { type: 'weapon', name: 'Боевой посох', desc: 'Базовое оружие (+урон)' },
        3: { type: 'potion', name: 'Масло скользкости', desc: 'Монстр не атакует 2 хода' },
        4: { type: 'hp_crystals', hp: 5, crystals: 10 },
        5: { type: 'food', name: 'Вино', desc: '+5 HP' },
        6: { type: 'hp', hp: 5 },
        7: { type: 'hp_crystals', hp: 5, crystals: 10 },
        8: { type: 'hp', hp: 5 },
        9: { type: 'hp_crystals', hp: 5, crystals: 10 },
        10: { type: 'combo', items: ['Вино (+7 HP)'], crystals: 10 },
        11: { type: 'weapon', name: 'Дубинка', desc: '+урон' },
        12: { type: 'spell', name: 'Водяная сфера', desc: '-2 HP и пропуск хода' },
        13: { type: 'hp_crystals', hp: 10, crystals: 10 },
        14: { type: 'food', name: 'Сырная тарелка', desc: '+10 HP' },
        15: { type: 'hp', hp: 10 },
        16: { type: 'hp_crystals', hp: 10, crystals: 10 },
        17: { type: 'arrows', count: 10 },
        18: { type: 'spell', name: 'Власть над ветрами', desc: '-10 HP, пропуск хода' },
        19: { type: 'hp_crystals', hp: 10, crystals: 10 },
        20: { type: 'combo', items: ['Власть над ветрами'], crystals: 20 },
        21: { type: 'weapon', name: 'Кинжал', desc: '+урон' },
        22: { type: 'food', name: 'Шоколад', desc: '+20 HP' },
        23: { type: 'potion', name: 'Зелье уменьшения', desc: 'Атаки монстра вдвое слабее' },
        24: { type: 'hp_crystals', hp: 15, crystals: 20 },
        25: { type: 'spell', name: 'Власть над водами', desc: '-20 HP, пропуск хода' },
        26: { type: 'hp', hp: 15 },
        27: { type: 'hp_crystals', hp: 15, crystals: 20 },
        28: { type: 'potion', name: 'Ядовитое зелье', desc: '-20 HP монстру' },
        29: { type: 'hp', hp: 15 },
        30: { type: 'combo', items: ['Шоколад', 'Ядовитое зелье'], crystals: 30 },
        31: { type: 'weapon', name: 'Кнут', desc: '+урон' },
        32: { type: 'food', name: 'Пиво', desc: '+30 HP' },
        33: { type: 'potion', name: 'Зелье силы горного великана', desc: '+5 урона' },
        34: { type: 'hp_crystals', hp: 20, crystals: 30 },
        35: { type: 'spell', name: 'Власть над огнём', desc: 'Мощный урон' },
        36: { type: 'hp', hp: 20 },
        37: { type: 'hp_crystals', hp: 20, crystals: 30 },
        38: { type: 'hp', hp: 20 },
        39: { type: 'hp_crystals', hp: 20, crystals: 30 },
        40: { type: 'combo', items: ['Зелье лечения', 'Вино', 'Пиво'], crystals: 40 },
        41: { type: 'weapon', name: 'Молот', desc: '+урон' },
        42: { type: 'food', name: 'Мясная нарезка', desc: '+40 HP' },
        43: { type: 'potion', name: 'Зелье неуязвимости', desc: '3 атаки без урона' },
        44: { type: 'hp_crystals', hp: 25, crystals: 50 },
        45: { type: 'spell', name: 'Вспышка мечей', desc: '-20 HP монстру' },
        46: { type: 'hp', hp: 25 },
        47: { type: 'hp_crystals', hp: 25, crystals: 50 },
        48: { type: 'food', name: 'Куриный шашлычок', desc: '+30 HP и +10 очков' },
        49: { type: 'hp_crystals', hp: 25, crystals: 50 },
        50: { type: 'combo', items: ['3 рандомных зелья'], crystals: 50 }
    };

    get(playerRef).then((snapshot) => {
        if (!snapshot.exists()) {
            set(playerRef, {
                name: playerName, level: 1, xp: 0, hp: 10, maxHp: 10,
                tickets: 0, crystals: 0, position: 0, lastSeen: Date.now(),
                inventory: startingInventory, invulnTurns: 0, avatar: '🧙‍♂️'
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
            document.getElementById('player-level').textContent = `Ур. ${myData.level || 1}`;
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
            else cell.textContent = '·';

            cell.addEventListener('click', () => attemptMove(i, cellData, myData));
            mapContainer.appendChild(cell);
        }

        if (playersData) {
            for (let key in playersData) {
                const p = playersData[key];
                if (myData && p.name !== myName && p.position === myData.position) {
                    showNotification(`Вы встретили ${p.name}!`, 'player');
                }
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

    // --- ДВИЖЕНИЕ ---
    function attemptMove(targetIndex, cellData, myData) {
        if (cellData.type === 'obstacle') {
            if (myData.inventory && myData.inventory.axe > 0) {
                const newInv = { ...myData.inventory, axe: myData.inventory.axe - 1 };
                const xpGain = Math.floor(Math.random() * 10) + 1;
                processXP(myData, xpGain); // Новая функция для опыта
                update(playerRef, { inventory: newInv });
                update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
                showNotification(`Завал разобран! Топор: ${newInv.axe}/10. +${xpGain} XP`, 'obstacle');
            } else {
                showNotification("Топор сломался! Завал не разобрать.", 'damage');
            }
            return;
        }

        if (cellData.type === 'monster') {
            openBattle(targetIndex, cellData.monsterType, myData);
            return;
        }

        const currentPos = myData.position;
        const row = Math.floor(currentPos / mapSize), col = currentPos % mapSize;
        const targetRow = Math.floor(targetIndex / mapSize), targetCol = targetIndex % mapSize;

        if ((Math.abs(row - targetRow) === 1 && col === targetCol) || (row === targetRow && Math.abs(col - targetCol) === 1)) {
            update(playerRef, { position: targetIndex });

            if (cellData.type === 'chest') {
                const rand = Math.random();
                if (rand < 0.5) {
                    const xpGain = Math.floor(Math.random() * 15) + 5;
                    processXP(myData, xpGain);
                    update(playerRef, { crystals: (myData.crystals || 0) + 5 });
                    update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
                    showNotification(`+5 кристаллов 💎 и +${xpGain} XP`, 'crystal');
                } else {
                    const gifts = ['👑', '🕶', '👒', '💐', '🍱', '🏆', '🎮', '📱', '⌚️', '📷'];
                    askGiftAction(targetIndex, gifts[Math.floor(Math.random() * gifts.length)], myData);
                }
            }
        } else {
            showNotification("Слишком далеко!", 'other');
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

        // Проверка на повышение уровня (каждый уровень требует level * 100 опыта)
        while (true) {
            const requiredXP = newLevel * 100;
            if (newXp >= requiredXP && newLevel < 50) {
                newXp -= requiredXP;
                newLevel++;
                leveledUp = true;

                // Применяем награду за уровень
                const reward = levelRewards[newLevel];
                if (reward) {
                    if (reward.type === 'hp') {
                        newMaxHp += reward.hp;
                    } else if (reward.type === 'hp_crystals') {
                        newMaxHp += reward.hp;
                        newCrystals += reward.crystals;
                    } else if (reward.type === 'crystals') {
                        newCrystals += reward.crystals;
                    } else if (reward.type === 'arrows') {
                        newInv.arrows = (newInv.arrows || 0) + reward.count;
                    } else if (reward.type === 'combo') {
                        newCrystals += reward.crystals;
                        // Предметы из комбо падают в инвентарь
                        reward.items.forEach(item => {
                            newInv[item] = (newInv[item] || 0) + 1;
                        });
                    }
                    // Оружие/зелья/еду мы просто открываем в магазине, в инвентарь не падают (кроме комбо)
                }
            } else {
                break;
            }
        }

        if (leveledUp) {
            update(playerRef, { xp: newXp, level: newLevel, maxHp: newMaxHp, hp: newMaxHp, crystals: newCrystals, inventory: newInv });
            showNotification(`🎉 Новый уровень: ${newLevel}!`, 'player');
        } else {
            update(playerRef, { xp: newXp, crystals: newCrystals, inventory: newInv });
        }
    }

    window.showLevelTable = () => {
        let table = "Уровень | Нужно XP (всего)\n------------------------\n";
        for (let i = 1; i <= 10; i++) {
            table += `${i} | ${i * 100}\n`;
        }
        table += "...\n50 | 5000";
        alert(table);
    };

    // --- ПОДАРКИ ---
    function askGiftAction(targetIndex, gift, myData) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="modal-content" style="text-align:center; border-color:#9370db;">
                <h2 style="color:#dda0dd;">Вы нашли: ${gift}</h2>
                <p>Что сделать с подарком?</p>
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
            showNotification("Вы продали подарок за 10 💎", 'crystal');
            overlay.remove();
        };

        document.getElementById('btn-gift').onclick = () => {
            get(ref(db, 'players')).then((snap) => {
                const players = snap.val();
                let partner = null;
                for (let key in players) { if (key !== playerName) partner = key; }
                if (partner) {
                    const giftRef = ref(db, `players/${partner}/gifts`).push();
                    set(giftRef, { item: gift, from: playerName });
                    showNotification(`Подарок отправлен!`, 'gift');
                } else {
                    update(playerRef, { crystals: (myData.crystals || 0) + 10 });
                    showNotification("Партнер не найден. Продано.", 'crystal');
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
        updateBattleHpUI();
        document.getElementById('modal-overlay').style.display = 'flex';
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

    window.attackMonster = (weapon) => {
        get(playerRef).then((snap) => {
            const myData = snap.val();
            const log = document.getElementById('battle-log');

            if (weapon === 'bow') {
                if (!myData.inventory || myData.inventory.arrows <= 0) {
                    log.innerHTML += '<br>Нет стрел!'; return;
                }
                const newInv = { ...myData.inventory, arrows: myData.inventory.arrows - 1 };
                update(playerRef, { inventory: newInv });
                currentBattle.monsterHp -= 1;
                log.innerHTML += `<br>Вы выстрелили из лука! (-1 HP)`;
            }

            if (currentBattle.monsterHp <= 0) {
                const xpGain = Math.floor(Math.random() * 15) + 5;
                processXP(myData, xpGain);
                log.innerHTML += `<br>Вы победили! +5 💎 и +${xpGain} XP.`;
                update(playerRef, { crystals: (myData.crystals || 0) + 5 });
                update(ref(db, `world/${currentBattle.targetIndex}`), { type: 'empty', monsterType: null });
                updateBattleHpUI();
                setTimeout(() => window.closeBattle(false), 2000);
                return;
            }

            updateBattleHpUI();
            setTimeout(() => monsterTurn(myData), 1000);
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
        get(playerRef).then((snap) => {
            const myData = snap.val();
            const log = document.getElementById('battle-log');
            let inv = { ...myData.inventory };

            if (type === 'potion') {
                if (inv.invulnPotion > 0) {
                    inv.invulnPotion -= 1;
                    update(playerRef, { inventory: inv, invulnTurns: 10 });
                    log.innerHTML += `<br>Вы выпили зелье!`;
                } else { log.innerHTML += `<br>Нет зелий!`; return; }
            } else if (type === 'food') {
                if (inv.cookies > 0) {
                    inv.cookies -= 1;
                    update(playerRef, { inventory: inv, hp: Math.min((myData.hp + 3), myData.maxHp) });
                    log.innerHTML += `<br>Вы съели печенье! (+3 HP)`;
                } else if (inv.pie > 0) {
                    inv.pie -= 1;
                    update(playerRef, { inventory: inv, hp: myData.maxHp });
                    log.innerHTML += `<br>Вы съели пирог! (HP восстановлено)`;
                } else { log.innerHTML += `<br>Нет еды!`; return; }
            }
            setTimeout(() => monsterTurn(myData), 1000);
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
                { name: '🏹 Лук', count: inv.bow, desc: '' },
                { name: '🏹 Стрелы', count: inv.arrows, desc: 'Урон 1' },
                { name: '🧪 Зелье', count: inv.invulnPotion, desc: 'Неуязвимость' },
                { name: '🥧 Пирог', count: inv.pie, desc: 'Полное HP' },
                { name: '🍪 Печенье', count: inv.cookies, desc: '+3 HP' }
            ];
            // Добавляем предметы, которые выпали из комбо
            for (let key in inv) {
                if (!items.find(i => i.name.includes(key)) && typeof inv[key] === 'number' && inv[key] > 0) {
                    items.push({ name: key, count: inv[key], desc: 'Из комбо-дропа' });
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
            document.getElementById('char-avatar').textContent = myData.avatar || '🧙‍♂️';
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
                div.onclick = () => {
                    update(playerRef, { avatar: av });
                    showCharacter(); // Обновить окно
                };
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

            // Список товаров в магазине (открываются по уровню)
            const shopItems = [
                { id: 'arrows', name: '🏹 Деревянные стрелы (x5)', price: 5, levelReq: 1, desc: 'Боеприпас' },
                { id: 'potion', name: '🧪 Зелье неуязвимости', price: 15, levelReq: 1, desc: '10 ударов без урона' },
                { id: 'cookies', name: '🍪 Печенье', price: 10, levelReq: 1, desc: '+3 HP' },
                { id: 'pie', name: '🥧 Вишневый пирог', price: 25, levelReq: 1, desc: 'Полное HP' },
                
                // Оружие и еда из твоей таблицы (появляются при достижении уровня)
                { id: 'staff', name: '🪄 Боевой посох', price: 20, levelReq: 2, desc: '+урон в атаке' },
                { id: 'wine', name: '🍷 Вино', price: 15, levelReq: 5, desc: '+5 HP' },
                { id: 'club', name: '🏏 Дубинка', price: 30, levelReq: 11, desc: '+урон в атаке' },
                { id: 'cheese', name: '🧀 Сырная тарелка', price: 25, levelReq: 14, desc: '+10 HP' },
                { id: 'dagger', name: '🗡 Кинжал', price: 40, levelReq: 21, desc: '+урон в атаке' },
                { id: 'chocolate', name: '🍫 Шоколад', price: 35, levelReq: 22, desc: '+20 HP' },
                { id: 'whip', name: '🪢 Кнут', price: 60, levelReq: 31, desc: '+урон в атаке' },
                { id: 'beer', name: '🍺 Пиво', price: 45, levelReq: 32, desc: '+30 HP' },
                { id: 'hammer', name: '🔨 Молот', price: 80, levelReq: 41, desc: '+урон в атаке' },
                { id: 'meat', name: '🥩 Мясная нарезка', price: 60, levelReq: 42, desc: '+40 HP' }
            ];

            shopItems.forEach(item => {
                if ((myData.level || 1) >= item.levelReq) {
                    shopList.innerHTML += `
                        <div class="inv-item">
                            <div>
                                <b>${item.name}</b><br>
                                <span style="font-size:10px; color:#aaa;">${item.desc} (с ${item.levelReq} ур.)</span>
                            </div>
                            <button class="shop-btn" onclick="buyItem('${item.id}', ${item.price})">${item.price} 💎</button>
                        </div>
                    `;
                } else {
                    shopList.innerHTML += `
                        <div class="inv-item" style="opacity: 0.4;">
                            <div
