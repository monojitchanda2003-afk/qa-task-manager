const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../utils/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/signup
 * Body: { username, email, password }
 */
router.post('/signup', (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'username must be between 3 and 20 characters' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'invalid email format' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  const db = readDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'email already registered' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = {
    id: db.nextUserId,
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  db.nextUserId += 1;
  writeDB(db);

  return res.status(201).json({
    message: 'user registered successfully',
    user: { id: user.id, username: user.username, email: user.email }
  });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  return res.status(200).json({
    message: 'login successful',
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
});

module.exports = router;
