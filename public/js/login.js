document.addEventListener('DOMContentLoaded', () => {
  // Redirect to dashboard if already logged in
  if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const errorMsg = document.getElementById('errorMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || 'Login failed';
        errorMsg.style.display = 'block';
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      window.location.href = '/dashboard.html';
    } catch (err) {
      errorMsg.textContent = 'Network error. Please try again.';
      errorMsg.style.display = 'block';
    }
  });
});
