import { closeModal, escapeHtml, getStatusClass, openModal } from './utils.js';

const API_BASES = ['/api', 'http://localhost:3001/api'];

const addonState = {
  search: '',
  status: 'all',
};

async function requestJson(path, options = {}) {
  let lastError = null;

  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${path}`, options);

      if (response.ok) {
        return await response.json();
      }

      const text = await response.text().catch(() => '');
      lastError = new Error(text || `Request failed with status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error(`Unable to load ${path}`);
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

async function renderAddonsTable() {
  const tbody = document.getElementById('addonsTableBody');
  if (!tbody) return;

  try {
    const addons = await requestJson('/addons');
    const list = Array.isArray(addons) ? addons : [];

    const filtered = list.filter((addon) => {
      const matchesSearch = [
        addon.addon_id,
        addon.addon_name,
        addon.description,
       addon.addon_rate,
        addon.unit_type,
        addon.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(addonState.search.toLowerCase());

      const matchesStatus = addonState.status === 'all' || String(addon.status || '').trim() === addonState.status;

      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-10 text-center text-sm text-slate-500">No add-ons found.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((addon) => `
      <tr>
        <td class="px-6 py-4 font-semibold text-slate-700">${escapeHtml(addon.addon_name ?? '')}</td>
        <td class="px-6 py-4 text-slate-600">${escapeHtml(addon.description ?? '')}</td>
        <td class="px-6 py-4 text-slate-700">${escapeHtml(formatMoney(addon.addon_rate))}</td>
        <td class="px-6 py-4 text-slate-700">${escapeHtml(addon.unit_type ?? '')}</td>
        <td class="px-6 py-4">
          <span class="${getStatusClass(addon.status || '')}">${escapeHtml(addon.status || '')}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex gap-2">
            <button class="edit-addon inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition" data-id="${addon.addon_id}">Edit</button>
            <button class="delete-addon inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 transition" data-id="${addon.addon_id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-10 text-center text-sm text-rose-600">Unable to load add-ons.</td>
      </tr>
    `;
  }
}

function resetAddonForm() {
  const title = document.getElementById('addonModalTitle');
  if (title) title.textContent = 'Add New Add-on';

  const name = document.getElementById('newAddonName');
  const description = document.getElementById('newAddonDescription');
  const rate = document.getElementById('newAddonRate');
  const unitType = document.getElementById('newAddonUnitType');
  const status = document.getElementById('newAddonStatus');

  if (name) name.value = '';
  if (description) description.value = '';
  if (rate) rate.value = '';
  if (unitType) unitType.value = '';
  if (status) status.value = 'Active';

  window.editingAddonId = null;
}

function openAddonModal() {
  openModal(document.getElementById('addAddonModal'));
}

function closeAddonModal() {
  closeModal(document.getElementById('addAddonModal'));
  resetAddonForm();
}

async function saveAddon() {
  const addon_name = document.getElementById('newAddonName')?.value.trim();
  const description = document.getElementById('newAddonDescription')?.value.trim();
  const rate = document.getElementById('newAddonRate')?.value.trim();
  const unit_type = document.getElementById('newAddonUnitType')?.value;
 const status = (document.getElementById('newAddonStatus')?.value || 'active').toLowerCase();

  if (!addon_name || !rate || !unit_type) {
    alert('Complete all required fields');
    return;
  }

 const payload = {
  addon_name,
  description,
  addon_rate: Number(rate),   // ✔ FIX HERE
  unit_type,
  status,
};

  try {
    let response;

    if (window.editingAddonId) {
      response = await requestJson(`/addons/${window.editingAddonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      response = await requestJson('/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (response.success || response.addon_id) {
      alert('Saved successfully');
      closeAddonModal();
      await renderAddonsTable();
      return;
    }

    alert(response.message || 'Failed to save add-on');
  } catch (error) {
    console.error(error);
    alert('Server error');
  }
}

async function deleteAddon(id) {
  if (!confirm('Delete this add-on?')) return;

  try {
    await requestJson(`/addons/${id}`, {
      method: 'DELETE',
    });

    await renderAddonsTable();
  } catch (error) {
    console.error(error);
    alert('Failed to delete add-on');
  }
}

async function editAddon(id) {
  try {
    const addon = await requestJson(`/addons/${id}`);

    const title = document.getElementById('addonModalTitle');
    if (title) title.textContent = 'Edit Add-on';

    document.getElementById('newAddonName').value = addon.addon_name ?? '';
    document.getElementById('newAddonDescription').value = addon.description ?? '';
    document.getElementById('newAddonRate').value = addon.addon_rate ?? '';
    document.getElementById('newAddonUnitType').value = addon.unit_type ?? '';
    document.getElementById('newAddonStatus').value = addon.status ?? 'Active';

    window.editingAddonId = id;
    openAddonModal();
  } catch (error) {
    console.error(error);
    alert('Failed to load add-on');
  }
}

export function initFacilityAddonsPage() {
  if (!document.getElementById('addonsTableBody')) return;

  renderAddonsTable();

  const searchInput = document.getElementById('addonSearch');
  const statusFilter = document.getElementById('addonStatusFilter');
  const addButton = document.getElementById('addAddonBtn');
  const saveButton = document.getElementById('saveAddonBtn');
  const closeButton = document.getElementById('closeAddonModalBtn');
  const cancelButton = document.getElementById('cancelAddonBtn');
  const modal = document.getElementById('addAddonModal');

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      addonState.search = event.target.value;
      renderAddonsTable();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', (event) => {
      addonState.status = event.target.value;
      renderAddonsTable();
    });
  }

  addButton?.addEventListener('click', () => {
    resetAddonForm();
    openAddonModal();
  });

  saveButton?.addEventListener('click', saveAddon);
  closeButton?.addEventListener('click', closeAddonModal);
  cancelButton?.addEventListener('click', closeAddonModal);

  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeAddonModal();
  });

  document.removeEventListener('click', handleAddonClicks);
  document.addEventListener('click', handleAddonClicks);
}

function handleAddonClicks(event) {
  const editButton = event.target.closest('.edit-addon');
  if (editButton) {
    editAddon(editButton.dataset.id);
    return;
  }

  const deleteButton = event.target.closest('.delete-addon');
  if (deleteButton) {
    deleteAddon(deleteButton.dataset.id);
  }
}