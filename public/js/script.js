document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const user_name = document.getElementById('user_name').value;
  const password = document.getElementById('password').value;
  const message = document.getElementById('loginMessage');

  try {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_name, password })
    });

    const data = await res.json();

   if (res.ok) {
  message.style.color = 'green';
  message.textContent = 'Login successful';

  localStorage.setItem(
    'user',
    JSON.stringify(data.user)
  );

  window.location.href = 'dashboard.html';
} else {
      message.style.color = 'red';
      message.textContent = data.message || 'Invalid credentials';
    }

  } catch (err) {
    console.error(err);
    message.style.color = 'red';
    message.textContent = 'Server error';
  }
});