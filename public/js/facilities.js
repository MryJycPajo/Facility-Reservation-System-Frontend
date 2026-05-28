import { closeModal, escapeHtml, getStatusClass, nextItemId, openModal } from './utils.js';

const facilityState = {
  search: '',
  status: 'all',
};

export const mockFacilities = [
  {
    id: 'FAC-001',
    name: 'Conference Room A',
    capacity: 20,
    hourlyRate: 75,
    status: 'Available',
    bookings: 45,
  },
  {
    id: 'FAC-002',
    name: 'Sports Hall',
    capacity: 100,
    hourlyRate: 150,
    status: 'Available',
    bookings: 38,
  },
  {
    id: 'FAC-003',
    name: 'Meeting Room B',
    capacity: 12,
    hourlyRate: 50,
    status: 'Maintenance',
    bookings: 52,
  },
  {
    id: 'FAC-004',
    name: 'Auditorium',
    capacity: 300,
    hourlyRate: 300,
    status: 'Available',
    bookings: 29,
  },
];

function initFacilityFilters() {
  const facilitySearch = document.getElementById('facilitySearch');
  const facilityStatusFilter = document.getElementById('facilityStatusFilter');

  if (facilitySearch) {
    facilitySearch.addEventListener('input', (event) => {
      facilityState.search = event.target.value;
      renderFacilitiesTable();
    });
  }

  if (facilityStatusFilter) {
    facilityStatusFilter.addEventListener('change', (event) => {
      facilityState.status = event.target.value;
      renderFacilitiesTable();
    });
  }
}

export function renderFacilitiesTable() {
  const tbody = document.getElementById('facilitiesTableBody');
  if (!tbody) return;

  const filtered = mockFacilities.filter((facility) => {
    const matchesSearch = [facility.id, facility.name, facility.status, facility.capacity, facility.hourlyRate, facility.bookings]
      .join(' ')
      .toLowerCase()
      .includes(facilityState.search.toLowerCase());

    const matchesStatus = facilityState.status === 'all' || facility.status === facilityState.status;
    return matchesSearch && matchesStatus;
  });

  tbody.innerHTML = filtered.map((facility) => `
      <tr class="table-row">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">${escapeHtml(facility.id)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(facility.name)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(facility.capacity)} people</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">$${escapeHtml(facility.hourlyRate)}/hr</td>
        <td class="px-6 py-4 whitespace-nowrap"><span class="${getStatusClass(facility.status)}">${escapeHtml(facility.status)}</span></td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(facility.bookings)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">
          <div class="flex flex-wrap gap-3">
            <button type="button" class="text-blue-600 transition hover:text-blue-800">Edit</button>
            <button type="button" class="text-rose-600 transition hover:text-rose-800">Delete</button>
          </div>
        </td>
      </tr>
    `).join('') || `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-sm text-slate-500">No facilities match the selected filters.</td>
      </tr>
    `;
}

export function initFacilityModal() {
  const addButton = document.getElementById('addFacilityBtn');
  const modal = document.getElementById('addFacilityModal');
  const closeButton = document.getElementById('closeFacilityModalBtn');
  const cancelButton = document.getElementById('cancelFacilityBtn');
  const saveButton = document.getElementById('saveFacilityBtn');

  if (!addButton || !modal) return;

  const closeFacilityModal = () => closeModal(modal);

  addButton.addEventListener('click', () => openModal(modal));
  closeButton?.addEventListener('click', closeFacilityModal);
  cancelButton?.addEventListener('click', closeFacilityModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeFacilityModal();
  });

  saveButton?.addEventListener('click', () => {
    const name = document.getElementById('newFacilityName')?.value.trim();
    const capacityValue = document.getElementById('newFacilityCapacity')?.value.trim();
    const hourlyRateValue = document.getElementById('newFacilityCost')?.value.trim();
    const status = document.getElementById('newFacilityStatus')?.value || 'Available';
    const capacity = Number.parseInt(capacityValue, 10);
    const hourlyRate = Number.parseInt(hourlyRateValue.replace(/[^\d]/g, ''), 10);

    if (!name || !capacityValue || !hourlyRateValue || Number.isNaN(capacity) || Number.isNaN(hourlyRate)) {
      window.alert('Enter a facility name, numeric capacity, and hourly cost before saving.');
      return;
    }

    mockFacilities.unshift({
      id: nextItemId('FAC', mockFacilities),
      name,
      capacity,
      hourlyRate,
      status,
      bookings: 0,
    });

    renderFacilitiesTable();
    modal.querySelectorAll('input').forEach((input) => {
      input.value = '';
    });
    closeFacilityModal();
  });
}

export function initFacilitiesPage() {
  if (!document.getElementById('facilitiesTableBody') && !document.getElementById('addFacilityBtn')) {
    return;
  }

  initFacilityFilters();
  initFacilityModal();
  renderFacilitiesTable();
}