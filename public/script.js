function setMessage(element, text, color) {
  element.textContent = text;
  element.style.color = color;
}

function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) {
    return;
  }

  const passwordInput = document.getElementById('password');
  const togglePassword = document.getElementById('togglePassword');
  const loginMessage = document.getElementById('loginMessage');

  togglePassword.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePassword.textContent = isHidden ? 'Hide' : 'Show';
    togglePassword.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      setMessage(loginMessage, 'Please enter both username and password.', '#fcd34d');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(loginMessage, data.message || 'Incorrect username or password.', '#fca5a5');
        return;
      }

      setMessage(loginMessage, 'Login successful. Redirecting to dashboard...', '#bbf7d0');
      window.location.href = '/dashboard.html';
    } catch (error) {
      setMessage(loginMessage, 'Unable to log in right now. Please try again.', '#fca5a5');
    }
  });
}

document.addEventListener('DOMContentLoaded', initLoginForm);