import { renderOverviewCharts } from './charts.js';
import { initFacilityAddonsPage } from './facilityAddons.js';
import { initFacilitiesPage } from './facilities.js';
import { initPaymentCollectionPage } from './paymentCollection.js';
import { initReservationsPage } from './reservations.js';
import { initUsersPage } from './users.js';
import { loadDashboardStats } from './dashboardStats.js';
import { formatDate, escapeHtml, getStatusClass } from './utils.js';

export function setCurrentDate() {
  const currentDate = document.getElementById('currentDate');
  if (currentDate) {
    currentDate.textContent = formatDate(new Date());
  }
}

export function setActiveNav() {
  const page = document.body.dataset.page;

  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.navLink === page);
  });
}

export function initSidebarControls() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const sidebarFooter = document.querySelector('#sidebar .border-t.border-slate-200.p-5');

  sidebarToggle?.addEventListener('click', () => {
    document.body.classList.add('sidebar-open');
  });

  sidebarBackdrop?.addEventListener('click', () => {
    document.body.classList.remove('sidebar-open');
  });

  if (sidebarFooter && !sidebarFooter.querySelector('[data-logout-link]')) {
    const logoutLink = document.createElement('a');
    logoutLink.href = 'login.html';
    logoutLink.textContent = 'Logout';
    logoutLink.className = 'dashboard-logout mt-4 block';
    logoutLink.dataset.logoutLink = 'true';
    sidebarFooter.appendChild(logoutLink);
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      document.body.classList.remove('sidebar-open');
    }
  });
}

export function initSettingsAction() {
  const saveButton = document.getElementById('saveSettingsButton');
  const settingsStatus = document.getElementById('settingsStatus');

  saveButton?.addEventListener('click', () => {
    if (!settingsStatus) return;

    settingsStatus.textContent =
      'Settings saved locally. Connect backend later.';
    settingsStatus.classList.remove('text-slate-500');
    settingsStatus.classList.add('text-emerald-600');
  });
}

function initPendingClick() {
  const card = document.getElementById('pendingRequestsCard');

  if (!card) return;

  card.addEventListener('click', () => {
    window.location.href = 'reservations.html?status=pending';
  });
}

async function loadPendingCount() {
  try {
    const res = await fetch('/api/dashboard/pending-count');
    const data = await res.json();

    const el = document.getElementById('pendingCount');
    if (el) {
      el.textContent = data.count ?? 0;
    }
  } catch (err) {
    console.error('Failed to load pending count:', err);
  }
}

export async function initPage() {

  const role = localStorage.getItem('role');

  console.log("CURRENT ROLE:", role);

  if (role === 'Admin') {

    document.getElementById('usersMenu')?.remove();
    document.getElementById('paymentMenu')?.remove();
    document.getElementById('facilityAddonsMenu')?.remove();

  }
  setCurrentDate();
  setActiveNav();
  initSidebarControls();
  initSettingsAction();

  initReservationsPage();
  initFacilitiesPage();
  initFacilityAddonsPage();
  initPaymentCollectionPage();
  initUsersPage();

  // IMPORTANT FEATURES
  initPendingClick();
  loadPendingCount();

  await loadPendingCount();

  if (document.body.dataset.page === 'dashboard') {
    const overviewData = await loadDashboardStats();
    renderOverviewCharts(overviewData?.reservations ?? []);

    try {
      const res = await fetch('/api/dashboard/recent-confirmed');
      const confirmed = await res.json();
      renderRecentConfirmedTable(Array.isArray(confirmed) ? confirmed : []);
    } catch (err) {
      console.error(err);
      renderRecentConfirmedTable([]);
    }
  }

  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    const titles = {
      dashboard: 'Dashboard Overview',
      reservations: 'Reservation Management',
      facilities: 'Facility Management',
      'facility-addons': 'Facility Add-ons Management',
      'payment-collection': 'Payment Collection',
      users: 'User Management',
      settings: 'System Settings',
    };

    pageTitle.textContent =
      titles[document.body.dataset.page] || pageTitle.textContent;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  void initPage();
});

function renderRecentConfirmedTable(items) {
  const tbody = document.getElementById('recentConfirmedTableBody');
  if (!tbody) return;

  if (!Array.isArray(items) || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-10 text-gray-500">
          No confirmed reservations found
        </td>
      </tr>
    `;
    return;
  }

  function parseToLocalDate(dateStr) {
    if (!dateStr) return null;

    const s = String(dateStr).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [m, d, y] = s.split('/').map(Number);
      return new Date(y, m - 1, d);
    }

    if (s.includes('T')) {
      const d = new Date(s);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    const parsed = new Date(s);
    return Number.isNaN(parsed.getTime())
      ? null
      : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  tbody.innerHTML = items.map((item) => {
    const dt = parseToLocalDate(item.date_of_use);
    const dateText = dt ? dt.toLocaleDateString() : '—';

    return `
      <tr>
        <td class="px-6 py-3 font-medium text-slate-700">
          ${escapeHtml(item.res_fullname || '')}
        </td>
        <td class="px-6 py-3 text-slate-600">
          ${escapeHtml(item.res_facility || '')}
        </td>
        <td class="px-6 py-3 text-slate-600">
          ${escapeHtml(dateText)}
        </td>
        <td class="px-6 py-3">
          <span class="${getStatusClass(item.status || '')}">
            ${escapeHtml(item.status || '')}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}