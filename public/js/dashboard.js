document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('welcomeMsg').textContent = `Welcome, ${user.username || 'User'}`;

  const tableBody = document.getElementById('taskTableBody');
  const emptyMsg = document.getElementById('emptyMsg');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  const filterButtons = document.querySelectorAll('.filters button');

  let currentFilter = 'all';

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    successMsg.style.display = 'none';
  }

  function showSuccess(message) {
    successMsg.textContent = message;
    successMsg.style.display = 'block';
    errorMsg.style.display = 'none';
    setTimeout(() => { successMsg.style.display = 'none'; }, 2000);
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
  }

  async function handleAuthError(res) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return true;
    }
    return false;
  }

  async function loadTasks() {
    errorMsg.style.display = 'none';
    let url = '/api/tasks';
    if (currentFilter !== 'all') {
      url += `?status=${currentFilter}`;
    }

    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (await handleAuthError(res)) return;

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Failed to load tasks');
        return;
      }

      renderTasks(data.tasks);
    } catch (err) {
      showError('Network error while loading tasks');
    }
  }

  function renderTasks(tasks) {
    tableBody.innerHTML = '';

    if (!tasks || tasks.length === 0) {
      emptyMsg.style.display = 'block';
      return;
    }
    emptyMsg.style.display = 'none';

    tasks.forEach(task => {
      const row = document.createElement('tr');
      row.setAttribute('data-testid', `task-row-${task.id}`);
      row.dataset.taskId = task.id;

      row.innerHTML = `
        <td data-testid="task-title-${task.id}">${escapeHtml(task.title)}</td>
        <td data-testid="task-description-${task.id}">${escapeHtml(task.description || '')}</td>
        <td><span class="status-badge status-${task.status}" data-testid="task-status-${task.id}">${task.status}</span></td>
        <td class="actions-cell">
          <button class="btn-secondary edit-btn" data-testid="edit-task-${task.id}" data-id="${task.id}">Edit</button>
          <button class="btn-danger delete-btn" data-testid="delete-task-${task.id}" data-id="${task.id}">Delete</button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    attachRowHandlers();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function attachRowHandlers() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Delete this task?')) return;

        try {
          const res = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
          });
          if (await handleAuthError(res)) return;

          const data = await res.json();
          if (!res.ok) {
            showError(data.error || 'Failed to delete task');
            return;
          }

          showSuccess('Task deleted');
          loadTasks();
        } catch (err) {
          showError('Network error while deleting task');
        }
      });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const row = document.querySelector(`tr[data-task-id="${id}"]`);
        startEdit(row, id);
      });
    });
  }

  function startEdit(row, id) {
    const titleCell = row.children[0];
    const descCell = row.children[1];
    const statusCell = row.children[2];
    const actionsCell = row.children[3];

    const currentTitle = titleCell.textContent;
    const currentDesc = descCell.textContent;
    const currentStatus = statusCell.querySelector('.status-badge').textContent.trim();

    row.classList.add('edit-row');

    titleCell.innerHTML = `<input type="text" data-testid="edit-title-${id}" value="${escapeAttr(currentTitle)}" />`;
    descCell.innerHTML = `<input type="text" data-testid="edit-description-${id}" value="${escapeAttr(currentDesc)}" />`;
    statusCell.innerHTML = `
      <select data-testid="edit-status-${id}">
        <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="in-progress" ${currentStatus === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
      </select>
    `;
    actionsCell.innerHTML = `
      <button class="btn-success save-btn" data-testid="save-task-${id}" data-id="${id}">Save</button>
      <button class="btn-secondary cancel-btn" data-testid="cancel-edit-${id}" data-id="${id}">Cancel</button>
    `;

    actionsCell.querySelector('.save-btn').addEventListener('click', () => saveEdit(id));
    actionsCell.querySelector('.cancel-btn').addEventListener('click', () => loadTasks());
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  async function saveEdit(id) {
    const title = document.querySelector(`[data-testid="edit-title-${id}"]`).value.trim();
    const description = document.querySelector(`[data-testid="edit-description-${id}"]`).value.trim();
    const status = document.querySelector(`[data-testid="edit-status-${id}"]`).value;

    if (!title) {
      showError('Title cannot be empty');
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title, description, status })
      });
      if (await handleAuthError(res)) return;

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Failed to update task');
        return;
      }

      showSuccess('Task updated');
      loadTasks();
    } catch (err) {
      showError('Network error while updating task');
    }
  }

  // Add task
  document.getElementById('addTaskBtn').addEventListener('click', async () => {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const status = document.getElementById('taskStatus').value;

    if (!title) {
      showError('Title is required');
      return;
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, description, status })
      });
      if (await handleAuthError(res)) return;

      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Failed to create task');
        return;
      }

      document.getElementById('taskTitle').value = '';
      document.getElementById('taskDescription').value = '';
      document.getElementById('taskStatus').value = 'pending';

      showSuccess('Task added');
      loadTasks();
    } catch (err) {
      showError('Network error while creating task');
    }
  });

  // Filters
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      loadTasks();
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  });

  // Initial load
  loadTasks();
});
