import { closeModal, escapeHtml, generatePassword, getStatusClass, openModal } from './utils.js';

const userState = {
  search: '',
  status: 'all',
};

function initUserFilters() {
  const userSearch = document.getElementById('userSearch');
  const userStatusFilter = document.getElementById('userStatusFilter');

  if (userSearch) {
    userSearch.addEventListener('input', (event) => {
      userState.search = event.target.value;
      renderUsersTable();
    });
  }

  if (userStatusFilter) {
    userStatusFilter.addEventListener('change', (event) => {
      userState.status = event.target.value;
      renderUsersTable();
    });
  }
}

export async function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('https://facility-reservation-system-backend.onrender.com/api/users');
    const users = await res.json();

    const filtered = users.filter((user) => {
      const matchesSearch = [
        user.user_fullname,
        user.user_name,
        user.user_type
      ]
        .join(' ')
        .toLowerCase()
        .includes(userState.search.toLowerCase());

      const matchesStatus =
        userState.status === 'all' || user.user_type === userState.status;

      return matchesSearch && matchesStatus;
    });

   tbody.innerHTML = filtered.map((user) => `
  <tr class="table-row">
    <td class="px-6 py-4">${escapeHtml(user.user_id)}</td>
    <td class="px-6 py-4">${escapeHtml(user.user_fullname)}</td>
    <td class="px-6 py-4">${escapeHtml(user.user_name)}</td>
    <td class="px-6 py-4">${escapeHtml(user.user_type)}</td>

    <!-- PASSWORD COLUMN (IBALIK NI) -->
    <td class="px-6 py-4">
      ${escapeHtml(user.password)}
    </td>

    <!-- ACTIONS COLUMN -->
    <td class="px-6 py-4">
      <div class="flex gap-2">
      <button class="edit-btn rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100" data-id="${user.user_id}">Edit</button>

<button class="delete-btn rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100" data-id="${user.user_id}">Delete</button>
      </div>
    </td>
  </tr>
`).join('');

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">Failed to load users</td>
      </tr>
    `;
  }
}

export function initUserModal() {
  const addButton = document.getElementById('addUserBtn');
  const modal = document.getElementById('addUserModal');
  const closeButton = document.getElementById('closeModalBtn');
  const cancelButton = document.getElementById('cancelUserBtn');
  const saveButton = document.getElementById('saveUserBtn');
  const generatePasswordButton = document.getElementById('generatePasswordBtn');
  const passwordInput = document.getElementById('newPassword');

  if (!addButton || !modal) return;

  const closeUserModal = () => {

  // reset edit mode
  window.editingUserId = null;

  // clear fields
  document.getElementById('newFullname').value = '';
  document.getElementById('newUsername').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('newUserType').value = 'User';

  closeModal(modal);
};

  addButton.addEventListener('click', () => {

  // sigurado nga Add mode
  window.editingUserId = null;

  document.getElementById('newFullname').value = '';
  document.getElementById('newUsername').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('newUserType').value = 'User';

  openModal(modal);

});
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

  saveButton?.addEventListener('click', async () => {
    const full_name = document.getElementById('newFullname')?.value.trim();
    const username = document.getElementById('newUsername')?.value.trim();
    const password = document.getElementById('newPassword')?.value.trim();
    const user_type = document.getElementById('newUserType')?.value || 'User';

   // IF ADD MODE
if (!window.editingUserId) {

  if (!full_name || !username || !password) {
    window.alert('Complete all fields first');
    return;
  }

} else {

  // IF EDIT MODE
  if (!full_name || !username) {
    window.alert('Complete all fields first');
    return;
  }

}

    try {

  let res;

  // EDIT EXISTING USER
  if (window.editingUserId) {

    res = await fetch(`https://facility-reservation-system-backend.onrender.com/api/users/${window.editingUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_fullname: full_name,
        user_name: username,
        user_type
      }),
    });

    window.editingUserId = null;

  } else {

    // ADD NEW USER
    res = await fetch('https://facility-reservation-system-backend.onrender.com/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_fullname: full_name,
        user_name: username,
        password,
        user_type
      }),
    });

  }

  const data = await res.json();

  if (data.success) {

    window.alert('User saved successfully');

    closeUserModal();

    renderUsersTable();

  } else {

    window.alert(data.message || 'Failed to save user');

  }

} catch (err) {

  console.error(err);

  window.alert('Server error');

}
  });
}

export function initUsersPage() {
  if (!document.getElementById('usersTableBody') && !document.getElementById('addUserBtn')) {
    return;
  }

  initUserFilters();

  // Clear search field
  const userSearch = document.getElementById('userSearch');

  if (userSearch) {
    userSearch.value = '';
    userState.search = '';
  }

  initUserModal();
  renderUsersTable();
}
async function deleteUser(id) {

  const confirmDelete = confirm("Are you sure you want to delete this user?");
  if (!confirmDelete) return;

  try {

    const res = await fetch(`https://facility-reservation-system-backend.onrender.com/api/users/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    console.log(data);

    if (data.success) {
      alert('User deleted successfully');
      renderUsersTable();
    } else {
      alert('Delete failed');
    }

  } catch (err) {
    console.error(err);
    alert('Server error');
  }
}

async function editUser(id) {

  const res = await fetch(`https://facility-reservation-system-backend.onrender.com/api/users/${id}`);
  const user = await res.json();

  window.editingUserId = id;

  document.getElementById('newFullname').value = user.user_fullname;
  document.getElementById('newUsername').value = user.user_name;
  document.getElementById('newUserType').value = user.user_type;

  openModal(document.getElementById('addUserModal'));

}
document.addEventListener('click', (e) => {

  const deleteBtn = e.target.closest('.delete-btn');
  if (deleteBtn) {
    deleteUser(deleteBtn.dataset.id);
  }

  const editBtn = e.target.closest('.edit-btn');
  if (editBtn) {
    editUser(editBtn.dataset.id);
  }

});