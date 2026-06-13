const express = require('express');
const { readDB, writeDB } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

/** GET /api/tasks — get all tasks for logged-in user */
router.get('/', (req, res) => {
  const db = readDB();
  const tasks = (db.tasks || []).filter(t => t.userId === req.user.id);
  res.json(tasks);
});

/** POST /api/tasks — create a task */
router.post('/', (req, res) => {
  const { title, description, status } = req.body || {};
  if (!title || !title.trim())
    return res.status(400).json({ error: 'Task title is required.' });

  const db = readDB();
  if (!db.tasks) db.tasks = [];
  if (!db.nextTaskId) db.nextTaskId = 1;

  const task = {
    id: db.nextTaskId,
    userId: req.user.id,
    title: title.trim(),
    description: (description || '').trim(),
    status: ['pending','in-progress','completed'].includes(status) ? status : 'pending',
    createdAt: new Date().toISOString()
  };

  db.tasks.push(task);
  db.nextTaskId += 1;
  writeDB(db);

  res.status(201).json(task);
});

/** PUT /api/tasks/:id — update a task */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const task = (db.tasks || []).find(t => t.id === id && t.userId === req.user.id);

  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const { title, description, status } = req.body || {};
  if (title)       task.title       = title.trim();
  if (description !== undefined) task.description = description.trim();
  if (status && ['pending','in-progress','completed'].includes(status)) task.status = status;
  task.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json(task);
});

/** DELETE /api/tasks/:id — delete a task */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const index = (db.tasks || []).findIndex(t => t.id === id && t.userId === req.user.id);

  if (index === -1) return res.status(404).json({ error: 'Task not found.' });

  db.tasks.splice(index, 1);
  writeDB(db);
  res.json({ message: 'Task deleted successfully.' });
});

module.exports = router;
