document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  const btn = document.getElementById('resetBtn');

  // Get token from URL: /reset-password.html?token=xxx
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    errorMsg.textContent = 'Invalid or missing reset token. Please request a new reset link.';
    errorMsg.style.display = 'block';
    form.style.display = 'none';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password.length < 6) {
      errorMsg.textContent = 'Password must be at least 6 characters.';
      errorMsg.style.display = 'block';
      return;
    }

    if (password !== confirmPassword) {
      errorMsg.textContent = 'Passwords do not match.';
      errorMsg.style.display = 'block';
      return;
    }

    btn.textContent = 'Resetting...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || 'Reset token is invalid or has expired. Please request a new one.';
        errorMsg.style.display = 'block';
        btn.textContent = 'Reset password';
        btn.disabled = false;
        return;
      }

      successMsg.textContent = 'Password reset successfully! Redirecting to login...';
      successMsg.style.display = 'block';

      setTimeout(() => { window.location.href = '/login.html'; }, 1500);

    } catch (err) {
      errorMsg.textContent = 'Network error. Please try again.';
      errorMsg.style.display = 'block';
      btn.textContent = 'Reset password';
      btn.disabled = false;
    }
  });
});
