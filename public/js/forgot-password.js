document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgotForm');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  const btn = document.getElementById('forgotBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    const email = document.getElementById('email').value.trim();
    if (!email) {
      errorMsg.textContent = 'Please enter your email address.';
      errorMsg.style.display = 'block';
      return;
    }

    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || 'Something went wrong.';
        errorMsg.style.display = 'block';
      } else {
        successMsg.textContent = data.message || 'Reset link sent! Check your email inbox.';
        successMsg.style.display = 'block';
        form.reset();
      }
    } catch (err) {
      errorMsg.textContent = 'Network error. Please try again.';
      errorMsg.style.display = 'block';
    } finally {
      btn.textContent = 'Send reset link';
      btn.disabled = false;
    }
  });
});
