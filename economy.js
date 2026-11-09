// economy.js
const { db, ref, set, update, get, onValue } = window.game;

const cashierItems = [
    { id: 'crystals_10', name: 'Обменять 1 билет на 10 кристаллов', price: 1, type: 'crystals', value: 10 },
    { id: 'delay', name: 'Отсрочка домашнего дела на 1 день', price: 1, type: 'effect' },
    { id: 'walk', name: 'Прогулка', price: 5, type: 'real' }, { id: 'massage', name: 'Получить массаж', price: 5, type: 'real' },
    { id: 'beer', name: 'Пиво до 1л (1 раз в день)', price: 5, type: 'real' }, { id: 'hookah', name: 'Поход в кальянную', price: 10, type: 'real' },
    { id: 'cinema', name: 'Поход в кино', price: 15, type: 'real' }, { id: 'sushi', name: 'Заказ роллов/суши', price: 15, type: 'real' },
    { id: 'pizza', name: 'Заказ пиццы', price: 15, type: 'real' }, { id: 'restaurant', name: 'Поход в ресторан', price: 20, type: 'real' },
    { id: 'lazy_day', name: 'Целый день ничего неделания', price: 10, type: 'real' }, { id: 'small_gift', name: 'Небольшой недорогой подарочек', price: 10, type: 'real' },
    { id: 'romantic_dinner', name: 'Романтический ужин', price: 10, type: 'real' }, { id: 'unusual_date', name: 'Необычное свидание', price: 50, type: 'real' },
    { id: 'trip', name: 'Поездка в другой город', price: 100, type: 'real' }
];

window.showShop = () => {
    get(ref(db, 'players/' + window.game.playerName)).then((snap) => {
        const myData = snap.val();
        document.getElementById('shop-crystals').textContent = myData.crystals || 0;
        const shopList = document.getElementById('shop-list'); shopList.innerHTML = '';
        const shopItems = [ { id: 'arrows', name: '🏹 Деревянные стрелы (x5)', price: 5, levelReq: 1, desc: 'Боеприпас' }, { id: 'evasionPotion', name: '💨 Зелье уклонения', price: 15, levelReq: 1, desc: '2 хода без урона' }, { id: 'cookies', name: '🍪 Печенье', price: 10, levelReq: 1, desc: '+3 HP' }, { id: 'milk', name: '🥛 Молоко', price: 5, levelReq: 1, desc: '+2 HP' }, { id: 'axe', name: '🪓 Топор', price: 10, levelReq: 1, desc: 'Разбирает завалы' }, { id: 'staff', name: '🪄 Боевой посох', price: 20, levelReq: 2, desc: 'Урон 2' }, { id: 'wine', name: '🍷 Вино', price: 15, levelReq: 5, desc: '+5 HP' }, { id: 'club', name: '🏏 Дубинка', price: 30, levelReq: 11, desc: 'Урон 3' }, { id: 'cheese', name: '🧀 Сырная тарелка', price: 25, levelReq: 14, desc: '+10 HP' }, { id: 'dagger', name: '🗡 Кинжал', price: 40, levelReq: 21, desc: 'Урон 4' }, { id: 'chocolate', name: '🍫 Шоколад', price: 35, levelReq: 22, desc: '+20 HP' }, { id: 'whip', name: '🪢 Кнут', price: 60, levelReq: 31, desc: 'Урон 5' }, { id: 'beer', name: '🍺 Пиво', price: 45, levelReq: 32, desc: '+30 HP' }, { id: 'hammer', name: '🔨 Молот', price: 80, levelReq: 41, desc: 'Урон 6' }, { id: 'meat', name: '🥩 Мясная нарезка', price: 60, levelReq: 42, desc: '+40 HP' } ];
        shopItems.forEach(item => {
            if ((myData.level || 1) >= item.levelReq) shopList.innerHTML += `<div class="inv-item"><div><b>${item.name}</b><br><span style="font-size:10px; color:#aaa;">${item.desc} (с ${item.levelReq} ур.)</span></div><button class="shop-btn" onclick="buyItem('${item.id}', ${item.price})">${item.price} 💎</button></div>`;
            else shopList.innerHTML += `<div class="inv-item" style="opacity: 0.4;"><div><b>🔒 ${item.name}</b><br><span style="font-size:10px; color:#aaa;">Откроется на ${item.levelReq} ур.</span></div></div>`;
        });
        document.getElementById('shop-modal').style.display = 'flex';
    });
};

window.buyItem = (itemId, price) => {
    get(ref(db, 'players/' + window.game.playerName)).then((snap) => {
        const myData = snap.val();
        if ((myData.crystals || 0) < price) { window.showNotification("Недостаточно кристаллов!", 'damage'); return; }
        let inv = myData.inventory ? { ...myData.inventory } : {};
        const newCrystals = myData.crystals - price;
        if (itemId === 'arrows') inv.arrows = (inv.arrows || 0) + 5; else inv[itemId] = (inv[itemId] || 0) + 1;
        update(ref(db, 'players/' + window.game.playerName), { crystals: newCrystals, inventory: inv });
        window.showNotification(`Куплено! (-${price} 💎)`, 'crystal'); window.showShop();
    });
};
window.closeShop = () => document.getElementById('shop-modal').style.display = 'none';

window.showCashier = () => {
    get(ref(db, 'players/' + window.game.playerName)).then((snap) => {
        const myData = snap.val();
        document.getElementById('cashier-tickets').textContent = myData.tickets || 0;
        const list = document.getElementById('cashier-list'); list.innerHTML = '';
        cashierItems.forEach(item => {
            list.innerHTML += `<div class="inv-item"><div>${item.name}</div><button class="shop-btn" onclick="buyCashier('${item.id}', ${item.price}, '${item.type}', ${item.value || 0})">${item.price} 🎫</button></div>`;
        });
        document.getElementById('cashier-modal').style.display = 'flex';
    });
};

window.buyCashier = (id, price, type, value) => {
    get(ref(db, 'players/' + window.game.playerName)).then((snap) => {
        const myData = snap.val();
        if ((myData.tickets || 0) < price) { window.showNotification("Недостаточно билетиков!", 'damage'); return; }
        get(ref(db, 'players')).then((pSnap) => {
            const players = pSnap.val(); let partner = null;
            for (let key in players) if (key !== window.game.playerName) partner = key;
            if (partner) set(ref(db, `players/${partner}/notifs`).push(), { text: `${window.game.playerName} купил: ${id}!` });
        });
        if (type === 'crystals') { update(ref(db, 'players/' + window.game.playerName), { tickets: myData.tickets - price, crystals: (myData.crystals || 0) + value }); window.showNotification(`Обменяно! +${value} 💎`, 'crystal'); }
        else { update(ref(db, 'players/' + window.game.playerName), { tickets: myData.tickets - price }); window.showNotification(`Куплено: ${id}!`, 'player'); }
        window.showCashier();
    });
};
window.closeCashier = () => document.getElementById('cashier-modal').style.display = 'none';

// Всплывающие уведомления
const notifContainer = document.createElement('div');
notifContainer.style.cssText = `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 1000; pointer-events: none; width: 90%; max-width: 400px;`;
document.body.appendChild(notifContainer);

window.showNotification = function(text, type) {
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
};

// Слушатель уведомлений о покупках
onValue(ref(db, `players/${window.game.playerName}/notifs`), (snap) => {
    const notifs = snap.val();
    if (notifs) { for (let key in notifs) { window.showNotification(notifs[key].text, 'player'); set(ref(db, `players/${window.game.playerName}/notifs/${key}`), null); } }
});
