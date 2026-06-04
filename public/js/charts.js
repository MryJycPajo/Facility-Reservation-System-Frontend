let trendChartInstance = null;

function getReservationDateKey(reservation) {
  const rawDate = reservation.reservation_date ?? reservation.date_of_use ?? reservation.date ?? '';

  if (!rawDate) return '';

  const stringValue = String(rawDate).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(stringValue)) {
    const [m, d, y] = stringValue.split('/');
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  if (stringValue.includes('T')) {
    const datePart = stringValue.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  }

  const parsed = new Date(stringValue);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

function buildMonthlyTrendData(reservations) {
  const today = new Date();
  const labels = [];
  const counts = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    labels.push(monthDate.toLocaleDateString('en-US', { month: 'short' }));

    const count = reservations.filter((reservation) => {
      const dateKey = getReservationDateKey(reservation);
      return dateKey.startsWith(monthKey);
    }).length;

    counts.push(count);
  }

  return { labels, counts };
}

export function renderOverviewCharts(reservations = []) {
  const trendContext = document.getElementById('trendChart');

  if (!trendContext || typeof Chart === 'undefined') {
    return;
  }

  const trendData = Array.isArray(reservations) && reservations.length > 0
    ? buildMonthlyTrendData(reservations)
    : buildMonthlyTrendData([]);

  if (trendChartInstance) {
    trendChartInstance.destroy();
  }

  trendChartInstance = new Chart(trendContext, {
    type: 'line',
    data: {
      labels: trendData.labels,
      datasets: [{
        label: 'Reservations',
        data: trendData.counts,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#2563eb',
        pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#cbd5e1',
          displayColors: false,
          padding: 12,
          cornerRadius: 10,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b' },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#e2e8f0' },
          ticks: { color: '#64748b' },
        },
      },
    },
  });
}