document.addEventListener('DOMContentLoaded', () => {
  emailjs.init('Yr2GKKMgQH12XZ9cM');

  const form = document.getElementById('forgotForm');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  const btn = document.getElementById('forgotBtn');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    if (!EMAIL_REGEX.test(email)) {
      errorMsg.textContent = 'Please enter a valid email address.';
      errorMsg.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || 'Something went wrong. Please try again.';
        errorMsg.style.display = 'block';
        return;
      }

      // If a resetToken came back, the email exists - send the reset email.
      if (data.resetToken) {
        const resetLink = `${window.location.origin}/reset-password.html?token=${data.resetToken}`;

        try {
          await emailjs.send('service_q27f9d9', 'template_gf7ket9', {
            email: email,
            link: resetLink,
            to_name: data.username || 'User'
          });
        } catch (emailErr) {
          // Email sending failed, but don't reveal account existence either way.
          console.error('Email send failed:', emailErr);
        }
      }

      // Generic message regardless, to avoid revealing whether the email is registered.
      successMsg.textContent = 'If that email is registered, a reset link has been sent. Please check your inbox.';
      successMsg.style.display = 'block';

    } catch (err) {
      errorMsg.textContent = 'Network error. Please try again.';
      errorMsg.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send reset link';
    }
  });
});
