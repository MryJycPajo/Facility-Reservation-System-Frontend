async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

function formatCurrency(v) {
  return '$' + (v / 1000 >= 1 ? (v / 1000).toFixed(1) + 'K' : v);
}

async function initDashboard() {
  const totalReservationsEl = document.getElementById('totalReservations');
  if (!totalReservationsEl) {
    return;
  }

  try {
    const [ov, trends, rev, status] = await Promise.all([
      fetchJson('/api/overview'),
      fetchJson('/api/trends'),
      fetchJson('/api/revenue'),
      fetchJson('/api/status')
    ]);

    totalReservationsEl.textContent = ov.totalReservations;
    document.getElementById('activeFacilities').textContent = ov.activeFacilities;
    document.getElementById('totalUsers').textContent = ov.totalUsers.toLocaleString();
    document.getElementById('revenueMTD').textContent = formatCurrency(ov.revenueMTD);

    document.getElementById('quickCompleted').textContent = ov.quickStats.completed;
    document.getElementById('quickPending').textContent = ov.quickStats.pending;
    document.getElementById('quickConfirmed').textContent = ov.quickStats.confirmed;
    document.getElementById('quickCancelled').textContent = ov.quickStats.cancelled;

    const ctx1 = document.getElementById('reservationsChart').getContext('2d');
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: trends.months,
        datasets: [{
          label: 'reservations',
          data: trends.reservations,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.06)',
          tension: 0.3,
          fill: true
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const ctx2 = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: rev.months,
        datasets: [{
          label: 'revenue',
          data: rev.revenue,
          backgroundColor: '#10b981'
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const ctx3 = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx3, {
      type: 'pie',
      data: {
        labels: status.labels,
        datasets: [{
          data: status.counts,
          backgroundColor: ['#6366f1', '#f59e0b', '#34d399', '#ef4444']
        }]
      },
      options: { responsive: true }
    });

  } catch (err) {
    console.error(err);
  }
}

function initSignupForm() {
  const signupForm = document.getElementById('signupForm');
  if (!signupForm) {
    return;
  }

  const formMessage = document.getElementById('formMessage');

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const emailAddress = document.getElementById('emailAddress').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!fullName || !emailAddress || !username || !password || !confirmPassword) {
      formMessage.textContent = 'Please complete all required fields.';
      formMessage.style.color = '#fcd34d';
      return;
    }

    if (password.length < 8) {
      formMessage.textContent = 'Password must be at least 8 characters long.';
      formMessage.style.color = '#fcd34d';
      return;
    }

    if (password !== confirmPassword) {
      formMessage.textContent = 'Passwords do not match.';
      formMessage.style.color = '#fca5a5';
      return;
    }

    formMessage.textContent = 'Account details look good. Connect this form to your backend signup endpoint next.';
    formMessage.style.color = '#bbf7d0';
    signupForm.reset();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  initSignupForm();
});
