// level.js
const { db, ref, set, update, get } = window.game;

const levelRewards = { 2: { type: 'weapon', name: 'Боевой посох' }, 3: { type: 'potion', name: 'Масло скользкости' }, 4: { type: 'hp_crystals', hp: 5, crystals: 10 }, 5: { type: 'food', name: 'Вино' }, 6: { type: 'hp', hp: 5 }, 7: { type: 'hp_crystals', hp: 5, crystals: 10 }, 8: { type: 'hp', hp: 5 }, 9: { type: 'hp_crystals', hp: 5, crystals: 10 }, 10: { type: 'combo', items: ['wine'], crystals: 10 }, 11: { type: 'weapon', name: 'Дубинка' }, 12: { type: 'spell', name: 'Водяная сфера' }, 13: { type: 'hp_crystals', hp: 10, crystals: 10 }, 14: { type: 'food', name: 'Сырная тарелка' }, 15: { type: 'hp', hp: 10 }, 16: { type: 'hp_crystals', hp: 10, crystals: 10 }, 17: { type: 'arrows', count: 10 }, 18: { type: 'spell', name: 'Власть над ветрами' }, 19: { type: 'hp_crystals', hp: 10, crystals: 10 }, 20: { type: 'combo', items: ['windSpell'], crystals: 20 }, 21: { type: 'weapon', name: 'Кинжал' }, 22: { type: 'food', name: 'Шоколад' }, 23: { type: 'potion', name: 'Зелье уменьшения' }, 24: { type: 'hp_crystals', hp: 15, crystals: 20 }, 25: { type: 'spell', name: 'Власть над водами' }, 26: { type: 'hp', hp: 15 }, 27: { type: 'hp_crystals', hp: 15, crystals: 20 }, 28: { type: 'potion', name: 'Ядовитое зелье' }, 29: { type: 'hp', hp: 15 }, 30: { type: 'combo', items: ['chocolate', 'poisonPotion'], crystals: 30 }, 31: { type: 'weapon', name: 'Кнут' }, 32: { type: 'food', name: 'Пиво' }, 33: { type: 'potion', name: 'Зелье силы великана' }, 34: { type: 'hp_crystals', hp: 20, crystals: 30 }, 35: { type: 'spell', name: 'Власть над огнём' }, 36: { type: 'hp', hp: 20 }, 37: { type: 'hp_crystals', hp: 20, crystals: 30 }, 38: { type: 'hp', hp: 20 }, 39: { type: 'hp_crystals', hp: 20, crystals: 30 }, 40: { type: 'combo', items: ['healingPotion', 'wine', 'beer'], crystals: 40 }, 41: { type: 'weapon', name: 'Молот' }, 42: { type: 'food', name: 'Мясная нарезка' }, 43: { type: 'potion', name: 'Зелье неуязвимости' }, 44: { type: 'hp_crystals', hp: 25, crystals: 50 }, 45: { type: 'spell', name: 'Вспышка мечей' }, 46: { type: 'hp', hp: 25 }, 47: { type: 'hp_crystals', hp: 25, crystals: 50 }, 48: { type: 'food', name: 'Куриный шашлычок' }, 49: { type: 'hp_crystals', hp: 25, crystals: 50 }, 50: { type: 'combo', items: ['randomPotion'], crystals: 50 } };

window.processXP = function(myData, xpGain) {
    let newXp = (myData.xp || 0) + xpGain, newLevel = myData.level || 1, leveledUp = false;
    let newMaxHp = myData.maxHp || 10, newCrystals = myData.crystals || 0;
    let newInv = myData.inventory ? { ...myData.inventory } : {};
    while (true) {
        const requiredXP = newLevel * 100;
        if (newXp >= requiredXP && newLevel < 50) {
            newXp -= requiredXP; newLevel++; leveledUp = true;
            const reward = levelRewards[newLevel];
            if (reward) {
                if (reward.type === 'hp') newMaxHp += reward.hp;
                else if (reward.type === 'hp_crystals') { newMaxHp += reward.hp; newCrystals += reward.crystals; }
                else if (reward.type === 'arrows') newInv.arrows = (newInv.arrows || 0) + reward.count;
                else if (reward.type === 'combo') { newCrystals += reward.crystals; reward.items.forEach(item => newInv[item] = (newInv[item] || 0) + 1); }
            }
        } else break;
    }
    if (leveledUp) {
        update(ref(db, 'players/' + window.game.playerName), { xp: newXp, level: newLevel, maxHp: newMaxHp, hp: newMaxHp, crystals: newCrystals, inventory: newInv });
        window.showNotification(`🎉 Новый уровень: ${newLevel}!`, 'player');
    } else update(ref(db, 'players/' + window.game.playerName), { xp: newXp, crystals: newCrystals, inventory: newInv });
};

window.showInventory = () => {
    get(ref(db, 'players/' + window.game.playerName)).then((snap) => {
        const myData = snap.val(); const inv = myData.inventory || {};
        const list = document.getElementById('inventory-list'); list.innerHTML = '';
        const items = [
            { name: '🪓 Топор', count: inv.axe, desc: `Прочность: ${inv.axe}/10` }, { name: '🏹 Стрелы', count: inv.arrows, desc: 'Урон 1' },
            { name: '💨 Зелье уклонения', count: inv.evasionPotion, desc: '2 хода без урона' }, { name: '🍪 Печенье', count: inv.cookies, desc: '+3 HP' },
            { name: '🥛 Молоко', count: inv.milk, desc: '+2 HP' }, { name: '🪄 Боевой посох', count: inv.staff, desc: 'Урон 2' },
            { name: '🏏 Дубинка', count: inv.club, desc: 'Урон 3' }, { name: '🗡 Кинжал', count: inv.dagger, desc: 'Урон 4' },
            { name: '🍷 Вино', count: inv.wine, desc: '+5 HP' }, { name: '🧀 Сыр', count: inv.cheese, desc: '+10 HP' }
        ];
        items.forEach(item => { if (item.count > 0) list.innerHTML += `<div class="inv-item"><div><b>${item.name}</b><br><span style="font-size:10px; color:#aaa;">${item.desc} (x${item.count})</span></div></div>`; });
        if (list.innerHTML === '') list.innerHTML = '<p style="text-align:center;">Пусто...</p>';
        document.getElementById('inventory-modal').style.display = 'flex';
    });
};
window.closeInventory = () => document.getElementById('inventory-modal').style.display = 'none';
