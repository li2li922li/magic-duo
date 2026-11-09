// game.js
const { db, ref, set, update, get, onValue } = window.game;
let currentBattle = { targetIndex: null, monsterHp: 10, monsterMaxHp: 10, monsterType: '👹', monsterName: 'Монстр', previousPos: 0 };
let turnInProgress = false;

const monsterDescriptions = { 
    '👹': { name: 'Огр', desc: 'Огромный, но медленный.', hp: 15, magic: 'Топот (урон 3)' }, 
    '👺': { name: 'Гоблин', desc: 'Хитрый и быстрый.', hp: 8, magic: 'Яд (урон 1)' }, 
    '🤖': { name: 'Древний Голем', desc: 'Машина из прошлого.', hp: 20, magic: 'Лазер (урон 4)' }, 
    '🎃': { name: 'Тыквоголовый', desc: 'Светится в темноте.', hp: 10, magic: 'Страх (пропуск хода)' }, 
    '🧙🏻': { name: 'Темный Маг', desc: 'Изгнанный волшебник.', hp: 12, magic: 'Огненный шар (урон 5)' }, 
    '🧌': { name: 'Тролль', desc: 'Регенерирует.', hp: 18, magic: 'Регенерация (+3 HP)' }, 
    '🧛🏻‍♂️': { name: 'Вампир', desc: 'Пьет кровь.', hp: 14, magic: 'Вампиризм (урон 2)' } 
};

window.cutObstacle = function(index, myData) {
    if (!myData.inventory) myData.inventory = {};
    if (myData.inventory.axe && myData.inventory.axe > 0) {
        const newInv = { ...myData.inventory, axe: myData.inventory.axe - 1 };
        const xpGain = Math.floor(Math.random() * 10) + 1;
        if (window.processXP) window.processXP(myData, xpGain);
        update(ref(db, 'players/' + window.game.playerName), { inventory: newInv });
        update(ref(db, `world/${index}`), { type: 'empty', monsterType: null });
        if (window.showNotification) window.showNotification(`Завал разобран! Топор: ${newInv.axe}/10. +${xpGain} XP`, 'obstacle');
    } else {
        if (window.showNotification) window.showNotification("Топор сломался! Нужен новый.", 'damage');
    }
};

window.openChest = function(index, myData) {
    const rand = Math.random();
    if (rand < 0.5) {
        const xpGain = Math.floor(Math.random() * 15) + 5;
        if (window.processXP) window.processXP(myData, xpGain);
        update(ref(db, 'players/' + window.game.playerName), { crystals: (myData.crystals || 0) + 5 });
        update(ref(db, `world/${index}`), { type: 'empty', monsterType: null });
        if (window.showNotification) window.showNotification(`+5 кристаллов 💎 и +${xpGain} XP`, 'crystal');
    } else {
        const gifts = ['👑', '🕶', '👒', '💐', '🍱', '🏆', '🎮', '📱', '⌚️', '📷'];
        window.askGiftAction(index, gifts[Math.floor(Math.random() * gifts.length)], myData);
    }
};

window.askGiftAction = function(targetIndex, gift, myData) {
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
        update(ref(db, 'players/' + window.game.playerName), { crystals: (myData.crystals || 0) + 10 });
        update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
        if (window.showNotification) window.showNotification("Продано за 10 💎", 'crystal'); 
        overlay.remove();
    };
    
    document.getElementById('btn-gift').onclick = () => {
        overlay.remove(); 
        get(ref(db, 'players')).then((snap) => {
            const players = snap.val(); 
            const list = document.getElementById('player-select-list'); 
            list.innerHTML = '';
            let found = false;
            
            for (let key in players) {
                if (key !== window.game.playerName) {
                    found = true;
                    // Передаем данные в виде строки, чтобы они не сломались
                    const safeData = encodeURIComponent(JSON.stringify(myData));
                    list.innerHTML += `<div class="inv-item"><div>${key}</div><button type="button" class="shop-btn" onclick="window.sendGiftToPlayer('${key}', '${gift}', ${targetIndex}, '${safeData}')">Отправить</button></div>`;
                }
            }
            if (!found) list.innerHTML = '<p style="text-align:center;">Других игроков нет</p>';
            document.getElementById('select-player-modal').style.display = 'flex';
        });
    };
};

window.sendGiftToPlayer = (partner, gift, targetIndex, myDataStr) => {
    const myData = JSON.parse(decodeURIComponent(myDataStr));
    const timestamp = Date.now();
    
    const giftRef = ref(db, `players/${partner}/gifts/${timestamp}`);
    set(giftRef, { item: gift, from: window.game.playerName }).then(() => {
        const phrases = [
            "Твоей половинке будет приятно 💋",
            "Плюсик в карму за подарочек любимке 👩‍❤️‍👨",
            "Ты самый лучший волшебник на свете! ✨",
            "Этот подарок согреет сердце! ❤️",
            "Любовь в каждой детали... 💖"
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        if (window.showNotification) window.showNotification(randomPhrase, 'gift');
        update(ref(db, `world/${targetIndex}`), { type: 'empty', monsterType: null });
        window.closeSelectPlayer();
    }).catch((error) => {
        alert("Ошибка при отправке подарка: " + error.message);
    });
};

onValue(ref(db, `players/${window.game.playerName}/gifts`), (snap) => {
    const gifts = snap.val();
    if (gifts) {
        for (let key in gifts) {
            const gift = gifts[key];
            if (window.showNotification) {
                window.showNotification(`Вам подарок от ${gift.from}: ${gift.item}!`, 'gift');
            }
            set(ref(db, `players/${window.game.playerName}/gifts/${key}`), null);
        }
    }
});

// --- БОЙ ---
window.openBattle = function(index, monsterType, myData) {
    const info = monsterDescriptions[monsterType] || { name: 'Неизвестный', desc: '...', hp: 10, magic: '...' };
    currentBattle = { targetIndex: index, monsterHp: info.hp, monsterMaxHp: info.hp, monsterType: monsterType, monsterName: info.name, magic: info.magic, previousPos: myData.position };
    document.getElementById('monster-name').textContent = `${monsterType} ${info.name}`;
    document.getElementById('monster-desc').innerHTML = `<b>История:</b> ${info.desc}<br><b>Магия:</b> ${info.magic}`;
    document.getElementById('battle-log').innerHTML = 'Бой начался!';
    window.renderBattleInventory(myData);
    window.updateBattleHpUI();
    document.getElementById('modal-overlay').style.display = 'flex';
};

window.renderBattleInventory = function(myData) {
    const invDiv = document.getElementById('battle-inventory');
    invDiv.innerHTML = '';
    const inv = myData.inventory || {};
    const itemMapping = { axe: '🪓 Топор', arrows: '🏹 Стрелы', evasionPotion: '💨 Зелье уклонения', cookies: '🍪 Печенье', milk: '🥛 Молоко', staff: '🪄 Боевой посох', club: '🏏 Дубинка', dagger: '🗡 Кинжал', wine: '🍷 Вино', cheese: '🧀 Сыр', chocolate: '🍫 Шоколад', beer: '🍺 Пиво', meat: '🥩 Мясо' };
    let hasItems = false;
    for (let key in inv) {
        if (inv[key] > 0 && itemMapping[key]) {
            hasItems = true;
            let action = "attackMonster('" + key + "')";
            if (['evasionPotion', 'cookies', 'milk', 'wine', 'cheese', 'chocolate', 'beer', 'meat'].includes(key)) action = "useItemInBattle('" + key + "')";
            invDiv.innerHTML += `<button class="battle-btn" style="width:100%; margin-bottom:5px;" onclick="${action}">${itemMapping[key]} (x${inv[key]})</button>`;
        }
    }
    if (!hasItems) invDiv.innerHTML = '<p style="font-size:12px; text-align:center; color:#aaa;">Нет предметов</p>';
};

window.updateBattleHpUI = () => { document.getElementById('monster-hp').textContent = `HP: ${currentBattle.monsterHp} / ${currentBattle.monsterMaxHp}`; };

window.closeBattle = (retreat = false) => {
    if (retreat) { update(ref(db, 'players/' + window.game.playerName), { position: currentBattle.previousPos, invulnTurns: 0 }); if (window.showNotification) window.showNotification("Вы отступили!", 'other'); }
    document.getElementById('modal-overlay').style.display = 'none';
};

window.attackMonster = (weapon) => {
    if (turnInProgress) return;
    turnInProgress = true;
    get(ref(db, 'players/' + window.game.playerName)).then((snap) => {
        const myData = snap.val(); const log = document.getElementById('battle-log');
        let damage = 1; let newInv = { ...myData.inventory };
        if (weapon === 'arrows') { if (newInv.arrows <= 0) { log.innerHTML += '<br>Нет стрел!'; turnInProgress = false; return; } newInv.arrows -= 1; damage = 1; log.innerHTML += `<br>Вы выстрелили из лука! (-1 HP)`; }
        else if (weapon === 'staff') { damage = 2; log.innerHTML += `<br>Вы ударили посохом! (-2 HP)`; }
        else if (weapon === 'club') { damage = 3; log.innerHTML += `<br>Вы ударили дубинкой! (-3 HP)`; }
        else if (weapon === 'dagger') { damage = 4; log.innerHTML += `<br>Вы ударили кинжалом! (-4 HP)`; }
        else if (weapon === 'whip') { damage = 5; log.innerHTML += `<br>Вы ударили кнутом! (-5 HP)`; }
        else if (weapon === 'hammer') { damage = 6; log.innerHTML += `<br>Вы ударили молотом! (-6 HP)`; }
        currentBattle.monsterHp -= damage; update(ref(db, 'players/' + window.game.playerName), { inventory: newInv }); window.updateBattleHpUI();
        if (currentBattle.monsterHp <= 0) {
            const xpGain = Math.floor(Math.random() * 15) + 5;
            if (window.processXP) window.processXP(myData, xpGain); log.innerHTML += `<br>Вы победили! +5 💎 и +${xpGain} XP.`;
            update(ref(db, 'players/' + window.game.playerName), { crystals: (myData.crystals || 0) + 5, invulnTurns: 0 });
            update(ref(db, `world/${currentBattle.targetIndex}`), { type: 'empty', monsterType: null });
            setTimeout(() => { window.closeBattle(false); turnInProgress = false; }, 2000); return;
        }
        setTimeout(() => { window.monsterTurn(myData); turnInProgress = false; }, 1000);
    });
};

window.monsterTurn = (myData) => {
    const log = document.getElementById('battle-log'); let damage = 0;
    if (myData.invulnTurns > 0) { log.innerHTML += `<br>Монстр атакует, но зелье защищает вас!`; update(ref(db, 'players/' + window.game.playerName), { invulnTurns: myData.invulnTurns - 1 }); }
    else {
        if (Math.random() < 0.3) { damage = Math.floor(Math.random() * 3) + 2; log.innerHTML += `<br>Монстр использует МАГИЮ! (-${damage} HP)`; }
        else { damage = 1; log.innerHTML += `<br>Монстр бьет вас! (-${damage} HP)`; }
        const newHp = Math.max(0, (myData.hp || 10) - damage); update(ref(db, 'players/' + window.game.playerName), { hp: newHp });
        if (newHp <= 0) { log.innerHTML += `<br>Вы проиграли... Возвращаетесь домой.`; update(ref(db, 'players/' + window.game.playerName), { hp: 10, position: 0, invulnTurns: 0 }); setTimeout(() => window.closeBattle(false), 2000); }
    }
};

window.useItemInBattle = (type) => {
    if (turnInProgress) return;
    turnInProgress = true;
    get(ref(db, 'players/' + window.game.playerName)).then((snap) => {
        const myData = snap.val(); const log = document.getElementById('battle-log'); let inv = { ...myData.inventory }; let used = false;
        if (type === 'evasionPotion' && inv.evasionPotion > 0) { inv.evasionPotion -= 1; update(ref(db, 'players/' + window.game.playerName), { inventory: inv, invulnTurns: 2 }); log.innerHTML += `<br>Выпито зелье уклонения!`; used = true; }
        else if (type === 'cookies' && inv.cookies > 0) { inv.cookies -= 1; update(ref(db, 'players/' + window.game.playerName), { inventory: inv, hp: Math.min((myData.hp + 3), myData.maxHp) }); log.innerHTML += `<br>Съедено печенье! (+3 HP)`; used = true; }
        else if (type === 'milk' && inv.milk > 0) { inv.milk -= 1; update(ref(db, 'players/' + window.game.playerName), { inventory: inv, hp: Math.min((myData.hp + 2), myData.maxHp) }); log.innerHTML += `<br>Выпито молоко! (+2 HP)`; used = true; }
        if (used) { window.renderBattleInventory({ ...myData, inventory: inv }); setTimeout(() => { window.monsterTurn(myData); turnInProgress = false; }, 1000); }
        else { log.innerHTML += `<br>Нет предмета!`; turnInProgress = false; }
    });
};
