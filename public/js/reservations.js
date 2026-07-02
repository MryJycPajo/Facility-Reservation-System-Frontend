import { buildAddonChecklistHtml, collectSelectedAddonIds, fetchAddonCatalog, getAddonSelectionKey, loadAddonSelection, saveAddonSelection } from './addonUtils.js';
import { escapeHtml, getStatusClass, formatDateOnly } from './utils.js';

async function fetchReservations() {
  const API_BASE = 'https://facility-reservation-system-backend.onrender.com';

  const res = await fetch(`${API_BASE}/api/reservations`);

  if (!res.ok) {
    throw new Error(`Failed to fetch reservations: ${res.status}`);
  }

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

     reservations.forEach(r => {
    console.log('DATE FROM API:', r.date_of_use);
  });

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
    reservation.control_number,
    reservation.status
  ]
    .join(' ')
    .toLowerCase()
    .includes(reservationState.search.toLowerCase());

 const matchesStatus =
  reservationState.status === 'all' ||
  reservation.status.toLowerCase().trim() === reservationState.status.toLowerCase().trim();
  return matchesSearch && matchesStatus;
});

  tbody.innerHTML =
  filtered.map((reservation) => {

    console.log('DATE FROM API:', reservation.date_of_use);

    return `
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
        <td>${escapeHtml(formatDateOnly(reservation.date_of_use))}</td>

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

       <td>${escapeHtml(reservation.control_number)}</td>

<td class="px-6 py-4 whitespace-nowrap">
  <div class="flex gap-2">

    <button
      class="edit-btn inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold hover:bg-blue-200 transition"
      data-id="${reservation.res_id}">
      Edit
    </button>

    <button
      class="delete-btn inline-flex items-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-200 transition"
      data-id="${reservation.res_id}">
      Delete
    </button>

  </div>
</td>

</tr>
    `;
  }).join('');
    

    // DELETE BUTTON EVENTS
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', async () => {

    const id = btn.dataset.id;

    if (!confirm('Delete this reservation?')) return;

    const response = await fetch(
      `https://facility-reservation-system-backend.onrender.com/api/reservations/${id}`,
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
  `https://facility-reservation-system-backend.onrender.com/api/reservations/${window.editingReservationId}`,
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
      'https://facility-reservation-system-backend.onrender.com/api/reservations',
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

    const addonSelectionKey = getAddonSelectionKey(document.getElementById('newResControlNumber')?.value || window.editingReservationId);
    saveAddonSelection(addonSelectionKey, collectSelectedAddonIds('reservationAddonsList'));

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

  const res = await fetch('https://facility-reservation-system-backend.onrender.com/api/reservations');
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
    reservation.date_of_use;

  document.getElementById('newResStart').value =
    reservation.start_time;

  document.getElementById('newResEnd').value =
    reservation.end_time;

  document.getElementById('newResStatus').value =
    reservation.status;

  const addonSelectionKey = getAddonSelectionKey(reservation.control_number || reservation.res_id);
  await loadReservationAddons(loadAddonSelection(addonSelectionKey));

  const modal =
    document.getElementById('addReservationModal');

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  window.editingReservationId = id;
}

async function loadFacilitiesDropdown() {
  const select = document.getElementById('newResFacility');
  if (!select) return;

  const res = await fetch('https://facility-reservation-system-backend.onrender.com/api/facilities');
  const facilities = await res.json();

  select.innerHTML =
  '<option value="">Select Facility</option>' +
  facilities.map(f =>
    `<option value="${f.fac_name}">${f.fac_name}</option>`
  ).join('');
}

async function loadReservationAddons(selectedIds = []) {
  const container = document.getElementById('reservationAddonsList');
  if (!container) return;

  try {
    const addons = await fetchAddonCatalog({ activeOnly: true });
    container.innerHTML = buildAddonChecklistHtml(addons, selectedIds);
  } catch (error) {
    console.error('Failed to load add-ons:', error);
    container.innerHTML = '<p class="text-sm text-slate-500">Unable to load add-ons.</p>';
  }
}

export function initReservationsPage() {

  renderReservationsTable();
  loadFacilitiesDropdown();

  const saveBtn = document.getElementById('saveReservationBtn');
  const addBtn = document.getElementById('addReservationBtn');
  const modal = document.getElementById('addReservationModal');
  const closeBtn = document.getElementById('closeReservationModalBtn');
  const cancelBtn = document.getElementById('cancelReservationBtn');

  const searchInput = document.getElementById('reservationSearch');
  const statusFilter = document.getElementById('reservationStatusFilter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      reservationState.search = e.target.value;
      renderReservationsTable();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      reservationState.status = e.target.value;
      renderReservationsTable();
    });
  }

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
