document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const yearView = document.getElementById('year-view');
    const monthView = document.getElementById('month-view');
    const yearStr = document.getElementById('year-str');
    const yearViewBody = document.getElementById('year-view-body');
    const monthYearStr = document.getElementById('month-year-str');
    const calendarBody = document.getElementById('calendar-body');
    const entryModal = document.getElementById('entry-modal');
    const manageModal = document.getElementById('manage-modal');
    const detailsModal = document.getElementById('details-modal');
    const addEntryBtn = document.getElementById('add-entry-btn');

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
        renderYearView(); // Re-render to update clickable states
        if (!monthView.classList.contains('hidden')) {
            renderCalendar();
        }
    };

    if (window.netlifyIdentity) {
        netlifyIdentity.on('init', user => updateAdminStatus(user));
        netlifyIdentity.on('login', user => { updateAdminStatus(user); netlifyIdentity.close(); });
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
                if (entries[monthKey] && entries[monthKey].some(e => e.type === 'project')) {
                    dayEl.classList.add('is-project');
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
        calendarBody.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearStr.textContent = `${monthNames[month]} ${year}`;
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const projectEntries = entries[monthKey]?.filter(e => e.type === 'project') || [];
        const isProjectMonth = projectEntries.length > 0;
        
        document.getElementById('manage-projects-btn').classList.toggle('hidden', !(isAdmin && isProjectMonth));

        const firstDayOfMonth = new Date(year, month, 1);
        let dayOfWeek = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay();
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - (dayOfWeek - 1));
        
        for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startDate); currentDay.setDate(startDate.getDate() + i);
            const dayDiv = document.createElement('div'); dayDiv.classList.add('day');
            const dateKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
            if (currentDay.getMonth() !== month) { dayDiv.classList.add('prev-next-month-day'); }
            if (isProjectMonth && currentDay.getMonth() === month) { dayDiv.classList.add('project-month-day'); }
            const today = new Date();
            if (currentDay.getDate() === today.getDate() && currentDay.getMonth() === today.getMonth() && currentDay.getFullYear() === today.getFullYear()) { dayDiv.classList.add('today'); }
            
            dayDiv.innerHTML = `<div class="day-number">${currentDay.getDate()}</div>`;
            const dayHasEvents = entries[dateKey]?.some(e => e.type === 'event');

            if (dayHasEvents) {
                const eventListDay = document.createElement('div');
                eventListDay.classList.add('event-list-day');
                entries[dateKey].filter(e => e.type === 'event').forEach(event => { eventListDay.innerHTML += `<div class="event-item-day">${event.title}</div>`; });
                dayDiv.appendChild(eventListDay);
            }
            
            if (isAdmin && dayHasEvents) {
                dayDiv.classList.add('clickable');
                dayDiv.addEventListener('click', () => openDetailsModal(dateKey));
            }
            
            calendarBody.appendChild(dayDiv);
        }
    };

    // --- MODAL & FORM FUNCTIONS ---
    const setupModal = (modal) => {
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    };
    [entryModal, manageModal, detailsModal].forEach(setupModal);

    const openDetailsModal = (dateKey) => {
        const eventData = entries[dateKey]?.find(e => e.type === 'event');
        if (!eventData) return;

        const dateObj = new Date(dateKey + 'T00:00:00');
        const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        
        document.getElementById('details-title').textContent = eventData.title;
        document.getElementById('details-date').textContent = formattedDate;

        const imgContainer = document.getElementById('details-image-container');
        const imgEl = document.getElementById('details-image');
        if (eventData.imageUrl) {
            imgEl.src = eventData.imageUrl;
            imgContainer.classList.remove('hidden');
        } else {
            imgContainer.classList.add('hidden');
        }

        const manageBtn = document.getElementById('manage-event-btn');
        manageBtn.onclick = () => {
            detailsModal.style.display = 'none';
            openManageModal(dateKey);
        };

        detailsModal.style.display = 'flex';
    };

    const openManageModal = (key) => {
        const isMonthKey = key.length === 7; // YYYY-MM
        const type = isMonthKey ? 'project' : 'event';
        
        document.getElementById('manage-modal-title').textContent = `${type === 'event' ? 'Etkinlikleri' : 'Projeleri'} Yönet`;
        if(!isMonthKey) {
             const dateObj = new Date(key + 'T00:00:00');
             document.getElementById('manage-modal-date').textContent = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        } else {
            document.getElementById('manage-modal-date').textContent = '';
        }

        const entryList = document.getElementById('entry-list');
        entryList.innerHTML = '';
        
        const items = entries[key]?.filter(e => e.type === type) || [];
        if (items.length === 0) {
            entryList.innerHTML = '<li>Silinecek kayıt bulunmuyor.</li>';
        } else {
            items.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.title}</span><button class="delete-btn" data-key="${key}" data-index="${index}">Sil</button>`;
                entryList.appendChild(li);
            });
        }
        manageModal.style.display = 'flex';
    };
    
    document.getElementById('entry-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const key = e.target.dataset.key;
            const indexToDelete = parseInt(e.target.dataset.index);

            const type = key.length === 7 ? 'project' : 'event';
            let originalIndex = 0;
            let foundIndex = -1;

            for(let i = 0; i < entries[key].length; i++) {
                if(entries[key][i].type === type) {
                    if(originalIndex === indexToDelete) {
                        foundIndex = i;
                        break;
                    }
                    originalIndex++;
                }
            }
            
            if (foundIndex !== -1) {
                entries[key].splice(foundIndex, 1);
                if (entries[key].length === 0) {
                    delete entries[key];
                }
                localStorage.setItem('tto_takvim_entries', JSON.stringify(entries));
                renderCalendar();
                manageModal.style.display = 'none';
            }
        }
    });

    addEntryBtn.addEventListener('click', () => { entryModal.querySelector('form').reset(); toggleFormInputs(); entryModal.style.display = 'flex'; });
    const entryForm = document.getElementById('entry-form');
    const toggleFormInputs = () => {
         const isEvent = document.getElementById('type-event').checked;
         document.getElementById('event-inputs').classList.toggle('hidden', !isEvent); document.getElementById('project-inputs').classList.toggle('hidden', isEvent);
         document.getElementById('event-title-input').required = isEvent; document.getElementById('event-date-input').required = isEvent;
         document.getElementById('project-title-input').required = !isEvent; document.getElementById('project-month-input').required = !isEvent;
    };
    entryForm.addEventListener('submit', (e) => {
        e.preventDefault(); const type = document.querySelector('input[name="entry-type"]:checked').value;
        let key, entry;
        if (type === 'event') {
            const title = document.getElementById('event-title-input').value.trim();
            const date = document.getElementById('event-date-input').value;
            const imageUrl = document.getElementById('event-image-input').value.trim();
            if (!title || !date) return;
            key = date;
            entry = { type: 'event', title, imageUrl };
        } else {
            const title = document.getElementById('project-title-input').value.trim();
            const month = document.getElementById('project-month-input').value;
            if (!title || !month) return;
            key = month;
            entry = { type: 'project', title };
        }
        if (!entries[key]) entries[key] = [];
        entries[key].push(entry);
        localStorage.setItem('tto_takvim_entries', JSON.stringify(entries));
        if (monthView.classList.contains('hidden')) renderYearView(); else renderCalendar();
        entryModal.style.display = 'none';
    });
    
    // --- NAVIGATION ---
    document.getElementById('prev-year-btn').addEventListener('click', () => { currentYear--; renderYearView(); });
    document.getElementById('next-year-btn').addEventListener('click', () => { currentYear++; renderYearView(); });
    document.getElementById('prev-month-btn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('next-month-btn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    document.getElementById('today-btn').addEventListener('click', () => { currentDate = new Date(); showMonthView(); });
    document.getElementById('back-to-year-view-btn').addEventListener('click', showYearView);
    document.querySelectorAll('input[name="entry-type"]').forEach(radio => radio.addEventListener('change', toggleFormInputs));
    document.getElementById('manage-projects-btn').addEventListener('click', () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        openManageModal(monthKey);
    });

    // --- INITIAL RENDER ---
    showYearView();
});
