document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, go to dashboard
  if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form      = document.getElementById('signupForm');
  const errEl     = document.getElementById('errorMsg');
  const successEl = document.getElementById('successMsg');
  const signupBtn = document.getElementById('signupBtn');

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
    successEl.style.display = 'none';
  }

  function showSuccess(msg) {
    successEl.textContent = msg;
    successEl.style.display = 'block';
    errEl.style.display = 'none';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.style.display = 'none';
    successEl.style.display = 'none';

    const username        = document.getElementById('username').value.trim();
    const email           = document.getElementById('email').value.trim();
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Front-end validation
    if (!username || !email || !password || !confirmPassword) {
      showError('All fields are required.');
      return;
    }
    if (username.length < 3 || username.length > 20) {
      showError('Username must be between 3 and 20 characters.');
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
    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    signupBtn.textContent = 'Creating account...';
    signupBtn.disabled = true;

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Registration failed. Please try again.');
        return;
      }

      showSuccess('✅ Account created successfully! Redirecting to login...');
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);

    } catch (err) {
      showError('Network error. Please try again.');
    } finally {
      signupBtn.textContent = 'Create account';
      signupBtn.disabled = false;
    }
  });
});
