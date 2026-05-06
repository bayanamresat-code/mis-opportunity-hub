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

function normalizeOpportunityInput(body = {}) {
  return {
    title: (body.title || '').trim(),
    company_name: (body.company_name || '').trim(),
    contact_name: (body.contact_name || '').trim(),
    contact_email: (body.contact_email || '').trim(),
    contact_phone: (body.contact_phone || '').trim(),
    location: (body.location || '').trim(),
    category: (body.category || '').trim(),
    description: (body.description || '').trim(),
    status: (body.status || 'open').trim()
  };
}

async function ensureSeedData() {
  const countRow = await getOne('SELECT COUNT(*) as count FROM opportunities');
  if (countRow && countRow.count > 0) return;

  const seedData = [
    ['Business Analyst - North 1', 'Galilee Insights Ltd.', 'Noa Levi', 'noa.levi@galileeinsights.co.il', '050-700-1001', 'Haifa', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Haifa. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Data Analyst - North 2', 'Carmel DataWorks', 'Omer Cohen', 'omer.cohen@carmeldataworks.co.il', '050-700-1002', 'Yokneam', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Yokneam. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['BI Analyst - North 3', 'Nazareth BI Solutions', 'Rana Khoury', 'rana.khoury@nazbi.co.il', '050-700-1003', 'Nazareth', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nazareth. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['ERP Support Specialist - North 4', 'Karmiel Process Tech', 'Daniel Mizrahi', 'daniel.mizrahi@kpt.co.il', '050-700-1004', 'Karmiel', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Karmiel. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Information Systems Coordinator - North 5', 'Acre Systems Hub', 'Maya Haddad', 'maya.haddad@acresystems.co.il', '050-700-1005', 'Acre', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Acre. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Project Coordinator - North 6', 'Tirat Projects Group', 'Eitan Bar', 'eitan.bar@tiratprojects.co.il', '050-700-1006', 'Tirat Carmel', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Tirat Carmel. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Operations Analyst - North 7', 'Afula Operations Lab', 'Shir Azulay', 'shir.azulay@afulaops.co.il', '050-700-1007', 'Afula', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Afula. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['QA Analyst - North 8', 'Nof QA Dynamics', 'Karim Nassar', 'karim.nassar@nofqa.co.il', '050-700-1008', 'Nof HaGalil', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nof HaGalil. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['PMO Assistant - North 9', 'Safed PMO Center', 'Lior Ben Ami', 'lior.benami@safedpmo.co.il', '050-700-1009', 'Safed', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Safed. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['SQL Reporting Analyst - North 10', 'Kiryat Reports Ltd.', 'Tamar Golan', 'tamar.golan@kiryatreports.co.il', '050-700-1010', 'Kiryat Bialik', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Kiryat Bialik. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['CRM Administrator - North 11', 'Haifa CRM Experts', 'Ariel Dahan', 'ariel.dahan@haifacrm.co.il', '050-700-1011', 'Haifa', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Haifa. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Systems Analyst - North 12', 'Yokneam Systems House', 'Yasmin Abu Saleh', 'yasmin.abusaleh@yoksystems.co.il', '050-700-1012', 'Yokneam', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Yokneam. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Implementation Specialist - North 13', 'Nazareth Implementers', 'Aviad Peretz', 'aviad.peretz@nazimplement.co.il', '050-700-1013', 'Nazareth', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nazareth. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Junior Product Analyst - North 14', 'Karmiel Product Metrics', 'Sivan Mor', 'sivan.mor@kpmetrics.co.il', '050-700-1014', 'Karmiel', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Karmiel. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Customer Success Analyst - North 15', 'Acre Service Analytics', 'Rami Saad', 'rami.saad@acreservice.co.il', '050-700-1015', 'Acre', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Acre. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Business Analyst - North 16', 'Carmel Business Flow', 'Hila Yosef', 'hila.yosef@carmelflow.co.il', '050-700-1016', 'Tirat Carmel', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Tirat Carmel. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Data Analyst - North 17', 'Afula Insight Systems', 'Muhammad Jabareen', 'muhammad.jabareen@afulainsight.co.il', '050-700-1017', 'Afula', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Afula. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['BI Analyst - North 18', 'Galil Dashboards', 'Adi Malka', 'adi.malka@galildash.co.il', '050-700-1018', 'Nof HaGalil', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Nof HaGalil. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['ERP Support Specialist - North 19', 'Safed ERP Link', 'Nour Zaher', 'nour.zaher@saferplink.co.il', '050-700-1019', 'Safed', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Safed. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Information Systems Coordinator - North 20', 'Bialik InfoCore', 'Guy Rahamim', 'guy.rahamim@infocore.co.il', '050-700-1020', 'Kiryat Bialik', 'job', 'Entry-to-junior role focused on analysis, reporting, coordination, and information systems processes in Kiryat Bialik. Requires Excel, SQL, communication skills, and process thinking.', 'open'],
    ['Data Analyst Intern - Cohort 1', 'Karmiel Student Labs', 'Noa Levi', 'interns1@kstudentlabs.co.il', '050-710-2001', 'Karmiel', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Karmiel. Supports reporting, documentation, and process improvement.', 'open'],
    ['BI Intern - Cohort 2', 'Acre BI Studio', 'Omer Cohen', 'interns2@acrebi.co.il', '050-710-2002', 'Acre', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Acre. Supports reporting, documentation, and process improvement.', 'open'],
    ['ERP Intern - Cohort 3', 'Tirat ERP Academy', 'Rana Khoury', 'interns3@tiraterp.co.il', '050-710-2003', 'Tirat Carmel', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Tirat Carmel. Supports reporting, documentation, and process improvement.', 'open'],
    ['QA Intern - Cohort 4', 'Afula QA Works', 'Daniel Mizrahi', 'interns4@afulaqa.co.il', '050-710-2004', 'Afula', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Afula. Supports reporting, documentation, and process improvement.', 'open'],
    ['Project Management Intern - Cohort 5', 'Nof Projects School', 'Maya Haddad', 'interns5@nofprojects.co.il', '050-710-2005', 'Nof HaGalil', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Nof HaGalil. Supports reporting, documentation, and process improvement.', 'open'],
    ['Operations Intern - Cohort 6', 'Safed Operations Lab', 'Eitan Bar', 'interns6@safedops.co.il', '050-710-2006', 'Safed', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Safed. Supports reporting, documentation, and process improvement.', 'open'],
    ['Systems Support Intern - Cohort 7', 'Bialik Support Center', 'Shir Azulay', 'interns7@bialiksupport.co.il', '050-710-2007', 'Kiryat Bialik', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Kiryat Bialik. Supports reporting, documentation, and process improvement.', 'open'],
    ['CRM Intern - Cohort 8', 'Haifa CRM Campus', 'Karim Nassar', 'interns8@haifacrmcampus.co.il', '050-710-2008', 'Haifa', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Haifa. Supports reporting, documentation, and process improvement.', 'open'],
    ['Business Analysis Intern - Cohort 9', 'Yokneam Analysts Hub', 'Lior Ben Ami', 'interns9@yokhub.co.il', '050-710-2009', 'Yokneam', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Yokneam. Supports reporting, documentation, and process improvement.', 'open'],
    ['Product Intern - Cohort 10', 'Nazareth Product House', 'Tamar Golan', 'interns10@nazproduct.co.il', '050-710-2010', 'Nazareth', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Nazareth. Supports reporting, documentation, and process improvement.', 'open'],
    ['Data Analyst Intern - Cohort 11', 'Karmiel Student Labs', 'Ariel Dahan', 'interns11@kstudentlabs.co.il', '050-710-2011', 'Karmiel', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Karmiel. Supports reporting, documentation, and process improvement.', 'open'],
    ['BI Intern - Cohort 12', 'Acre BI Studio', 'Yasmin Abu Saleh', 'interns12@acrebi.co.il', '050-710-2012', 'Acre', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Acre. Supports reporting, documentation, and process improvement.', 'open'],
    ['ERP Intern - Cohort 13', 'Tirat ERP Academy', 'Aviad Peretz', 'interns13@tiraterp.co.il', '050-710-2013', 'Tirat Carmel', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Tirat Carmel. Supports reporting, documentation, and process improvement.', 'open'],
    ['QA Intern - Cohort 14', 'Afula QA Works', 'Sivan Mor', 'interns14@afulaqa.co.il', '050-710-2014', 'Afula', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Afula. Supports reporting, documentation, and process improvement.', 'open'],
    ['Project Management Intern - Cohort 15', 'Nof Projects School', 'Rami Saad', 'interns15@nofprojects.co.il', '050-710-2015', 'Nof HaGalil', 'internship', 'Hands-on internship for students in information systems, analytics, QA, ERP, or operations in Nof HaGalil. Supports reporting, documentation, and process improvement.', 'open'],
    ['CRM Optimization Project - Cycle 1', 'Tirat Project Studio', 'Hila Yosef', 'projects1@tiratstudio.co.il', '050-720-3001', 'Tirat Carmel', 'project', 'Applied project in Tirat Carmel focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['BI Dashboard Project - Cycle 2', 'Afula Data Projects', 'Muhammad Jabareen', 'projects2@afuladata.co.il', '050-720-3002', 'Afula', 'project', 'Applied project in Afula focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['ERP Process Mapping Project - Cycle 3', 'Nof Process Design', 'Adi Malka', 'projects3@nofprocess.co.il', '050-720-3003', 'Nof HaGalil', 'project', 'Applied project in Nof HaGalil focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['Inventory Analytics Project - Cycle 4', 'Safed Inventory Labs', 'Nour Zaher', 'projects4@safedinventory.co.il', '050-720-3004', 'Safed', 'project', 'Applied project in Safed focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['Student Placement Portal Project - Cycle 5', 'Bialik Portal Systems', 'Guy Rahamim', 'projects5@bialikportal.co.il', '050-720-3005', 'Kiryat Bialik', 'project', 'Applied project in Kiryat Bialik focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['Recruitment Workflow Project - Cycle 6', 'Haifa Recruitment Tech', 'Noa Levi', 'projects6@haifarecruit.co.il', '050-720-3006', 'Haifa', 'project', 'Applied project in Haifa focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['Customer Service KPI Project - Cycle 7', 'Yokneam KPI Works', 'Omer Cohen', 'projects7@yokkpi.co.il', '050-720-3007', 'Yokneam', 'project', 'Applied project in Yokneam focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['Project Tracking Dashboard - Cycle 8', 'Nazareth PM Studio', 'Rana Khoury', 'projects8@nazpm.co.il', '050-720-3008', 'Nazareth', 'project', 'Applied project in Nazareth focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['Admissions Reporting Project - Cycle 9', 'Karmiel Academic BI', 'Daniel Mizrahi', 'projects9@kacademicbi.co.il', '050-720-3009', 'Karmiel', 'project', 'Applied project in Karmiel focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['Operations Automation Project - Cycle 10', 'Acre Automation Hub', 'Maya Haddad', 'projects10@acreautomation.co.il', '050-720-3010', 'Acre', 'project', 'Applied project in Acre focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['CRM Optimization Project - Cycle 11', 'Tirat Project Studio', 'Eitan Bar', 'projects11@tiratstudio.co.il', '050-720-3011', 'Tirat Carmel', 'project', 'Applied project in Tirat Carmel focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['BI Dashboard Project - Cycle 12', 'Afula Data Projects', 'Shir Azulay', 'projects12@afuladata.co.il', '050-720-3012', 'Afula', 'project', 'Applied project in Afula focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['ERP Process Mapping Project - Cycle 13', 'Nof Process Design', 'Karim Nassar', 'projects13@nofprocess.co.il', '050-720-3013', 'Nof HaGalil', 'project', 'Applied project in Nof HaGalil focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['Inventory Analytics Project - Cycle 14', 'Safed Inventory Labs', 'Lior Ben Ami', 'projects14@safedinventory.co.il', '050-720-3014', 'Safed', 'project', 'Applied project in Safed focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open'],
    ['Student Placement Portal Project - Cycle 15', 'Bialik Portal Systems', 'Tamar Golan', 'projects15@bialikportal.co.il', '050-720-3015', 'Kiryat Bialik', 'project', 'Applied project in Kiryat Bialik focused on workflow design, dashboarding, CRM/ERP improvement, or KPI tracking. Suitable for students and graduates.', 'open']
  ];

  for (const row of seedData) {
    await runQuery(
      'INSERT INTO opportunities (title, company_name, contact_name, contact_email, contact_phone, location, category, description, status) VALUES (?,?,?,?,?,?,?,?,?)',
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
    company_name TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
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
  await ensureColumn('opportunities', 'company_name', 'TEXT');
  await ensureColumn('opportunities', 'contact_name', 'TEXT');
  await ensureColumn('opportunities', 'contact_email', 'TEXT');
  await ensureColumn('opportunities', 'contact_phone', 'TEXT');
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
    sql += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ? OR company_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ?)';
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }

  sql += ' ORDER BY id DESC';
  return { sql, params };
}

app.get('/', async (req, res) => {
  const latest = await getAll('SELECT * FROM opportunities ORDER BY id DESC LIMIT 6');
  const counts = await getAll('SELECT category, COUNT(*) AS total FROM opportunities GROUP BY category');
  res.render('index', { currentPage: 'home', latest, counts });
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
    'SELECT a.*, o.title, o.category, o.company_name, o.contact_email FROM applications a JOIN opportunities o ON a.opportunity_id=o.id WHERE a.user_id=? ORDER BY a.id DESC',
    [req.session.user.id]
  );
  res.render('student-dashboard', { currentPage: '', user: req.session.user, apps });
});

app.get('/graduate-dashboard', requireRole(['graduate']), async (req, res) => {
  const apps = await getAll(
    'SELECT a.*, o.title, o.category, o.company_name, o.contact_email FROM applications a JOIN opportunities o ON a.opportunity_id=o.id WHERE a.user_id=? ORDER BY a.id DESC',
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
        SELECT a.id, a.status, a.notes, a.created_at, u.fullname, u.email, o.title, o.category, o.company_name
        FROM applications a
        JOIN users u ON a.user_id = u.id
        JOIN opportunities o ON a.opportunity_id = o.id
        ORDER BY a.id DESC
      `)
      : await getAll(`
        SELECT a.id, a.status, '' as notes, a.created_at, u.fullname, u.email, o.title, o.category, o.company_name
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
  const item = normalizeOpportunityInput(req.body);
  await runQuery(
    'INSERT INTO opportunities (title, company_name, contact_name, contact_email, contact_phone, location, category, description, status) VALUES (?,?,?,?,?,?,?,?,?)',
    [item.title, item.company_name, item.contact_name, item.contact_email, item.contact_phone, item.location, item.category, item.description, item.status || 'open']
  );
  res.redirect('/crm');
});

app.get('/manage/opportunity/:id/edit', requireRole(['admin', 'employer']), async (req, res) => {
  const item = await getOne('SELECT * FROM opportunities WHERE id=?', [req.params.id]);
  if (!item) return res.status(404).send('Opportunity not found');
  res.render('opportunity-form', { currentPage: '', item, action: `/manage/opportunity/${item.id}/edit`, pageTitle: 'Edit Opportunity' });
});

app.post('/manage/opportunity/:id/edit', requireRole(['admin', 'employer']), async (req, res) => {
  const item = normalizeOpportunityInput(req.body);
  await runQuery(
    'UPDATE opportunities SET title=?, company_name=?, contact_name=?, contact_email=?, contact_phone=?, location=?, category=?, description=?, status=? WHERE id=?',
    [item.title, item.company_name, item.contact_name, item.contact_email, item.contact_phone, item.location, item.category, item.description, item.status, req.params.id]
  );
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
  const latest = await getAll('SELECT title, company_name, location, category FROM opportunities ORDER BY id DESC LIMIT 5');
  let response = 'AI assistant response:\n\n';

  if (!prompt) {
    response += 'Please write a question.';
  } else if (/skill|skills|כישורים/i.test(prompt)) {
    response += 'Top relevant areas in this portal include SQL, reporting, BI thinking, ERP/CRM familiarity, analytics, QA, and project coordination. These align with common analyst and information-systems roles in the north.';
  } else if (/crm|summary|status|סכם|סטטוס/i.test(prompt)) {
    response += 'Current CRM focus should be: track pending applications first, move accepted projects to in_progress, and mark completed projects when delivered. This keeps the pipeline operational and measurable.';
  } else {
    response += 'Use this assistant for job matching, skills summaries, CRM summaries, and message drafting. Latest opportunities: ' + latest.map(x => `${x.title} - ${x.company_name || 'N/A'} (${x.location})`).join(', ') + '.';
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
