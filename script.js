// --- KONSOL TEMİZLEME VE GİZLEME ---
(function() {
    try {
        const interval = setInterval(() => {
            const start = new Date().getTime();
            debugger;
            const end = new Date().getTime();
            if (end - start > 100) {
                console.clear();
                console.log('%cBu alan sadece geliştiriciler içindir.', 'font-size: 20px; color: red; font-weight: bold;');
            }
        }, 1000);
    } catch (e) {}
})();
// --- KONSOL TEMİZLEME SONU ---

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const yearView = document.getElementById('year-view');
    const monthView = document.getElementById('month-view');
    const userPanel = document.getElementById('user-panel');
    const yearStr = document.getElementById('year-str');
    const yearViewBody = document.getElementById('year-view-body');
    const monthYearStr = document.getElementById('month-year-str');
    const calendarGridContainer = document.getElementById('calendar-grid-container');
    const entryModal = document.getElementById('entry-modal');
    const manageModal = document.getElementById('manage-modal');
    const detailsModal = document.getElementById('details-modal');

    // State
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let entries = JSON.parse(localStorage.getItem('tto_takvim_entries')) || {};
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    let isAdmin = false;

    // --- ADMIN MODE & Netlify Identity ---
    const updateAdminStatus = (user) => {
        isAdmin = !!user;
        document.body.classList.toggle('admin-mode', isAdmin);
        
        if (user) {
            userPanel.innerHTML = `<span>${user.email}</span><button id="logout-btn">Çıkış Yap</button>`;
            document.getElementById('logout-btn').addEventListener('click', () => {
                if (window.netlifyIdentity) {
                    window.netlifyIdentity.logout();
                }
            });
        } else {
            userPanel.innerHTML = `<a href="/inNout.html" target="_blank">Giriş Yap</a>`;
        }

        renderYearView();
        if (!monthView.classList.contains('hidden')) {
            renderCalendar();
        }
    };

    if (window.netlifyIdentity) {
        netlifyIdentity.on('init', user => updateAdminStatus(user));
        netlifyIdentity.on('login', user => updateAdminStatus(user));
        netlifyIdentity.on('logout', () => updateAdminStatus(null));
    }

    // --- VIEW MANAGEMENT ---
    const showYearView = () => { yearView.classList.remove('hidden'); monthView.classList.add('hidden'); renderYearView(); }
    const showMonthView = () => { yearView.classList.add('hidden'); monthView.classList.remove('hidden'); renderCalendar(); }

    // --- RENDER FUNCTIONS ---
    const renderYearView = () => {
        yearStr.textContent = currentYear;
        yearViewBody.innerHTML = '';
        for (let i = 0; i < 12; i++) {
            const miniCalendar = document.createElement('div');
            miniCalendar.className = 'mini-calendar';
            miniCalendar.addEventListener('click', () => { currentDate = new Date(currentYear, i, 1); showMonthView(); });
            const header = document.createElement('div');
            header.className = 'mini-calendar-header';
            header.textContent = monthNames[i];
            const dayNamesContainer = document.createElement('div');
            dayNamesContainer.className = 'mini-day-names';
            dayNames.forEach(name => dayNamesContainer.innerHTML += `<div>${name}</div>`);
            const dayGrid = document.createElement('div');
            dayGrid.className = 'mini-day-grid';
            const firstDay = new Date(currentYear, i, 1);
            const daysInMonth = new Date(currentYear, i + 1, 0).getDate();
            let startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
            for (let j = 0; j < startDay; j++) { dayGrid.innerHTML += `<div class="mini-day"></div>`; }
            for (let j = 1; j <= daysInMonth; j++) {
                const dayEl = document.createElement('div');
                dayEl.className = 'mini-day';
                dayEl.textContent = j;
                const dateKey = `${currentYear}-${String(i + 1).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
                if (entries[dateKey]) dayEl.classList.add('has-event');
                const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
                if (entries[monthKey] && entries[monthKey].some(e => e.type === 'monthly')) {
                    dayEl.classList.add('is-monthly');
                }
                const today = new Date();
                if (j === today.getDate() && i === today.getMonth() && currentYear === today.getFullYear()) {
                    dayEl.classList.add('is-today');
                }
                dayGrid.appendChild(dayEl);
            }
            miniCalendar.append(header, dayNamesContainer, dayGrid);
            yearViewBody.appendChild(miniCalendar);
        }
    };
    
    const renderCalendar = () => {
        calendarGridContainer.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearStr.textContent = `${monthNames[month]} ${year}`;
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const isMonthlyEvent = entries[monthKey]?.some(e => e.type === 'monthly');
        
        const manageProjectsBtn = document.getElementById('manage-projects-btn');
        if (manageProjectsBtn) {
            manageProjectsBtn.classList.toggle('hidden', !(isAdmin && isMonthlyEvent));
        }

        dayNames.forEach(name => {
            const dayNameEl = document.createElement('div');
            dayNameEl.className = 'day-name';
            dayNameEl.textContent = name;
            calendarGridContainer.appendChild(dayNameEl);
        });

        const firstDayOfMonth = new Date(year, month, 1);
        let dayOfWeek = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay();
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - (dayOfWeek - 1));
        
        for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day');
            const dateKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
            dayDiv.dataset.dateKey = dateKey;

            if (currentDay.getMonth() !== month) {
                dayDiv.classList.add('prev-next-month-day');
            } else if (isMonthlyEvent) {
                dayDiv.classList.add('monthly-event-day');
            }

            const today = new Date();
            if (currentDay.getDate() === today.getDate() && currentDay.getMonth() === today.getMonth() && currentDay.getFullYear() === today.getFullYear()) {
                dayDiv.classList.add('today');
            }
            
            dayDiv.innerHTML = `<div class="day-number">${currentDay.getDate()}</div>`;
            const dayHasEvents = entries[dateKey]?.some(e => e.type === 'daily');

            if (dayHasEvents) {
                const eventListDay = document.createElement('div');
                eventListDay.classList.add('event-list-day');
                entries[dateKey].filter(e => e.type === 'daily').map(event => {
                    eventListDay.innerHTML += `<div class="event-item-day">${event.title}</div>`;
                });
                dayDiv.appendChild(eventListDay);
            }

            if (isAdmin) {
                if (currentDay.getMonth() === month) {
                    const addBtn = document.createElement('button');
                    addBtn.className = 'add-day-btn';
                    addBtn.textContent = '+';
                    dayDiv.appendChild(addBtn);
                }
                if (dayHasEvents) {
                    dayDiv.classList.add('clickable');
                }
            }
            calendarGridContainer.appendChild(dayDiv);
        }
    };

    const setupModal = (modal) => {
        if (!modal) return;
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    };
    [entryModal, detailsModal, manageModal].forEach(setupModal);
    
    const openEntryModalForDate = (dateKey) => {
        entryModal.querySelector('form').reset();
        document.getElementById('entry-date-input').value = dateKey;
        document.getElementById('type-daily').checked = true;
        toggleFormInputs();
        entryModal.style.display = 'flex';
    };

    const openDetailsModal = (dateKey) => {
        const dailyEntries = entries[dateKey]?.filter(e => e.type === 'daily');
        if (!dailyEntries || dailyEntries.length === 0) return;
        const mainEntry = dailyEntries[0];
        
        const dateObj = new Date(dateKey + 'T00:00:00');
        const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        document.getElementById('details-title').textContent = mainEntry.title;
        document.getElementById('details-date').textContent = formattedDate;
        const mediaContainer = document.getElementById('details-media-container');
        const descriptionDiv = document.getElementById('details-description');
        mediaContainer.innerHTML = '';
        descriptionDiv.innerHTML = '';
        
        if (mainEntry.description) {
            if (mainEntry.description.includes('instagram.com')) {
                mediaContainer.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${mainEntry.description}"></blockquote>`;
                if (window.instgrm) window.instgrm.Embeds.process();
            } else if (mainEntry.description.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                mediaContainer.innerHTML = `<img src="${mainEntry.description}" alt="Etkinlik Görseli">`;
            } else {
                descriptionDiv.textContent = mainEntry.description;
            }
        }
        
        document.getElementById('manage-day-btn').onclick = () => {
            detailsModal.style.display = 'none';
            openManageModal(dateKey);
        };
        detailsModal.style.display = 'flex';
    };

    const openManageModal = (key) => {
        const isMonthKey = key.length === 7;
        const type = isMonthKey ? 'monthly' : 'daily';
        document.getElementById('manage-modal-title').textContent = `Kayıtları Yönet`;
        const entryList = document.getElementById('entry-list');
        entryList.innerHTML = '';
        const items = entries[key]?.filter(e => e.type === type) || [];
        if (items.length === 0) {
            entryList.innerHTML = '<li>Bu seçime ait silinecek kayıt bulunmuyor.</li>';
        } else {
            items.forEach((item) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.title}</span><button class="delete-btn" data-key="${key}" data-type="${type}" data-title="${item.title}">Sil</button>`;
                entryList.appendChild(li);
            });
        }
        manageModal.style.display = 'flex';
    };
    
    document.getElementById('entry-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const key = e.target.dataset.key;
            const type = e.target.dataset.type;
            const title = e.target.dataset.title;
            if (entries[key]) {
                entries[key] = entries[key].filter(entry => !(entry.type === type && entry.title === title));
                if (entries[key].length === 0) {
                    delete entries[key];
                }
                localStorage.setItem('tto_takvim_entries', JSON.stringify(entries));
                if (monthView.classList.contains('hidden')) { renderYearView(); } else { renderCalendar(); }
                manageModal.style.display = 'none';
            }
        }
    });

    const entryForm = document.getElementById('entry-form');
    const toggleFormInputs = () => {
         const isDaily = document.getElementById('type-daily').checked;
         document.getElementById('date-group').classList.toggle('hidden', !isDaily);
         document.getElementById('month-group').classList.toggle('hidden', isDaily);
         document.getElementById('entry-date-input').required = isDaily;
         document.getElementById('entry-month-input').required = !isDaily;
    };
    entryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.querySelector('input[name="entry-type"]:checked').value;
        const title = document.getElementById('entry-title-input').value.trim();
        const description = document.getElementById('entry-description-input').value.trim();
        let key, newEntry;
        if (type === 'daily') {
            const date = document.getElementById('entry-date-input').value;
            if (!title || !date) return;
            key = date;
            newEntry = { type: 'daily', title, description };
        } else {
            const month = document.getElementById('entry-month-input').value;
            if (!title || !month) return;
            key = month;
            newEntry = { type: 'monthly', title, description };
        }
        if (!entries[key]) entries[key] = [];
        entries[key].push(newEntry);
        localStorage.setItem('tto_takvim_entries', JSON.stringify(entries));
        if (monthView.classList.contains('hidden')) { renderYearView(); } else { renderCalendar(); }
        entryModal.style.display = 'none';
    });
    
    document.getElementById('prev-year-btn').addEventListener('click', () => { currentYear--; renderYearView(); });
    document.getElementById('next-year-btn').addEventListener('click', () => { currentYear++; renderYearView(); });
    document.getElementById('prev-month-btn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('next-month-btn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    document.getElementById('today-btn').addEventListener('click', () => { currentDate = new Date(); showMonthView(); });
    document.getElementById('back-to-year-view-btn').addEventListener('click', showYearView);
    document.querySelectorAll('input[name="entry-type"]').forEach(radio => radio.addEventListener('change', toggleFormInputs));
    
    calendarGridContainer.addEventListener('click', (e) => {
        const target = e.target;
        const dayElement = target.closest('.day');
        if (!dayElement || dayElement.classList.contains('prev-next-month-day')) return;

        if (target.classList.contains('add-day-btn')) {
            e.stopPropagation();
            openEntryModalForDate(dayElement.dataset.dateKey);
        } else if (dayElement.classList.contains('clickable')) {
            openDetailsModal(dayElement.dataset.dateKey);
        }
    });
    
    const manageProjectsBtn = document.getElementById('manage-projects-btn');
    if(manageProjectsBtn) {
        manageProjectsBtn.addEventListener('click', () => {
            const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            openManageModal(monthKey);
        });
    }

    showYearView();
});
