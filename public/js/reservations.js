async function fetchReservations() {
  const res = await fetch('http://localhost:3001/api/reservations');
  return await res.json();
}
export async function renderReservationsTable() {
  const tbody = document.getElementById('reservationsTableBody');
  if (!tbody) return;

  let reservations = [];

  try {
    reservations = await fetchReservations();
    if (!Array.isArray(reservations)) reservations = [];
  } catch (err) {
    console.error(err);
    reservations = [];
  }

  const filtered = reservations.filter((reservation) => {
    const matchesSearch = [
      reservation.reservation_id,
      reservation.fac_name,
      reservation.user_fullname,
      reservation.reservation_date,
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

  tbody.innerHTML = filtered.map((reservation) => `
    <tr class="table-row">

      <td class="px-6 py-4 text-sm font-semibold">
        ${escapeHtml(reservation.reservation_id)}
      </td>

      <td class="px-6 py-4 text-sm">
        ${escapeHtml(reservation.fac_name)}
      </td>

      <td class="px-6 py-4 text-sm">
        ${escapeHtml(reservation.user_fullname)}
      </td>

      <td class="px-6 py-4 text-sm">
        ${escapeHtml(reservation.reservation_date)}
      </td>

      <td class="px-6 py-4 text-sm">
        ${escapeHtml(`${reservation.start_time} - ${reservation.end_time}`)}
      </td>

      <td class="px-6 py-4">
        <span class="${getStatusClass(reservation.status)}">
          ${escapeHtml(reservation.status)}
        </span>
      </td>

    </tr>
  `).join('') || `
    <tr>
      <td colspan="6" class="text-center py-10 text-gray-500">
        No reservations found
      </td>
    </tr>
  `;
}
export function initReservationsPage() {
  renderReservationsTable();
}