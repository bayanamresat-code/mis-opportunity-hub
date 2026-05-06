const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new pgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'mis-opportunity-hub-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPage = '';
  next();
});

async function runQuery(sql, params = []) {
  return pool.query(sql, params);
}
async function getOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}
async function getAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function ensureSchema() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      fullname TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student','graduate','employer','admin')),
      preferred_language TEXT DEFAULT 'en',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      company_name TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      location TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('job','internship','project')),
      description TEXT,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, opportunity_id)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS ai_messages (
      id SERIAL PRIMARY KEY,
      user_role TEXT,
      prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function seedUsers() {
  const count = await getOne('SELECT COUNT(*)::int AS count FROM users');
  if (count && count.count > 0) return;
  const demoUsers = [
    ['System Admin', 'admin@hub.local', 'Admin123!', 'admin'],
    ['Bayan Student', 'student@hub.local', 'Student123!', 'student'],
    ['Lina Graduate', 'graduate@hub.local', 'Graduate123!', 'graduate'],
    ['Gal Employer', 'employer@hub.local', 'Employer123!', 'employer'],
    ['Nour Student', 'nour.student@hub.local', 'Student123!', 'student'],
    ['Adam Graduate', 'adam.grad@hub.local', 'Graduate123!', 'graduate']
  ];
  for (const [fullname, email, plain, role] of demoUsers) {
    const password = await bcrypt.hash(plain, 10);
    await runQuery(
      'INSERT INTO users (fullname, email, password, role) VALUES ($1,$2,$3,$4)',
      [fullname, email, password, role]
    );
  }
}

async function seedOpportunities() {
  const count = await getOne('SELECT COUNT(*)::int AS count FROM opportunities');
  if (count && count.count > 0) return;
  const rows = [
    ['Business Analyst - North 1','Matrix North','Rami Levi','rami.levi@matrix.local','050-700-1001','Haifa','job','Entry role focused on reporting, process mapping, and dashboard support.','open'],
    ['Data Analyst - North 2','Ness Analytics','Dana Cohen','dana.cohen@ness.local','050-700-1002','Yokneam','job','Support SQL reporting, KPI analysis, and cross-team business insights.','open'],
    ['BI Analyst - North 3','Galil BI Lab','Maya Haddad','maya.haddad@galilbi.local','050-700-1003','Nazareth','job','Build Power BI dashboards and operational summaries for managers.','open'],
    ['ERP Support Specialist - North 4','Priority Solutions','Avi Azulay','avi.azulay@priority.local','050-700-1004','Karmiel','job','Support ERP users, training, and business process documentation.','open'],
    ['Information Systems Coordinator - North 5','Northern Systems','Rana Safadi','rana.safadi@northsys.local','050-700-1005','Acre','job','Coordinate users, process updates, and reporting quality.','open'],
    ['Project Coordinator - North 6','Carmel Projects','Lior Ben David','lior.ben-david@carmel.local','050-700-1006','Tirat Carmel','job','Track schedules, status updates, and stakeholder communication.','open'],
    ['Operations Analyst - North 7','OpsFlow','Noa Dayan','noa.dayan@opsflow.local','050-700-1007','Afula','job','Monitor KPIs and improve operational workflow performance.','open'],
    ['QA Analyst - North 8','Quality Bridge','Hala Nassar','hala.nassar@quality.local','050-700-1008','Nof HaGalil','job','Run functional QA, write bug reports, and support release cycles.','open'],
    ['PMO Assistant - North 9','PMO House','Erez Tal','erez.tal@pmohouse.local','050-700-1009','Safed','job','Assist governance, planning, and PMO reporting activities.','open'],
    ['SQL Reporting Analyst - North 10','Insight SQL','Shani Mor','shani.mor@insightsql.local','050-700-1010','Kiryat Bialik','job','Produce SQL reports and maintain business reporting accuracy.','open'],
    ['CRM Administrator - North 11','Hub CRM','Yousef Khoury','yousef.khoury@hubcrm.local','050-700-1011','Haifa','job','Own CRM data quality, statuses, and pipeline visibility.','open'],
    ['Systems Analyst - North 12','MIS Works','Alaa Zidan','alaa.zidan@misworks.local','050-700-1012','Yokneam','job','Analyze requirements and document future-state workflows.','open'],
    ['Implementation Specialist - North 13','Deploy IT','Yael Friedman','yael.friedman@deployit.local','050-700-1013','Nazareth','job','Support onboarding, configuration, and implementation plans.','open'],
    ['Junior Product Analyst - North 14','Product North','Sahar Odeh','sahar.odeh@productnorth.local','050-700-1014','Karmiel','job','Monitor product metrics and help prepare analytical summaries.','open'],
    ['Customer Success Analyst - North 15','Success Point','Talia Amir','talia.amir@successpoint.local','050-700-1015','Acre','job','Track support quality, adoption, and customer operational metrics.','open'],
    ['Business Analyst - North 16','Flow Metrics','Yarden Shaham','yarden.shaham@flowmetrics.local','050-700-1016','Tirat Carmel','job','Support reporting and process improvement initiatives.','open'],
    ['Data Analyst - North 17','North Data','Omar Kabha','omar.kabha@northdata.local','050-700-1017','Afula','job','Analyze trends and create performance reports.','open'],
    ['BI Analyst - North 18','Insight Factory','Lena Kassis','lena.kassis@insightfactory.local','050-700-1018','Nof HaGalil','job','Create visual dashboards and executive summaries.','open'],
    ['ERP Support Specialist - North 19','ERP Core','Keren Levi','keren.levi@erpcore.local','050-700-1019','Safed','job','Assist ERP users and maintain support documentation.','open'],
    ['Information Systems Coordinator - North 20','Systems Gate','Amir Dori','amir.dori@systemsgate.local','050-700-1020','Kiryat Bialik','job','Coordinate system operations and reporting tasks.','open'],
    ['Data Analyst Intern - Cohort 1','Campus Data','Nadine Farah','nadine.farah@campusdata.local','050-700-1021','Nazareth','internship','Hands-on analytics internship for MIS students.','open'],
    ['BI Intern - Cohort 2','BI Academy','Gilad Bar','gilad.bar@biacademy.local','050-700-1022','Karmiel','internship','Support dashboarding and KPI analysis.','open'],
    ['ERP Intern - Cohort 3','ERP Track','Rasha Salim','rasha.salim@erptrack.local','050-700-1023','Acre','internship','Assist ERP process mapping and support tasks.','open'],
    ['QA Intern - Cohort 4','QA Ready','Moran Azulai','moran.azulai@qaready.local','050-700-1024','Tirat Carmel','internship','Participate in testing, cases, and documentation.','open'],
    ['Project Management Intern - Cohort 5','PMO Campus','Hussein Jaar','hussein.jaar@pmocampus.local','050-700-1025','Afula','internship','Help track timelines and project action items.','open'],
    ['Operations Intern - Cohort 6','Ops Interns','Rinat Harel','rinat.harel@opsinterns.local','050-700-1026','Nof HaGalil','internship','Support business operations reporting and coordination.','open'],
    ['Systems Support Intern - Cohort 7','Support Lab','Khaled Mansour','khaled.mansour@supportlab.local','050-700-1027','Safed','internship','Assist users and document support issues.','open'],
    ['CRM Intern - Cohort 8','CRM Studio','Aseel Taha','aseel.taha@crmstudio.local','050-700-1028','Kiryat Bialik','internship','Support CRM updates and data quality.','open'],
    ['Business Analysis Intern - Cohort 9','Analyst Path','Lihi Segal','lihi.segal@analystpath.local','050-700-1029','Haifa','internship','Analyze workflows and prepare documentation.','open'],
    ['Product Intern - Cohort 10','Product School','Fadi Hamdan','fadi.hamdan@productschool.local','050-700-1030','Yokneam','internship','Support product reporting and feedback analysis.','open'],
    ['Data Analyst Intern - Cohort 11','Campus Data','Nadine Farah','nadine.farah2@campusdata.local','050-700-1031','Nazareth','internship','Practice SQL and reporting in a structured environment.','open'],
    ['BI Intern - Cohort 12','BI Academy','Gilad Bar','gilad.bar2@biacademy.local','050-700-1032','Karmiel','internship','Prepare dashboards and summaries for business teams.','open'],
    ['ERP Intern - Cohort 13','ERP Track','Rasha Salim','rasha.salim2@erptrack.local','050-700-1033','Acre','internship','Support process improvement using ERP data.','open'],
    ['QA Intern - Cohort 14','QA Ready','Moran Azulai','moran.azulai2@qaready.local','050-700-1034','Tirat Carmel','internship','Help validate releases and fixes.','open'],
    ['Project Management Intern - Cohort 15','PMO Campus','Hussein Jaar','hussein.jaar2@pmocampus.local','050-700-1035','Afula','internship','Support coordination and execution reporting.','open'],
    ['CRM Optimization Project - Cycle 1','Hub CRM','Yousef Khoury','yousef.khoury@hubcrm.local','050-700-1036','Nof HaGalil','project','Applied project for CRM workflow redesign and KPI tracking.','open'],
    ['BI Dashboard Project - Cycle 2','Insight Factory','Lena Kassis','lena.kassis@insightfactory.local','050-700-1037','Safed','project','Create a dashboard for operational and academic reporting.','open'],
    ['ERP Process Mapping Project - Cycle 3','ERP Core','Keren Levi','keren.levi@erpcore.local','050-700-1038','Kiryat Bialik','project','Map ERP-related business processes and recommend improvements.','open'],
    ['Inventory Analytics Project - Cycle 4','North Data','Omar Kabha','omar.kabha@northdata.local','050-700-1039','Haifa','project','Analyze stock and inventory data to improve planning.','open'],
    ['Student Placement Portal Project - Cycle 5','Campus Flow','Hiba Saad','hiba.saad@campusflow.local','050-700-1040','Yokneam','project','Build workflows for opportunity matching and placement tracking.','open'],
    ['Recruitment Workflow Project - Cycle 6','Talent North','Amit Shalev','amit.shalev@talentnorth.local','050-700-1041','Nazareth','project','Improve candidate pipeline visibility and CRM updates.','open'],
    ['Customer Service KPI Project - Cycle 7','Service Pulse','Sami Awad','sami.awad@servicepulse.local','050-700-1042','Karmiel','project','Track service metrics and analyze support quality.','open'],
    ['Project Tracking Dashboard - Cycle 8','PMO House','Erez Tal','erez.tal@pmohouse.local','050-700-1043','Acre','project','Build progress dashboards for active initiatives.','open'],
    ['Admissions Reporting Project - Cycle 9','Campus Reports','Dina Habib','dina.habib@campusreports.local','050-700-1044','Tirat Carmel','project','Improve admissions reporting and trend analysis.','open'],
    ['Operations Automation Project - Cycle 10','OpsFlow','Noa Dayan','noa.dayan@opsflow.local','050-700-1045','Afula','project','Automate recurring reporting and approval tasks.','open'],
    ['CRM Optimization Project - Cycle 11','Hub CRM','Yousef Khoury','yousef.khoury2@hubcrm.local','050-700-1046','Nof HaGalil','project','Improve CRM data structure and status handling.','open'],
    ['BI Dashboard Project - Cycle 12','Insight Factory','Lena Kassis','lena.kassis2@insightfactory.local','050-700-1047','Safed','project','Extend analytical reporting and chart coverage.','open'],
    ['ERP Process Mapping Project - Cycle 13','ERP Core','Keren Levi','keren.levi2@erpcore.local','050-700-1048','Kiryat Bialik','project','Document ERP flow and support redesign.','open'],
    ['Inventory Analytics Project - Cycle 14','North Data','Omar Kabha','omar.kabha2@northdata.local','050-700-1049','Haifa','project','Build inventory summaries and forecasting sheets.','open'],
    ['Student Placement Portal Project - Cycle 15','Campus Flow','Hiba Saad','hiba.saad2@campusflow.local','050-700-1050','Yokneam','project','Enhance portal matching flows and reporting.','open']
  ];
  for (const row of rows) {
    await runQuery(
      `INSERT INTO opportunities (title, company_name, contact_name, contact_email, contact_phone, location, category, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, row
    );
  }
}

async function seedDemoData() {
  const contactCount = await getOne('SELECT COUNT(*)::int AS count FROM contacts');
  if (contactCount.count === 0) {
    await runQuery(`INSERT INTO contacts (name, email, subject, message) VALUES
      ('Dana Student','dana@student.local','Need internship support','Looking for BI internship in the north.'),
      ('Rami Employer','rami@company.local','Need candidates','Searching for MIS graduates for analyst role.'),
      ('Lina Graduate','lina@graduate.local','CRM access','Can I track my applications history?')`);
  }

  const appCount = await getOne('SELECT COUNT(*)::int AS count FROM applications');
  if (appCount.count === 0) {
    const student = await getOne("SELECT id FROM users WHERE email = 'student@hub.local'");
    const graduate = await getOne("SELECT id FROM users WHERE email = 'graduate@hub.local'");
    const opps = await getAll('SELECT id FROM opportunities ORDER BY id ASC LIMIT 6');
    if (student && graduate && opps.length >= 6) {
      await runQuery(
        `INSERT INTO applications (user_id, opportunity_id, status, notes) VALUES
        ($1,$2,'pending','Applied through portal'),
        ($1,$3,'reviewed','Strong SQL profile'),
        ($4,$5,'accepted','Interview completed successfully'),
        ($4,$6,'pending','Waiting for hiring manager feedback')`,
        [student.id, opps[0].id, opps[1].id, graduate.id, opps[2].id, opps[3].id]
      );
    }
  }
}

async function initDb() {
  await ensureSchema();
  await seedUsers();
  await seedOpportunities();
  await seedDemoData();
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (!roles.includes(req.session.user.role)) return res.status(403).render('403', { currentPage: '' });
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
  let i = 1;
  if (filters.category) { sql += ` AND category = $${i++}`; params.push(filters.category); }
  if (filters.location) { sql += ` AND location ILIKE $${i++}`; params.push(`%${filters.location}%`); }
  if (filters.status) { sql += ` AND status = $${i++}`; params.push(filters.status); }
  if (filters.q) {
    sql += ` AND (title ILIKE $${i} OR description ILIKE $${i+1} OR location ILIKE $${i+2} OR company_name ILIKE $${i+3})`;
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
    i += 4;
  }
  sql += ' ORDER BY id DESC';
  return { sql, params };
}

app.get('/', async (req, res) => {
  const latest = await getAll('SELECT * FROM opportunities ORDER BY id DESC LIMIT 6');
  res.render('index', { currentPage: 'home', latest });
});
app.get('/jobs', async (req, res) => {
  const items = await getAll(`SELECT * FROM opportunities WHERE category = 'job' ORDER BY id DESC`);
  res.render('listing', { currentPage: 'jobs', title: 'Jobs', subtitle: 'Open analyst, BI, ERP and MIS jobs in northern Israel.', items });
});
app.get('/internships', async (req, res) => {
  const items = await getAll(`SELECT * FROM opportunities WHERE category = 'internship' ORDER BY id DESC`);
  res.render('listing', { currentPage: 'internships', title: 'Internships', subtitle: 'Student and graduate internships with contact details and clear status.', items });
});
app.get('/projects', async (req, res) => {
  const items = await getAll(`SELECT * FROM opportunities WHERE category = 'project' ORDER BY id DESC`);
  res.render('listing', { currentPage: 'projects', title: 'Projects', subtitle: 'Applied MIS projects with CRM-style visibility and real contacts.', items });
});
app.get('/search', async (req, res) => {
  const filters = { q: req.query.q || '', location: req.query.location || '', category: req.query.category || '', status: req.query.status || '' };
  const { sql, params } = buildSearch(filters);
  const items = await getAll(sql, params);
  res.render('search', { currentPage: 'search', filters, items });
});
app.get('/contact', (req, res) => res.render('contact', { currentPage: 'contact', flash: null }));
app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  await runQuery('INSERT INTO contacts (name,email,subject,message) VALUES ($1,$2,$3,$4)', [name, email, subject, message]);
  res.render('contact', { currentPage: 'contact', flash: { type: 'success', text: 'Message sent successfully.' } });
});
app.get('/login', (req, res) => res.render('login', { currentPage: 'login', flash: null }));
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await getOne('SELECT * FROM users WHERE email = $1', [email]);
  if (!user) return res.status(400).render('login', { currentPage: 'login', flash: { type: 'error', text: 'Invalid email or password.' } });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).render('login', { currentPage: 'login', flash: { type: 'error', text: 'Invalid email or password.' } });
  req.session.user = { id: user.id, fullname: user.fullname, email: user.email, role: user.role };
  redirectByRole(user.role, res);
});
app.get('/signup', (req, res) => res.render('signup', { currentPage: 'signup', flash: null }));
app.post('/signup', async (req, res) => {
  const { fullname, email, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const created = await runQuery(
      'INSERT INTO users (fullname,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id',
      [fullname, email, hash, role]
    );
    req.session.user = { id: created.rows[0].id, fullname, email, role };
    redirectByRole(role, res);
  } catch (error) {
    res.status(400).render('signup', { currentPage: 'signup', flash: { type: 'error', text: 'Email already exists or input is invalid.' } });
  }
});
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

app.get('/student-dashboard', requireRole(['student']), async (req, res) => {
  const apps = await getAll(`
    SELECT a.*, o.title, o.category, o.company_name, o.location
    FROM applications a JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.user_id = $1 ORDER BY a.id DESC`, [req.session.user.id]);
  const suggested = await getAll(`SELECT * FROM opportunities ORDER BY id DESC LIMIT 8`);
  res.render('role-dashboard', { currentPage: '', title: 'Student Dashboard', subtitle: 'Track your applications and discover new roles.', user: req.session.user, apps, suggested, accent: 'student' });
});
app.get('/graduate-dashboard', requireRole(['graduate']), async (req, res) => {
  const apps = await getAll(`
    SELECT a.*, o.title, o.category, o.company_name, o.location
    FROM applications a JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.user_id = $1 ORDER BY a.id DESC`, [req.session.user.id]);
  const suggested = await getAll(`SELECT * FROM opportunities ORDER BY id DESC LIMIT 8`);
  res.render('role-dashboard', { currentPage: '', title: 'Graduate Dashboard', subtitle: 'Manage your pipeline and follow employers in the region.', user: req.session.user, apps, suggested, accent: 'graduate' });
});
app.get('/employer-dashboard', requireRole(['employer']), async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities ORDER BY id DESC LIMIT 12');
  const recentApps = await getAll(`
    SELECT a.status, a.created_at, u.fullname, u.email, o.title, o.company_name
    FROM applications a
    JOIN users u ON a.user_id = u.id
    JOIN opportunities o ON a.opportunity_id = o.id
    ORDER BY a.id DESC LIMIT 8`);
  res.render('employer-dashboard', { currentPage: '', user: req.session.user, items, recentApps });
});
app.get('/admin-dashboard', requireRole(['admin']), async (req, res) => {
  const usersCount = await getOne('SELECT COUNT(*)::int AS c FROM users');
  const contactsCount = await getOne('SELECT COUNT(*)::int AS c FROM contacts');
  const opportunitiesCount = await getOne('SELECT COUNT(*)::int AS c FROM opportunities');
  const appsCount = await getOne('SELECT COUNT(*)::int AS c FROM applications');
  const byCategory = await getAll('SELECT category, COUNT(*)::int AS total FROM opportunities GROUP BY category ORDER BY category');
  const byStatus = await getAll('SELECT status, COUNT(*)::int AS total FROM applications GROUP BY status ORDER BY status');
  const byLocation = await getAll('SELECT location, COUNT(*)::int AS total FROM opportunities GROUP BY location ORDER BY total DESC, location ASC LIMIT 10');
  const latestUsers = await getAll('SELECT fullname, email, role, created_at FROM users ORDER BY id DESC LIMIT 6');
  res.render('admin-dashboard', {
    currentPage: '', user: req.session.user,
    stats: { usersCount: usersCount.c, contactsCount: contactsCount.c, opportunitiesCount: opportunitiesCount.c, appsCount: appsCount.c },
    byCategory, byStatus, byLocation, latestUsers
  });
});
app.get('/crm', requireRole(['admin']), async (req, res) => {
  const users = await getAll('SELECT id, fullname, email, role, created_at FROM users ORDER BY id DESC');
  const opportunities = await getAll('SELECT * FROM opportunities ORDER BY id DESC');
  const contacts = await getAll('SELECT * FROM contacts ORDER BY id DESC');
  const applications = await getAll(`
    SELECT a.id, a.status, a.notes, a.created_at, u.fullname, u.email, o.title, o.category, o.company_name
    FROM applications a JOIN users u ON a.user_id = u.id JOIN opportunities o ON a.opportunity_id = o.id ORDER BY a.id DESC`);
  res.render('crm', { currentPage: '', users, opportunities, contacts, applications, errorMessage: '' });
});
app.get('/manage/opportunity/new', requireRole(['admin', 'employer']), (req, res) => {
  res.render('opportunity-form', { currentPage: '', item: null, action: '/manage/opportunity/new', pageTitle: 'Add Opportunity' });
});
app.post('/manage/opportunity/new', requireRole(['admin', 'employer']), async (req, res) => {
  const { title, company_name, contact_name, contact_email, contact_phone, location, category, description, status } = req.body;
  await runQuery(
    'INSERT INTO opportunities (title, company_name, contact_name, contact_email, contact_phone, location, category, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [title, company_name || null, contact_name || null, contact_email || null, contact_phone || null, location, category, description, status || 'open']
  );
  res.redirect('/crm');
});
app.get('/manage/opportunity/:id/edit', requireRole(['admin', 'employer']), async (req, res) => {
  const item = await getOne('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
  if (!item) return res.status(404).render('404', { currentPage: '' });
  res.render('opportunity-form', { currentPage: '', item, action: `/manage/opportunity/${item.id}/edit`, pageTitle: 'Edit Opportunity' });
});
app.post('/manage/opportunity/:id/edit', requireRole(['admin', 'employer']), async (req, res) => {
  const { title, company_name, contact_name, contact_email, contact_phone, location, category, description, status } = req.body;
  await runQuery(
    'UPDATE opportunities SET title=$1, company_name=$2, contact_name=$3, contact_email=$4, contact_phone=$5, location=$6, category=$7, description=$8, status=$9 WHERE id=$10',
    [title, company_name || null, contact_name || null, contact_email || null, contact_phone || null, location, category, description, status, req.params.id]
  );
  res.redirect('/crm');
});
app.post('/manage/opportunity/:id/delete', requireRole(['admin', 'employer']), async (req, res) => {
  await runQuery('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
  res.redirect('/crm');
});
app.post('/apply/:id', requireRole(['student', 'graduate']), async (req, res) => {
  try {
    await runQuery('INSERT INTO applications (user_id, opportunity_id, status, notes) VALUES ($1,$2,$3,$4)', [req.session.user.id, req.params.id, 'pending', 'Applied from portal']);
  } catch (e) {}
  res.redirect('back');
});
app.post('/applications/:id/status', requireRole(['admin']), async (req, res) => {
  await runQuery('UPDATE applications SET status=$1, notes=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3', [req.body.status, req.body.notes || '', req.params.id]);
  res.redirect('/crm');
});
app.get('/ai-assistant', requireAuth, (req, res) => res.render('ai-assistant', { currentPage: 'ai', messages: [] }));
app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const prompt = (req.body.message || '').trim();
  const stats = await getAll('SELECT category, COUNT(*)::int AS total FROM opportunities GROUP BY category ORDER BY category');
  const latest = await getAll('SELECT title, location, category FROM opportunities ORDER BY id DESC LIMIT 5');
  let response = 'AI assistant response:\n\n';
  if (!prompt) response += 'Please write a question.';
  else if (/skill|skills|כישורים/i.test(prompt)) response += 'Top relevant areas include SQL, reporting, BI, ERP familiarity, analytics, QA, and project coordination.';
  else if (/crm|summary|status|סכם|סטטוס/i.test(prompt)) response += 'CRM focus should be reviewing pending applications, promoting accepted projects, and keeping statuses updated across the pipeline.';
  else response += 'Use this assistant for job matching, skills summaries, CRM summaries, and drafting short responses. Latest opportunities: ' + latest.map(x => `${x.title} (${x.location})`).join(', ') + '.';
  response += '\n\nOpportunities by category: ' + stats.map(s => `${s.category}=${s.total}`).join(', ') + '.';
  await runQuery('INSERT INTO ai_messages (user_role,prompt,response) VALUES ($1,$2,$3)', [req.session.user.role, prompt, response]);
  res.json({ answer: response });
});
app.get('/api/charts', requireRole(['admin']), async (req, res) => {
  const byCategory = await getAll('SELECT category AS label, COUNT(*)::int AS value FROM opportunities GROUP BY category ORDER BY category');
  const byStatus = await getAll('SELECT status AS label, COUNT(*)::int AS value FROM applications GROUP BY status ORDER BY status');
  const byLocation = await getAll('SELECT location AS label, COUNT(*)::int AS value FROM opportunities GROUP BY location ORDER BY value DESC, label ASC LIMIT 10');
  res.json({ byCategory, byStatus, byLocation });
});
app.use((req, res) => res.status(404).render('404', { currentPage: '' }));
initDb().then(async () => {
  await pool.query('SELECT 1');
  app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));
}).catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
