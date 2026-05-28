import { closeModal, escapeHtml, getStatusClass, openModal } from './utils.js';

const reservationState = {
  search: '',
  status: 'all',
};

export const mockReservations = [
  {
    id: 'RES-001',
    facility: 'Conference Room A',
    user: 'John Smith',
    date: '2026-05-22',
    time: '09:00 - 11:00',
    status: 'Confirmed',
  },
  {
    id: 'RES-002',
    facility: 'Sports Hall',
    user: 'Emma Wilson',
    date: '2026-05-23',
    time: '14:00 - 16:00',
    status: 'Pending',
  },
  {
    id: 'RES-003',
    facility: 'Meeting Room B',
    user: 'Michael Brown',
    date: '2026-05-24',
    time: '10:00 - 12:00',
    status: 'Confirmed',
  },
  {
    id: 'RES-004',
    facility: 'Auditorium',
    user: 'Sarah Davis',
    date: '2026-05-25',
    time: '15:00 - 17:00',
    status: 'Cancelled',
  },
];

function initReservationFilters() {
  const reservationSearch = document.getElementById('reservationSearch');
  const reservationStatusFilter = document.getElementById('reservationStatusFilter');

  if (reservationSearch) {
    reservationSearch.addEventListener('input', (event) => {
      reservationState.search = event.target.value;
      renderReservationsTable();
    });
  }

  if (reservationStatusFilter) {
    reservationStatusFilter.addEventListener('change', (event) => {
      reservationState.status = event.target.value;
      renderReservationsTable();
    });
  }
}

export function renderReservationsTable() {
  const tbody = document.getElementById('reservationsTableBody');
  if (!tbody) return;

  const filtered = mockReservations.filter((reservation) => {
    const matchesSearch = [reservation.id, reservation.facility, reservation.user, reservation.date, reservation.time, reservation.status]
      .join(' ')
      .toLowerCase()
      .includes(reservationState.search.toLowerCase());

    const matchesStatus = reservationState.status === 'all' || reservation.status === reservationState.status;
    return matchesSearch && matchesStatus;
  });

  tbody.innerHTML = filtered.map((reservation) => `
      <tr class="table-row">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">${escapeHtml(reservation.id)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(reservation.facility)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(reservation.user)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(reservation.date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(reservation.time)}</td>
        <td class="px-6 py-4 whitespace-nowrap"><span class="${getStatusClass(reservation.status)}">${escapeHtml(reservation.status)}</span></td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">
          <div class="flex flex-wrap gap-3">
            <button type="button" class="text-blue-600 transition hover:text-blue-800">Edit</button>
            <button type="button" class="text-rose-600 transition hover:text-rose-800">Cancel</button>
          </div>
        </td>
      </tr>
    `).join('') || `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-sm text-slate-500">No reservations match the selected filters.</td>
      </tr>
    `;
}

export function initReservationModal() {
  const addButton = document.getElementById('addReservationBtn');
  const modal = document.getElementById('addReservationModal');
  const closeButton = document.getElementById('closeReservationModalBtn');
  const cancelButton = document.getElementById('cancelReservationBtn');

  if (!addButton || !modal) return;

  const closeReservationModal = () => closeModal(modal);

  addButton.addEventListener('click', () => openModal(modal));
  closeButton?.addEventListener('click', closeReservationModal);
  cancelButton?.addEventListener('click', closeReservationModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeReservationModal();
  });
}

export function initReservationsPage() {
  if (!document.getElementById('reservationsTableBody') && !document.getElementById('addReservationBtn')) {
    return;
  }

  initReservationFilters();
  initReservationModal();
  renderReservationsTable();
}