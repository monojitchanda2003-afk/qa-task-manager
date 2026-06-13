document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, go to dashboard
  if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form    = document.getElementById('loginForm');
  const errEl   = document.getElementById('errorMsg');
  const loginBtn = document.getElementById('loginBtn');

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.style.display = 'none';

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Basic front-end validation
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    loginBtn.textContent = 'Signing in...';
    loginBtn.disabled = true;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Login failed. Please check your credentials.');
        return;
      }

      // Store real JWT token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard.html';

    } catch (err) {
      showError('Network error. Please try again.');
    } finally {
      loginBtn.textContent = 'Sign in';
      loginBtn.disabled = false;
    }
  });
});
