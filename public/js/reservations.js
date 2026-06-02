import { escapeHtml, getStatusClass } from './utils.js';

async function fetchReservations() {
  const res = await fetch('http://localhost:3001/api/reservations');
  return await res.json();
}

const reservationState = {
  search: '',
  status: 'all'
};

export async function renderReservationsTable() {
  const tbody = document.getElementById('reservationsTableBody');
  if (!tbody) return;

  let reservations = [];

  try {
    reservations = await fetchReservations();

    if (!Array.isArray(reservations)) {
      reservations = [];
    }

  } catch (err) {
    console.error(err);
    reservations = [];
  }

  const filtered = reservations.filter((reservation) => {

    const matchesSearch = [
      reservation.res_id,
      reservation.res_fullname,
      reservation.res_facility,
      reservation.date_of_use,
      reservation.start_time,
      reservation.end_time,
      reservation.status
    ]
      .join(' ')
      .toLowerCase()
      .includes(reservationState.search.toLowerCase());

    const matchesStatus =
      reservationState.status === 'all' ||
      reservation.status === reservationState.status;

    return matchesSearch && matchesStatus;
  });

  tbody.innerHTML =
    filtered.map((reservation) => `
      <tr>

        <td class="px-6 py-4 font-semibold text-slate-700">
  ${escapeHtml(reservation.res_id)}
</td>
   <td>
  ${new Date(reservation.timestamp).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}
</td>
        <td>${escapeHtml(reservation.res_fullname)}</td>
        <td>${escapeHtml(reservation.contact)}</td>
        <td>${escapeHtml(reservation.res_facility)}</td>
        <td>${escapeHtml(reservation.purpose)}</td>
        <td>${escapeHtml(new Date(reservation.date_of_use).toLocaleDateString())}</td>
        <td>
  ${new Date(`1970-01-01T${reservation.start_time}`)
      .toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}
</td>

<td>
  ${new Date(`1970-01-01T${reservation.end_time}`)
      .toLocaleTimeString('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}
</td>

        <td>
          <span class="${getStatusClass(reservation.status)}">
            ${escapeHtml(reservation.status)}
          </span>
        </td>

        <td class="px-6 py-4 whitespace-nowrap text-slate-700">
  ${escapeHtml(reservation.conflict_check)}
</td>
        <td>${escapeHtml(reservation.control_number)}</td>

<td class="px-4 py-2">
  <div class="flex gap-2">

    <button
      class="edit-btn rounded bg-blue-500 px-3 py-1 text-white"
      data-id="${reservation.res_id}">
      Edit
    </button>

    <button
      class="delete-btn rounded bg-red-500 px-3 py-1 text-white"
      data-id="${reservation.res_id}">
      Delete
    </button>

  </div>
</td>
      </tr>
    `).join('') ||
    `
      <tr>
        <td colspan="13" class="text-center py-10 text-gray-500">
          No reservations found
        </td>
      </tr>
    `;
    // DELETE BUTTON EVENTS
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', async () => {

    const id = btn.dataset.id;

    if (!confirm('Delete this reservation?')) return;

    const response = await fetch(
      `http://localhost:3001/api/reservations/${id}`,
      {
        method: 'DELETE'
      }
    );

    const result = await response.json();

    if (result.success) {
      alert('Reservation deleted');
      renderReservationsTable();
    }
  });
});

/// EDIT BUTTON EVENTS
document.querySelectorAll('.edit-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    const id = btn.dataset.id;

    editReservation(id);

  });
});
}
async function saveReservation() {

  const reservation = {
    res_fullname: document.getElementById('newResName').value,
    contact: document.getElementById('newResContact').value,
    res_facility: document.getElementById('newResFacility').value,
    purpose: document.getElementById('newResPurpose').value,
    date_of_use: document.getElementById('newResDate').value,
    start_time: document.getElementById('newResStart').value,
    end_time: document.getElementById('newResEnd').value,
    status: document.getElementById('newResStatus').value,
    control_number: document.getElementById('newResControlNumber').value
  };

  let response;

  if (window.editingReservationId) {

    response = await fetch(
      `http://localhost:3001/api/reservations/${window.editingReservationId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservation)
      }
    );

    window.editingReservationId = null;

  } else {

    response = await fetch(
      'http://localhost:3001/api/reservations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservation)
      }
    );

  }

  const result = await response.json();

  if (result.success) {

    alert('Reservation saved successfully');

    const modal = document.getElementById('addReservationModal');

    modal.classList.add('hidden');
    modal.classList.remove('flex');

    renderReservationsTable();

  } else {

    alert(result.message);

  }
}
async function editReservation(id) {

  const res = await fetch('http://localhost:3001/api/reservations');
  const reservations = await res.json();

  const reservation = reservations.find(
    r => r.res_id == id
  );

  if (!reservation) return;

  document.getElementById('newResName').value =
    reservation.res_fullname;

  document.getElementById('newResContact').value =
    reservation.contact;

  document.getElementById('newResFacility').value =
    reservation.res_facility;

  document.getElementById('newResPurpose').value =
    reservation.purpose;

  document.getElementById('newResDate').value =
    reservation.date_of_use.split('T')[0];

  document.getElementById('newResStart').value =
    reservation.start_time;

  document.getElementById('newResEnd').value =
    reservation.end_time;

  document.getElementById('newResStatus').value =
    reservation.status;

  const modal =
    document.getElementById('addReservationModal');

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  window.editingReservationId = id;
}

export function initReservationsPage() {

  renderReservationsTable();

  const saveBtn = document.getElementById('saveReservationBtn');
  const addBtn = document.getElementById('addReservationBtn');
  const modal = document.getElementById('addReservationModal');
  const closeBtn = document.getElementById('closeReservationModalBtn');
  const cancelBtn = document.getElementById('cancelReservationBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', saveReservation);
  }

  // OPEN MODAL
  if (addBtn && modal) {
    addBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    });
  }

  // CLOSE MODAL (X button)
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }

  // CANCEL button
  if (cancelBtn && modal) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }
}
document.addEventListener('click', (e) => {

  const editBtn = e.target.closest('.edit-btn');

  if (editBtn) {
    editReservation(editBtn.dataset.id);
  }

});
