import { closeModal, escapeHtml, getStatusClass, openModal } from './utils.js';

const facilityState = {
  search: '',
  status: 'all',
};

export async function renderFacilitiesTable() {
  const tbody = document.getElementById('facilitiesTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('https://facility-reservation-system-backend.onrender.com/api/facilities');
    const facilities = await res.json();

    const filtered = facilities.filter((f) => {
      const matchesSearch = [
        f.fac_id,
        f.fac_name,
        f.fac_cost
      ]
        .join(' ')
        .toLowerCase()
        .includes(facilityState.search.toLowerCase());

      const matchesStatus =
        facilityState.status === 'all' || f.fac_status === facilityState.status;

      return matchesSearch && matchesStatus;
    });

    tbody.innerHTML = filtered.map((f) => `
      <tr>
        <td class="px-6 py-4">${escapeHtml(f.fac_id)}</td>
        <td class="px-6 py-4">${escapeHtml(f.fac_name)}</td>
        <td class="px-6 py-4">${escapeHtml(f.fac_cost)}</td>
        <td class="px-6 py-4">${escapeHtml(f.fac_status || '')}</td>

        <td class="px-6 py-4 whitespace-nowrap">
  <div class="flex gap-2">

    <button
      class="edit-facility inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition"
      data-id="${f.fac_id}">
      Edit
    </button>

    <button
      class="delete-facility inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 transition"
      data-id="${f.fac_id}">
      Delete
    </button>

  </div>
</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5">Error loading facilities</td></tr>`;
  }
}

export function initFacilityModal() {
  const addBtn = document.getElementById('addFacilityBtn');
  const modal = document.getElementById('addFacilityModal');
  const closeBtn = document.getElementById('closeFacilityModalBtn');
  const cancelBtn = document.getElementById('cancelFacilityBtn');
  const saveBtn = document.getElementById('saveFacilityBtn');

  if (!addBtn || !modal) return;

  const close = () => {
    closeModal(modal);
    window.editingFacilityId = null;
  };

  addBtn.addEventListener('click', () => openModal(modal));
  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });


  saveBtn?.addEventListener('click', async () => {
    const name = document.getElementById('newFacilityName')?.value.trim();
    const cost = document.getElementById('newFacilityCost')?.value.trim();
    const status = document.getElementById('newFacilityStatus')?.value || 'Available';

    if (!name || !cost) {
      alert('Complete all fields');
      return;
    }

    try {
      let res;

      if (window.editingFacilityId) {
        res = await fetch(`https://facility-reservation-system-backend.onrender.com/api/facilities/${window.editingFacilityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fac_name: name,
            fac_cost: cost,
            fac_status: status
          }),
        });

        window.editingFacilityId = null;

      } else {
        
        res = await fetch('https://facility-reservation-system-backend.onrender.com/api/facilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fac_name: name,
            fac_cost: cost,
            fac_status: status
          }),
        });
      }

      const data = await res.json();

      if (data.success) {
        alert('Saved successfully');
        close();
        renderFacilitiesTable();
      } else {
        alert('Failed');
      }

    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  });
}

async function deleteFacility(id) {
  const ok = confirm('Delete this facility?');
  if (!ok) return;

  await fetch(`https://facility-reservation-system-backend.onrender.com/api/facilities/${id}`, {
    method: 'DELETE'
  });

  renderFacilitiesTable();
}

async function editFacility(id) {
  const res = await fetch(`https://facility-reservation-system-backend.onrender.com/api/facilities/${id}`);
  const f = await res.json();

  document.getElementById('newFacilityName').value = f.fac_name;
  document.getElementById('newFacilityCost').value = f.fac_cost;
  document.getElementById('newFacilityStatus').value = f.fac_status;

  openModal(document.getElementById('addFacilityModal'));

  window.editingFacilityId = id;
}

export function initFacilitiesPage() {
  if (!document.getElementById('facilitiesTableBody')) return;

  renderFacilitiesTable();
  initFacilityModal();

  const searchInput = document.getElementById('facilitySearch');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    facilityState.search = e.target.value;
    renderFacilitiesTable();
  });
}

const statusFilter = document.getElementById('facilityStatusFilter');

if (statusFilter) {
  statusFilter.addEventListener('change', (e) => {
    facilityState.status = e.target.value;
    renderFacilitiesTable();
  });
}

  document.removeEventListener('click', handleFacilityClicks);
  document.addEventListener('click', handleFacilityClicks);
}
function handleFacilityClicks(e) {
  const del = e.target.closest('.delete-facility');
  if (del) deleteFacility(del.dataset.id);

  const edit = e.target.closest('.edit-facility');
  if (edit) editFacility(edit.dataset.id);
}
