document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('token')) { location.href = '/login.html'; return; }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const el = id => document.getElementById(id);

  el('welcomeMsg').textContent = `👋 Welcome back, ${user.username || 'there'}!`;

  // Form toggle
  el('toggleFormBtn').addEventListener('click', () => {
    const wrap = el('taskFormWrap');
    const open = wrap.style.display === 'none';
    wrap.style.display = open ? 'block' : 'none';
    el('toggleFormBtn').textContent = open ? '✕ Close' : '+ Add Task';
  });
  el('cancelFormBtn').addEventListener('click', () => {
    el('taskFormWrap').style.display = 'none';
    el('toggleFormBtn').textContent = '+ Add Task';
  });

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  let allTasks = [];
  let currentFilter = 'all';
  let searchQuery = '';

  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks', { headers });
      const data = await res.json();
      allTasks = Array.isArray(data) ? data : (data.tasks || []);
      renderStats();
      renderTasks();
    } catch (e) { console.error(e); }
  }

  function renderStats() {
    const total    = allTasks.length;
    const pending  = allTasks.filter(t => t.status === 'pending').length;
    const progress = allTasks.filter(t => t.status === 'in-progress').length;
    const done     = allTasks.filter(t => t.status === 'completed').length;
    const pct      = total ? Math.round((done / total) * 100) : 0;

    el('statTotal').textContent   = total;
    el('statPending').textContent = pending;
    el('statProgress').textContent= progress;
    el('statDone').textContent    = done;
    el('progressBar').style.width = pct + '%';
    el('progressPct').textContent = pct + '%';
    el('progressLabel').textContent = `${total} total tasks`;
    document.querySelector('.progress-labels span').textContent = `${done} completed`;
  }

  function renderTasks() {
    const filtered = allTasks.filter(t => {
      const matchFilter = currentFilter === 'all' || t.status === currentFilter;
      const matchSearch = t.title.toLowerCase().includes(searchQuery) ||
                         (t.description || '').toLowerCase().includes(searchQuery);
      return matchFilter && matchSearch;
    });

    const tbody = el('taskTableBody');
    const empty = el('emptyState');

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
        <td style="color:var(--text3);font-size:12px;">#${i+1}</td>
        <td style="font-weight:600;">${escHtml(t.title)}</td>
        <td style="color:var(--text2);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(t.description || '—')}</td>
        <td>${badge}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn-edit-sm" onclick="startEdit(${t.id})">✏️ Edit</button>
            <button class="btn-danger-sm" onclick="deleteTask(${t.id})">🗑 Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Add task
  el('addTaskBtn').addEventListener('click', async () => {
    const title = el('taskTitle').value.trim();
    const description = el('taskDescription').value.trim();
    const status = el('taskStatus').value;
    if (!title) { showMsg('errorMsg', 'Title is required.'); return; }

    el('addTaskBtn').textContent = 'Adding...';
    el('addTaskBtn').disabled = true;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST', headers,
        body: JSON.stringify({ title, description, status })
      });
      const data = await res.json();
      if (!res.ok) { showMsg('errorMsg', data.error || 'Failed to add task.'); return; }
      showMsg('successMsg', '✅ Task added!');
      el('taskTitle').value = '';
      el('taskDescription').value = '';
      el('taskStatus').value = 'pending';
      await loadTasks();
    } catch(e) { showMsg('errorMsg', 'Network error.'); }
    finally { el('addTaskBtn').textContent = 'Add Task'; el('addTaskBtn').disabled = false; }
  });

  // Delete
  window.deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers });
      await loadTasks();
    } catch(e) { console.error(e); }
  };

  // Edit (inline)
  window.startEdit = (id) => {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    const row = document.querySelector(`tr[data-id="${id}"]`);
    row.innerHTML = `
      <td style="color:var(--text3);font-size:12px;">#</td>
      <td><input class="form-group input" value="${escHtml(task.title)}" id="eTitle${id}" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:13px;width:100%;"/></td>
      <td><input class="form-group input" value="${escHtml(task.description||'')}" id="eDesc${id}" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:13px;width:100%;"/></td>
      <td>
        <select id="eSt${id}" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:13px;">
          <option value="pending" ${task.status==='pending'?'selected':''}>⏳ Pending</option>
          <option value="in-progress" ${task.status==='in-progress'?'selected':''}>🔄 In Progress</option>
          <option value="completed" ${task.status==='completed'?'selected':''}>✅ Completed</option>
        </select>
      </td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn-save-sm" onclick="saveEdit(${id})">💾 Save</button>
          <button class="btn-outline" style="padding:5px 10px;border-radius:6px;font-size:12px;" onclick="loadTasks()">✕</button>
        </div>
      </td>`;
  };

  window.saveEdit = async (id) => {
    const title = document.getElementById(`eTitle${id}`).value.trim();
    const description = document.getElementById(`eDesc${id}`).value.trim();
    const status = document.getElementById(`eSt${id}`).value;
    if (!title) return;
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ title, description, status })
      });
      await loadTasks();
    } catch(e) { console.error(e); }
  };

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Search
  el('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderTasks();
  });

  function showMsg(id, text) {
    const e = el(id);
    e.textContent = text;
    e.style.display = 'block';
    setTimeout(() => { e.style.display = 'none'; }, 3500);
  }

  loadTasks();
});
