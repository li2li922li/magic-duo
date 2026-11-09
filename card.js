// card.js
import { questsList } from './task.js';

const { db, ref, set, update, get, onValue, push } = window.game;
const avatarOptions = ['🥷🏻', '🧚🏻‍♀️', '🧚🏻', '🧚🏻‍♂️', '🧜🏻‍♀️', '🧜🏻‍♂️', '👸🏻', '🤴🏻'];

window.showCharacter = () => {
    get(ref(db, 'players/' + window.game.playerName)).then((snap) => {
        const myData = snap.val();
        document.getElementById('char-avatar').textContent = myData.avatar || '🥷🏻';
        document.getElementById('char-name').textContent = myData.name;
        document.getElementById('char-level').textContent = myData.level;
        const nextLevelXP = (myData.level) * 100; const currentXP = myData.xp || 0;
        const xpPercent = Math.min((currentXP / nextLevelXP) * 100, 100);
        document.getElementById('xp-bar').style.width = `${xpPercent}%`;
        document.getElementById('xp-text').textContent = `${currentXP} / ${nextLevelXP} XP`;

        const avatarList = document.getElementById('avatar-list'); avatarList.innerHTML = '';
        avatarOptions.forEach(av => {
            const div = document.createElement('div'); div.className = `avatar-option ${av === myData.avatar ? 'selected' : ''}`; div.textContent = av;
            div.onclick = () => { update(ref(db, 'players/' + window.game.playerName), { avatar: av }); window.showCharacter(); }; avatarList.appendChild(div);
        });

        const notifList = document.getElementById('notifications-list');
        notifList.innerHTML = '<p style="font-size:12px; color:#aaa;">Загрузка...</p>';
        
        // Загружаем задания и уведомления
        get(ref(db, `players/${window.game.playerName}/quests`)).then((qSnap) => {
            get(ref(db, `players/${window.game.playerName}/notifs`)).then((nSnap) => {
                const quests = qSnap.val();
                const notifs = nSnap.val();
                notifList.innerHTML = '';
                
                let hasNotifs = false;

                if (quests) {
                    hasNotifs = true;
                    for (let key in quests) {
                        const q = quests[key];
                        const isCashier = q.isCashier || false;
                        let questName = isCashier ? q.questId : (questsList.find(x => x.id === q.questId)?.name || 'Задание');
                        
                        // Если это касса, показываем цену
                        let displayName = isCashier ? `🎁 ${questName} (${q.cost} 🎫)` : questName;

                        notifList.innerHTML += `<div class="notification-item"><div>${isCashier ? 'Покупка от' : 'Задание от'} <b>${q.from}</b>: ${displayName}</div><div class="notif-actions"><button class="notif-btn" style="color:#4a6a4a;" onclick="confirmQuest('${key}', '${q.from}', ${q.tickets}, '${isCashier}')">✔️</button><button class="notif-btn" style="color:#6a2a2a;" onclick="rejectQuest('${key}')">❌</button></div></div>`;
                    }
                }

                if (notifs) {
                    hasNotifs = true;
                    for (let key in notifs) {
                        notifList.innerHTML += `<div class="notification-item" style="border-left-color: #90ee90;"><div>${notifs[key].text}</div><div class="notif-actions"><button class="notif-btn" style="color:#aaa;" onclick="clearNotif('${key}')">❌</button></div></div>`;
                    }
                }

                if (!hasNotifs) notifList.innerHTML = '<p style="font-size:12px; color:#aaa;">Нет новых уведомлений</p>';
            });
        });
        document.getElementById('character-modal').style.display = 'flex';
    });
};

// Подтверждение задания/покупки
window.confirmQuest = (key, from, tickets, isCashier) => {
    get(ref(db, `players/${window.game.playerName}/quests/${key}`)).then((qSnap) => {
        const qData = qSnap.val();
        
        if (isCashier) {
            // Если это покупка, то мы подтверждаем, что выполнили её, и списываем билетики у того, кто купил
            get(ref(db, 'players/' + from)).then((snap) => {
                const pData = snap.val();
                update(ref(db, 'players/' + from), { tickets: Math.max(0, (pData.tickets || 0) - qData.cost) });
            });
        } else {
            // Обычное задание: начисляем билетики тому, кто выполнил
            get(ref(db, 'players/' + from)).then((snap) => {
                const pData = snap.val(); 
                update(ref(db, 'players/' + from), { tickets: (pData.tickets || 0) + tickets });
            });
        }
        
        // Переносим в архив
        const archiveRef = push(ref(db, `players/${window.game.playerName}/archive`));
        set(archiveRef, { 
            text: isCashier ? `Куплено: ${qData.questId}` : `Выполнено: ${questsList.find(x => x.id === qData.questId)?.name || 'Задание'}`,
            from: from,
            date: new Date().toLocaleDateString()
        });

        window.showNotification(`Подтверждено!`, 'player');
        set(ref(db, `players/${window.game.playerName}/quests/${key}`), null); 
        window.showCharacter();
    });
};

window.rejectQuest = (key) => { set(ref(db, `players/${window.game.playerName}/quests/${key}`), null); window.showCharacter(); };
window.clearNotif = (key) => { set(ref(db, `players/${window.game.playerName}/notifs/${key}`), null); window.showCharacter(); };
window.closeCharacter = () => document.getElementById('character-modal').style.display = 'none';

// Архив
window.showArchive = () => {
    get(ref(db, `players/${window.game.playerName}/archive`)).then((snap) => {
        const archive = snap.val();
        const list = document.getElementById('notifications-list'); // Используем тот же контейнер
        list.innerHTML = '<h3>📜 Архив выполненных дел</h3>';
        
        if (archive) {
            for (let key in archive) {
                list.innerHTML += `<div class="notification-item" style="border-left-color: #aaa;"><div>${archive[key].text}<br><span style="font-size:10px; color:#666;">${archive[key].from} • ${archive[key].date}</span></div></div>`;
            }
        } else {
            list.innerHTML += '<p style="font-size:12px; color:#aaa;">Архив пуст</p>';
        }
        list.innerHTML += `<button onclick="window.showCharacter()" style="width: 100%; margin-top: 15px; background: #4a6a8a;">Назад</button>`;
    });
};
