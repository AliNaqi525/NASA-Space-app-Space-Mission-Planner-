import express from 'express';
import cors from 'cors';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_PATH = path.join(__dirname, 'database.json');
const TMP_DB_PATH = path.join(os.tmpdir(), 'astrobuilder_database.json');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory fallback + JSON file persistence (supports both local disk & Vercel /tmp)
let memoryDb = null;

function readDb(forceDisk = false) {
  if (memoryDb && !forceDisk) return memoryDb;
  try {
    // On Vercel (where LOCAL_DB_PATH is read-only), prioritize TMP_DB_PATH if written
    if (fs.existsSync(TMP_DB_PATH)) {
      memoryDb = JSON.parse(fs.readFileSync(TMP_DB_PATH, 'utf-8'));
      return memoryDb;
    }
    if (fs.existsSync(LOCAL_DB_PATH)) {
      memoryDb = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
      return memoryDb;
    }
  } catch (err) {
    console.error('Database read warning:', err.message);
  }
  memoryDb = memoryDb || { users: [], rooms: {}, activeRoomCode: null };
  return memoryDb;
}

function writeDb(data) {
  memoryDb = data;
  if (process.env.VERCEL) {
    try {
      fs.writeFileSync(TMP_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return;
    } catch {
      return;
    }
  }
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    try {
      fs.writeFileSync(TMP_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // In-memory fallback active on read-only serverless environment
    }
  }
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// Helper: Detect local LAN IPv4 address so mobile QR codes work on Wi-Fi
function getLanIp() {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch {}
  return 'localhost';
}

// Automatically divide the 4 roles among 1, 2, 3, or 4 players in the room
function assignRolesToPlayers(players = []) {
  const allRoles = ['commander', 'propulsion', 'payload', 'lifesupport'];
  const count = players.length;
  return players.map((p, idx) => {
    let assignedRoles = [];
    if (count === 1) {
      assignedRoles = [...allRoles];
    } else if (count === 2) {
      assignedRoles =
        idx === 0 ? ['commander', 'propulsion'] : ['payload', 'lifesupport'];
    } else if (count === 3) {
      if (idx === 0) assignedRoles = ['commander', 'payload'];
      else if (idx === 1) assignedRoles = ['propulsion'];
      else assignedRoles = ['lifesupport'];
    } else {
      assignedRoles = [allRoles[idx % 4]];
    }
    return {
      ...p,
      assignedRoles,
    };
  });
}

// ============================================================================
// SINGLE SERVER GAME ROOMS & MULTIPLAYER STATE (UP TO 4 PLAYERS PER ROOM)
// ============================================================================
const rooms = new Map();
let activeRoomCode = null;

function hydrateRoomsFromDb() {
  try {
    const db = readDb(true);
    if (db.rooms && typeof db.rooms === 'object') {
      for (const [code, r] of Object.entries(db.rooms)) {
        if (!rooms.has(code)) {
          rooms.set(code, r);
        }
      }
      if (!activeRoomCode && db.activeRoomCode && rooms.has(db.activeRoomCode)) {
        activeRoomCode = db.activeRoomCode;
      }
    }
  } catch {}
}

function persistRoomsToDb() {
  try {
    const db = readDb();
    db.rooms = Object.fromEntries(rooms.entries());
    db.activeRoomCode = activeRoomCode;
    writeDb(db);
  } catch {}
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function createRoomObject(code, hostUser, initialState = {}) {
  const playerUserId = hostUser.sessionPlayerId || hostUser.id;
  const hostPlayer = {
    userId: playerUserId,
    username: hostUser.username,
    isReady: true,
    joinedAt: new Date().toISOString(),
  };

  return {
    roomCode: code,
    hostUserId: playerUserId,
    strictRoleLock: false,
    missionId: initialState.missionId || 'moon',
    build: initialState.build || {
      noseId: 'nose_aero',
      tankId: 'tank_medium',
      coatingId: 'coat_light',
      finsId: 'fins_stabilizer',
      engineId: 'eng_thruster_x',
      experimentIds: ['exp_lunar_drill'],
    },
    foodQuantities: initialState.foodQuantities || {
      food_pouches: 1,
      food_thermo: 0,
      food_hydroponic: 0,
      food_cryo_vault: 0,
    },
    launchAngleDeg: initialState.launchAngleDeg ?? 80,
    trajectoryId: initialState.trajectoryId || 'direct',
    launchTimestamp: null,
    players: assignRolesToPlayers([hostPlayer]),
    chatMessages: [
      {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Mission Control',
        text: `Room ${code} created by ${hostUser.username}! Scan the QR code or enter code ${code} to join (up to 4 players).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
    updatedAt: Date.now(),
  };
}

// Server & Network Info for QR Code generation
app.get('/api/server-info', (req, res) => {
  hydrateRoomsFromDb();
  const roomList = Array.from(rooms.values()).map((r) => ({
    roomCode: r.roomCode,
    playerCount: r.players.length,
    missionId: r.missionId,
  }));
  const latestCode =
    activeRoomCode && rooms.has(activeRoomCode)
      ? activeRoomCode
      : roomList.length > 0
      ? roomList[roomList.length - 1].roomCode
      : null;

  res.json({
    success: true,
    lanIp: getLanIp(),
    activeRoomCode: latestCode,
    activeRooms: roomList,
  });
});

// Create a new Room (or reset single-server round)
app.post('/api/rooms/create', (req, res) => {
  hydrateRoomsFromDb();
  const { user, initialState, customCode } = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ error: 'User profile required to create a room.' });
  }

  const code =
    customCode && String(customCode).trim().length === 4
      ? String(customCode).trim().toUpperCase()
      : generateRoomCode();

  const room = createRoomObject(code, user, initialState);
  rooms.set(code, room);
  activeRoomCode = code;
  persistRoomsToDb();

  res.json({ success: true, room });
});

// Join an existing Room by Code (Max 4 Players, Auto-Divides the 4 Roles!)
app.post('/api/rooms/join', (req, res) => {
  hydrateRoomsFromDb();
  const { roomCode, user } = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ error: 'Please log in first to join the room.' });
  }

  let code = String(roomCode || activeRoomCode || 'TEAM')
    .trim()
    .toUpperCase();

  let room = rooms.get(code);

  // If the code isn't found directly, check if there is an active room on the single server
  // or automatically initialize the room with that code so joining across devices never fails!
  if (!room) {
    if ((!roomCode || code === 'ABCD') && activeRoomCode && rooms.has(activeRoomCode)) {
      code = activeRoomCode;
      room = rooms.get(code);
    } else {
      room = createRoomObject(code, user);
      rooms.set(code, room);
      activeRoomCode = code;
      persistRoomsToDb();
      return res.json({ success: true, room });
    }
  }

  // Ensure each physical device / session can join as a distinct player even if using Quick Demo
  const playerUserId = user.sessionPlayerId || user.id;
  const existingIdx = room.players.findIndex((p) => p.userId === playerUserId);

  if (existingIdx === -1) {
    if (room.players.length >= 4) {
      return res.status(400).json({
        error: `Room ${code} is full (Maximum 4 astronauts per team)!`,
      });
    }
    const sameNameCount = room.players.filter((p) =>
      p.username.toLowerCase().startsWith(user.username.toLowerCase())
    ).length;
    const displayUsername =
      sameNameCount > 0 ? `${user.username} #${sameNameCount + 1}` : user.username;

    room.players.push({
      userId: playerUserId,
      username: displayUsername,
      isReady: true,
      joinedAt: new Date().toISOString(),
    });
    room.players = assignRolesToPlayers(room.players);

    room.chatMessages.push({
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: 'system',
      senderName: 'Mission Control',
      text: `${displayUsername} joined Room ${code}! (${room.players.length}/4 astronauts — 4 roles automatically divided).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } else {
    room.players = assignRolesToPlayers(room.players);
  }

  activeRoomCode = code;
  room.updatedAt = Date.now();
  persistRoomsToDb();
  res.json({ success: true, room });
});

// Get live Room State
app.get('/api/rooms/:code', (req, res) => {
  hydrateRoomsFromDb();
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({ success: true, room });
});

// Sync Shared Mission Build / Budget / Food / Trajectory / Launch State
app.post('/api/rooms/:code/sync', (req, res) => {
  hydrateRoomsFromDb();
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const {
    missionId,
    build,
    foodQuantities,
    launchAngleDeg,
    trajectoryId,
    strictRoleLock,
    triggerLaunch,
    resetLaunch,
    actorName,
    actionNote,
  } = req.body;

  if (missionId !== undefined) room.missionId = missionId;
  if (build !== undefined) room.build = { ...room.build, ...build };
  if (foodQuantities !== undefined) {
    room.foodQuantities = { ...room.foodQuantities, ...foodQuantities };
  }
  if (launchAngleDeg !== undefined) room.launchAngleDeg = Number(launchAngleDeg);
  if (trajectoryId !== undefined) room.trajectoryId = trajectoryId;
  if (strictRoleLock !== undefined) room.strictRoleLock = Boolean(strictRoleLock);
  if (triggerLaunch) {
    room.launchTimestamp = Date.now();
  } else {
    room.launchTimestamp = null;
  }

  if (actionNote) {
    room.chatMessages.push({
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: 'action',
      senderName: actorName || 'Teammate',
      text: actionNote,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    if (room.chatMessages.length > 60) {
      room.chatMessages = room.chatMessages.slice(-60);
    }
  }

  room.updatedAt = Date.now();
  persistRoomsToDb();
  res.json({ success: true, room });
});

// Toggle Player Ready status or Rotate Role Order
app.post('/api/rooms/:code/ready', (req, res) => {
  hydrateRoomsFromDb();
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const { userId, isReady, rotateRoles } = req.body;
  if (rotateRoles && room.players.length > 1) {
    const first = room.players.shift();
    room.players.push(first);
    room.players = assignRolesToPlayers(room.players);
    room.chatMessages.push({
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: 'system',
      senderName: 'Mission Control',
      text: 'Team roles rotated among room members!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } else {
    const p = room.players.find((pl) => pl.userId === userId);
    if (p) {
      p.isReady = Boolean(isReady);
    }
  }

  room.updatedAt = Date.now();
  persistRoomsToDb();
  res.json({ success: true, room });
});

// Send Chat Message in Room
app.post('/api/rooms/:code/chat', (req, res) => {
  hydrateRoomsFromDb();
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const { senderId, senderName, text } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Empty message' });
  }

  room.chatMessages.push({
    id: `msg-${Date.now()}-${Math.random()}`,
    senderId: senderId || 'user',
    senderName: senderName || 'Astronaut',
    text: String(text).trim().slice(0, 220),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  if (room.chatMessages.length > 60) {
    room.chatMessages = room.chatMessages.slice(-60);
  }

  room.updatedAt = Date.now();
  persistRoomsToDb();
  res.json({ success: true, room });
});

// Leave Room (Re-divides roles among remaining players, keeps room alive for re-joining)
app.post('/api/rooms/:code/leave', (req, res) => {
  hydrateRoomsFromDb();
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.json({ success: true });
  }

  const { userId, username } = req.body;
  room.players = room.players.filter((p) => p.userId !== userId);

  if (room.players.length > 0) {
    room.players = assignRolesToPlayers(room.players);
    room.chatMessages.push({
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: 'system',
      senderName: 'Mission Control',
      text: `${username || 'An astronaut'} left the room. Roles re-divided among ${room.players.length} player(s).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }

  persistRoomsToDb();
  res.json({ success: true });
});

// ============================================================================
// USER AUTHENTICATION & PERSISTENT PROFILE ENDPOINTS
// ============================================================================
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

// Quick Instant Guest Login for QR Code Scanners
app.post('/api/auth/quick-join', (req, res) => {
  const { nickname } = req.body;
  const db = readDb();
  const cleanName =
    String(nickname || `Cadet_${Math.floor(100 + Math.random() * 899)}`).trim();

  let user = db.users.find(
    (u) => u.username.toLowerCase() === cleanName.toLowerCase()
  );
  if (!user) {
    user = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username: cleanName,
      email: `${cleanName.toLowerCase().replace(/\s+/g, '')}@spaceport.org`,
      password: 'password123',
      preferredRole: 'Mission Commander',
      totalScore: 0,
      missionsCompleted: [],
      missionHistory: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    db.users.push(user);
    writeDb(db);
  }

  res.json({ success: true, user: sanitizeUser(user) });
});

app.get('/api/user/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, user: sanitizeUser(user) });
});

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

app.get('/api/leaderboard', (req, res) => {
  const db = readDb();
  const leaderboard = db.users
    .map(sanitizeUser)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 15);
  res.json({ success: true, leaderboard });
});

const PORT = process.env.PORT || 3001;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `[SPACE MISSION SERVER] Running at http://localhost:${PORT} (LAN IP: ${getLanIp()})`
    );
  });
}

export default app;
