document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL DEĞİŞKENLER VE DOM ELEMENTLERİ ---
    const yearView = document.getElementById('year-view');
    const monthView = document.getElementById('month-view');
    const yearStr = document.getElementById('year-str');
    const yearViewBody = document.getElementById('year-view-body');
    const prevYearBtn = document.getElementById('prev-year-btn');
    const nextYearBtn = document.getElementById('next-year-btn');
    const monthYearStr = document.getElementById('month-year-str');
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const todayBtn = document.getElementById('today-btn');
    const backToYearViewBtn = document.getElementById('back-to-year-view-btn');
    const entryModal = document.getElementById('entry-modal');
    const addEntryBtn = document.getElementById('add-entry-btn');
    
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let entries = JSON.parse(localStorage.getItem('tto_takvim_entries')) || {};
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

    // --- ADMİN MODU YÖNETİMİ ---
    const enableAdminMode = () => document.body.classList.add('admin-mode');
    const disableAdminMode = () => document.body.classList.remove('admin-mode');

    // --- NETLIFY IDENTITY ENTEGRASYONU ---
    if (window.netlifyIdentity) {
        netlifyIdentity.on('init', user => { if (user) enableAdminMode(); });
        netlifyIdentity.on('login', user => { enableAdminMode(); netlifyIdentity.close(); });
        netlifyIdentity.on('logout', () => disableAdminMode());
    }

    // --- GÖRÜNÜM YÖNETİMİ ---
    const showYearView = () => { yearView.classList.remove('hidden'); monthView.classList.add('hidden'); renderYearView(); }
    const showMonthView = () => { yearView.classList.add('hidden'); monthView.classList.remove('hidden'); renderCalendar(); }

    // --- YIL GÖRÜNÜMÜ (YENİ MİNİ TAKVİMLER) ---
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

            // Boş günleri ekle
            for (let j = 0; j < startDay; j++) { dayGrid.innerHTML += `<div class="mini-day"></div>`; }
            
            // Ayın günlerini ekle
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
    }
    
    // --- AY GÖRÜNÜMÜ (SABİT 42 GÜN) ---
    const renderCalendar = () => { /* Bu fonksiyon önceki versiyondaki gibi kalabilir, değişiklik yok */
        calendarBody.innerHTML = '';
        const year = currentDate.getFullYear(); const month = currentDate.getMonth();
        monthYearStr.textContent = `${monthNames[month]} ${year}`;
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const isProjectMonth = entries[monthKey] && entries[monthKey].some(e => e.type === 'project');
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
            if (entries[dateKey] && entries[dateKey].length > 0) {
                const eventListDay = document.createElement('div'); eventListDay.classList.add('event-list-day');
                entries[dateKey].filter(e => e.type === 'event').forEach(event => { eventListDay.innerHTML += `<div class="event-item-day">${event.title}</div>`; });
                dayDiv.appendChild(eventListDay);
            }
            calendarBody.appendChild(dayDiv);
        }
    }

    // --- MODAL & FORM FONKSİYONLARI ---
    const setupModal = (modal) => { /* Değişiklik yok */
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }
    setupModal(entryModal);
    addEntryBtn.addEventListener('click', () => { /* Değişiklik yok */
        entryModal.querySelector('form').reset(); toggleFormInputs(); entryModal.style.display = 'flex';
    });

    const entryForm = document.getElementById('entry-form');
    const entryTypeRadios = document.querySelectorAll('input[name="entry-type"]');
    
    const toggleFormInputs = () => { /* Değişiklik yok */
         const isEvent = document.getElementById('type-event').checked;
         document.getElementById('event-inputs').classList.toggle('hidden', !isEvent); document.getElementById('project-inputs').classList.toggle('hidden', isEvent);
         document.getElementById('event-title-input').required = isEvent; document.getElementById('event-date-input').required = isEvent;
         document.getElementById('project-title-input').required = !isEvent; document.getElementById('project-month-input').required = !isEvent;
    }

    entryForm.addEventListener('submit', (e) => { /* Değişiklik yok */
        e.preventDefault(); const type = document.querySelector('input[name="entry-type"]:checked').value;
        let key, entry;
        if (type === 'event') {
            const title = document.getElementById('event-title-input').value.trim(); const date = document.getElementById('event-date-input').value;
            if (!title || !date) return; key = date; entry = { type: 'event', title };
        } else {
            const title = document.getElementById('project-title-input').value.trim(); const month = document.getElementById('project-month-input').value;
            if (!title || !month) return; key = month; entry = { type: 'project', title };
        }
        if (!entries[key]) entries[key] = []; entries[key].push(entry);
        localStorage.setItem('tto_takvim_entries', JSON.stringify(entries));
        if (monthView.classList.contains('hidden')) renderYearView(); else renderCalendar();
        entryModal.style.display = 'none';
    });
    
    // --- NAVİGASYON EVENTLERİ ---
    prevYearBtn.addEventListener('click', () => { currentYear--; renderYearView(); });
    nextYearBtn.addEventListener('click', () => { currentYear++; renderYearView(); });
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    todayBtn.addEventListener('click', () => { currentDate = new Date(); showMonthView(); });
    backToYearViewBtn.addEventListener('click', showYearView);
    entryTypeRadios.forEach(radio => radio.addEventListener('change', toggleFormInputs));

    // --- UYGULAMA BAŞLANGICI ---
    showYearView();
});
