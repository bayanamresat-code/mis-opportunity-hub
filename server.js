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
      if (err) reject(err);
      else resolve(this);
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
async function ensureSeedData() {
  const countRow = await getOne('SELECT COUNT(*) as count FROM opportunities');
  if (countRow && countRow.count > 0) return;

  const seedData = [
    ['Business Analyst - North 1', 'Haifa', 'job', 'Entry-to-junior role focused on analysis, reporting, and process improvement.', 'open'],
    ['Data Analyst - North 2', 'Yokneam', 'job', 'Support dashboards, KPI reporting, and SQL-based analytics for business teams.', 'open'],
    ['BI Analyst - North 3', 'Nazareth', 'job', 'Build reports and support decision-making processes for operations teams.', 'open'],
    ['ERP Support Specialist - North 4', 'Karmiel', 'job', 'Support ERP workflows, user training, and operational data quality.', 'open'],
    ['Information Systems Coordinator - North 5', 'Acre', 'job', 'Coordinate systems users, documentation, and cross-team process updates.', 'open'],
    ['Project Coordinator - North 6', 'Tirat Carmel', 'job', 'Track project tasks, schedules, and stakeholder communication.', 'open'],
    ['Operations Analyst - North 7', 'Afula', 'job', 'Monitor operational KPIs and improve workflow efficiency.', 'open'],
    ['QA Analyst - North 8', 'Nof HaGalil', 'job', 'Run functional tests, document bugs, and support release quality.', 'open'],
    ['PMO Assistant - North 9', 'Safed', 'job', 'Assist PMO reporting, status tracking, and project governance.', 'open'],
    ['SQL Reporting Analyst - North 10', 'Kiryat Bialik', 'job', 'Create SQL reports and support analytics-driven decisions.', 'open'],
    ['CRM Administrator - North 11', 'Haifa', 'job', 'Manage CRM data quality, pipelines, and user support.', 'open'],
    ['Systems Analyst - North 12', 'Yokneam', 'job', 'Analyze system requirements and document business processes.', 'open'],
    ['Implementation Specialist - North 13', 'Nazareth', 'job', 'Support onboarding and implementation of business systems.', 'open'],
    ['Junior Product Analyst - North 14', 'Karmiel', 'job', 'Monitor product usage and build analytical summaries.', 'open'],
    ['Customer Success Analyst - North 15', 'Acre', 'job', 'Track customer metrics and improve support workflows.', 'open'],
    ['Business Analyst - North 16', 'Tirat Carmel', 'job', 'Support reporting and operational improvement initiatives.', 'open'],
    ['Data Analyst - North 17', 'Afula', 'job', 'Analyze trends and build business performance reports.', 'open'],
    ['BI Analyst - North 18', 'Nof HaGalil', 'job', 'Create visual dashboards and BI summaries.', 'open'],
    ['ERP Support Specialist - North 19', 'Safed', 'job', 'Assist ERP users and operational documentation.', 'open'],
    ['Information Systems Coordinator - North 20', 'Kiryat Bialik', 'job', 'Coordinate system-related processes and reporting.', 'open'],
    ['Data Analyst Intern - Cohort 1', 'Nazareth', 'internship', 'Hands-on analytics internship for students in information systems.', 'open'],
    ['BI Intern - Cohort 2', 'Karmiel', 'internship', 'Support dashboarding and KPI analysis.', 'open'],
    ['ERP Intern - Cohort 3', 'Acre', 'internship', 'Assist ERP process mapping and support activities.', 'open'],
    ['QA Intern - Cohort 4', 'Tirat Carmel', 'internship', 'Participate in testing and documentation.', 'open'],
    ['Project Management Intern - Cohort 5', 'Afula', 'internship', 'Help track project timelines and action items.', 'open'],
    ['Operations Intern - Cohort 6', 'Nof HaGalil', 'internship', 'Support business operations reporting and coordination.', 'open'],
    ['Systems Support Intern - Cohort 7', 'Safed', 'internship', 'Assist users and document system support issues.', 'open'],
    ['CRM Intern - Cohort 8', 'Kiryat Bialik', 'internship', 'Support CRM updates and data quality activities.', 'open'],
    ['Business Analysis Intern - Cohort 9', 'Haifa', 'internship', 'Analyze workflows and prepare business documentation.', 'open'],
    ['Product Intern - Cohort 10', 'Yokneam', 'internship', 'Support product reporting and user feedback analysis.', 'open'],
    ['Data Analyst Intern - Cohort 11', 'Nazareth', 'internship', 'Practice reporting and basic SQL analysis.', 'open'],
    ['BI Intern - Cohort 12', 'Karmiel', 'internship', 'Prepare dashboards and summaries for teams.', 'open'],
    ['ERP Intern - Cohort 13', 'Acre', 'internship', 'Support process improvement with ERP data.', 'open'],
    ['QA Intern - Cohort 14', 'Tirat Carmel', 'internship', 'Help validate system releases and fixes.', 'open'],
    ['Project Management Intern - Cohort 15', 'Afula', 'internship', 'Support coordination and reporting of project execution.', 'open'],
    ['CRM Optimization Project - Cycle 1', 'Nof HaGalil', 'project', 'Applied project for CRM workflow redesign and KPI tracking.', 'open'],
    ['BI Dashboard Project - Cycle 2', 'Safed', 'project', 'Create a dashboard for operational and academic reporting.', 'open'],
    ['ERP Process Mapping Project - Cycle 3', 'Kiryat Bialik', 'project', 'Map ERP-related business processes and recommend improvements.', 'open'],
    ['Inventory Analytics Project - Cycle 4', 'Haifa', 'project', 'Analyze stock and inventory data to improve planning.', 'open'],
    ['Student Placement Portal Project - Cycle 5', 'Yokneam', 'project', 'Build workflows for opportunity matching and placement tracking.', 'open'],
    ['Recruitment Workflow Project - Cycle 6', 'Nazareth', 'project', 'Improve candidate pipeline visibility and CRM updates.', 'open'],
    ['Customer Service KPI Project - Cycle 7', 'Karmiel', 'project', 'Track service metrics and analyze support quality.', 'open'],
    ['Project Tracking Dashboard - Cycle 8', 'Acre', 'project', 'Build progress dashboards for active initiatives.', 'open'],
    ['Admissions Reporting Project - Cycle 9', 'Tirat Carmel', 'project', 'Improve admissions reporting and trend analysis.', 'open'],
    ['Operations Automation Project - Cycle 10', 'Afula', 'project', 'Automate recurring reporting and approval tasks.', 'open'],
    ['CRM Optimization Project - Cycle 11', 'Nof HaGalil', 'project', 'Improve CRM data structure and status handling.', 'open'],
    ['BI Dashboard Project - Cycle 12', 'Safed', 'project', 'Extend analytical reporting and chart coverage.', 'open'],
    ['ERP Process Mapping Project - Cycle 13', 'Kiryat Bialik', 'project', 'Document ERP flow and support redesign.', 'open'],
    ['Inventory Analytics Project - Cycle 14', 'Haifa', 'project', 'Build inventory summaries and forecasting sheets.', 'open'],
    ['Student Placement Portal Project - Cycle 15', 'Yokneam', 'project', 'Enhance portal matching flows and reporting.', 'open']
  ];

  for (const row of seedData) {
    await runQuery(
      'INSERT INTO opportunities (title, location, category, description, status) VALUES (?,?,?,?,?)',
      row
    );
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

  await ensureSeedData();

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
function redirectByRole(role, res) {
  if (role === 'student') return res.redirect('/student-dashboard');
  if (role === 'graduate') return res.redirect('/graduate-dashboard');
  if (role === 'employer') return res.redirect('/employer-dashboard');
  if (role === 'admin') return res.redirect('/admin-dashboard');
  return res.redirect('/');
}
function buildSearch(filters = {}) {
  let sql = 'SELECT * FROM opportunities WHERE 1=1';
  const params = [];
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
  if (filters.q) {
    sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }
  sql += ' ORDER BY id DESC';
  return { sql, params };
}

app.get('/', async (req, res) => {
  const latest = await getAll('SELECT * FROM opportunities ORDER BY id DESC LIMIT 6');
  res.render('index', { currentPage: 'home', latest });
});
app.get('/jobs', async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities WHERE category = ? ORDER BY id DESC', ['job']);
  res.render('jobs', { currentPage: 'jobs', title: 'Jobs', subtitle: 'Explore jobs in the north of Israel.', items });
});
app.get('/internships', async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities WHERE category = ? ORDER BY id DESC', ['internship']);
  res.render('internships', { currentPage: 'internships', title: 'Internships', subtitle: 'Explore internships for students and graduates.', items });
});
app.get('/projects', async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities WHERE category = ? ORDER BY id DESC', ['project']);
  res.render('projects', { currentPage: 'projects', title: 'Projects', subtitle: 'Explore applied projects and innovation initiatives.', items });
});
app.get('/search', async (req, res) => {
  const filters = {
    q: req.query.q || '',
    location: req.query.location || '',
    category: req.query.category || '',
    status: req.query.status || ''
  };
  const { sql, params } = buildSearch(filters);
  const items = await getAll(sql, params);
  res.render('search', { currentPage: 'search', filters, items });
});
app.get('/contact', (req, res) => {
  res.render('contact', { currentPage: 'contact', message: '', messageType: '' });
});
app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  await runQuery('INSERT INTO contacts (name,email,subject,message) VALUES (?,?,?,?)', [name, email, subject, message]);
  res.render('contact', { currentPage: 'contact', message: 'Message sent successfully.', messageType: 'success' });
});
app.get('/login', (req, res) => {
  res.render('login', { currentPage: 'login', message: '', messageType: '' });
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(400).render('login', { currentPage: 'login', message: 'Invalid email or password', messageType: 'error' });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render('login', { currentPage: 'login', message: 'Invalid email or password', messageType: 'error' });
  }
  req.session.user = { id: user.id, fullname: user.fullname, email: user.email, role: user.role };
  redirectByRole(user.role, res);
});
app.get('/signup', (req, res) => {
  res.render('signup', { currentPage: 'signup', message: '', messageType: '' });
});
app.post('/signup', async (req, res) => {
  const { fullname, email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await runQuery('INSERT INTO users (fullname,email,password,role) VALUES (?,?,?,?)', [fullname, email, hash, role]);
    req.session.user = { id: result.lastID, fullname, email, role };
    redirectByRole(role, res);
  } catch (error) {
    res.status(400).render('signup', { currentPage: 'signup', message: 'Email already exists or invalid input', messageType: 'error' });
  }
});
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});
app.get('/student-dashboard', requireRole(['student']), async (req, res) => {
  const apps = await getAll(
    'SELECT a.*, o.title, o.category FROM applications a JOIN opportunities o ON a.opportunity_id=o.id WHERE a.user_id=? ORDER BY a.id DESC',
    [req.session.user.id]
  );
  res.render('student-dashboard', { currentPage: '', user: req.session.user, apps });
});
app.get('/graduate-dashboard', requireRole(['graduate']), async (req, res) => {
  const apps = await getAll(
    'SELECT a.*, o.title, o.category FROM applications a JOIN opportunities o ON a.opportunity_id=o.id WHERE a.user_id=? ORDER BY a.id DESC',
    [req.session.user.id]
  );
  res.render('graduate-dashboard', { currentPage: '', user: req.session.user, apps });
});
app.get('/employer-dashboard', requireRole(['employer']), async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities ORDER BY id DESC LIMIT 10');
  res.render('employer-dashboard', { currentPage: '', user: req.session.user, items });
});
app.get('/admin-dashboard', requireRole(['admin']), async (req, res) => {
  const usersCount = await getOne('SELECT COUNT(*) as c FROM users');
  const contactsCount = await getOne('SELECT COUNT(*) as c FROM contacts');
  const opportunitiesCount = await getOne('SELECT COUNT(*) as c FROM opportunities');
  const appsCount = await getOne('SELECT COUNT(*) as c FROM applications');
  const byCategory = await getAll('SELECT category, COUNT(*) as total FROM opportunities GROUP BY category');
  const byStatus = await getAll('SELECT status, COUNT(*) as total FROM applications GROUP BY status');
  res.render('admin-dashboard', {
    currentPage: '',
    user: req.session.user,
    stats: {
      usersCount: usersCount.c,
      contactsCount: contactsCount.c,
      opportunitiesCount: opportunitiesCount.c,
      appsCount: appsCount.c
    },
    byCategory,
    byStatus
  });
});
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

    res.render('crm', {
      currentPage: '',
      users,
      opportunities,
      contacts,
      applications,
      errorMessage: ''
    });
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
  if (!item) return res.status(404).send('Opportunity not found');
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
  await runQuery('INSERT INTO applications (user_id, opportunity_id, status, notes) VALUES (?,?,?,?)', [req.session.user.id, req.params.id, 'pending', 'Applied from portal']);
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
  if (!prompt) {
    response += 'Please write a question.';
  } else if (/skill|skills|׳›׳™׳©׳•׳¨׳™׳/i.test(prompt)) {
    response += 'Top relevant areas in this portal include SQL, reporting, BI thinking, ERP/CRM familiarity, analytics, QA, and project coordination. These align with common analyst and information-systems roles in the north.';
  } else if (/crm|summary|status|׳¡׳›׳|׳¡׳˜׳˜׳•׳¡/i.test(prompt)) {
    response += 'Current CRM focus should be: track pending applications first, move accepted projects to in_progress, and mark completed projects when delivered. This keeps the pipeline operational and measurable.';
  } else {
    response += 'Use this assistant for job matching, skills summaries, CRM summaries, and message drafting. Latest opportunities: ' + latest.map(x => `${x.title} (${x.location})`).join(', ') + '.';
  }
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
app.use((req, res) => {
  res.status(404).render('404', { currentPage: '' });
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
});