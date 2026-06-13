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

  // Look up the reset token in localStorage
  const resets = JSON.parse(localStorage.getItem('qa_resets') || '{}');
  const resetEntry = resets[token];

  if (!resetEntry || Date.now() > resetEntry.expiry) {
    errorMsg.textContent = 'Invalid or expired reset token. Please request a new reset link.';
    errorMsg.style.display = 'block';
    form.style.display = 'none';
    return;
  }

  form.addEventListener('submit', (e) => {
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

    // Update the user's password in qa_users
    const users = JSON.parse(localStorage.getItem('qa_users') || '[]');
    const userIndex = users.findIndex(u => u.email === resetEntry.email);

    if (userIndex === -1) {
      errorMsg.textContent = 'Account not found for this reset link.';
      errorMsg.style.display = 'block';
      btn.textContent = 'Reset password';
      btn.disabled = false;
      return;
    }

    users[userIndex].password = password;
    localStorage.setItem('qa_users', JSON.stringify(users));

    // Invalidate the used reset token
    delete resets[token];
    localStorage.setItem('qa_resets', JSON.stringify(resets));

    successMsg.textContent = 'Password reset successfully! Redirecting to login...';
    successMsg.style.display = 'block';

    setTimeout(() => { window.location.href = '/login.html'; }, 1500);
  });
});
