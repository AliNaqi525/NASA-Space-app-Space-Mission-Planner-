import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

const app = express();
app.use(cors());
app.use(express.json());

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const init = { users: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2), 'utf-8');
      return init;
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (err) {
    console.error('Database read error:', err);
    return { users: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Database write error:', err);
  }
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// 1. Signup Endpoint
app.post('/api/auth/signup', (req, res) => {
  const { username, email, password, preferredRole } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required!' });
  }

  const db = readDb();
  const cleanUsername = String(username).trim();
  const cleanEmail = String(email || `${cleanUsername.toLowerCase()}@spaceport.org`).trim();

  const existing = db.users.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername.toLowerCase() ||
      (email && u.email.toLowerCase() === cleanEmail.toLowerCase())
  );

  if (existing) {
    return res.status(400).json({ error: 'Astronaut callsign or email already exists! Please log in.' });
  }

  const newUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    username: cleanUsername,
    email: cleanEmail,
    password: String(password),
    preferredRole: preferredRole || 'Mission Commander',
    totalScore: 0,
    missionsCompleted: [],
    missionHistory: [],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);

  res.json({ success: true, user: sanitizeUser(newUser) });
});

// 2. Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter both username and password.' });
  }

  const db = readDb();
  const cleanInput = String(username).trim().toLowerCase();
  const user = db.users.find(
    (u) =>
      u.username.toLowerCase() === cleanInput ||
      u.email.toLowerCase() === cleanInput
  );

  if (!user || user.password !== String(password)) {
    return res.status(401).json({ error: 'Invalid astronaut username or password!' });
  }

  user.lastLoginAt = new Date().toISOString();
  writeDb(db);

  res.json({ success: true, user: sanitizeUser(user) });
});

// 3. Get User Profile
app.get('/api/user/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, user: sanitizeUser(user) });
});

// 4. Update User Profile / Team Role
app.post('/api/user/:id/profile', (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.body.preferredRole) {
    user.preferredRole = req.body.preferredRole;
  }
  writeDb(db);
  res.json({ success: true, user: sanitizeUser(user) });
});

// 5. Record Mission Result & Add Score
app.post('/api/user/:id/mission-result', (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { missionId, missionName, success, score, budgetSpent, failureReason } = req.body;
  const numericScore = success ? Math.max(0, Number(score) || 0) : 0;

  if (success) {
    user.totalScore = (user.totalScore || 0) + numericScore;
    if (!user.missionsCompleted.includes(missionId)) {
      user.missionsCompleted.push(missionId);
    }
  }

  user.missionHistory.unshift({
    id: `hist-${Date.now()}`,
    missionId,
    missionName,
    success: Boolean(success),
    score: numericScore,
    budgetSpent: Number(budgetSpent) || 0,
    failureReason: failureReason || null,
    timestamp: new Date().toISOString(),
  });
  user.missionHistory = user.missionHistory.slice(0, 25);

  writeDb(db);
  res.json({
    success: true,
    user: sanitizeUser(user),
    leaderboard: db.users
      .map(sanitizeUser)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 15),
  });
});

// 6. Get Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const db = readDb();
  const leaderboard = db.users
    .map(sanitizeUser)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 15);
  res.json({ success: true, leaderboard });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[SPACE MISSION SERVER] User DB & Mission API running at http://localhost:${PORT}`);
});
