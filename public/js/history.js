import { escapeHtml } from './utils.js';

const API_BASE = 'http://localhost:3001';

async function fetchHistory() {
  const response = await fetch(`${API_BASE}/api/history`);

  if (!response.ok) {
    throw new Error('Failed to load history');
  }

  return await response.json();
}

function formatMoney(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return '—';

  const date = new Date(dateString);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getStatusBadge(status) {
  const value = String(status || '').toLowerCase();

  if (value === 'completed') {
    return `
      <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
        Completed
      </span>
    `;
  }

  if (value === 'cancelled') {
    return `
      <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
        Cancelled
      </span>
    `;
  }

  return `
    <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
      ${escapeHtml(status)}
    </span>
  `;
}

async function loadHistory() {
  const tbody = document.getElementById('historyTableBody');

  if (!tbody) return;

  try {
    const records = await fetchHistory();

    if (!Array.isArray(records) || records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-10 text-center text-slate-500">
            No history records found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = records.map(record => `
      <tr class="hover:bg-slate-50">
        <td class="px-6 py-4">
          ${escapeHtml(record.control_number || '—')}
        </td>

        <td class="px-6 py-4">
          ${escapeHtml(record.res_fullname || '—')}
        </td>

        <td class="px-6 py-4">
          ${escapeHtml(record.res_facility || '—')}
        </td>

        <td class="px-6 py-4">
          ${formatDate(record.date_of_use)}
        </td>

        <td class="px-6 py-4 font-medium">
          ${formatMoney(record.amount_paid)}
        </td>

        <td class="px-6 py-4">
          ${escapeHtml(record.collector_name || '—')}
        </td>

        <td class="px-6 py-4">
          ${getStatusBadge(record.display_status)}
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error(error);

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-10 text-center text-red-600">
          Failed to load history records.
        </td>
      </tr>
    `;
  }
}

export function initHistoryPage() {
  const tbody = document.getElementById('historyTableBody');
  const searchInput = document.getElementById('historySearch');

  if (!tbody) return;

  loadHistory();

  // ✅ SEARCH FEATURE (ADD HERE)
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const keyword = searchInput.value.toLowerCase();
      const rows = tbody.querySelectorAll('tr');

      rows.forEach(row => {
        const text = row.innerText.toLowerCase();

        if (text.includes(keyword)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', initHistoryPage);