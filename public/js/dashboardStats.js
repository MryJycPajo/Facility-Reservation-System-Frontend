import { escapeHtml, getStatusClass } from './utils.js';

const API_BASE = 'http://localhost:3001/api';

let overviewCalendar = null;

async function fetchStats() {
  const res = await fetch(`${API_BASE}/reservations/stats/summary`);
  return await res.json();
}

async function fetchReservations() {
  const res = await fetch(`${API_BASE}/reservations`);
  const reservations = await res.json();

  return Array.isArray(reservations) ? reservations : [];
}

function getReservationDateKey(reservation) {
  const rawDate =
    reservation.reservation_date ??
    reservation.date_of_use ??
    reservation.date ??
    '';

  if (!rawDate) return '';

  const str = String(rawDate).trim();

  // CASE 1: already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // CASE 2: MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [m, d, y] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // CASE 3: ISO STRING (FIXED TIMEZONE SAFE)
  if (str.includes('T')) {
    const d = new Date(str);

    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
    }).format(d);
  }

  return str.slice(0, 10);
}

function formatLongDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function getLocalDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function normalizeStatus(status) {
  const key = String(status || '').trim().toLowerCase();

  if (key === 'approved' || key === 'confirmed' || key === 'completed') return 'approved';
  if (key === 'cancelled' || key === 'canceled') return 'cancelled';
  return 'pending';
}

function getStatusBadgeClass(status) {
  return getStatusClass(status === 'approved' ? 'confirmed' : status);
}

function getReservationFacility(reservation) {
  return reservation.res_facility ?? reservation.facility_name ?? reservation.facility ?? 'Unknown Facility';
}

function formatTime(time) {
  if (!time) return '';

  const [h, m] = time.split(':');
  const hour = Number(h);
  const minute = m || '00';

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minute} ${ampm}`;
}

function createTrendLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function populateSummaryCards(reservations, stats) {
  const totalReservations = Number(stats?.total ?? reservations.length ?? 0);
  const todayKey = getLocalDateKey(new Date());
  const todayReservations = reservations.filter((reservation) => getReservationDateKey(reservation) === todayKey);
  const pendingReservations = reservations.filter((reservation) => normalizeStatus(reservation.status) === 'pending');

  const facilityCounts = new Map();

  reservations.forEach((reservation) => {
    const facilityName = String(getReservationFacility(reservation)).trim() || 'Unknown Facility';
    facilityCounts.set(facilityName, (facilityCounts.get(facilityName) ?? 0) + 1);
  });

  const topFacility = Array.from(facilityCounts.entries()).sort((left, right) => right[1] - left[1])[0];

  const totalEl = document.getElementById('totalReservations');
  const todayEl = document.getElementById('todaySchedule');
  const pendingEl = document.getElementById('pendingRequests');
  const topFacilityCountEl = document.getElementById('topFacilityCount');
  const topFacilityNameEl = document.getElementById('topFacilityName');

  if (totalEl) totalEl.textContent = String(totalReservations);
  if (todayEl) todayEl.textContent = String(todayReservations.length);
  if (pendingEl) pendingEl.textContent = String(pendingReservations.length);
  if (topFacilityCountEl) topFacilityCountEl.textContent = String(topFacility?.[1] ?? 0);
  if (topFacilityNameEl) {
    topFacilityNameEl.textContent = topFacility ? topFacility[0] : 'No reservations yet';
  }
}

function getCalendarEventColor(status) {
  if (status === 'approved') return '#2563eb';
  if (status === 'cancelled') return '#ef4444';
  return '#f59e0b';
}

function buildCalendarEvents(reservations) {
  return reservations
    .map((reservation, index) => {
      const dateKey = getReservationDateKey(reservation);
      if (!dateKey) return null;

      const status = normalizeStatus(reservation.status);
      const facility = String(getReservationFacility(reservation)).trim() || 'Unknown Facility';

      // Build local Date objects for start/end to avoid timezone shifts
      const [y, m, d] = dateKey.split('-').map((v) => Number(v));

      let start = null;
      if (reservation.start_time) {
        const parts = String(reservation.start_time).split(':').map((v) => Number(v));
        start = new Date(y, m - 1, d, parts[0] || 0, parts[1] || 0, parts[2] || 0);
      } else {
        start = new Date(y, m - 1, d, 0, 0, 0);
      }

      let end = null;
      if (reservation.end_time) {
        const parts = String(reservation.end_time).split(':').map((v) => Number(v));
        end = new Date(y, m - 1, d, parts[0] || 0, parts[1] || 0, parts[2] || 0);
      }

      const event = {
        id: reservation.res_id ?? `${dateKey}-${index}`,
        title: facility,
        start,
        allDay: false,
        backgroundColor: getCalendarEventColor(status),
        borderColor: getCalendarEventColor(status),
        extendedProps: {
          facility,
          dateKey,
          status,
          startTime: reservation.start_time,
          endTime: reservation.end_time,
        },
      };

      if (end) event.end = end;

      return event;
    })
    .filter(Boolean);
}

function renderReservationList(dateKey, reservations) {
  const listEl = document.getElementById('dateReservationsList');
  const countEl = document.getElementById('dateReservationsCount');
  const subtitleEl = document.getElementById('dateReservationsSubtitle');

  if (!listEl || !countEl || !subtitleEl) return;

  const [y, m, d] = dateKey.split('-').map((v) => Number(v));
  const selectedDate = new Date(y, m - 1, d);
  subtitleEl.textContent = formatLongDate(selectedDate);
  countEl.textContent = `${reservations.length} reservation${reservations.length === 1 ? '' : 's'}`;

  if (reservations.length === 0) {
    listEl.innerHTML = `
      <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        No reservations were found for this date.
      </div>
    `;
    return;
  }

  listEl.innerHTML = reservations.map((reservation) => {
    const status = normalizeStatus(reservation.status);
    const facility = escapeHtml(String(getReservationFacility(reservation)));
    const timeRange = `${escapeHtml(formatTime(reservation.start_time))} - ${escapeHtml(formatTime(reservation.end_time))}`;

    return `
      <article class="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-base font-bold text-slate-900">${facility}</p>
            <p class="mt-1 text-sm text-slate-500">${timeRange}</p>
          </div>
          <span class="${getStatusBadgeClass(status)}">${escapeHtml(status)}</span>
        </div>
      </article>
    `;
  }).join('');
}

function closeDateModal() {
  const modal = document.getElementById('dateReservationsModal');
  const panel = document.getElementById('dateReservationsPanel');

  if (!modal || !panel) return;

  modal.classList.add('opacity-0', 'invisible', 'pointer-events-none');
  modal.classList.remove('opacity-100', 'visible', 'pointer-events-auto');
  panel.classList.add('translate-y-4', 'scale-95');
  panel.classList.remove('translate-y-0', 'scale-100');
}

function openDateModal(dateKey, reservations) {
  const modal = document.getElementById('dateReservationsModal');
  const panel = document.getElementById('dateReservationsPanel');

  if (!modal || !panel) return;

  renderReservationList(dateKey, reservations);

  modal.classList.remove('opacity-0', 'invisible', 'pointer-events-none');
  modal.classList.add('opacity-100', 'visible', 'pointer-events-auto');
  panel.classList.remove('translate-y-4', 'scale-95');
  panel.classList.add('translate-y-0', 'scale-100');
}

function bindModalControls() {
  const backdrop = document.getElementById('dateReservationsBackdrop');
  const closeButton = document.getElementById('closeDateReservationsModal');

  if (backdrop && !backdrop.dataset.bound) {
    backdrop.dataset.bound = 'true';
    backdrop.addEventListener('click', closeDateModal);
  }

  if (closeButton && !closeButton.dataset.bound) {
    closeButton.dataset.bound = 'true';
    closeButton.addEventListener('click', closeDateModal);
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDateModal();
    }
  });
}

function initOverviewCalendar(reservations) {
  const calendarEl = document.getElementById('overviewCalendar');

  if (!calendarEl || typeof window.FullCalendar === 'undefined') {
    if (calendarEl) {
      calendarEl.innerHTML = `
        <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          Calendar library is unavailable. The overview data still loads above.
        </div>
      `;
    }

    return;
  }

  if (overviewCalendar) {
    overviewCalendar.destroy();
    overviewCalendar = null;
  }

  const events = buildCalendarEvents(reservations);
  const reservationsByDate = new Map();

  reservations.forEach((reservation) => {
    const dateKey = getReservationDateKey(reservation);
    if (!dateKey) return;

    if (!reservationsByDate.has(dateKey)) {
      reservationsByDate.set(dateKey, []);
    }

    reservationsByDate.get(dateKey).push(reservation);
  });

  overviewCalendar = new window.FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 360,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    firstDay: 0,
    navLinks: false,
    editable: false,
    selectable: false,
    dayMaxEventRows: 3,
    eventDisplay: 'list-item',
    events,
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
    eventDidMount(info) {
      info.el.style.borderRadius = '0.9rem';
      info.el.style.border = '0';
      info.el.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.08)';
      info.el.style.fontWeight = '700';
    },
    dayCellDidMount(info) {
      const dateKey = getLocalDateKey(info.date);
      const reservationsForDay = reservationsByDate.get(dateKey) ?? [];

      if (reservationsForDay.length === 0) return;

      if (!info.el.dataset.dateModalBound) {
        info.el.dataset.dateModalBound = 'true';
        info.el.addEventListener('click', () => {
          openDateModal(dateKey, reservationsByDate.get(dateKey) ?? []);
        });
      }

      const existingIndicator = info.el.querySelector('[data-reservation-indicator]');
      if (existingIndicator) {
        existingIndicator.remove();
      }

      const indicator = document.createElement('div');
      indicator.dataset.reservationIndicator = 'true';
      indicator.className = 'mt-2 flex flex-wrap items-center gap-1.5';

      reservationsForDay.slice(0, 3).forEach((reservation) => {
        const dot = document.createElement('span');
        dot.className = 'h-2.5 w-2.5 rounded-full';
        dot.style.backgroundColor = getCalendarEventColor(normalizeStatus(reservation.status));
        indicator.appendChild(dot);
      });

      if (reservationsForDay.length > 3) {
        const more = document.createElement('span');
        more.className = 'rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500';
        more.textContent = `+${reservationsForDay.length - 3}`;
        indicator.appendChild(more);
      }

      info.el.querySelector('.fc-daygrid-day-frame')?.appendChild(indicator);
      info.el.style.cursor = 'pointer';
    },
   dateClick(info) {
  const dateKey = getLocalDateKey(info.date);
  openDateModal(dateKey, reservationsByDate.get(dateKey) ?? []);
}
  });

  overviewCalendar.render();
  bindModalControls();
}

export async function loadDashboardStats() {
  try {
    const [stats, reservations] = await Promise.all([
      fetchStats(),
      fetchReservations(),
    ]);

    console.log('RESERVATIONS:', reservations);

    populateSummaryCards(reservations, stats);
    initOverviewCalendar(reservations);

    return { stats, reservations };
  } catch (err) {
    console.error('Failed to load dashboard stats:', err);

    populateSummaryCards([], null);
    initOverviewCalendar([]);

    return { stats: null, reservations: [] };
  }
}