// quest.js
const { db, ref, set, update, get, onValue } = window.game;

// Список квестов
const questsData = {
    'artiste': {
        name: 'Странствующий Артист 🤹🏻‍♀️',
        desc: 'Бывший циркач с потрёпанным сундуком. Ищет помощи.',
        stages: [
            {
                id: 1, title: 'Уставший путник',
                text: '«Ох... Добрый путник. Не осуди — я на мели. Три дня во рту маковой росинки не было. Дай мне, Христа ради... то есть, во имя приключений! — молока и печенья. Старое печенье, новое — не важно. Просто... хочу почувствовать вкус дома.»',
                require: { milk: 1, cookies: 3 },
                rewardXp: 50, rewardTickets: 0, rewardCrystals: 0, item: null
            },
            {
                id: 2, title: 'Топор для сцены',
                text: '«О! Ты пришёл! Смотри — я нашёл это место. Здесь можно построить маленькую сцену и снова выступать! Но вот беда — мой топор сломался. А без него никак: доски, гвозди, перекладины... Принеси мне топор, друг. Обещаю — я верну его, как только закончу. Ну... почти обещаю.»',
                require: { axe: 1 },
                rewardXp: 100, rewardTickets: 0, rewardCrystals: 0, item: null
            },
            {
                id: 3, title: 'Глоток вдохновения',
                text: '«Ха! Как в старые добрые! Знаешь, я ведь не только жонглировал. Я был эквилибристом. Ходил по канату над львами. Однажды упал — прямо в пасть! Лев оказался старым и беззубым, только облизал меня. Труппа смеялась неделю... А потом был пожар. Я потерял всё. Но теперь... теперь у меня есть план! Мне нужно ещё кое-что. Одолжишь мне 100 кристаллов? Я видел на базаре глоток вдохновения — зелье, которое вернёт мне былую ловкость. Клянусь, верну с первым гонораром!»',
                require: { crystals: 100 },
                rewardXp: 150, rewardTickets: 0, rewardCrystals: 0, item: null
            },
            {
                id: 4, title: 'Защита сцены',
                text: '«Спасибо. Ты не представляешь, что это значит... Знаешь, я ведь был таким же. Меня подобрал старый клоун, научил всему. А потом сгорел цирк... Я поклялся, что если смогу — помогу кому-то ещё. Но хватит о грустном! Я слышал, в лесу появились разбойники. Я хочу защитить свою будущую сцену. Научился стрелять из лука — сам, по книжке! Но стрелы... Стрелы нужны деревянные. Много. Принесёшь?»',
                require: { arrows: 10 },
                rewardXp: 200, rewardTickets: 0, rewardCrystals: 0, item: null
            },
            {
                id: 5, title: 'День рождения Тима',
                text: '«Отлично! Теперь я готов. Слушай... Я давно хотел тебе сказать. Пока ты помогал мне, я... Я снова почувствовал себя нужным. Не просто артистом, а другом. И знаешь что? У меня есть племянник. Маленький Тим. Он живёт с моей сестрой в соседней деревне. Завтра у него день рождения. А я... Я не могу прийти с пустыми руками. Мне нужен шоколад. Для торта. Самый лучший, какой найдёшь. Принесёшь? Это будет мой первый день рождения с ним за три года.»',
                require: { chocolate: 1 },
                rewardXp: 200, rewardTickets: 5, rewardCrystals: 0, item: 'eagle'
            }
        ]
    },
    'sage': {
        name: 'Хранитель Вод 🧘🏼‍♂️',
        desc: 'Старец в синих одеждах у горного озера.',
        stages: [
            {
                id: 1, title: 'Испытание сферы',
                text: '«Я ждал тебя. Вода шепнула мне, что ты придёшь. Видишь это озеро? Оно не просто вода. Это — память мира. Каждая капля хранит чьи-то слёзы, чью-то радость. Но чтобы управлять водой, нужно сначала понять её. Принеси мне зелье "Водяная Сфера". Оно создаст круг чистой воды — основу любого водного заклинания. Иди. И помни: вода не терпит суеты.»',
                require: { waterSphere: 1 },
                rewardXp: 200, rewardTickets: 1, rewardCrystals: 0, item: null
            },
            {
                id: 2, title: 'Поток власти',
                text: '«Видишь? Вода слушается того, кто не борется с ней. Ты принёс зелье "Власть над водами"? Хорошо. Но помни: власть над водой — это не сила. Это ответственность. Однажды тебе придётся выбрать: направить поток или позволить ему течь свободно. А теперь... Оставь зелье на алтаре. И иди. Тебе нужно ещё кое-что. Храм у подножия горы нуждается в пожертвовании. Сто кристаллов. Не для меня — для людей. Вода питает землю, земля питает людей. Так замыкается круг.»',
                require: { waterPower: 1 },
                rewardXp: 300, rewardTickets: 1, rewardCrystals: 0, item: null
            },
            {
                id: 3, title: 'Дар храму',
                text: '«Ты сделал всё. Теперь — последнее. Я дам тебе то, что вода дала мне. Это не оружие в привычном смысле. Это — часть стихии. Магический шар. Он не убивает напрямую. Он... преображает. Выпусти его — и всё вокруг станет водой. Ненадолго. Но этого хватит, чтобы монстры потеряли форму и не смогли двигаться. А ты — сможешь ударить их своим оружием. Или уйти. Выбор всегда за тобой.»',
                require: { crystals: 200 },
                rewardXp: 500, rewardTickets: 5, rewardCrystals: 0, item: 'magicOrb'
            }
        ]
    }
};

// Функция для открытия карточки квеста
window.openQuest = function(questId, stageIndex, myData) {
    const quest = questsData[questId];
    const stage = quest.stages[stageIndex];
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay'; overlay.style.display = 'flex';
    
    // Проверяем, есть ли нужные предметы
    let canComplete = true;
    let requirementHtml = '';
    
    for (let key in stage.require) {
        const requiredAmount = stage.require[key];
        let haveAmount = 0;
        
        if (key === 'crystals') haveAmount = myData.crystals || 0;
        else if (myData.inventory && myData.inventory[key]) haveAmount = myData.inventory[key];
        
        if (haveAmount < requiredAmount) canComplete = false;
        
        // Названия предметов для отображения
        const itemNames = { milk: '🥛 Молоко', cookies: '🍪 Печенье', axe: '🪓 Топор', arrows: '🏹 Стрелы', chocolate: '🍫 Шоколад', waterSphere: '🧪 Водяная Сфера', waterPower: '🧪 Власть над водами', crystals: '💎 Кристаллы' };
        const itemName = itemNames[key] || key;
        
        requirementHtml += `<div style="margin-bottom: 5px; color: ${haveAmount >= requiredAmount ? '#90ee90' : '#ff6b6b'}">
            ${itemName}: ${haveAmount} / ${requiredAmount}
        </div>`;
    }

    overlay.innerHTML = `
        <div class="modal-content" style="border-color:#dda0dd; max-width: 450px;">
            <h2 style="color:#ffcc00;">${quest.name}</h2>
            <h3 style="color:#fff; text-align:center;">${stage.title}</h3>
            <p style="font-style: italic; color: #ccc; line-height: 1.5;">${stage.text}</p>
            
            <h4 style="color:#dda0dd; border-bottom: 1px solid #444; padding-bottom: 5px;">Требуется:</h4>
            ${requirementHtml}
            
            <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                <button id="btn-submit-quest" style="background: ${canComplete ? '#4a6a4a' : '#333'}; color: ${canComplete ? '#fff' : '#888'}; padding: 12px; border: 1px solid ${canComplete ? '#90ee90' : '#555'}; border-radius: 6px; cursor: ${canComplete ? 'pointer' : 'not-allowed'}; font-weight: bold;">
                    ${canComplete ? 'Отдать предметы' : 'Недостаточно предметов'}
                </button>
                <button id="btn-close-quest" style="background: #6a2a2a; padding: 10px; border: 1px solid #8a4a4a; border-radius: 6px; cursor: pointer; color: #fff;">Отступить</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Кнопка "Отступить"
    document.getElementById('btn-close-quest').onclick = () => overlay.remove();

    // Кнопка "Отдать"
    if (canComplete) {
        document.getElementById('btn-submit-quest').onclick = () => {
            // Списываем предметы
            let newInv = myData.inventory ? { ...myData.inventory } : {};
            let newCrystals = myData.crystals || 0;
            let newXp = myData.xp || 0;
            let newTickets = myData.tickets || 0;

            for (let key in stage.require) {
                if (key === 'crystals') {
                    newCrystals -= stage.require[key];
                } else {
                    newInv[key] = (newInv[key] || 0) - stage.require[key];
                }
            }

            // Начисляем награды
            newXp += stage.rewardXp;
            newTickets += stage.rewardTickets;
            newCrystals += stage.rewardCrystals;
            
            if (stage.item === 'eagle') {
                newInv['eagle'] = (newInv['eagle'] || 0) + 1;
            } else if (stage.item === 'magicOrb') {
                newInv['magicOrb'] = (newInv['magicOrb'] || 0) + 1;
            }

            // Обновляем в базе
            update(ref(db, 'players/' + window.game.playerName), {
                inventory: newInv,
                crystals: newCrystals,
                xp: newXp,
                tickets: newTickets
            }).then(() => {
                // Отмечаем, что эта стадия пройдена
                update(ref(db, `players/${window.game.playerName}/questsProgress/${questId}`), { stage: stageIndex + 1 });
                
                window.showNotification(`Квест "${stage.title}" выполнен!`, 'player');
                overlay.remove();
                
                // Пересчитываем уровень (если нужно)
                if (window.processXP) window.processXP(myData, stage.rewardXp); // Начисляем опыт через level.js
            });
        };
    }
};
