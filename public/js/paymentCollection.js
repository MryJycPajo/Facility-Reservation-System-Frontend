import { buildAddonChecklistHtml, collectSelectedAddonIds, fetchAddonCatalog, getAddonSelectionKey, loadAddonSelection, saveAddonSelection } from './addonUtils.js';
import { closeModal, escapeHtml, openModal } from './utils.js';

const API_BASES = ['http://localhost:3001'];
const PAYMENT_STORAGE_KEY = 'paymentCollectionRecords';

const paymentState = {
  reservations: [],
  facilities: [],
  addons: [],
  selectedReservation: null,
};

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function formatMoney(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

function parseMoney(value) {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const match = String(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatDisplayDate(value) {
  if (!value) return '—';

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? raw
    : parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}

function formatDisplayTime(value) {
  if (!value) return '—';

  const parts = String(value).split(':').map((part) => Number(part));
  const hour = parts[0] ?? 0;
  const minute = parts[1] ?? 0;
  const displayHour = hour % 12 || 12;
  const suffix = hour >= 12 ? 'PM' : 'AM';

  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function getReservationControlNumber(reservation) {
  return reservation.control_number ?? reservation.controlNo ?? reservation.control_number_no ?? '—';
}

function getReservationContact(reservation) {
  return reservation.contact ?? reservation.contact_number ?? reservation.res_contact ?? '—';
}

function getReservationFacilityName(reservation) {
  return reservation.res_facility ?? reservation.facility_name ?? reservation.facility ?? '—';
}

function getReservationAddonIds(reservation) {
  const values = [
    reservation.selected_addons,
    reservation.addon_ids,
    reservation.addon_ids_json,
    reservation.addons,
  ];

  for (const value of values) {
    if (!value) continue;

    if (Array.isArray(value)) {
      return value
        .map((item) => String(item.addon_id ?? item.id ?? item).trim())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item.addon_id ?? item.id ?? item).trim()).filter(Boolean);
        }
      } catch {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
      }
    }
  }

  return loadAddonSelection(getAddonSelectionKey(reservation));
}

function getSelectedAddonCatalog(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];

  const selectedIds = new Set(collectSelectedAddonIds(containerId));

  return paymentState.addons.filter((addon) => selectedIds.has(String(addon.addon_id)));
}

function calculateAddonTotalFromSelection(containerId) {
  return getSelectedAddonCatalog(containerId).reduce((sum, addon) => sum + (Number(addon.addon_rate) || 0), 0);
}

function renderPaymentAddonChecklist(reservation) {
  const container = document.getElementById('paymentAddonsList');
  if (!container) return;

  const selectedIds = getReservationAddonIds(reservation);
  container.innerHTML = buildAddonChecklistHtml(paymentState.addons, selectedIds);
}

function refreshPaymentTotals() {
  const facilityFee = getFacilityFee(paymentState.selectedReservation || {});
  const addonTotal = calculateAddonTotalFromSelection('paymentAddonsList');
  const totalDue = facilityFee + addonTotal;

  setTextValue('paymentFacilityFee', formatMoney(facilityFee));
  setTextValue('paymentAddonFeeTotal', formatMoney(addonTotal));
  setTextValue('paymentTotalDue', formatMoney(totalDue));
  setInputValue('paymentAmountPaid', totalDue.toFixed(2));
}

function getFacilityFee(reservation) {
  const facilityName = String(getReservationFacilityName(reservation)).trim().toLowerCase();
  const facility = paymentState.facilities.find((item) => String(item.fac_name || '').trim().toLowerCase() === facilityName);

  return parseMoney(facility?.fac_cost ?? facility?.facility_cost ?? facility?.amount ?? 0);
}

function extractAddonFees(reservation) {
  const candidateKeys = [
    'add_on_fees',
    'addon_fees',
    'add_on_fee',
    'addon_fee',
    'additional_fee',
    'additional_fees',
    'other_fee',
    'other_fees',
  ];

  const collected = [];

  for (const key of candidateKeys) {
    const value = reservation[key];
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (entry === undefined || entry === null || entry === '') return;

        if (typeof entry === 'object') {
          collected.push({
            label: entry.name ?? entry.label ?? `Add-on ${index + 1}`,
            amount: parseMoney(entry.amount ?? entry.fee ?? entry.value),
          });
          return;
        }

        collected.push({
          label: `Add-on ${index + 1}`,
          amount: parseMoney(entry),
        });
      });
      continue;
    }

    if (typeof value === 'object') {
      Object.entries(value).forEach(([label, amount]) => {
        collected.push({ label, amount: parseMoney(amount) });
      });
      continue;
    }

    collected.push({ label: key.replace(/_/g, ' '), amount: parseMoney(value) });
  }

  return collected.filter((item) => item.amount > 0 || String(item.label).trim().length > 0);
}

function getTotalAddonAmount(reservation) {
  return extractAddonFees(reservation).reduce((sum, item) => sum + item.amount, 0);
}

async function requestJson(path, options = {}) {
  let lastError = null;

  for (const base of API_BASES) {
    const url = `${base}${path}`;

    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return await response.json();
      }

      if (response.status !== 404) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Request failed with status ${response.status}`);
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error(`Unable to reach ${path}`);
}

function getPaymentModal() {
  return document.getElementById('paymentCollectionModal');
}

function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value ?? '';
}

function setTextValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderAddonFees(reservation) {
  const list = document.getElementById('paymentAddonFeesList');
  const total = document.getElementById('paymentAddonFeeTotal');

  if (!list || !total) return;

  const addonFees = extractAddonFees(reservation);
  const addonTotal = addonFees.reduce((sum, item) => sum + item.amount, 0);

  total.textContent = formatMoney(addonTotal);

  if (addonFees.length === 0) {
    list.innerHTML = '<p class="text-slate-500">No add-on fees available.</p>';
    return;
  }

  list.innerHTML = addonFees.map((fee) => `
    <div class="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
      <span class="truncate text-slate-600">${escapeHtml(String(fee.label))}</span>
      <span class="font-semibold text-slate-900">${escapeHtml(formatMoney(fee.amount))}</span>
    </div>
  `).join('');
}

function populatePaymentModal(reservation) {
  paymentState.selectedReservation = reservation;

  setInputValue('paymentReservationId', reservation.res_id ?? '');
  setInputValue('paymentControlNumber', getReservationControlNumber(reservation));
  setInputValue('paymentFullName', reservation.res_fullname ?? reservation.full_name ?? '');
  setInputValue('paymentContactNumber', getReservationContact(reservation));
  setInputValue('paymentFacilityName', getReservationFacilityName(reservation));
  setInputValue('paymentPurpose', reservation.purpose ?? '');
  setInputValue('paymentStatus', reservation.status ?? 'Approved for Payment');
  setInputValue('paymentDateOfUse', formatDisplayDate(reservation.date_of_use ?? reservation.reservation_date));
  setInputValue('paymentStartTime', formatDisplayTime(reservation.start_time));
  setInputValue('paymentEndTime', formatDisplayTime(reservation.end_time));

  renderPaymentAddonChecklist(reservation);
  refreshPaymentTotals();

  const today = new Date().toISOString().slice(0, 10);
  setInputValue('paymentDate', today);

  const collectorName = localStorage.getItem('name') || '';
  setInputValue('paymentCollectorName', collectorName);

  setInputValue('paymentReceiptNumber', '');
}

function openPaymentModal(reservation) {
  populatePaymentModal(reservation);
  openModal(getPaymentModal());
}

function closePaymentModal() {
  closeModal(getPaymentModal());
  paymentState.selectedReservation = null;
}

function storePaymentLocally(record) {
  try {
    const existing = JSON.parse(localStorage.getItem(PAYMENT_STORAGE_KEY) || '[]');
    const updated = Array.isArray(existing) ? [...existing, record] : [record];
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Unable to save payment locally:', error);
  }
}

async function savePaymentRecord(record) {
  try {
    await requestJson('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
  } catch (error) {
    console.warn('Payment API unavailable, saving locally instead:', error);
    storePaymentLocally(record);
  }
}

async function updateReservationStatus(reservation) {
  const updatedReservation = {
    ...reservation,
    status: 'Confirmed',
  };

  await requestJson(`/api/reservations/${reservation.res_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedReservation),
  });
}

async function loadPaymentCollectionData() {
  const tbody = document.getElementById('paymentCollectionTableBody');
  if (!tbody) return;

  try {
    const [reservations, facilities, addons] = await Promise.all([
  requestJson('/api/reservations'),
  requestJson('/api/facilities'),
  fetchAddonCatalog({ activeOnly: false }),
]);

paymentState.reservations = Array.isArray(reservations) ? reservations : [];
paymentState.facilities = Array.isArray(facilities) ? facilities : [];
paymentState.addons = Array.isArray(addons) ? addons : [];

    const approvedReservations = paymentState.reservations.filter((reservation) => normalizeStatus(reservation.status) === 'approved for payment');

    if (approvedReservations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="px-6 py-10 text-center text-sm text-slate-500">No reservations are currently approved for payment.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = approvedReservations.map((reservation) => `
      <tr>
        <td class="px-6 py-4 font-semibold text-slate-700">${escapeHtml(String(getReservationControlNumber(reservation)))}</td>
        <td class="px-6 py-4 text-slate-700">${escapeHtml(reservation.res_fullname ?? '')}</td>
        <td class="px-6 py-4 text-slate-700">${escapeHtml(String(getReservationContact(reservation)))}</td>
        <td class="px-6 py-4 text-slate-700">${escapeHtml(String(getReservationFacilityName(reservation)))}</td>
        <td class="px-6 py-4 text-slate-700">${escapeHtml(reservation.purpose ?? '')}</td>
        <td class="px-6 py-4 text-slate-700">${escapeHtml(formatDisplayDate(reservation.date_of_use ?? reservation.reservation_date))}</td>
        <td class="px-6 py-4 text-slate-700">${escapeHtml(formatDisplayTime(reservation.start_time))}</td>
        <td class="px-6 py-4 text-slate-700">${escapeHtml(formatDisplayTime(reservation.end_time))}</td>
        <td class="px-6 py-4"><span class="status-badge bg-sky-100 text-sky-700">Approved for Payment</span></td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button class="collect-payment-btn inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-200" data-id="${escapeHtml(String(reservation.res_id ?? ''))}">Collect Payment</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Failed to load payment collection data:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="px-6 py-10 text-center text-sm text-rose-600">Unable to load payment collection records.</td>
      </tr>
    `;
  }
}

async function confirmPayment() {
  if (!paymentState.selectedReservation) return;

  const receiptNumber = document.getElementById('paymentReceiptNumber')?.value.trim();
  const amountPaid = parseMoney(document.getElementById('paymentAmountPaid')?.value);
  const paymentDate = document.getElementById('paymentDate')?.value;
  const collectorName = document.getElementById('paymentCollectorName')?.value.trim();

  const addonIds = collectSelectedAddonIds('paymentAddonsList');
  const selectedAddons = paymentState.addons.filter((addon) => addonIds.includes(String(addon.addon_id)));
  const facilityFee = getFacilityFee(paymentState.selectedReservation);
  const addonTotal = selectedAddons.reduce((sum, addon) => sum + (Number(addon.addon_rate) || 0), 0);
  const totalDue = facilityFee + addonTotal;

  if (!receiptNumber || !paymentDate || !collectorName) {
    alert('Please complete the payment information fields.');
    return;
  }

  if (amountPaid < totalDue) {
    alert('Amount paid must be equal to or greater than the total amount due.');
    return;
  }

  const paymentRecord = {
    reservation_id: paymentState.selectedReservation.res_id,
    control_number: getReservationControlNumber(paymentState.selectedReservation),
    full_name: paymentState.selectedReservation.res_fullname ?? '',
    contact_number: getReservationContact(paymentState.selectedReservation),
    facility: getReservationFacilityName(paymentState.selectedReservation),
    purpose: paymentState.selectedReservation.purpose ?? '',
    date_of_use: paymentState.selectedReservation.date_of_use ?? paymentState.selectedReservation.reservation_date ?? '',
    start_time: paymentState.selectedReservation.start_time ?? '',
    end_time: paymentState.selectedReservation.end_time ?? '',
    facility_fee: facilityFee,
    addon_fee_total: addonTotal,
    total_amount_due: totalDue,
    selected_addons: selectedAddons,
    official_receipt_number: receiptNumber,
    amount_paid: amountPaid,
    payment_date: paymentDate,
    collector_name: collectorName,
    created_at: new Date().toISOString(),
  };

  await savePaymentRecord(paymentRecord);
  saveAddonSelection(paymentState.selectedReservation, addonIds);
  await updateReservationStatus(paymentState.selectedReservation);

  alert('Payment confirmed successfully.');
  closePaymentModal();
  await loadPaymentCollectionData();
}

function bindPaymentModalControls() {
  const modal = getPaymentModal();
  const closeBtn = document.getElementById('closePaymentModalBtn');
  const cancelBtn = document.getElementById('cancelPaymentBtn');
  const confirmBtn = document.getElementById('confirmPaymentBtn');

  if (modal && !modal.dataset.bound) {
    modal.dataset.bound = 'true';
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closePaymentModal();
    });
  }

  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = 'true';
    closeBtn.addEventListener('click', closePaymentModal);
  }

  if (cancelBtn && !cancelBtn.dataset.bound) {
    cancelBtn.dataset.bound = 'true';
    cancelBtn.addEventListener('click', closePaymentModal);
  }

  if (confirmBtn && !confirmBtn.dataset.bound) {
    confirmBtn.dataset.bound = 'true';
    confirmBtn.addEventListener('click', () => {
      void confirmPayment();
    });
  }

  if (modal && !modal.dataset.addonChangeBound) {
    modal.dataset.addonChangeBound = 'true';
    modal.addEventListener('change', (event) => {
      if (event.target.closest('#paymentAddonsList')) {
        refreshPaymentTotals();
      }
    });
  }

  if (!window.__paymentModalEscapeBound) {
    window.__paymentModalEscapeBound = true;
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePaymentModal();
    });
  }
}

function handlePaymentClicks(event) {
  const button = event.target.closest('.collect-payment-btn');
  if (!button) return;

  const reservation = paymentState.reservations.find((item) => String(item.res_id) === String(button.dataset.id));
  if (!reservation) return;

  openPaymentModal(reservation);
}

export function initPaymentCollectionPage() {
  if (!document.getElementById('paymentCollectionTableBody')) return;

  loadPaymentCollectionData();
  bindPaymentModalControls();

  document.removeEventListener('click', handlePaymentClicks);
  document.addEventListener('click', handlePaymentClicks);

  const paymentDate = document.getElementById('paymentDate');
  if (paymentDate && !paymentDate.value) {
    paymentDate.value = new Date().toISOString().slice(0, 10);
  }

  // AUTO FILL COLLECTOR NAME
 const collectorInput = document.getElementById('paymentCollectorName');

if (collectorInput) {
  collectorInput.value = localStorage.getItem('name') || '';
  collectorInput.readOnly = true;
}
}