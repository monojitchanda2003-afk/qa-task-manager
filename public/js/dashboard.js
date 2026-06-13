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
  let tasks = JSON.parse(localStorage.getItem('qa_tasks') || '[]');

  function saveTasks() {
    localStorage.setItem('qa_tasks', JSON.stringify(tasks));
  }

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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  function loadTasks() {
    tasks = JSON.parse(localStorage.getItem('qa_tasks') || '[]');
    const filtered = currentFilter === 'all'
      ? tasks
      : tasks.filter(t => t.status === currentFilter);
    renderTasks(filtered);
  }

  function renderTasks(list) {
    tableBody.innerHTML = '';
    if (!list || list.length === 0) {
      emptyMsg.style.display = 'block';
      return;
    }
    emptyMsg.style.display = 'none';
    list.forEach(task => {
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

  function attachRowHandlers() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Delete this task?')) return;
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        showSuccess('Task deleted');
        loadTasks();
      });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const row = tableBody.querySelector(`tr[data-task-id="${id}"]`);
        startEdit(row, id);
      });
    });
  }

  function startEdit(row, id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    row.classList.add('edit-row');
    row.children[0].innerHTML = `<input type="text" data-testid="edit-title-${id}" value="${escapeAttr(task.title)}" />`;
    row.children[1].innerHTML = `<input type="text" data-testid="edit-description-${id}" value="${escapeAttr(task.description || '')}" />`;
    row.children[2].innerHTML = `
      <select data-testid="edit-status-${id}">
        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
      </select>`;
    row.children[3].innerHTML = `
      <button class="btn-success save-btn" data-testid="save-task-${id}" data-id="${id}">Save</button>
      <button class="btn-secondary cancel-btn" data-testid="cancel-edit-${id}">Cancel</button>`;
    row.children[3].querySelector('.save-btn').addEventListener('click', () => saveEdit(id));
    row.children[3].querySelector('.cancel-btn').addEventListener('click', () => loadTasks());
  }

  function saveEdit(id) {
    const title = document.querySelector(`[data-testid="edit-title-${id}"]`).value.trim();
    const description = document.querySelector(`[data-testid="edit-description-${id}"]`).value.trim();
    const status = document.querySelector(`[data-testid="edit-status-${id}"]`).value;
    if (!title) { showError('Title cannot be empty'); return; }
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], title, description, status };
      saveTasks();
      showSuccess('Task updated');
      loadTasks();
    }
  }

  // Add task
  document.getElementById('addTaskBtn').addEventListener('click', () => {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const status = document.getElementById('taskStatus').value;
    if (!title) { showError('Title is required'); return; }
    const newTask = {
      id: 'task_' + Date.now(),
      title,
      description,
      status,
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    saveTasks();
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskStatus').value = 'pending';
    showSuccess('Task added');
    loadTasks();
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
