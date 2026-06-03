export function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getStatusClass(status) {
  const key = String(status).toLowerCase();

  if (key === 'pending')
    return 'status-badge bg-yellow-100 text-yellow-700';

  if (key === 'approved')
    return 'status-badge bg-green-100 text-green-700';

  if (key === 'rejected')
    return 'status-badge bg-red-100 text-red-700';

  if (key === 'cancelled')
    return 'status-badge bg-gray-100 text-gray-700';

  if (key === 'available')
    return 'status-badge bg-green-100 text-green-700';

  if (key === 'maintenance')
    return 'status-badge bg-orange-100 text-orange-700';

  if (key === 'active')
    return 'status-badge bg-blue-100 text-blue-700';

  if (key === 'inactive')
    return 'status-badge bg-gray-100 text-gray-700';

  return 'status-badge bg-slate-100 text-slate-700';
}

export function openModal(modal) {
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

export function closeModal(modal) {
  if (!modal) return;

  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

export function nextItemId(prefix, items) {
  const highestNumber = items.reduce((currentMax, item) => {
    const match = String(item.id).match(/^(?:[A-Z]+-)(\d+)$/);
    if (!match) return currentMax;

    return Math.max(currentMax, Number.parseInt(match[1], 10));
  }, 0);

  return `${prefix}-${String(highestNumber + 1).padStart(3, '0')}`;
}

export function generatePassword(length = 12) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);

  return Array.from(values, (value) => charset[value % charset.length]).join('');
}