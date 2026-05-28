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

  if (key === 'confirmed') return 'status-badge status-confirmed';
  if (key === 'pending') return 'status-badge status-pending';
  if (key === 'cancelled') return 'status-badge status-cancelled';
  if (key === 'completed') return 'status-badge status-completed';
  if (key === 'available') return 'status-badge status-available';
  if (key === 'maintenance') return 'status-badge status-maintenance';
  if (key === 'active') return 'status-badge status-active';
  if (key === 'inactive') return 'status-badge status-inactive';

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