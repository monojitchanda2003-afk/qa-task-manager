const fs   = require('fs');
const path = require('path');

// Store db.json at project root — committed to repo so it survives deploys
const DB_PATH = path.join(__dirname, '..', 'db.json');

const INITIAL = {
  users: [],
  tasks: [],
  nextUserId: 1,
  nextTaskId: 1,
  passwordResets: []
};

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(INITIAL));
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8').trim();
    if (!raw) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(INITIAL));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB] readDB error:', err.message);
    return JSON.parse(JSON.stringify(INITIAL));
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] writeDB error:', err.message);
  }
}

module.exports = { readDB, writeDB };
