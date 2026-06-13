document.addEventListener('DOMContentLoaded', () => {
  emailjs.init('Yr2GKKMgQH12XZ9cM');

  const form = document.getElementById('forgotForm');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  const btn = document.getElementById('forgotBtn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    const email = document.getElementById('email').value.trim();

    if (!email) {
      errorMsg.textContent = 'Please enter your email address.';
      errorMsg.style.display = 'block';
      return;
    }

    const users = JSON.parse(localStorage.getItem('qa_users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
      errorMsg.textContent = 'No account found with this email.';
      errorMsg.style.display = 'block';
      return;
    }

    // Generate reset token
    const token = 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2);
    const expiry = Date.now() + 3600000; // 1 hour

    // Save reset token
    const resets = JSON.parse(localStorage.getItem('qa_resets') || '{}');
    resets[token] = { email, expiry };
    localStorage.setItem('qa_resets', JSON.stringify(resets));

    const resetLink = `${window.location.origin}/reset-password.html?token=${token}`;

    btn.disabled = true;
    btn.textContent = 'Sending...';

    emailjs.send('service_q27f9d9', 'template_gf7ket9', {
      email: email,
      link: resetLink,
      to_name: user.username || 'User'
    })
    .then(() => {
      successMsg.textContent = 'Reset link sent! Check your email.';
      successMsg.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Send reset link';
    })
    .catch(() => {
      errorMsg.textContent = 'Failed to send email. Please try again.';
      errorMsg.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Send reset link';
    });
  });
});
