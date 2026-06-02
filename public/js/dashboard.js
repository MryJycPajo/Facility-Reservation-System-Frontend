import { renderOverviewCharts } from './charts.js';
import { initFacilitiesPage } from './facilities.js';
import { initReservationsPage } from './reservations.js';
import { initUsersPage } from './users.js';
import { loadDashboardStats } from './dashboardStats.js';
import { formatDate } from './utils.js';

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

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.body.classList.add('sidebar-open');
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }

  if (sidebarFooter && !sidebarFooter.querySelector('[data-logout-link]')) {
    const logoutLink = document.createElement('a');
    logoutLink.href = 'login.html';
    logoutLink.dataset.logoutLink = 'true';
    logoutLink.className = 'dashboard-logout mt-4';
    logoutLink.style.width = '100%';
    logoutLink.textContent = 'Logout';
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

  if (!saveButton || !settingsStatus) return;

  saveButton.addEventListener('click', () => {
    settingsStatus.textContent = 'Settings saved locally. Connect this action to your backend endpoint when ready.';
    settingsStatus.classList.remove('text-slate-500');
    settingsStatus.classList.add('text-emerald-600');
  });
}

export async function initPage() {
  setCurrentDate();
  setActiveNav();
  initSidebarControls();
  initSettingsAction();
  initReservationsPage();
  initFacilitiesPage();
  initUsersPage();

  if (document.body.dataset.page === 'dashboard') {
    const overviewData = await loadDashboardStats();
    renderOverviewCharts(overviewData?.reservations ?? []);
  }

  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    const titles = {
      dashboard: 'Dashboard Overview',
      reservations: 'Reservation Management',
      facilities: 'Facility Management',
      users: 'User Management',
      settings: 'System Settings',
    };

    pageTitle.textContent = titles[document.body.dataset.page] || pageTitle.textContent;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  void initPage();
});
