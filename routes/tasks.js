const express = require('express');
const { readDB, writeDB } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/** GET /api/tasks */
router.get('/', (req, res) => {
  try {
    const db = readDB();
    const userId = Number(req.user.id);
    const tasks = (db.tasks || []).filter(t => Number(t.userId) === userId);
    console.log('[TASKS] GET userId:', userId, 'found:', tasks.length, 'tasks');
    res.json(tasks);
  } catch(err) {
    console.error('[TASKS] GET error:', err);
    res.status(500).json({ error: 'Failed to load tasks.' });
  }
});

/** POST /api/tasks */
router.post('/', (req, res) => {
  try {
    const { title, description, status } = req.body || {};
    if (!title || !title.trim())
      return res.status(400).json({ error: 'Task title is required.' });

    const db = readDB();
    if (!db.tasks)      db.tasks      = [];
    if (!db.nextTaskId) db.nextTaskId = 1;

    const userId = Number(req.user.id);
    const task = {
      id:          db.nextTaskId,
      userId:      userId,
      title:       title.trim(),
      description: (description || '').trim(),
      status:      ['pending','in-progress','completed'].includes(status) ? status : 'pending',
      createdAt:   new Date().toISOString()
    };

    db.tasks.push(task);
    db.nextTaskId += 1;
    writeDB(db);

    console.log('[TASKS] POST created task:', task.id, 'for userId:', userId);
    res.status(201).json(task);
  } catch(err) {
    console.error('[TASKS] POST error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

/** PUT /api/tasks/:id */
router.put('/:id', (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const userId = Number(req.user.id);
    const db = readDB();

    const task = (db.tasks || []).find(t => Number(t.id) === taskId && Number(t.userId) === userId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const { title, description, status } = req.body || {};
    if (title !== undefined && title.trim()) task.title = title.trim();
    if (description !== undefined)           task.description = description.trim();
    if (status && ['pending','in-progress','completed'].includes(status)) task.status = status;
    task.updatedAt = new Date().toISOString();

    writeDB(db);
    console.log('[TASKS] PUT updated task:', taskId);
    res.json(task);
  } catch(err) {
    console.error('[TASKS] PUT error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

/** DELETE /api/tasks/:id */
router.delete('/:id', (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const userId = Number(req.user.id);
    const db = readDB();

    const index = (db.tasks || []).findIndex(t => Number(t.id) === taskId && Number(t.userId) === userId);
    if (index === -1) return res.status(404).json({ error: 'Task not found.' });

    db.tasks.splice(index, 1);
    writeDB(db);
    console.log('[TASKS] DELETE task:', taskId);
    res.json({ message: 'Task deleted.' });
  } catch(err) {
    console.error('[TASKS] DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
