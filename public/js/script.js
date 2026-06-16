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
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: username, password })
      });

     const data = await response.json();

console.log("FULL RESPONSE:", data);

      if (!response.ok || !data.success) {
        setMessage(loginMessage, data.message || 'Incorrect username or password.', '#fca5a5');
        return;
      }

      setMessage(loginMessage, 'Login successful. Redirecting...', '#bbf7d0');

     localStorage.setItem('role', data.user.role);
      localStorage.setItem('name', data.user.name);

      // ✅ ROLE REDIRECT
const role = data.user.role.toLowerCase();

console.log("ROLE:", role);

localStorage.setItem('role', role);
localStorage.setItem('name', data.user.name);

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