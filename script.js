window.addEventListener('load', () => {
    const { db, ref, set, onValue, update, get } = window.gameDB;
    const mapSize = 30;
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';

    // --- СИСТЕМА УВЕДОМЛЕНИЙ ---
    const notifContainer = document.createElement('div');
    notifContainer.style.cssText = `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 1000; pointer-events: none; width: 90%; max-width: 400px;`;
    document.body.appendChild(notifContainer);

    function showNotification(text, type) {
        const el = document.createElement('div');
        el.textContent = text;
        let bgColor = '#90ee90', borderColor = '#5cb85c'; // Зеленый
        if (type === 'obstacle') { bgColor = '#ffb347'; borderColor = '#d98c3a'; } // Оранжевый
        if (type === 'crystal') { bgColor = '#87ceeb'; borderColor = '#4682b4'; }  // Голубой
        if (type === 'damage') { bgColor = '#ff6b6b'; borderColor = '#d13c3c'; }   // Красный
        if (type === 'player') { bgColor = '#ffb6c1'; borderColor = '#d17b8a'; }   // Розовый
        if (type === 'gift') { bgColor = '#dda0dd'; borderColor = '#9370db'; }     // Фиолетовый

        el.style.cssText = `background: ${bgColor}; color: #111; padding: 10px 15px; border-radius: 5px; border: 2px solid ${borderColor}; font-weight: bold; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.5); opacity: 0; transition: all 0.3s ease; transform: translateY(20px); font-size: 14px; pointer-events: auto;`;
        notifContainer.appendChild(el);
        
        // Если это подарок или выбор - кнопки
        if (type === 'gift' || type === 'gift-choice') {
            el.style.pointerEvents = 'auto';
        }

        setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 10);
        setTimeout(() => {
            el.style.opacity = '0'; el.style.transform = 'translateY(20px)';
            setTimeout(() => el.remove(), 300);
        }, 4000);
    }

    // --- ВХОД ---
    let playerName = prompt("Введите имя вашего волшебника:");
    if (!playerName) playerName = "Безымянный";
    document.getElementById('player-name').textContent = playerName;

    const playerRef = ref(db, 'players/' + playerName);
    const worldRef = ref(db, 'world');

    // СТАРТОВЫЙ ИНВЕНТАРЬ
    const startingInventory = {
        axe: 10,        // Топор (10 прочности)
        bow: 1,         // Лук
        arrows: 20,     // 20 стрел
        invulnPotion: 1,// Зелье неуязвимости
        pie: 1,         // Пирог (макс HP)
        cookies: 3      // 3 печенья (+3 HP)
    };

    get(playerRef).then((snapshot) => {
        if (!snapshot.exists()) {
            set(playerRef, {
                name: playerName, level: 1, hp: 10, maxHp: 10,
                tickets: 0, crystals: 0, position: 0, lastSeen: Date.now(),
                inventory: startingInventory,
                invulnTurns: 0
            });
        }
    });

    // ГЕНЕРАЦИЯ МИРА
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
                else if (rand < 0.18 && bossCount < 15) { 
                    type = 'monster'; 
                    monsterType = monsters[Math.floor(Math.random() * monsters.length)];
                    bossCount++; 
                }
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
                    cell.textContent = (p.name === myName) ? 'Я' : p.name[0].toUpperCase();
                    cell.style.color = (p.name === myName) ? '#ffcc00' : '#00ccff';
                    cell.style.fontWeight = 'bold';
                    cell.style.fontSize = '12px';
                }
            }
        }
    }

    // --- ДВИЖЕНИЕ ---
    function attemptMove(targetIndex, cellData, myData) {
        if (cellData.type === 'obstacle') {
            if (myData.inventory && myData.inventory.axe > 0) {
                // Разбираем завал
                const newInv = { ...myData.inventory, axe: myData.inventory.axe - 1 };
                update(playerRef, { inventory: newInv });
                update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
                showNotification(`Завал разобран! Топор: ${newInv.axe}/10`, 'obstacle');
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
                    // Кристаллы
                    update(playerRef, { crystals: (myData.crystals || 0) + 5 });
                    update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
                    showNotification("Вы нашли сундук! +5 кристаллов 💎", 'crystal');
                } else {
                    // Подарок
                    const gifts = ['👑', '🕶', '👒', '💐', '🍱', '🏆', '🎮', '📱', '⌚️', '📷'];
                    const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
                    askGiftAction(targetIndex, randomGift, myData);
                }
            }
        } else {
            showNotification("Слишком далеко!", 'other');
        }
    }

    // --- ПОДАРКИ ---
    function askGiftAction(targetIndex, gift, myData) {
        // Создаем модальное окно выбора
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:200; display:flex; justify-content:center; align-items:center;`;
        overlay.innerHTML = `
            <div style="background:#2a2a2a; padding:20px; border-radius:10px; text-align:center; border:2px solid #9370db;">
                <h2 style="color:#dda0dd; margin-top:0;">Вы нашли: ${gift}</h2>
                <p>Что сделать с подарком?</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button id="btn-sell" style="background:#4a6a4a; padding:10px;">Продать (10 💎)</button>
                    <button id="btn-gift" style="background:#6a4a8a; padding:10px;">Подарить 2 игроку</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('btn-sell').onclick = () => {
            update(playerRef, { crystals: (myData.crystals || 0) + 10 });
            update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
            showNotification("Вы продали подарок за 10 кристаллов 💎", 'crystal');
            overlay.remove();
        };

        document.getElementById('btn-gift').onclick = () => {
            // Ищем второго игрока (любого, кроме нас)
            get(ref(db, 'players')).then((snap) => {
                const players = snap.val();
                let partner = null;
                for (let key in players) { if (key !== playerName) partner = key; }

                if (partner) {
                    // Отправляем подарок в специальную папку партнера
                    const giftRef = ref(db, `players/${partner}/gifts`).push();
                    set(giftRef, { item: gift, from: playerName });
                    update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
                    showNotification(`Подарок ${gift} отправлен игроку ${partner}!`, 'gift');
                } else {
                    // Если партнера нет, продаем
                    update(playerRef, { crystals: (myData.crystals || 0) + 10 });
                    update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
                    showNotification("Партнер не найден. Продано за 10 💎", 'crystal');
                }
                overlay.remove();
            });
        };
    }

    // Слушаем подарки входящие
    onValue(ref(db, `players/${playerName}/gifts`), (snap) => {
        const gifts = snap.val();
        if (gifts) {
            for (let key in gifts) {
                showNotification(`Вам подарок от ${gifts[key].from}: ${gifts[key].item}!`, 'gift');
                // Удаляем после показа (или добавляем в инвентарь)
                set(ref(db, `players/${playerName}/gifts/${key}`), null);
            }
        }
    });

    // --- БОЙ ---
    let currentBattle = { targetIndex: null, monsterHp: 10, monsterMaxHp: 10, monsterType: '👹', monsterName: 'Монстр' };
    const monsterDescriptions = {
        '👹': { name: 'Огр', desc: 'Огромный, но медленный. Бьет дубиной.', hp: 15, magic: 'Топот (урон 3)' },
        '👺': { name: 'Гоблин', desc: 'Хитрый и быстрый. Использует кинжал.', hp: 8, magic: 'Яд (урон 1, пропуск хода)' },
        '🤖': { name: 'Древний Голем', desc: 'Машина из прошлого. Броня из металла.', hp: 20, magic: 'Лазер (урон 4)' },
        '🎃': { name: 'Тыквоголовый', desc: 'Светится в темноте. Пугает.', hp: 10, magic: 'Страх (пропуск хода)' },
        '🧙🏻': { name: 'Темный Маг', desc: 'Изгнанный волшебник. Знает запретные чары.', hp: 12, magic: 'Огненный шар (урон 5)' },
        '🧌': { name: 'Тролль', desc: 'Живет под мостом. Регенерирует.', hp: 18, magic: 'Регенерация (+3 HP)' },
        '🧛🏻‍♂️': { name: 'Вампир', desc: 'Боится света. Пьет кровь.', hp: 14, magic: 'Вампиризм (урон 2, лечит себя)' }
    };

    function openBattle(index, monsterType, myData) {
        const info = monsterDescriptions[monsterType] || { name: 'Неизвестный', desc: '...', hp: 10, magic: '...' };
        currentBattle = { targetIndex: index, monsterHp: info.hp, monsterMaxHp: info.hp, monsterType: monsterType, monsterName: info.name, magic: info.magic };

        document.getElementById('monster-name').textContent = `${monsterType} ${info.name}`;
        document.getElementById('monster-desc').innerHTML = `<b>История:</b> ${info.desc}<br><b>Магия:</b> ${info.magic}`;
        document.getElementById('battle-log').innerHTML = 'Бой начался!';
        updateBattleHpUI();
        document.getElementById('modal-overlay').style.display = 'flex';
    }

    function updateBattleHpUI() {
        document.getElementById('monster-hp').textContent = `HP: ${currentBattle.monsterHp} / ${currentBattle.monsterMaxHp}`;
    }

    function closeBattle() {
        document.getElementById('modal-overlay').style.display = 'none';
    }

    // Функции боя, привязанные к кнопкам (экспортируем в window)
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
                log.innerHTML += `<br>Вы победили! +5 кристаллов.`;
                update(playerRef, { crystals: (myData.crystals || 0) + 5 });
                update(ref(db, `world/${currentBattle.targetIndex}`), { type: 'empty', monsterType: null });
                updateBattleHpUI();
                setTimeout(closeBattle, 2000);
                return;
            }

            updateBattleHpUI();
            // Ход монстра
            setTimeout(() => monsterTurn(myData), 1000);
        });
    };

    function monsterTurn(myData) {
        const log = document.getElementById('battle-log');
        let damage = 0;

        // Зелье неуязвимости
        if (myData.invulnTurns > 0) {
            log.innerHTML += `<br>Монстр атакует, но зелье защищает вас!`;
            update(playerRef, { invulnTurns: myData.invulnTurns - 1 });
        } else {
            // Монстр наносит урон
            if (Math.random() < 0.3) {
                // Магическая атака
                damage = Math.floor(Math.random() * 3) + 2; // 2-4 урона
                log.innerHTML += `<br>Монстр использует МАГИЮ! (-${damage} HP)`;
            } else {
                // Обычная атака
                damage = 1;
                log.innerHTML += `<br>Монстр бьет вас! (-${damage} HP)`;
            }
            const newHp = Math.max(0, (myData.hp || 10) - damage);
            update(playerRef, { hp: newHp });
            
            if (newHp <= 0) {
                log.innerHTML += `<br>Вы проиграли... Возвращаетесь домой.`;
                update(playerRef, { hp: 10, position: 0 });
                setTimeout(closeBattle, 2000);
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
                    log.innerHTML += `<br>Вы выпили зелье! (10 ударов неуязвимости)`;
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
                { key: 'axe', name: '🪓 Топор', count: inv.axe, desc: `Прочность: ${inv.axe}/10` },
                { key: 'bow', name: '🏹 Деревянный лук', count: inv.bow, desc: '' },
                { key: 'arrows', name: '🏹 Деревянные стрелы', count: inv.arrows, desc: 'Урон 1' },
                { key: 'invulnPotion', name: '🧪 Зелье неуязвимости', count: inv.invulnPotion, desc: 'На 10 ударов' },
                { key: 'pie', name: '🥧 Вишневый пирог', count: inv.pie, desc: 'Восстанавливает HP полностью' },
                { key: 'cookies', name: '🍪 Печенье', count: inv.cookies, desc: 'Восстанавливает 3 HP' },
            ];

            items.forEach(item => {
                if (item.count > 0) {
                    list.innerHTML += `
                        <div class="inv-item">
                            <div>
                                <b>${item.name}</b><br>
                                <span style="font-size:10px; color:#aaa;">${item.desc} (x${item.count})</span>
                            </div>
                        </div>
                    `;
                }
            });

            if (list.innerHTML === '') list.innerHTML = '<p style="text-align:center;">Пусто...</p>';
            document.getElementById('inventory-modal').style.display = 'flex';
        });
    };

    window.closeInventory = () => document.getElementById('inventory-modal').style.display = 'none';

    // Слушаем изменения
    onValue(worldRef, (worldSnap) => {
        onValue(ref(db, 'players'), (playersSnap) => {
            const playersData = playersSnap.val();
            const myData = playersData ? playersData[playerName] : null;
            renderWorld(worldSnap.val(), playersData, playerName, myData);
        });
    });

    window.showQuests = () => showNotification('Заданий пока нет', 'other');
    window.refreshGame = () => location.reload();
    window.showMenu = () => showNotification('Вы уже в игре', 'other');
});
