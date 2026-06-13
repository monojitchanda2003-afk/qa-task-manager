document.addEventListener('DOMContentLoaded', async () => {

  // ── Auth Guard ──────────────────────────────────────────────────────────
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  // Verify token is still valid with server
  try {
    const check = await fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (check.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return;
    }
  } catch(e) {
    // network error — continue anyway, tasks load will handle it
  }

  // ── UI Setup ────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  // Welcome message
  $('welcomeMsg').textContent = `👋 Welcome back, ${user.username}!`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let allTasks = [];
  let currentFilter = 'all';
  let searchQuery   = '';

  // ── Load Tasks ──────────────────────────────────────────────────────────
  async function loadTasks() {
    try {
      const res  = await fetch('/api/tasks', { headers });
      if (res.status === 401) { window.location.href = '/login.html'; return; }
      const data = await res.json();
      allTasks = Array.isArray(data) ? data : (data.tasks || []);
      renderStats();
      renderTable();
    } catch(e) {
      console.error('Failed to load tasks:', e);
    }
  }

  // ── Stats & Progress ────────────────────────────────────────────────────
  function renderStats() {
    const total    = allTasks.length;
    const pending  = allTasks.filter(t => t.status === 'pending').length;
    const progress = allTasks.filter(t => t.status === 'in-progress').length;
    const done     = allTasks.filter(t => t.status === 'completed').length;
    const pct      = total ? Math.round((done / total) * 100) : 0;

    $('statTotal').textContent    = total;
    $('statPending').textContent  = pending;
    $('statProgress').textContent = progress;
    $('statDone').textContent     = done;
    $('progressBar').style.width  = pct + '%';
    $('progressPct').textContent  = pct + '%';
    $('progressDone').textContent = done + ' completed';
    $('progressTotal').textContent= total + ' total tasks';
  }

  // ── Render Table ────────────────────────────────────────────────────────
  function renderTable() {
    const filtered = allTasks.filter(t => {
      const matchFilter = currentFilter === 'all' || t.status === currentFilter;
      const matchSearch = t.title.toLowerCase().includes(searchQuery) ||
                         (t.description || '').toLowerCase().includes(searchQuery);
      return matchFilter && matchSearch;
    });

    const tbody = $('taskBody');
    const empty = $('emptyState');

    if (!filtered.length) {
      tbody.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = filtered.map((t, i) => {
      const badge = t.status === 'completed'
        ? '<span class="badge badge-completed">✅ Completed</span>'
        : t.status === 'in-progress'
        ? '<span class="badge badge-progress">🔄 In Progress</span>'
        : '<span class="badge badge-pending">⏳ Pending</span>';
      return `<tr data-id="${t.id}">
        <td style="color:var(--gray);font-size:12px;font-weight:600;">${i+1}</td>
        <td style="font-weight:600;">${esc(t.title)}</td>
        <td style="color:var(--gray);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.description||'—')}</td>
        <td>${badge}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-edit" onclick="startEdit(${t.id})">✏️ Edit</button>
            <button class="btn-del"  onclick="deleteTask(${t.id})">🗑 Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Add Task ────────────────────────────────────────────────────────────
  const toggleBtn  = $('toggleFormBtn');
  const formWrap   = $('taskFormWrap');
  const cancelBtn  = $('cancelFormBtn');
  const addBtn     = $('addTaskBtn');

  toggleBtn.addEventListener('click', () => {
    const open = formWrap.style.display === 'none' || !formWrap.style.display;
    formWrap.style.display = open ? 'block' : 'none';
    toggleBtn.textContent  = open ? '✕ Close' : '+ Add Task';
  });

  cancelBtn.addEventListener('click', () => {
    formWrap.style.display = 'none';
    toggleBtn.textContent  = '+ Add Task';
  });

  addBtn.addEventListener('click', async () => {
    const title       = $('taskTitle').value.trim();
    const description = $('taskDesc').value.trim();
    const status      = $('taskStatus').value;

    if (!title) { showAlert('errMsg', 'Task title is required.'); return; }

    addBtn.textContent = 'Adding...';
    addBtn.disabled    = true;

    try {
      const res  = await fetch('/api/tasks', {
        method: 'POST', headers,
        body: JSON.stringify({ title, description, status })
      });
      const data = await res.json();
      if (!res.ok) { showAlert('errMsg', data.error || 'Failed to add task.'); return; }
      showAlert('okMsg', '✅ Task added successfully!');
      $('taskTitle').value = '';
      $('taskDesc').value  = '';
      $('taskStatus').value = 'pending';
      formWrap.style.display = 'none';
      toggleBtn.textContent  = '+ Add Task';
      await loadTasks();
    } catch(e) {
      showAlert('errMsg', 'Network error. Please try again.');
    } finally {
      addBtn.textContent = 'Add Task';
      addBtn.disabled    = false;
    }
  });

  // ── Delete Task ─────────────────────────────────────────────────────────
  window.deleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers });
      await loadTasks();
    } catch(e) { console.error(e); }
  };

  // ── Edit Task (inline) ───────────────────────────────────────────────────
  window.startEdit = (id) => {
    const t = allTasks.find(t => t.id === id);
    if (!t) return;
    const row = document.querySelector(`tr[data-id="${id}"]`);
    row.innerHTML = `
      <td style="color:var(--gray);font-size:12px;">#</td>
      <td><input id="eT${id}" value="${esc(t.title)}" style="width:100%;padding:7px 10px;border:1.5px solid var(--green);border-radius:7px;background:var(--white);color:var(--dark);font-size:13px;font-family:inherit;"/></td>
      <td><input id="eD${id}" value="${esc(t.description||'')}" style="width:100%;padding:7px 10px;border:1.5px solid var(--border);border-radius:7px;background:var(--white);color:var(--dark);font-size:13px;font-family:inherit;"/></td>
      <td>
        <select id="eS${id}" style="padding:7px 10px;border:1.5px solid var(--border);border-radius:7px;background:var(--white);color:var(--dark);font-size:13px;font-family:inherit;">
          <option value="pending"     ${t.status==='pending'?'selected':''}>⏳ Pending</option>
          <option value="in-progress" ${t.status==='in-progress'?'selected':''}>🔄 In Progress</option>
          <option value="completed"   ${t.status==='completed'?'selected':''}>✅ Completed</option>
        </select>
      </td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn-save" onclick="saveEdit(${id})">💾 Save</button>
          <button class="btn-edit" onclick="loadTasks()">✕ Cancel</button>
        </div>
      </td>`;
  };

  window.saveEdit = async (id) => {
    const title       = document.getElementById(`eT${id}`).value.trim();
    const description = document.getElementById(`eD${id}`).value.trim();
    const status      = document.getElementById(`eS${id}`).value;
    if (!title) return;
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ title, description, status })
      });
      await loadTasks();
    } catch(e) { console.error(e); }
  };

  // ── Filters ─────────────────────────────────────────────────────────────
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });

  // ── Search ───────────────────────────────────────────────────────────────
  $('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderTable();
  });

  // ── Alert Helpers ────────────────────────────────────────────────────────
  function showAlert(id, msg) {
    const el = $(id);
    if (!el) return;
    el.textContent    = msg;
    el.style.display  = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3500);
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  await loadTasks();
});
