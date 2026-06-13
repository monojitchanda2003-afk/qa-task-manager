document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
    return;
  }
  const form = document.getElementById('signupForm');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  form.addEventListener('submit', (e) => {
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
    const users = JSON.parse(localStorage.getItem('qa_users') || '[]');
    if (users.find(u => u.email === email)) {
      errorMsg.textContent = 'Email already registered';
      errorMsg.style.display = 'block';
      return;
    }
    users.push({ username, email, password });
    localStorage.setItem('qa_users', JSON.stringify(users));
    successMsg.textContent = 'Account created! Redirecting to login...';
    successMsg.style.display = 'block';
    setTimeout(() => { window.location.href = '/login.html'; }, 1200);
  });
});
