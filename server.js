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
  if (!(await columnExists(table, column))) {
    await runQuery(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
async function seedUsers() {
  const users = [
    ['System Admin', 'admin@hub.local', 'admin'],
    ['Bayan Student', 'student1@hub.local', 'student'],
    ['Noa Graduate', 'graduate1@hub.local', 'graduate'],
    ['Lior Employer', 'employer1@hub.local', 'employer'],
    ['Dana Student', 'student2@hub.local', 'student'],
    ['Omer Graduate', 'graduate2@hub.local', 'graduate']
  ];
  for (const [fullname, email, role] of users) {
    const exists = await getOne('SELECT id FROM users WHERE email = ?', [email]);
    if (!exists) {
      const hash = await bcrypt.hash('Admin123!', 10);
      await runQuery('INSERT INTO users (fullname, email, password, role) VALUES (?,?,?,?)', [fullname, email, hash, role]);
    }
  }
}
async function seedOpportunities() {
  const row = await getOne('SELECT COUNT(*) as count FROM opportunities');
  if (row && row.count >= 50) return;
  if (row && row.count > 0 && row.count < 50) {
    await runQuery('DELETE FROM opportunities');
  }
  const items = [];
  for (let i = 1; i <= 20; i++) items.push([`Business Analyst ${i}`, i % 2 ? 'Haifa' : 'Nazareth', 'job', `Business analysis role ${i} for MIS students and graduates in the north.`, 'open']);
  for (let i = 1; i <= 15; i++) items.push([`Data Internship ${i}`, i % 2 ? 'Safed' : 'Acre', 'internship', `Hands-on internship ${i} in reporting, SQL, BI, and process analysis.`, 'open']);
  for (let i = 1; i <= 15; i++) items.push([`CRM Project ${i}`, i % 2 ? 'Yokneam' : 'Afula', 'project', `Applied project ${i} focused on CRM, workflow, dashboards, and delivery.`, 'open']);
  for (const item of items) {
    await runQuery('INSERT INTO opportunities (title, location, category, description, status) VALUES (?,?,?,?,?)', item);
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
  await seedUsers();
  await seedOpportunities();
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
function redirectByRole(role, res) {
  if (role === 'student') return res.redirect('/student-dashboard');
  if (role === 'graduate') return res.redirect('/graduate-dashboard');
  if (role === 'employer') return res.redirect('/employer-dashboard');
  if (role === 'admin') return res.redirect('/admin-dashboard');
  return res.redirect('/');
}
function searchQuery(filters = {}) {
  let sql = 'SELECT * FROM opportunities WHERE 1=1';
  const params = [];
  if (filters.q) {
    sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters.location) {
    sql += ' AND location LIKE ?';
    params.push(`%${filters.location}%`);
  }
  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  sql += ' ORDER BY id DESC';
  return { sql, params };
}

app.get('/', async (req, res) => {
  const latest = await getAll('SELECT * FROM opportunities ORDER BY id DESC LIMIT 9');
  const counts = await getAll('SELECT category, COUNT(*) as total FROM opportunities GROUP BY category');
  res.render('index', { currentPage: 'home', latest, counts });
});
app.get('/jobs', async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities WHERE category=? ORDER BY id DESC', ['job']);
  res.render('jobs', { currentPage: 'jobs', title: 'Jobs', subtitle: 'Open positions for students and graduates in information systems.', items });
});
app.get('/internships', async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities WHERE category=? ORDER BY id DESC', ['internship']);
  res.render('internships', { currentPage: 'internships', title: 'Internships', subtitle: 'Practical internships with real business systems and analytics work.', items });
});
app.get('/projects', async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities WHERE category=? ORDER BY id DESC', ['project']);
  res.render('projects', { currentPage: 'projects', title: 'Projects', subtitle: 'Applied projects in CRM, BI, ERP, automation, and dashboards.', items });
});
app.get('/search', async (req, res) => {
  const filters = { q: req.query.q || '', category: req.query.category || '', location: req.query.location || '', status: req.query.status || '' };
  const { sql, params } = searchQuery(filters);
  const items = await getAll(sql, params);
  res.render('search', { currentPage: 'search', filters, items });
});
app.get('/contact', (req, res) => res.render('contact', { currentPage: 'contact', message: '', messageType: '' }));
app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  await runQuery('INSERT INTO contacts (name,email,subject,message) VALUES (?,?,?,?)', [name, email, subject, message]);
  res.render('contact', { currentPage: 'contact', message: 'Message sent successfully.', messageType: 'success' });
});
app.get('/login', (req, res) => res.render('login', { currentPage: 'login', message: '', messageType: '' }));
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(400).render('login', { currentPage: 'login', message: 'Invalid email or password', messageType: 'error' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).render('login', { currentPage: 'login', message: 'Invalid email or password', messageType: 'error' });
  req.session.user = { id: user.id, fullname: user.fullname, email: user.email, role: user.role };
  redirectByRole(user.role, res);
});
app.get('/signup', (req, res) => res.render('signup', { currentPage: 'signup', message: '', messageType: '' }));
app.post('/signup', async (req, res) => {
  const { fullname, email, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await runQuery('INSERT INTO users (fullname,email,password,role) VALUES (?,?,?,?)', [fullname, email, hash, role]);
    req.session.user = { id: result.lastID, fullname, email, role };
    redirectByRole(role, res);
  } catch {
    res.status(400).render('signup', { currentPage: 'signup', message: 'Email already exists or invalid input', messageType: 'error' });
  }
});
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
app.get('/student-dashboard', requireRole(['student']), async (req, res) => {
  const apps = await getAll('SELECT a.*, o.title, o.category FROM applications a JOIN opportunities o ON a.opportunity_id=o.id WHERE a.user_id=? ORDER BY a.id DESC', [req.session.user.id]);
  res.render('student-dashboard', { currentPage: '', user: req.session.user, apps });
});
app.get('/graduate-dashboard', requireRole(['graduate']), async (req, res) => {
  const apps = await getAll('SELECT a.*, o.title, o.category FROM applications a JOIN opportunities o ON a.opportunity_id=o.id WHERE a.user_id=? ORDER BY a.id DESC', [req.session.user.id]);
  res.render('graduate-dashboard', { currentPage: '', user: req.session.user, apps });
});
app.get('/employer-dashboard', requireRole(['employer']), async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities ORDER BY id DESC LIMIT 12');
  res.render('employer-dashboard', { currentPage: '', user: req.session.user, items });
});
app.get('/admin-dashboard', requireRole(['admin']), async (req, res) => {
  const usersCount = await getOne('SELECT COUNT(*) as c FROM users');
  const contactsCount = await getOne('SELECT COUNT(*) as c FROM contacts');
  const opportunitiesCount = await getOne('SELECT COUNT(*) as c FROM opportunities');
  const appsCount = await getOne('SELECT COUNT(*) as c FROM applications');
  const byCategory = await getAll('SELECT category, COUNT(*) as total FROM opportunities GROUP BY category');
  const byStatus = await getAll('SELECT status, COUNT(*) as total FROM applications GROUP BY status');
  const byLocation = await getAll('SELECT location, COUNT(*) as total FROM opportunities GROUP BY location ORDER BY total DESC LIMIT 10');
  res.render('admin-dashboard', { currentPage: '', user: req.session.user, stats: { usersCount: usersCount.c, contactsCount: contactsCount.c, opportunitiesCount: opportunitiesCount.c, appsCount: appsCount.c }, byCategory, byStatus, byLocation });
});
app.get('/crm', requireRole(['admin']), async (req, res) => {
  try {
    const users = await getAll('SELECT id, fullname, email, role, created_at FROM users ORDER BY id DESC');
    const opportunities = await getAll('SELECT id, title, location, category, description, status, created_at FROM opportunities ORDER BY id DESC');
    const contacts = await getAll('SELECT id, name, email, subject, message, created_at FROM contacts ORDER BY id DESC');
    const applications = await getAll(`SELECT a.id, a.status, COALESCE(a.notes,'') as notes, a.created_at, u.fullname, u.email, o.title, o.category FROM applications a JOIN users u ON a.user_id=u.id JOIN opportunities o ON a.opportunity_id=o.id ORDER BY a.id DESC`);
    res.render('crm', { currentPage: '', users, opportunities, contacts, applications, errorMessage: '' });
  } catch (error) {
    res.status(500).render('crm', { currentPage: '', users: [], opportunities: [], contacts: [], applications: [], errorMessage: `CRM failed to load: ${error.message}` });
  }
});
app.get('/manage/opportunity/new', requireRole(['admin', 'employer']), (req, res) => {
  res.render('opportunity-form', { currentPage: '', item: null, action: '/manage/opportunity/new', pageTitle: 'Add Opportunity' });
});
app.post('/manage/opportunity/new', requireRole(['admin', 'employer']), async (req, res) => {
  const { title, location, category, description, status } = req.body;
  await runQuery('INSERT INTO opportunities (title,location,category,description,status) VALUES (?,?,?,?,?)', [title, location, category, description, status || 'open']);
  res.redirect('/crm');
});
app.get('/manage/opportunity/:id/edit', requireRole(['admin', 'employer']), async (req, res) => {
  const item = await getOne('SELECT * FROM opportunities WHERE id=?', [req.params.id]);
  if (!item) return res.status(404).render('404', { currentPage: '' });
  res.render('opportunity-form', { currentPage: '', item, action: `/manage/opportunity/${item.id}/edit`, pageTitle: 'Edit Opportunity' });
});
app.post('/manage/opportunity/:id/edit', requireRole(['admin', 'employer']), async (req, res) => {
  const { title, location, category, description, status } = req.body;
  await runQuery('UPDATE opportunities SET title=?, location=?, category=?, description=?, status=? WHERE id=?', [title, location, category, description, status, req.params.id]);
  res.redirect('/crm');
});
app.post('/manage/opportunity/:id/delete', requireRole(['admin', 'employer']), async (req, res) => {
  await runQuery('DELETE FROM opportunities WHERE id=?', [req.params.id]);
  res.redirect('/crm');
});
app.post('/apply/:id', requireRole(['student', 'graduate']), async (req, res) => {
  await runQuery('INSERT INTO applications (user_id, opportunity_id, status, notes) VALUES (?,?,?,?)', [req.session.user.id, req.params.id, 'pending', 'Applied from website']);
  res.redirect('back');
});
app.post('/applications/:id/status', requireRole(['admin']), async (req, res) => {
  await runQuery('UPDATE applications SET status=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [req.body.status, req.body.notes || '', req.params.id]);
  res.redirect('/crm');
});
app.get('/ai-assistant', requireAuth, (req, res) => {
  res.render('ai-assistant', { currentPage: 'ai', messages: [] });
});
app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const prompt = (req.body.message || '').trim();
  const stats = await getAll('SELECT category, COUNT(*) as total FROM opportunities GROUP BY category');
  const latest = await getAll('SELECT title, location, category FROM opportunities ORDER BY id DESC LIMIT 5');
  let response = 'AI assistant response:\n\n';
  if (!prompt) response += 'Please write a question.';
  else if (/skill|skills|כישורים/i.test(prompt)) response += 'Top relevant areas include SQL, reporting, BI thinking, ERP/CRM familiarity, analytics, QA, and project coordination.';
  else if (/crm|summary|status|סכם|סטטוס/i.test(prompt)) response += 'Focus on pending applications first, then move accepted work into in_progress and completed states.';
  else response += 'Use this assistant for job matching, skills summaries, CRM summaries, and message drafting. Latest opportunities: ' + latest.map(x => `${x.title} (${x.location})`).join(', ') + '.';
  response += '\n\nOpportunities by category: ' + stats.map(s => `${s.category}=${s.total}`).join(', ') + '.';
  await runQuery('INSERT INTO ai_messages (user_role,prompt,response) VALUES (?,?,?)', [req.session.user.role, prompt, response]);
  res.json({ answer: response });
});
app.get('/api/charts', requireRole(['admin']), async (req, res) => {
  const byCategory = await getAll('SELECT category as label, COUNT(*) as value FROM opportunities GROUP BY category');
  const byStatus = await getAll('SELECT status as label, COUNT(*) as value FROM applications GROUP BY status');
  const byLocation = await getAll('SELECT location as label, COUNT(*) as value FROM opportunities GROUP BY location ORDER BY value DESC LIMIT 10');
  res.json({ byCategory, byStatus, byLocation });
});
app.use((req, res) => res.status(404).render('404', { currentPage: '' }));

initDb().then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))).catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
