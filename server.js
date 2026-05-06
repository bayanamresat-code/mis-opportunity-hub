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
    );
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
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS ai_messages (
      id SERIAL PRIMARY KEY,
      user_role TEXT,
      prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function ensureSeedData() {
  const countRow = await getOne('SELECT COUNT(*)::int as count FROM opportunities');
  if (countRow && countRow.count > 0) return;

  await runQuery(`
    INSERT INTO opportunities (
      title, company_name, contact_name, contact_email, contact_phone,
      location, category, description, status
    ) VALUES
      ('Business Analyst - North 1','Carmel Insights Ltd.','Noa Levi','noa.levi@carmel-insights.co.il','050-710-1001','Haifa','job','Entry-to-junior role focused on analysis, reporting, and process improvement.','open'),
      ('Data Analyst - North 2','Galilee DataWorks','Amit Ben David','amit@galileedata.co.il','050-710-1002','Yokneam','job','Support dashboards, KPI reporting, and SQL-based analytics for business teams.','open'),
      ('BI Analyst - North 3','Northern Metrics Group','Rana Khoury','rana.khoury@nmetrics.co.il','050-710-1003','Nazareth','job','Build reports and support decision-making processes for operations teams.','open'),
      ('ERP Support Specialist - North 4','Karmiel Systems House','Lior Azulay','lior.azulay@ksh.co.il','050-710-1004','Karmiel','job','Support ERP workflows, user training, and operational data quality.','open'),
      ('Information Systems Coordinator - North 5','Coastline Process Labs','Maya Hason','maya.hason@coastline-labs.co.il','050-710-1005','Acre','job','Coordinate systems users, documentation, and cross-team process updates.','open'),
      ('Project Coordinator - North 6','Harbor PMO Services','Shir Cohen','shir.cohen@harborpmo.co.il','050-710-1006','Tirat Carmel','job','Track project tasks, schedules, and stakeholder communication.','open'),
      ('Operations Analyst - North 7','Emek Operations Hub','Omer Mizrahi','omer.mizrahi@emekops.co.il','050-710-1007','Afula','job','Monitor operational KPIs and improve workflow efficiency.','open'),
      ('QA Analyst - North 8','Quality Arc Ltd.','Dana Zidan','dana.zidan@qualityarc.co.il','050-710-1008','Nof HaGalil','job','Run functional tests, document bugs, and support release quality.','open'),
      ('PMO Assistant - North 9','Safed Project Office','Yael Peretz','yael.peretz@safedpmo.co.il','050-710-1009','Safed','job','Assist PMO reporting, status tracking, and project governance.','open'),
      ('SQL Reporting Analyst - North 10','Bialik Reporting Center','Nir Vaknin','nir.vaknin@brc.co.il','050-710-1010','Kiryat Bialik','job','Create SQL reports and support analytics-driven decisions.','open'),
      ('CRM Administrator - North 11','BlueCRM Solutions','Tal Romano','tal.romano@bluecrm.co.il','050-710-1011','Haifa','job','Manage CRM data quality, pipelines, and user support.','open'),
      ('Systems Analyst - North 12','Yokneam Digital Systems','Keren Avni','keren.avni@yds.co.il','050-710-1012','Yokneam','job','Analyze system requirements and document business processes.','open'),
      ('Implementation Specialist - North 13','NazTech Deployments','Rami Awad','rami.awad@naztech.co.il','050-710-1013','Nazareth','job','Support onboarding and implementation of business systems.','open'),
      ('Junior Product Analyst - North 14','Product Pulse North','Adi Weiss','adi.weiss@productpulse.co.il','050-710-1014','Karmiel','job','Monitor product usage and build analytical summaries.','open'),
      ('Customer Success Analyst - North 15','Success Bridge Ltd.','Lena Saad','lena.saad@successbridge.co.il','050-710-1015','Acre','job','Track customer metrics and improve support workflows.','open'),
      ('Business Analyst - North 16','Tirat Strategy Works','Ofir Dayan','ofir.dayan@tsw.co.il','050-710-1016','Tirat Carmel','job','Support reporting and operational improvement initiatives.','open'),
      ('Data Analyst - North 17','Afula Insight Lab','Michal Biton','michal.biton@afulainsight.co.il','050-710-1017','Afula','job','Analyze trends and build business performance reports.','open'),
      ('BI Analyst - North 18','Galil BI Studio','Yousef Daher','yousef.daher@galilbi.co.il','050-710-1018','Nof HaGalil','job','Create visual dashboards and BI summaries.','open'),
      ('ERP Support Specialist - North 19','North ERP Care','Rivka Malka','rivka.malka@nerpcare.co.il','050-710-1019','Safed','job','Assist ERP users and operational documentation.','open'),
      ('Information Systems Coordinator - North 20','Bialik Workflow Hub','Eran Harel','eran.harel@workflowhub.co.il','050-710-1020','Kiryat Bialik','job','Coordinate system-related processes and reporting.','open'),
      ('Data Analyst Intern - Cohort 1','Nazareth Data Lab','Mira Haddad','mira.haddad@nazdatalab.co.il','050-710-1021','Nazareth','internship','Hands-on analytics internship for students in information systems.','open'),
      ('BI Intern - Cohort 2','Insight Apprentices','Noam Moyal','noam.moyal@insightapp.co.il','050-710-1022','Karmiel','internship','Support dashboarding and KPI analysis.','open'),
      ('ERP Intern - Cohort 3','Acre ERP Studio','Sivan Kadosh','sivan.kadosh@acreerp.co.il','050-710-1023','Acre','internship','Assist ERP process mapping and support activities.','open'),
      ('QA Intern - Cohort 4','BugTrack North','Rotem Segal','rotem.segal@bugtracknorth.co.il','050-710-1024','Tirat Carmel','internship','Participate in testing and documentation.','open'),
      ('Project Management Intern - Cohort 5','PM Launchpad','Eli Golan','eli.golan@pmlaunchpad.co.il','050-710-1025','Afula','internship','Help track project timelines and action items.','open'),
      ('Operations Intern - Cohort 6','Ops Forward','Hiba Salameh','hiba.salameh@opsforward.co.il','050-710-1026','Nof HaGalil','internship','Support business operations reporting and coordination.','open'),
      ('Systems Support Intern - Cohort 7','Support First North','Avigail Azulai','avigail.azulai@supportfirst.co.il','050-710-1027','Safed','internship','Assist users and document system support issues.','open'),
      ('CRM Intern - Cohort 8','CRM Growth Desk','Matan Shani','matan.shani@crmgrowth.co.il','050-710-1028','Kiryat Bialik','internship','Support CRM updates and data quality activities.','open'),
      ('Business Analysis Intern - Cohort 9','Haifa Process Partners','Shani Rosen','shani.rosen@hpp.co.il','050-710-1029','Haifa','internship','Analyze workflows and prepare business documentation.','open'),
      ('Product Intern - Cohort 10','Yokneam Product Lab','Dean Tzur','dean.tzur@yplab.co.il','050-710-1030','Yokneam','internship','Support product reporting and user feedback analysis.','open'),
      ('Data Analyst Intern - Cohort 11','Naz Insight Program','Aseel Khoury','aseel.khoury@nazinsight.co.il','050-710-1031','Nazareth','internship','Practice reporting and basic SQL analysis.','open'),
      ('BI Intern - Cohort 12','Karmiel Dashboards','Gal Malul','gal.malul@kdashboards.co.il','050-710-1032','Karmiel','internship','Prepare dashboards and summaries for teams.','open'),
      ('ERP Intern - Cohort 13','ERP Pathways','Tomer Ben Lulu','tomer.benlulu@erppathways.co.il','050-710-1033','Acre','internship','Support process improvement with ERP data.','open'),
      ('QA Intern - Cohort 14','North Release Lab','Lihi Sabag','lihi.sabag@nrlab.co.il','050-710-1034','Tirat Carmel','internship','Help validate system releases and fixes.','open'),
      ('Project Management Intern - Cohort 15','Execution Bridge','Yarden Bar','yarden.bar@executionbridge.co.il','050-710-1035','Afula','internship','Support coordination and reporting of project execution.','open'),
      ('CRM Optimization Project - Cycle 1','Galilee CRM Partners','Roei Sela','roei.sela@gcrm.co.il','050-710-1036','Nof HaGalil','project','Applied project for CRM workflow redesign and KPI tracking.','open'),
      ('BI Dashboard Project - Cycle 2','Safed Analytics Center','Hadas Elbaz','hadas.elbaz@sac.co.il','050-710-1037','Safed','project','Create a dashboard for operational and academic reporting.','open'),
      ('ERP Process Mapping Project - Cycle 3','FlowMap Systems','Shahar Friedman','shahar.friedman@flowmap.co.il','050-710-1038','Kiryat Bialik','project','Map ERP-related business processes and recommend improvements.','open'),
      ('Inventory Analytics Project - Cycle 4','Inventory IQ','Bar Katz','bar.katz@inventoryiq.co.il','050-710-1039','Haifa','project','Analyze stock and inventory data to improve planning.','open'),
      ('Student Placement Portal Project - Cycle 5','Placement Grid','Tamar Golan','tamar.golan@placementgrid.co.il','050-710-1040','Yokneam','project','Build workflows for opportunity matching and placement tracking.','open'),
      ('Recruitment Workflow Project - Cycle 6','Talent Route North','Samer Nassar','samer.nassar@talentroute.co.il','050-710-1041','Nazareth','project','Improve candidate pipeline visibility and CRM updates.','open'),
      ('Customer Service KPI Project - Cycle 7','Service Metrics House','Coral Ohana','coral.ohana@smh.co.il','050-710-1042','Karmiel','project','Track service metrics and analyze support quality.','open'),
      ('Project Tracking Dashboard - Cycle 8','Milestone Dash Ltd.','Gilad Peri','gilad.peri@milestonedash.co.il','050-710-1043','Acre','project','Build progress dashboards for active initiatives.','open'),
      ('Admissions Reporting Project - Cycle 9','Campus Reporting Works','Roni Nahum','roni.nahum@campusreporting.co.il','050-710-1044','Tirat Carmel','project','Improve admissions reporting and trend analysis.','open'),
      ('Operations Automation Project - Cycle 10','Automation Valley','Maor Dahan','maor.dahan@automationvalley.co.il','050-710-1045','Afula','project','Automate recurring reporting and approval tasks.','open'),
      ('CRM Optimization Project - Cycle 11','CRM North Scale','Nurit Aharon','nurit.aharon@crmnorthscale.co.il','050-710-1046','Nof HaGalil','project','Improve CRM data structure and status handling.','open'),
      ('BI Dashboard Project - Cycle 12','DashView Analytics','Neta Ben Ami','neta.benami@dashview.co.il','050-710-1047','Safed','project','Extend analytical reporting and chart coverage.','open'),
      ('ERP Process Mapping Project - Cycle 13','Process Canvas','Eyal Madmon','eyal.madmon@processcanvas.co.il','050-710-1048','Kiryat Bialik','project','Document ERP flow and support redesign.','open'),
      ('Inventory Analytics Project - Cycle 14','Forecast Harbor','Adva Ben Hamo','adva.benh@forecastharbor.co.il','050-710-1049','Haifa','project','Build inventory summaries and forecasting sheets.','open'),
      ('Student Placement Portal Project - Cycle 15','Bialik Portal Systems','Tamar Golan','tamar.golan@bialikportal.co.il','050-710-1050','Yokneam','project','Enhance portal matching flows and reporting.','open');
  `);
}

async function initDb() {
  await ensureSchema();
  await ensureSeedData();

  const admin = await getOne('SELECT id FROM users WHERE email = $1', ['admin@hub.local']);
  if (!admin) {
    const hash = await bcrypt.hash('Admin123!', 10);
    await runQuery(
      'INSERT INTO users (fullname, email, password, role) VALUES ($1,$2,$3,$4)',
      ['System Admin', 'admin@hub.local', hash, 'admin']
    );
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
  let i = 1;

  if (filters.category) {
    sql += ` AND category = $${i++}`;
    params.push(filters.category);
  }
  if (filters.location) {
    sql += ` AND location ILIKE $${i++}`;
    params.push(`%${filters.location}%`);
  }
  if (filters.status) {
    sql += ` AND status = $${i++}`;
    params.push(filters.status);
  }
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
  const items = await getAll('SELECT * FROM opportunities WHERE category = $1 ORDER BY id DESC', ['job']);
  res.render('jobs', { currentPage: 'jobs', title: 'Jobs', subtitle: 'Explore jobs in the north of Israel.', items });
});

app.get('/internships', async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities WHERE category = $1 ORDER BY id DESC', ['internship']);
  res.render('internships', { currentPage: 'internships', title: 'Internships', subtitle: 'Explore internships for students and graduates.', items });
});

app.get('/projects', async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities WHERE category = $1 ORDER BY id DESC', ['project']);
  res.render('projects', { currentPage: 'projects', title: 'Projects', subtitle: 'Explore applied projects and innovation initiatives.', items });
});

app.get('/search', async (req, res) => {
  const filters = { q: req.query.q || '', location: req.query.location || '', category: req.query.category || '', status: req.query.status || '' };
  const { sql, params } = buildSearch(filters);
  const items = await getAll(sql, params);
  res.render('search', { currentPage: 'search', filters, items });
});

app.get('/contact', (req, res) => {
  res.render('contact', { currentPage: 'contact', message: '', messageType: '' });
});

app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  await runQuery('INSERT INTO contacts (name,email,subject,message) VALUES ($1,$2,$3,$4)', [name, email, subject, message]);
  res.render('contact', { currentPage: 'contact', message: 'Message sent successfully.', messageType: 'success' });
});

app.get('/login', (req, res) => {
  res.render('login', { currentPage: 'login', message: '', messageType: '' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await getOne('SELECT * FROM users WHERE email = $1', [email]);
  if (!user) return res.status(400).render('login', { currentPage: 'login', message: 'Invalid email or password', messageType: 'error' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).render('login', { currentPage: 'login', message: 'Invalid email or password', messageType: 'error' });

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
    const result = await runQuery(
      'INSERT INTO users (fullname,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id',
      [fullname, email, hash, role]
    );
    req.session.user = { id: result.rows[0].id, fullname, email, role };
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
    'SELECT a.*, o.title, o.category, o.company_name FROM applications a JOIN opportunities o ON a.opportunity_id = o.id WHERE a.user_id = $1 ORDER BY a.id DESC',
    [req.session.user.id]
  );
  res.render('student-dashboard', { currentPage: '', user: req.session.user, apps });
});

app.get('/graduate-dashboard', requireRole(['graduate']), async (req, res) => {
  const apps = await getAll(
    'SELECT a.*, o.title, o.category, o.company_name FROM applications a JOIN opportunities o ON a.opportunity_id = o.id WHERE a.user_id = $1 ORDER BY a.id DESC',
    [req.session.user.id]
  );
  res.render('graduate-dashboard', { currentPage: '', user: req.session.user, apps });
});

app.get('/employer-dashboard', requireRole(['employer']), async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities ORDER BY id DESC LIMIT 10');
  res.render('employer-dashboard', { currentPage: '', user: req.session.user, items });
});

app.get('/admin-dashboard', requireRole(['admin']), async (req, res) => {
  const usersCount = await getOne('SELECT COUNT(*)::int as c FROM users');
  const contactsCount = await getOne('SELECT COUNT(*)::int as c FROM contacts');
  const opportunitiesCount = await getOne('SELECT COUNT(*)::int as c FROM opportunities');
  const appsCount = await getOne('SELECT COUNT(*)::int as c FROM applications');
  const byCategory = await getAll('SELECT category, COUNT(*)::int as total FROM opportunities GROUP BY category ORDER BY category');
  const byStatus = await getAll('SELECT status, COUNT(*)::int as total FROM applications GROUP BY status ORDER BY status');
  const byLocation = await getAll('SELECT location, COUNT(*)::int as total FROM opportunities GROUP BY location ORDER BY total DESC, location ASC LIMIT 10');

  res.render('admin-dashboard', {
    currentPage: '',
    user: req.session.user,
    stats: { usersCount: usersCount.c, contactsCount: contactsCount.c, opportunitiesCount: opportunitiesCount.c, appsCount: appsCount.c },
    byCategory,
    byStatus,
    byLocation
  });
});

app.get('/crm', requireRole(['admin']), async (req, res) => {
  try {
    const users = await getAll('SELECT fullname,email,role,created_at FROM users ORDER BY id DESC');
    const opportunities = await getAll('SELECT * FROM opportunities ORDER BY id DESC');
    const contacts = await getAll('SELECT * FROM contacts ORDER BY id DESC');
    const applications = await getAll(`
      SELECT a.id, a.status, a.notes, a.created_at, u.fullname, u.email, o.title, o.category, o.company_name
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN opportunities o ON a.opportunity_id = o.id
      ORDER BY a.id DESC
    `);
    res.render('crm', { currentPage: '', users, opportunities, contacts, applications, errorMessage: '' });
  } catch (error) {
    console.error('CRM route error:', error.message);
    res.status(500).render('crm', { currentPage: '', users: [], opportunities: [], contacts: [], applications: [], errorMessage: `CRM failed to load: ${error.message}` });
  }
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
  if (!item) return res.status(404).send('Opportunity not found');
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
  await runQuery('INSERT INTO applications (user_id, opportunity_id, status, notes) VALUES ($1,$2,$3,$4)', [req.session.user.id, req.params.id, 'pending', 'Applied from portal']);
  res.redirect('back');
});

app.post('/applications/:id/status', requireRole(['admin']), async (req, res) => {
  await runQuery('UPDATE applications SET status=$1, notes=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3', [req.body.status, req.body.notes || '', req.params.id]);
  res.redirect('/crm');
});

app.get('/ai-assistant', requireAuth, (req, res) => {
  res.render('ai-assistant', { currentPage: 'ai', messages: [] });
});

app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const prompt = (req.body.message || '').trim();
  const stats = await getAll('SELECT category, COUNT(*)::int as total FROM opportunities GROUP BY category ORDER BY category');
  const latest = await getAll('SELECT title, location, category FROM opportunities ORDER BY id DESC LIMIT 5');
  let response = 'AI assistant response.';

  if (!prompt) response += 'Please write a question.';
  else if (/skill|skills|כישורים/i.test(prompt)) response += 'Top relevant areas in this portal include SQL, reporting, BI thinking, ERP/CRM familiarity, analytics, QA, and project coordination. These align with common analyst and information-systems roles in the north.';
  else if (/crm|summary|status|סכם|סטטוס/i.test(prompt)) response += 'Current CRM focus should be: track pending applications first, move accepted projects to in_progress, and mark completed projects when delivered. This keeps the pipeline operational and measurable.';
  else response += 'Use this assistant for job matching, skills summaries, CRM summaries, and message drafting. Latest opportunities: ' + latest.map(x => `${x.title} (${x.location})`).join(', ') + '.';

  response += 'Opportunities by category: ' + stats.map(s => `${s.category}=${s.total}`).join(', ') + '.';
  await runQuery('INSERT INTO ai_messages (user_role,prompt,response) VALUES ($1,$2,$3)', [req.session.user.role, prompt, response]);
  res.json({ answer: response });
});

app.get('/api/charts', requireRole(['admin']), async (req, res) => {
  const byCategory = await getAll('SELECT category as label, COUNT(*)::int as value FROM opportunities GROUP BY category ORDER BY category');
  const byStatus = await getAll('SELECT status as label, COUNT(*)::int as value FROM applications GROUP BY status ORDER BY status');
  const byLocation = await getAll('SELECT location as label, COUNT(*)::int as value FROM opportunities GROUP BY location ORDER BY value DESC, label ASC LIMIT 10');
  res.json({ byCategory, byStatus, byLocation });
});

app.use((req, res) => {
  res.status(404).render('404', { currentPage: '' });
});

initDb().then(async () => {
  await pool.query('SELECT 1');
  app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));
}).catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
