(function () {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const mockReservationData = [
    { month: 'Jan', reservations: 45, revenue: 12500 },
    { month: 'Feb', reservations: 52, revenue: 14200 },
    { month: 'Mar', reservations: 61, revenue: 16800 },
    { month: 'Apr', reservations: 58, revenue: 15900 },
    { month: 'May', reservations: 73, revenue: 19500 },
  ];

  const mockStatusData = [
    { name: 'Confirmed', value: 156 },
    { name: 'Pending', value: 42 },
    { name: 'Completed', value: 231 },
    { name: 'Cancelled', value: 18 },
  ];

  const mockReservations = [
    {
      id: 'RES-001',
      facility: 'Conference Room A',
      user: 'John Smith',
      date: '2026-05-22',
      time: '09:00 - 11:00',
      status: 'Confirmed',
    },
    {
      id: 'RES-002',
      facility: 'Sports Hall',
      user: 'Emma Wilson',
      date: '2026-05-23',
      time: '14:00 - 16:00',
      status: 'Pending',
    },
    {
      id: 'RES-003',
      facility: 'Meeting Room B',
      user: 'Michael Brown',
      date: '2026-05-24',
      time: '10:00 - 12:00',
      status: 'Confirmed',
    },
    {
      id: 'RES-004',
      facility: 'Auditorium',
      user: 'Sarah Davis',
      date: '2026-05-25',
      time: '15:00 - 17:00',
      status: 'Cancelled',
    },
  ];

  const mockFacilities = [
    {
      id: 'FAC-001',
      name: 'Conference Room A',
      capacity: 20,
      hourlyRate: 75,
      status: 'Available',
      bookings: 45,
    },
    {
      id: 'FAC-002',
      name: 'Sports Hall',
      capacity: 100,
      hourlyRate: 150,
      status: 'Available',
      bookings: 38,
    },
    {
      id: 'FAC-003',
      name: 'Meeting Room B',
      capacity: 12,
      hourlyRate: 50,
      status: 'Maintenance',
      bookings: 52,
    },
    {
      id: 'FAC-004',
      name: 'Auditorium',
      capacity: 300,
      hourlyRate: 300,
      status: 'Available',
      bookings: 29,
    },
  ];

  const mockUsers = [
    { id: 'USR-001', name: 'John Smith', email: 'john@example.com', reservations: 12, status: 'Active' },
    { id: 'USR-002', name: 'Emma Wilson', email: 'emma@example.com', reservations: 8, status: 'Active' },
    { id: 'USR-003', name: 'Michael Brown', email: 'michael@example.com', reservations: 15, status: 'Active' },
    { id: 'USR-004', name: 'Sarah Davis', email: 'sarah@example.com', reservations: 5, status: 'Inactive' },
  ];

  const appState = {
    reservationSearch: '',
    reservationStatus: 'all',
    facilitySearch: '',
    facilityStatus: 'all',
    userSearch: '',
    userStatus: 'all',
  };

  const charts = [];

  function formatDate(value) {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getStatusClass(status) {
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

  function setCurrentDate() {
    const currentDate = document.getElementById('currentDate');

    if (currentDate) {
      currentDate.textContent = formatDate(new Date());
    }
  }

  function setActiveNav() {
    const page = document.body.dataset.page;

    document.querySelectorAll('[data-nav-link]').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.navLink === page);
    });
  }

  function initSidebarControls() {
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

  function openModal(modal) {
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function nextItemId(prefix, items) {
    const highestNumber = items.reduce((currentMax, item) => {
      const match = String(item.id).match(/^(?:[A-Z]+-)(\d+)$/);
      if (!match) return currentMax;

      return Math.max(currentMax, Number.parseInt(match[1], 10));
    }, 0);

    return `${prefix}-${String(highestNumber + 1).padStart(3, '0')}`;
  }

  function generatePassword(length = 12) {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);

    return Array.from(values, (value) => charset[value % charset.length]).join('');
  }

  function initReservationModal() {
    const addButton = document.getElementById('addReservationBtn');
    const modal = document.getElementById('addReservationModal');
    const closeButton = document.getElementById('closeReservationModalBtn');
    const cancelButton = document.getElementById('cancelReservationBtn');
    const saveButton = document.getElementById('saveReservationBtn');

    if (!addButton || !modal) return;

    const openReservationModal = () => openModal(modal);
    const closeReservationModal = () => closeModal(modal);

    addButton.addEventListener('click', openReservationModal);
    closeButton?.addEventListener('click', closeReservationModal);
    cancelButton?.addEventListener('click', closeReservationModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeReservationModal();
    });

    saveButton?.addEventListener('click', () => {
      const user = document.getElementById('newResName')?.value.trim();
      const facility = document.getElementById('newResFacility')?.value;
      const date = document.getElementById('newResDate')?.value;
      const startTime = document.getElementById('newResStart')?.value;
      const endTime = document.getElementById('newResEnd')?.value;
      const status = document.getElementById('newResStatus')?.value || 'Pending';

      if (!user || !facility || !date || !startTime || !endTime) {
        window.alert('Please complete all reservation fields before saving.');
        return;
      }

      mockReservations.unshift({
        id: nextItemId('RES', mockReservations),
        facility,
        user,
        date,
        time: `${startTime} - ${endTime}`,
        status,
      });

      renderReservationsTable();
      modal.querySelectorAll('input').forEach((input) => {
        input.value = '';
      });
      closeReservationModal();
    });
  }

  function initFacilityModal() {
    const addButton = document.getElementById('addFacilityBtn');
    const modal = document.getElementById('addFacilityModal');
    const closeButton = document.getElementById('closeFacilityModalBtn');
    const cancelButton = document.getElementById('cancelFacilityBtn');
    const saveButton = document.getElementById('saveFacilityBtn');

    if (!addButton || !modal) return;

    const openFacilityModal = () => openModal(modal);
    const closeFacilityModal = () => closeModal(modal);

    addButton.addEventListener('click', openFacilityModal);
    closeButton?.addEventListener('click', closeFacilityModal);
    cancelButton?.addEventListener('click', closeFacilityModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeFacilityModal();
    });

    saveButton?.addEventListener('click', () => {
      const name = document.getElementById('newFacilityName')?.value.trim();
      const capacityValue = document.getElementById('newFacilityCapacity')?.value.trim();
      const hourlyRateValue = document.getElementById('newFacilityCost')?.value.trim();
      const status = document.getElementById('newFacilityStatus')?.value || 'Available';
      const capacity = Number.parseInt(capacityValue, 10);
      const hourlyRate = Number.parseInt(hourlyRateValue.replace(/[^\d]/g, ''), 10);

      if (!name || !capacityValue || !hourlyRateValue || Number.isNaN(capacity) || Number.isNaN(hourlyRate)) {
        window.alert('Enter a facility name, numeric capacity, and hourly cost before saving.');
        return;
      }

      mockFacilities.unshift({
        id: nextItemId('FAC', mockFacilities),
        name,
        capacity,
        hourlyRate,
        status,
        bookings: 0,
      });

      renderFacilitiesTable();
      modal.querySelectorAll('input').forEach((input) => {
        input.value = '';
      });
      closeFacilityModal();
    });
  }

  function initUserModal() {
    const addButton = document.getElementById('addUserBtn');
    const modal = document.getElementById('addUserModal');
    const closeButton = document.getElementById('closeModalBtn');
    const cancelButton = document.getElementById('cancelUserBtn');
    const saveButton = document.getElementById('saveUserBtn');
    const generatePasswordButton = document.getElementById('generatePasswordBtn');
    const passwordInput = document.getElementById('newPassword');

    if (!addButton || !modal) return;

    const openUserModal = () => openModal(modal);
    const closeUserModal = () => closeModal(modal);

    addButton.addEventListener('click', openUserModal);
    closeButton?.addEventListener('click', closeUserModal);
    cancelButton?.addEventListener('click', closeUserModal);
    generatePasswordButton?.addEventListener('click', () => {
      if (!passwordInput) return;

      passwordInput.type = 'text';
      passwordInput.value = generatePassword();
      passwordInput.focus();
      passwordInput.select();
    });
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeUserModal();
    });

    saveButton?.addEventListener('click', () => {
      const name = document.getElementById('newFullname')?.value.trim();
      const username = document.getElementById('newUsername')?.value.trim();
      const password = document.getElementById('newPassword')?.value.trim();
      const userType = document.getElementById('newUserType')?.value || 'User';

      if (!name || !username || !password) {
        window.alert('Enter a full name, username, and password before saving.');
        return;
      }

      mockUsers.unshift({
        id: nextItemId('USR', mockUsers),
        name,
        email: `${username}@example.com`,
        reservations: 0,
        status: userType === 'Admin' ? 'Active' : 'Active',
      });

      renderUsersTable();
      modal.querySelectorAll('input').forEach((input) => {
        input.value = '';
      });
      closeUserModal();
    });
  }

  function renderReservationsTable() {
    const tbody = document.getElementById('reservationsTableBody');
    if (!tbody) return;

    const filtered = mockReservations.filter((reservation) => {
      const matchesSearch = [reservation.id, reservation.facility, reservation.user, reservation.date, reservation.time, reservation.status]
        .join(' ')
        .toLowerCase()
        .includes(appState.reservationSearch.toLowerCase());

      const matchesStatus = appState.reservationStatus === 'all' || reservation.status === appState.reservationStatus;
      return matchesSearch && matchesStatus;
    });

    tbody.innerHTML = filtered.map((reservation) => `
      <tr class="table-row">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">${escapeHtml(reservation.id)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(reservation.facility)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(reservation.user)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(reservation.date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(reservation.time)}</td>
        <td class="px-6 py-4 whitespace-nowrap"><span class="${getStatusClass(reservation.status)}">${escapeHtml(reservation.status)}</span></td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">
          <div class="flex flex-wrap gap-3">
            <button type="button" class="text-blue-600 transition hover:text-blue-800">Edit</button>
            <button type="button" class="text-rose-600 transition hover:text-rose-800">Cancel</button>
          </div>
        </td>
      </tr>
    `).join('') || `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-sm text-slate-500">No reservations match the selected filters.</td>
      </tr>
    `;
  }

  function renderFacilitiesTable() {
    const tbody = document.getElementById('facilitiesTableBody');
    if (!tbody) return;

    const filtered = mockFacilities.filter((facility) => {
      const matchesSearch = [facility.id, facility.name, facility.status, facility.capacity, facility.hourlyRate, facility.bookings]
        .join(' ')
        .toLowerCase()
        .includes(appState.facilitySearch.toLowerCase());

      const matchesStatus = appState.facilityStatus === 'all' || facility.status === appState.facilityStatus;
      return matchesSearch && matchesStatus;
    });

    tbody.innerHTML = filtered.map((facility) => `
      <tr class="table-row">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">${escapeHtml(facility.id)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(facility.name)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(facility.capacity)} people</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">$${escapeHtml(facility.hourlyRate)}/hr</td>
        <td class="px-6 py-4 whitespace-nowrap"><span class="${getStatusClass(facility.status)}">${escapeHtml(facility.status)}</span></td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(facility.bookings)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">
          <div class="flex flex-wrap gap-3">
            <button type="button" class="text-blue-600 transition hover:text-blue-800">Edit</button>
            <button type="button" class="text-rose-600 transition hover:text-rose-800">Delete</button>
          </div>
        </td>
      </tr>
    `).join('') || `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-sm text-slate-500">No facilities match the selected filters.</td>
      </tr>
    `;
  }

  function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const filtered = mockUsers.filter((user) => {
      const matchesSearch = [user.id, user.name, user.email, user.reservations, user.status]
        .join(' ')
        .toLowerCase()
        .includes(appState.userSearch.toLowerCase());

      const matchesStatus = appState.userStatus === 'all' || user.status === appState.userStatus;
      return matchesSearch && matchesStatus;
    });

    tbody.innerHTML = filtered.map((user) => `
      <tr class="table-row">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">${escapeHtml(user.id)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(user.name)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(user.email)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${escapeHtml(user.reservations)}</td>
        <td class="px-6 py-4 whitespace-nowrap"><span class="${getStatusClass(user.status)}">${escapeHtml(user.status)}</span></td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">
          <div class="flex flex-wrap gap-3">
            <button type="button" class="text-blue-600 transition hover:text-blue-800">Edit</button>
            <button type="button" class="text-rose-600 transition hover:text-rose-800">Deactivate</button>
          </div>
        </td>
      </tr>
    `).join('') || `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center text-sm text-slate-500">No users match the selected filters.</td>
      </tr>
    `;
  }

  function renderOverviewCharts() {
    const trendContext = document.getElementById('trendChart');
    const revenueContext = document.getElementById('revenueChart');
    const statusContext = document.getElementById('statusChart');

    if (!trendContext || !revenueContext || !statusContext || typeof Chart === 'undefined') {
      return;
    }

    const trendChart = new Chart(trendContext, {
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

    const revenueChart = new Chart(revenueContext, {
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

    const statusChart = new Chart(statusContext, {
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

    charts.push(trendChart, revenueChart, statusChart);
  }

  function initFilters() {
    const reservationSearch = document.getElementById('reservationSearch');
    const reservationStatusFilter = document.getElementById('reservationStatusFilter');
    const facilitySearch = document.getElementById('facilitySearch');
    const facilityStatusFilter = document.getElementById('facilityStatusFilter');
    const userSearch = document.getElementById('userSearch');
    const userStatusFilter = document.getElementById('userStatusFilter');

    if (reservationSearch) {
      reservationSearch.addEventListener('input', (event) => {
        appState.reservationSearch = event.target.value;
        renderReservationsTable();
      });
    }

    if (reservationStatusFilter) {
      reservationStatusFilter.addEventListener('change', (event) => {
        appState.reservationStatus = event.target.value;
        renderReservationsTable();
      });
    }

    if (facilitySearch) {
      facilitySearch.addEventListener('input', (event) => {
        appState.facilitySearch = event.target.value;
        renderFacilitiesTable();
      });
    }

    if (facilityStatusFilter) {
      facilityStatusFilter.addEventListener('change', (event) => {
        appState.facilityStatus = event.target.value;
        renderFacilitiesTable();
      });
    }

    if (userSearch) {
      userSearch.addEventListener('input', (event) => {
        appState.userSearch = event.target.value;
        renderUsersTable();
      });
    }

    if (userStatusFilter) {
      userStatusFilter.addEventListener('change', (event) => {
        appState.userStatus = event.target.value;
        renderUsersTable();
      });
    }
  }

  function initSettingsAction() {
    const saveButton = document.getElementById('saveSettingsButton');
    const settingsStatus = document.getElementById('settingsStatus');

    if (!saveButton || !settingsStatus) return;

    saveButton.addEventListener('click', () => {
      settingsStatus.textContent = 'Settings saved locally. Connect this action to your backend endpoint when ready.';
      settingsStatus.classList.remove('text-slate-500');
      settingsStatus.classList.add('text-emerald-600');
    });
  }

  function initPage() {
    setCurrentDate();
    setActiveNav();
    initSidebarControls();
    initFilters();
    initSettingsAction();
    initReservationModal();
    initFacilityModal();
    initUserModal();

    if (document.getElementById('reservationsTableBody')) renderReservationsTable();
    if (document.getElementById('facilitiesTableBody')) renderFacilitiesTable();
    if (document.getElementById('usersTableBody')) renderUsersTable();
    if (document.getElementById('trendChart')) renderOverviewCharts();

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

  document.addEventListener('DOMContentLoaded', initPage);
})();