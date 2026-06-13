document.addEventListener('DOMContentLoaded', async () => {

  // ── Auth Guard ──────────────────────────────────────────────────────────
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  const $ = id => document.getElementById(id);
  $('welcomeMsg').textContent = `👋 Welcome back, ${user.username}!`;

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let allTasks      = [];
  let currentFilter = 'all';
  let searchQuery   = '';

  // ── Load Tasks from API ─────────────────────────────────────────────────
  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks', { headers: authHeaders });
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return;
      }
      const data = await res.json();
      allTasks = Array.isArray(data) ? data : [];
      console.log('[DASH] Loaded tasks:', allTasks.length);
      renderStats();
      renderTable();
    } catch(e) {
      console.error('[DASH] loadTasks error:', e);
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────
  function renderStats() {
    const total    = allTasks.length;
    const pending  = allTasks.filter(t => t.status === 'pending').length;
    const inProg   = allTasks.filter(t => t.status === 'in-progress').length;
    const done     = allTasks.filter(t => t.status === 'completed').length;
    const pct      = total ? Math.round((done / total) * 100) : 0;

    $('statTotal').textContent    = total;
    $('statPending').textContent  = pending;
    $('statProgress').textContent = inProg;
    $('statDone').textContent     = done;
    $('progressBar').style.width  = pct + '%';
    $('progressPct').textContent  = pct + '%';
    $('progressDone').textContent  = done + ' completed';
    $('progressTotal').textContent = total + ' total tasks';
  }

  // ── Render Table ────────────────────────────────────────────────────────
  function renderTable() {
    const q = searchQuery.toLowerCase();
    const filtered = allTasks.filter(t => {
      const matchFilter = currentFilter === 'all' || t.status === currentFilter;
      const matchSearch = !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });

    const tbody     = $('taskBody');
    const emptyState = $('emptyState');

    if (!filtered.length) {
      tbody.innerHTML      = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map((t, i) => {
      const badge =
        t.status === 'completed'  ? '<span class="badge badge-completed">✅ Completed</span>' :
        t.status === 'in-progress'? '<span class="badge badge-progress">🔄 In Progress</span>' :
                                    '<span class="badge badge-pending">⏳ Pending</span>';
      return `<tr data-id="${t.id}">
        <td style="color:var(--gray);font-size:12px;font-weight:600;">${i + 1}</td>
        <td style="font-weight:600;">${esc(t.title)}</td>
        <td style="color:var(--gray);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.description || '—')}</td>
        <td>${badge}</td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn-edit" onclick="startEdit(${t.id})">✏️ Edit</button>
            <button class="btn-del"  onclick="deleteTask(${t.id})">🗑 Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  // ── Toggle Add Form ─────────────────────────────────────────────────────
  $('toggleFormBtn').addEventListener('click', () => {
    const wrap = $('taskFormWrap');
    const open = wrap.style.display === 'none' || wrap.style.display === '';
    wrap.style.display          = open ? 'block' : 'none';
    $('toggleFormBtn').textContent = open ? '✕ Close' : '+ Add Task';
  });

  $('cancelFormBtn').addEventListener('click', () => {
    $('taskFormWrap').style.display = 'none';
    $('toggleFormBtn').textContent  = '+ Add Task';
  });

  // ── Add Task ────────────────────────────────────────────────────────────
  $('addTaskBtn').addEventListener('click', async () => {
    const title       = $('taskTitle').value.trim();
    const description = $('taskDesc').value.trim();
    const status      = $('taskStatus').value;

    if (!title) { showAlert('errMsg', '⚠️ Task title is required.'); return; }

    $('addTaskBtn').textContent = 'Adding...';
    $('addTaskBtn').disabled    = true;

    try {
      const res  = await fetch('/api/tasks', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ title, description, status })
      });
      const data = await res.json();

      if (!res.ok) {
        showAlert('errMsg', data.error || 'Failed to add task.');
        return;
      }

      // Reset form
      $('taskTitle').value   = '';
      $('taskDesc').value    = '';
      $('taskStatus').value  = 'pending';
      $('taskFormWrap').style.display = 'none';
      $('toggleFormBtn').textContent  = '+ Add Task';
      showAlert('okMsg', '✅ Task added!');
      await loadTasks();

    } catch(e) {
      showAlert('errMsg', 'Network error. Try again.');
    } finally {
      $('addTaskBtn').textContent = 'Add Task';
      $('addTaskBtn').disabled    = false;
    }
  });

  // ── Delete Task ─────────────────────────────────────────────────────────
  window.deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Delete failed.'); return; }
      await loadTasks();
    } catch(e) { console.error(e); }
  };

  // ── Edit Task (inline) ───────────────────────────────────────────────────
  window.startEdit = (id) => {
    const t = allTasks.find(t => t.id === id);
    if (!t) return;
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;
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
          <button class="btn-edit" onclick="loadTasks()">✕</button>
        </div>
      </td>`;
  };

  window.saveEdit = async (id) => {
    const title       = document.getElementById(`eT${id}`)?.value.trim();
    const description = document.getElementById(`eD${id}`)?.value.trim();
    const status      = document.getElementById(`eS${id}`)?.value;
    if (!title) return;
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ title, description, status })
      });
      await loadTasks();
    } catch(e) { console.error(e); }
  };

  // ── Filters ──────────────────────────────────────────────────────────────
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });

  // ── Search ────────────────────────────────────────────────────────────────
  $('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderTable();
  });

  // ── Alert helper ─────────────────────────────────────────────────────────
  function showAlert(id, msg) {
    const el = $(id);
    if (!el) return;
    el.textContent   = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3500);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  await loadTasks();
});
