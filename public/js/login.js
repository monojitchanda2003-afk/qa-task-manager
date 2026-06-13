document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
    return;
  }
  const form = document.getElementById('loginForm');
  const errorMsg = document.getElementById('errorMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const users = JSON.parse(localStorage.getItem('qa_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('token', 'local_' + Date.now());
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/dashboard.html';
    } else {
      errorMsg.textContent = 'Invalid email or password.';
      errorMsg.style.display = 'block';
    }
  });
});
