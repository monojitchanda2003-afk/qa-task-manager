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
      : `<a href="/login.html"  class="btn-nav-login">Login</a>
         <a href="/signup.html" class="btn-nav-signup">Sign up →</a>`;

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
<footer style="background:#0f172a;color:#cbd5e1;padding:64px 5% 0;">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;padding-bottom:48px;border-bottom:1px solid rgba(255,255,255,0.08);">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <div style="width:38px;height:38px;background:linear-gradient(135deg,#16a34a,#0ea5e9);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;">✅</div>
        <span style="font-size:18px;font-weight:800;color:white;">QA Task Manager</span>
      </div>
      <p style="font-size:14px;color:#94a3b8;line-height:1.8;max-width:280px;margin-bottom:20px;">A professional SaaS tool for QA engineers to track bugs, manage tasks, and ship quality software faster.</p>
      <div style="display:flex;gap:10px;">
        <a href="https://github.com/monojitchanda2003-afk" target="_blank" style="width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:17px;transition:all 0.25s;" title="GitHub">🐙</a>
        <a href="https://linkedin.com/in/monojitchanda" target="_blank" style="width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:17px;" title="LinkedIn">💼</a>
        <a href="mailto:monojitchanda@email.com" style="width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:17px;" title="Email">📧</a>
      </div>
    </div>
    <div>
      <h4 style="font-size:12px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;">Product</h4>
      <a href="/dashboard.html" style="display:block;font-size:14px;color:#94a3b8;text-decoration:none;margin-bottom:9px;">Dashboard</a>
      <a href="/about.html"     style="display:block;font-size:14px;color:#94a3b8;text-decoration:none;margin-bottom:9px;">About</a>
      <a href="/faq.html"       style="display:block;font-size:14px;color:#94a3b8;text-decoration:none;margin-bottom:9px;">FAQ</a>
    </div>
    <div>
      <h4 style="font-size:12px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;">Support</h4>
      <a href="/contact.html"   style="display:block;font-size:14px;color:#94a3b8;text-decoration:none;margin-bottom:9px;">Contact Us</a>
      <a href="/faq.html"       style="display:block;font-size:14px;color:#94a3b8;text-decoration:none;margin-bottom:9px;">Help Center</a>
      <a href="/about.html"     style="display:block;font-size:14px;color:#94a3b8;text-decoration:none;margin-bottom:9px;">Documentation</a>
    </div>
    <div>
      <h4 style="font-size:12px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;">Account</h4>
      <a href="/login.html"     style="display:block;font-size:14px;color:#94a3b8;text-decoration:none;margin-bottom:9px;">Login</a>
      <a href="/signup.html"    style="display:block;font-size:14px;color:#94a3b8;text-decoration:none;margin-bottom:9px;">Sign Up</a>
      <a href="/profile.html"   style="display:block;font-size:14px;color:#94a3b8;text-decoration:none;margin-bottom:9px;">Profile</a>
    </div>
  </div>
  <div style="max-width:1200px;margin:0 auto;padding:20px 0 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:13px;color:#64748b;">
    <span>© 2025 QA Task Manager. All rights reserved.</span>
    <span>Built with ❤️ by <a href="https://github.com/monojitchanda2003-afk" target="_blank" style="color:#16a34a;text-decoration:none;">Monojit Chanda</a></span>
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
