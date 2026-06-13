/* shared.js — navbar, footer, dark mode, loader */
(function () {
  const DARK_KEY = 'qa-dark';

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const btn = document.getElementById('darkToggle');
    if (btn) btn.textContent = dark ? '☀️' : '🌙';
  }

  function initTheme() {
    const saved = localStorage.getItem(DARK_KEY);
    applyTheme(saved === 'true');
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    localStorage.setItem(DARK_KEY, !isDark);
    applyTheme(!isDark);
  }

  function currentUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function buildNavbar() {
    const user = currentUser();
    const page = location.pathname.split('/').pop() || 'index.html';
    const isAuth = !!localStorage.getItem('token');

    const links = isAuth
      ? [
          { href: '/dashboard.html', label: 'Dashboard' },
          { href: '/about.html',     label: 'About'     },
          { href: '/contact.html',   label: 'Contact'   },
          { href: '/faq.html',       label: 'FAQ'       },
        ]
      : [
          { href: '/index.html',   label: 'Home'    },
          { href: '/about.html',   label: 'About'   },
          { href: '/contact.html', label: 'Contact' },
          { href: '/faq.html',     label: 'FAQ'     },
        ];

    const navLinks = links.map(l =>
      `<a href="${l.href}" class="nav-link${page === l.href.replace('/', '') ? ' active' : ''}">${l.label}</a>`
    ).join('');

    const mobileLinks = links.map(l =>
      `<a href="${l.href}" class="nav-link">${l.label}</a>`
    ).join('');

    const rightSlot = isAuth
      ? `<a href="/profile.html" class="user-avatar" title="Profile">${initials(user?.username)}</a>
         <button class="btn btn-outline" id="logoutBtn" style="padding:6px 14px;font-size:13px;">Logout</button>`
      : `<a href="/login.html"  class="btn btn-outline" style="padding:6px 14px;font-size:13px;">Login</a>
         <a href="/signup.html" class="btn btn-green"   style="padding:6px 14px;font-size:13px;">Sign up</a>`;

    const html = `
<nav class="navbar">
  <a href="${isAuth ? '/dashboard.html' : '/index.html'}" class="navbar-brand">
    <div class="brand-icon">✅</div>
    QA Task Manager
  </a>
  <div class="navbar-nav">${navLinks}</div>
  <div class="navbar-right">
    <button class="dark-toggle" id="darkToggle" onclick="window.__toggleTheme()" title="Toggle dark mode">🌙</button>
    ${rightSlot}
    <button class="hamburger" id="hamburger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu">${mobileLinks}${rightSlot}</div>`;

    const el = document.getElementById('navbar-placeholder');
    if (el) el.innerHTML = html;

    document.getElementById('hamburger')?.addEventListener('click', () => {
      document.getElementById('mobileMenu')?.classList.toggle('open');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.href = '/login.html';
    });
  }

  function buildFooter() {
    const html = `
<footer class="footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <a href="/index.html" class="navbar-brand" style="text-decoration:none;">
        <div class="brand-icon">✅</div>
        <span style="font-size:16px;font-weight:700;color:var(--text)">QA Task Manager</span>
      </a>
      <p>A professional SaaS tool for QA engineers to track bugs, manage tasks, and ship quality software faster.</p>
      <div class="social-links">
        <a href="https://github.com/monojitchanda2003-afk" target="_blank" class="social-link" title="GitHub">🐙</a>
        <a href="https://linkedin.com/in/monojitchanda" target="_blank" class="social-link" title="LinkedIn">💼</a>
        <a href="mailto:monojitchanda@email.com" class="social-link" title="Email">📧</a>
      </div>
    </div>
    <div class="footer-col">
      <h4>Product</h4>
      <a href="/dashboard.html">Dashboard</a>
      <a href="/about.html">About</a>
      <a href="/faq.html">FAQ</a>
    </div>
    <div class="footer-col">
      <h4>Support</h4>
      <a href="/contact.html">Contact Us</a>
      <a href="/faq.html">Help Center</a>
      <a href="/about.html">Documentation</a>
    </div>
    <div class="footer-col">
      <h4>Pages</h4>
      <a href="/login.html">Login</a>
      <a href="/signup.html">Sign Up</a>
      <a href="/profile.html">Profile</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2025 QA Task Manager. All rights reserved.</span>
    <span>Built with ❤️ by <a href="https://github.com/monojitchanda2003-afk" target="_blank">Monojit Chanda</a></span>
  </div>
</footer>`;
    const el = document.getElementById('footer-placeholder');
    if (el) el.innerHTML = html;
  }

  function hideLoader() {
    const l = document.getElementById('loader');
    if (l) { l.style.opacity = '0'; setTimeout(() => l.remove(), 400); }
  }

  window.__toggleTheme = toggleTheme;

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    buildNavbar();
    buildFooter();
    setTimeout(hideLoader, 600);
  });
})();
