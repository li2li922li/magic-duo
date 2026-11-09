// task.js
const { db, ref, set, update, get, onValue } = window.game;

const questsList = [
    { id: 'dishes', name: 'Помыть посуду', tickets: 1 }, { id: 'trash', name: 'Вынести мусор', tickets: 1 },
    { id: 'package', name: 'Забрать посылку', tickets: 1 }, { id: 'zhkh_transfer', name: 'Передать показания ЖКХ', tickets: 1 },
    { id: 'zhkh_pay', name: 'Оплатить ЖКХ', tickets: 1 }, { id: 'laundry_start', name: 'Запустить стирку', tickets: 2 },
    { id: 'laundry_hang', name: 'Развесить белье', tickets: 1 }, { id: 'laundry_fold', name: 'Разобрать белье', tickets: 1 },
    { id: 'bed', name: 'Поменять постельное белье', tickets: 2 }, { id: 'dust', name: 'Протереть пыль в 1 комнате', tickets: 3 },
    { id: 'floors', name: 'Помыть полы в 1 комнате', tickets: 3 }, { id: 'groceries', name: 'Закупиться продуктами', tickets: 3 },
    { id: 'lunch', name: 'Приготовить обед', tickets: 5 }, { id: 'dinner', name: 'Приготовить ужин', tickets: 5 },
    { id: 'massage', name: 'Сделать массаж', tickets: 5 }, { id: 'flowers', name: 'Подарить цветы просто так', tickets: 10 },
    { id: 'gift', name: 'Подарить подарок просто так', tickets: 10 }, { id: 'bake', name: 'Испечь пирожки/торт', tickets: 20 },
    { id: 'table', name: 'Убрать со стола', tickets: 1 }, { id: 'water_flowers', name: 'Полить цветы', tickets: 2 }
].sort((a, b) => a.tickets - b.tickets);

let currentQuestToSend = null;

window.showQuests = () => {
    const list = document.getElementById('quests-list'); 
    list.innerHTML = '';
    questsList.forEach(q => {
        list.innerHTML += `<div class="quest-item"><div>${q.name}</div><button class="shop-btn" onclick="openPlayerSelect('${q.id}', ${q.tickets})">+${q.tickets} 🎫</button></div>`;
    });
    document.getElementById('quests-modal').style.display = 'flex';
};

window.openPlayerSelect = (questId, tickets) => {
    currentQuestToSend = { id: questId, tickets: tickets };
    get(ref(db, 'players')).then((snap) => {
        const players = snap.val(); 
        const list = document.getElementById('player-select-list'); 
        list.innerHTML = '';
        let found = false;
        
        for (let key in players) {
            if (key !== window.game.playerName) {
                found = true;
                // Принудительно делаем кнопку рабочей
                list.innerHTML += `<div class="inv-item"><div>${key}</div><button type="button" class="shop-btn" onclick="window.sendQuestToPlayer('${key}')">Отправить</button></div>`;
            }
        }
        if (!found) list.innerHTML = '<p style="text-align:center;">Других игроков нет</p>';
        document.getElementById('select-player-modal').style.display = 'flex';
        window.closeQuests(); 
    });
};

window.sendQuestToPlayer = (targetPlayer) => {
    if (!currentQuestToSend) return;
    
    // Отправляем данные в базу
    const newQuestRef = ref(db, `players/${targetPlayer}/quests`).push();
    set(newQuestRef, { 
        questId: currentQuestToSend.id, 
        tickets: currentQuestToSend.tickets, 
        from: window.game.playerName 
    }).then(() => {
        // Этот код сработает ТОЛЬКО если запись в базе прошла успешно
        window.showNotification(`Задание отправлено игроку ${targetPlayer}!`, 'gift');
        window.closeSelectPlayer();
    }).catch((error) => {
        // Если произошла ошибка - покажем её
        console.error("Ошибка отправки:", error);
        alert("Ошибка при отправке: " + error.message);
        window.closeSelectPlayer();
    });
};

window.closeSelectPlayer = () => { 
    document.getElementById('select-player-modal').style.display = 'none'; 
    currentQuestToSend = null; 
};

window.closeQuests = () => document.getElementById('quests-modal').style.display = 'none';

export { questsList };
