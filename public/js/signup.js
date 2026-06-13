document.addEventListener('DOMContentLoaded', () => {
  // Redirect to dashboard if already logged in
  if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
    return;
  }

  const form = document.getElementById('signupForm');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      errorMsg.textContent = 'Passwords do not match';
      errorMsg.style.display = 'block';
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || 'Signup failed';
        errorMsg.style.display = 'block';
        return;
      }

      successMsg.textContent = 'Account created successfully! Redirecting to login...';
      successMsg.style.display = 'block';

      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1200);
    } catch (err) {
      errorMsg.textContent = 'Network error. Please try again.';
      errorMsg.style.display = 'block';
    }
  });
});
