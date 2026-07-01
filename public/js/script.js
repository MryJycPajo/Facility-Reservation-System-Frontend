function setMessage(element, text, color) {
  element.textContent = text;
  element.style.color = color;
}

function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  const passwordInput = document.getElementById('password');
  const togglePassword = document.getElementById('togglePassword');
  const loginMessage = document.getElementById('loginMessage');

 if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePassword.textContent = isHidden ? 'Hide' : 'Show';
  });
}

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('user_name').value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      setMessage(loginMessage, 'Please enter both username and password.', '#fcd34d');
      return;
    }

try {
  const response = await fetch('https://facility-reservation-system-backend.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: username, password })
  });

     const data = await response.json();

console.log("FULL RESPONSE:", data);
console.log("USER OBJECT:", data.user);

      if (!response.ok || !data.success) {
        setMessage(loginMessage, data.message || 'Incorrect username or password.', '#fca5a5');
        return;
      }

      setMessage(loginMessage, 'Login successful. Redirecting...', '#bbf7d0');

 const role = data.user.role.toLowerCase();

const fullName =
  data.user.user_fullname ||
  data.user.fullname ||
  data.user.name ||
  data.user.user_name;

localStorage.setItem('role', role);
localStorage.setItem('name', fullName);

console.log("ROLE:", role);
console.log("NAME:", fullName);

if (role === 'super admin') {
  window.location.href = '/dashboard.html';
}
else if (role === 'admin') {
  window.location.href = '/dashboard.html';
}
else if (role === 'collecting officer') {
  window.location.href = '/payment-collection.html';
}
else {
  setMessage(loginMessage, 'Unknown user role: ' + role, '#fca5a5');
}

    } catch (error) {
      setMessage(loginMessage, 'Unable to login. Try again later.', '#fca5a5');
    }
  });
}

document.addEventListener('DOMContentLoaded', initLoginForm);