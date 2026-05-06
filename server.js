const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const storageDir = process.env.RENDER ? '/opt/render/project/src/storage' : __dirname;
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
const DATABASE = path.join(storageDir, 'database.db');
const db = new sqlite3.Database(DATABASE);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'mis-opportunity-hub-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPage = '';
  next();
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err); else resolve(this);
    });
  });
}
function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}
function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}
async function columnExists(table, column) {
  const cols = await getAll(`PRAGMA table_info(${table})`);
  return cols.some(c => c.name === column);
}
async function ensureColumn(table, column, definition) {
  const exists = await columnExists(table, column);
  if (!exists) {
    await runQuery(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added missing column ${table}.${column}`);
  }
}
async function initDb() {
  await runQuery(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student','graduate','employer','admin')),
    preferred_language TEXT DEFAULT 'en',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await runQuery(`CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('job','internship','project')),
    description TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await runQuery(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    opportunity_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
  )`);
  await runQuery(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await runQuery(`CREATE TABLE IF NOT EXISTS ai_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_role TEXT,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await ensureColumn('users', 'preferred_language', "TEXT DEFAULT 'en'");
  await ensureColumn('opportunities', 'status', "TEXT DEFAULT 'open'");
  await ensureColumn('applications', 'notes', 'TEXT');
  await ensureColumn('applications', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

  const admin = await getOne('SELECT id FROM users WHERE email = ?', ['admin@hub.local']);
  if (!admin) {
    const hash = await bcrypt.hash('Admin123!', 10);
    await runQuery('INSERT INTO users (fullname, email, password, role) VALUES (?,?,?,?)', ['System Admin', 'admin@hub.local', hash, 'admin']);
  }
}
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (!roles.includes(req.session.user.role)) return res.status(403).send('Access denied');
    next();
  };
}
app.get('/crm', requireRole(['admin']), async (req, res) => {
  try {
    const hasNotes = await columnExists('applications', 'notes');
    const users = await getAll('SELECT fullname,email,role,created_at FROM users ORDER BY id DESC');
    const opportunities = await getAll('SELECT * FROM opportunities ORDER BY id DESC');
    const contacts = await getAll('SELECT * FROM contacts ORDER BY id DESC');
    const applications = hasNotes
      ? await getAll(`
          SELECT a.id, a.status, a.notes, a.created_at, u.fullname, u.email, o.title, o.category
          FROM applications a
          JOIN users u ON a.user_id = u.id
          JOIN opportunities o ON a.opportunity_id = o.id
          ORDER BY a.id DESC
        `)
      : await getAll(`
          SELECT a.id, a.status, '' as notes, a.created_at, u.fullname, u.email, o.title, o.category
          FROM applications a
          JOIN users u ON a.user_id = u.id
          JOIN opportunities o ON a.opportunity_id = o.id
          ORDER BY a.id DESC
        `);

    res.render('crm', { currentPage: '', users, opportunities, contacts, applications, errorMessage: '' });
  } catch (error) {
    console.error('CRM route error:', error.message);
    res.status(500).render('crm', {
      currentPage: '',
      users: [],
      opportunities: [],
      contacts: [],
      applications: [],
      errorMessage: `CRM failed to load: ${error.message}`
    });
  }
});

app.get('/', (req, res) => res.send('Server is running. Open /crm after login.'));
app.get('/login', (req, res) => {
  res.send(`
    <form method="POST" action="/login" style="max-width:420px;margin:40px auto;font-family:Arial">
      <h2>Login</h2>
      <input name="email" type="email" placeholder="Email" style="display:block;width:100%;margin:10px 0;padding:10px" />
      <input name="password" type="password" placeholder="Password" style="display:block;width:100%;margin:10px 0;padding:10px" />
      <button style="padding:10px 16px">Login</button>
      <p>Admin: admin@hub.local / Admin123!</p>
    </form>
  `);
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(400).send('Invalid email or password');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).send('Invalid email or password');
  req.session.user = { id: user.id, fullname: user.fullname, email: user.email, role: user.role };
  res.redirect('/crm');
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
});