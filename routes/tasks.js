const express = require('express');
const { readDB, writeDB } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = ['pending', 'in-progress', 'completed'];

// All routes below require a valid JWT
router.use(authenticate);

/**
 * GET /api/tasks
 * GET /api/tasks?status=pending
 */
router.get('/', (req, res) => {
  const db = readDB();
  let tasks = db.tasks.filter(t => t.userId === req.user.id);

  const { status } = req.query;
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    tasks = tasks.filter(t => t.status === status);
  }

  return res.status(200).json({ count: tasks.length, tasks });
});

/**
 * GET /api/tasks/:id
 */
router.get('/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'task id must be a number' });
  }

  const task = db.tasks.find(t => t.id === id && t.userId === req.user.id);
  if (!task) {
    return res.status(404).json({ error: 'task not found' });
  }

  return res.status(200).json({ task });
});

/**
 * POST /api/tasks
 * Body: { title, description?, status? }
 */
router.post('/', (req, res) => {
  const { title, description, status } = req.body || {};

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const db = readDB();
  const task = {
    id: db.nextTaskId,
    userId: req.user.id,
    title,
    description: description || '',
    status: status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.tasks.push(task);
  db.nextTaskId += 1;
  writeDB(db);

  return res.status(201).json({ message: 'task created', task });
});

/**
 * PUT /api/tasks/:id
 * Body: { title?, description?, status? }
 */
router.put('/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'task id must be a number' });
  }

  const task = db.tasks.find(t => t.id === id && t.userId === req.user.id);
  if (!task) {
    return res.status(404).json({ error: 'task not found' });
  }

  const { title, description, status } = req.body || {};

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (title !== undefined) {
    if (title.trim() === '') {
      return res.status(400).json({ error: 'title cannot be empty' });
    }
    task.title = title;
  }
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  task.updatedAt = new Date().toISOString();

  writeDB(db);
  return res.status(200).json({ message: 'task updated', task });
});

/**
 * DELETE /api/tasks/:id
 */
router.delete('/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'task id must be a number' });
  }

  const index = db.tasks.findIndex(t => t.id === id && t.userId === req.user.id);
  if (index === -1) {
    return res.status(404).json({ error: 'task not found' });
  }

  db.tasks.splice(index, 1);
  writeDB(db);

  return res.status(200).json({ message: 'task deleted' });
});

module.exports = router;
