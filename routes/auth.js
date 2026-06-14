const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { readDB, writeDB } = require('../utils/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/auth/signup */
router.post('/signup', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password)
    return res.status(400).json({ error: 'username, email and password are required' });
  if (username.length < 3 || username.length > 20)
    return res.status(400).json({ error: 'username must be between 3 and 20 characters' });
  if (!EMAIL_REGEX.test(email))
    return res.status(400).json({ error: 'invalid email format' });
  if (password.length < 6)
    return res.status(400).json({ error: 'password must be at least 6 characters' });

  const db = readDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'email already registered' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = { id: db.nextUserId, username, email, passwordHash, createdAt: new Date().toISOString() };
  db.users.push(user);
  db.nextUserId += 1;
  writeDB(db);

  return res.status(201).json({ message: 'user registered successfully', user: { id: user.id, username: user.username, email: user.email } });
});

/** POST /api/auth/login */
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'invalid email or password' });

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'invalid email or password' });

  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  return res.status(200).json({ message: 'login successful', token, user: { id: user.id, username: user.username, email: user.email } });
});

/** POST /api/auth/forgot-password */
router.post('/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email || !EMAIL_REGEX.test(email))
    return res.status(400).json({ error: 'Please provide a valid email address.' });

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
  }

  // Generate token (valid 1 hour)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiry = Date.now() + 3600000;

  if (!db.passwordResets) db.passwordResets = [];
  // Remove any old tokens for this user
  db.passwordResets = db.passwordResets.filter(r => r.userId !== user.id);
  db.passwordResets.push({ userId: user.id, token: resetToken, expiry: resetExpiry });
  writeDB(db);

  // In production, send an email here using nodemailer.
  // For now, we log the reset link to server console AND return the token
  // so the frontend can send it via EmailJS (this is a portfolio/demo app).
  const resetLink = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
  console.log(`\n[PASSWORD RESET] User: ${user.email}\nReset Link: ${resetLink}\n`);

  return res.status(200).json({
    message: 'If that email is registered, a reset link has been sent.',
    resetToken,
    username: user.username
  });
});

/** POST /api/auth/reset-password */
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password)
    return res.status(400).json({ error: 'Token and new password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const db = readDB();
  if (!db.passwordResets) return res.status(400).json({ error: 'Invalid or expired reset token.' });

  const resetEntry = db.passwordResets.find(r => r.token === token);
  if (!resetEntry || Date.now() > resetEntry.expiry)
    return res.status(400).json({ error: 'Reset token is invalid or has expired. Please request a new one.' });

  const user = db.users.find(u => u.id === resetEntry.userId);
  if (!user) return res.status(400).json({ error: 'User not found.' });

  user.passwordHash = bcrypt.hashSync(password, 10);
  db.passwordResets = db.passwordResets.filter(r => r.token !== token);
  writeDB(db);

  return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
});

module.exports = router;
