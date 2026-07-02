const API_BASES = ['https://facility-reservation-system-backend.onrender.com'];
const ADDON_SELECTION_STORAGE_KEY = 'facilityAddonSelections';

function parseSelectedIds(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.map((item) => String(item).trim()).filter(Boolean)
        : [];
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
}

export function getAddonSelectionKey(reservationOrKey) {
  if (!reservationOrKey) return '';

  if (typeof reservationOrKey === 'string') return reservationOrKey.trim();

  return String(
    reservationOrKey.control_number ??
    reservationOrKey.res_id ??
    reservationOrKey.id ??
    ''
  ).trim();
}

export function loadAddonSelection(selectionKey) {
  const key = getAddonSelectionKey(selectionKey);
  if (!key) return [];

  try {
    const allSelections = JSON.parse(localStorage.getItem(ADDON_SELECTION_STORAGE_KEY) || '{}');
    return parseSelectedIds(allSelections[key]);
  } catch {
    return [];
  }
}

export function saveAddonSelection(selectionKey, selectedIds) {
  const key = getAddonSelectionKey(selectionKey);
  if (!key) return;

  try {
    const allSelections = JSON.parse(localStorage.getItem(ADDON_SELECTION_STORAGE_KEY) || '{}');
    allSelections[key] = Array.from(new Set(parseSelectedIds(selectedIds)));
    localStorage.setItem(ADDON_SELECTION_STORAGE_KEY, JSON.stringify(allSelections));
  } catch (error) {
    console.warn('Unable to persist add-on selection:', error);
  }
}

export function collectSelectedAddonIds(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];

  return Array.from(container.querySelectorAll('input[type="checkbox"][data-addon-id]'))
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => String(checkbox.dataset.addonId).trim())
    .filter(Boolean);
}

export function buildAddonChecklistHtml(addons, selectedIds = []) {
  const selected = new Set(parseSelectedIds(selectedIds));

  if (!Array.isArray(addons) || addons.length === 0) {
    return '<p class="text-sm text-slate-500">No active add-ons available.</p>';
  }

  return addons.map((addon) => {
    const addonId = String(addon.addon_id ?? addon.id ?? '').trim();
    const checked = selected.has(addonId) ? 'checked' : '';
    const rate = Number(addon.addon_rate) || 0;
    const unitType = addon.unit_type || 'Unit';

    return `
      <label class="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50">
        <input type="checkbox" data-addon-id="${addonId}" ${checked} class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-slate-900">${addon.addon_name ?? ''}</span>
          <span class="mt-1 block text-xs text-slate-500">${addon.description ?? ''}</span>
          <span class="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">${rate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${unitType}</span>
        </span>
      </label>
    `;
  }).join('');
}

export async function fetchAddonCatalog({ activeOnly = true } = {}) {
  let lastError = null;
  const query = activeOnly ? '?status=Active' : '';

  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}/api/addons${query}`);
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        lastError = new Error(text || `Request failed with status ${response.status}`);
        continue;
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Unable to load add-ons');
}