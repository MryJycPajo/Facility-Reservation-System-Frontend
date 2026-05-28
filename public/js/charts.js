export const mockReservationData = [
  { month: 'Jan', reservations: 45, revenue: 12500 },
  { month: 'Feb', reservations: 52, revenue: 14200 },
  { month: 'Mar', reservations: 61, revenue: 16800 },
  { month: 'Apr', reservations: 58, revenue: 15900 },
  { month: 'May', reservations: 73, revenue: 19500 },
];

export const mockStatusData = [
  { name: 'Confirmed', value: 156 },
  { name: 'Pending', value: 42 },
  { name: 'Completed', value: 231 },
  { name: 'Cancelled', value: 18 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function renderOverviewCharts() {
  const trendContext = document.getElementById('trendChart');
  const revenueContext = document.getElementById('revenueChart');
  const statusContext = document.getElementById('statusChart');

  if (!trendContext || !revenueContext || !statusContext || typeof Chart === 'undefined') {
    return;
  }

  new Chart(trendContext, {
    type: 'line',
    data: {
      labels: mockReservationData.map((item) => item.month),
      datasets: [{
        label: 'Reservations',
        data: mockReservationData.map((item) => item.reservations),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.10)',
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

  new Chart(revenueContext, {
    type: 'bar',
    data: {
      labels: mockReservationData.map((item) => item.month),
      datasets: [{
        label: 'Revenue',
        data: mockReservationData.map((item) => item.revenue),
        backgroundColor: '#0ea5e9',
        borderRadius: 10,
        borderSkipped: false,
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
          callbacks: {
            label(context) {
              return `Revenue: $${context.raw.toLocaleString()}`;
            },
          },
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
          ticks: {
            color: '#64748b',
            callback(value) {
              return `$${(Number(value) / 1000).toFixed(0)}k`;
            },
          },
        },
      },
    },
  });

  new Chart(statusContext, {
    type: 'pie',
    data: {
      labels: mockStatusData.map((item) => item.name),
      datasets: [{
        data: mockStatusData.map((item) => item.value),
        backgroundColor: COLORS,
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 6,
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
    },
  });
}