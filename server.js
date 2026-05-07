const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const storageDir = process.env.RENDER
  ? '/opt/render/project/src/storage'
  : __dirname;

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const DATABASE = path.join(storageDir, 'database.db');

const db = new sqlite3.Database(DATABASE, (err) => {
  if (err) console.error('Failed to connect to database:', err.message);
  else console.log('Connected to SQLite database');
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
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function columnExists(table, column) {
  const columns = await getAll(`PRAGMA table_info(${table})`);
  return columns.some((col) => col.name === column);
}

async function ensureColumn(table, column, definition) {
  const exists = await columnExists(table, column);
  if (!exists) {
    await runQuery(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added missing column: ${table}.${column}`);
  }
}

async function ensureSeedData() {
  const row = await getOne('SELECT COUNT(*) AS count FROM opportunities');
  if (row && row.count > 0) return;

  const seedData = [
    ['Business Analyst', 'Galilee Data Solutions', 'Maya Cohen', 'jobs1@galileedata.co.il', '04-601-1001', 'Haifa', 'job', 'Entry-to-junior role focused on analysis, reporting, and process improvement.', 'open'],
    ['Data Analyst', 'Carmel Insight Labs', 'Noam Levi', 'jobs2@carmelinsight.co.il', '04-601-1002', 'Yokneam', 'job', 'Support dashboards, KPI reporting, and SQL-based analytics for business teams.', 'open'],
    ['BI Analyst', 'NazTech Analytics', 'Rana Khoury', 'jobs3@naztech.co.il', '04-601-1003', 'Nazareth', 'job', 'Build reports and support decision-making processes for operations teams.', 'open'],
    ['ERP Support Specialist', 'Karmiel Systems Group', 'Lior Dayan', 'jobs4@karmielsystems.co.il', '04-601-1004', 'Karmiel', 'job', 'Support ERP workflows, user training, and operational data quality.', 'open'],
    ['Information Systems Coordinator', 'Acre Process Hub', 'Shira Azulay', 'jobs5@acreprocess.co.il', '04-601-1005', 'Acre', 'job', 'Coordinate systems users, documentation, and cross-team process updates.', 'open'],
    ['Project Coordinator', 'Tirat Digital Ops', 'Daniel Haddad', 'jobs6@tiratdigital.co.il', '04-601-1006', 'Tirat Carmel', 'job', 'Track project tasks, schedules, and stakeholder communication.', 'open'],
    ['Operations Analyst', 'Afula Metrics Center', 'Yarden Moyal', 'jobs7@afulametrics.co.il', '04-601-1007', 'Afula', 'job', 'Monitor operational KPIs and improve workflow efficiency.', 'open'],
    ['QA Analyst', 'Nof Quality Tech', 'Moran Peretz', 'jobs8@nofquality.co.il', '04-601-1008', 'Nof HaGalil', 'job', 'Run functional tests, document bugs, and support release quality.', 'open'],
    ['PMO Assistant', 'Safed PMO Partners', 'Tamar Biton', 'jobs9@safedpmo.co.il', '04-601-1009', 'Safed', 'job', 'Assist PMO reporting, status tracking, and project governance.', 'open'],
    ['SQL Reporting Analyst', 'Bialik Reporting House', 'Eran Malka', 'jobs10@bialikreporting.co.il', '04-601-1010', 'Kiryat Bialik', 'job', 'Create SQL reports and support analytics-driven decisions.', 'open'],
    ['Data Analyst Intern', 'Nazareth Student Analytics', 'Maya Yassin', 'intern1@nazstudent.co.il', '04-602-2001', 'Nazareth', 'internship', 'Hands-on analytics internship for students in information systems.', 'open'],
    ['BI Intern', 'Karmiel BI Lab', 'Niv Bar', 'intern2@karmielbi.co.il', '04-602-2002', 'Karmiel', 'internship', 'Support dashboarding and KPI analysis.', 'open'],
    ['ERP Intern', 'Acre ERP Academy', 'Roei Maman', 'intern3@acreerp.co.il', '04-602-2003', 'Acre', 'internship', 'Assist ERP process mapping and support activities.', 'open'],
    ['QA Intern', 'Tirat QA Center', 'Sivan Ohana', 'intern4@tiratqa.co.il', '04-602-2004', 'Tirat Carmel', 'internship', 'Participate in testing and documentation.', 'open'],
    ['Project Management Intern', 'Afula PM Track', 'Dean Tzuberi', 'intern5@afulapm.co.il', '04-602-2005', 'Afula', 'internship', 'Help track project timelines and action items.', 'open'],
    ['CRM Optimization Project', 'Nof CRM Projects', 'Alaa Khateeb', 'project1@nofcrm.co.il', '04-603-3001', 'Nof HaGalil', 'project', 'Applied project for CRM workflow redesign and KPI tracking.', 'open'],
    ['BI Dashboard Project', 'Safed Dashboard Works', 'Lihi Vaknin', 'project2@safeddash.co.il', '04-603-3002', 'Safed', 'project', 'Create a dashboard for operational and academic reporting.', 'open'],
    ['ERP Process Mapping Project', 'Bialik ERP Studio', 'Elad Harari', 'project3@bialikerp.co.il', '04-603-3003', 'Kiryat Bialik', 'project', 'Map ERP-related business processes and recommend improvements.', 'open'],
    ['Inventory Analytics Project', 'Haifa Inventory Lab', 'Neta Ben Nun', 'project4@haifainventory.co.il', '04-603-3004', 'Haifa', 'project', 'Analyze stock and inventory data to improve planning.', 'open'],
    ['Student Placement Portal Project', 'Yokneam Placement Systems', 'Tal Ronen', 'project5@yokneamplacement.co.il', '04-603-3005', 'Yokneam', 'project', 'Build workflows for opportunity matching and placement tracking.', 'open']
    ['Junior Business Analyst', 'Kiryat Ata Business Solutions', 'Yael Mor', 'jobs11@katabs.co.il', '04-601-1011', 'Kiryat Ata', 'job', 'Support business requirements gathering, process documentation, and reporting tasks.', 'open'],
    ['Business Systems Analyst', 'Tiberias Systems Lab', 'Omer Shalev', 'jobs12@tiberiassystems.co.il', '04-601-1012', 'Tiberias', 'job', 'Bridge business needs and technical teams through analysis, documentation, and testing support.', 'open'],
    ['Process Analyst', 'Migdal Process Works', 'Hila Rahamim', 'jobs13@migdalprocess.co.il', '04-601-1013', 'Migdal HaEmek', 'job', 'Analyze workflows and identify improvement opportunities across internal operations.', 'open'],
    ['Reporting Analyst', 'Kiryat Motzkin Reporting Hub', 'Itai Ben David', 'jobs14@motzkinreporting.co.il', '04-601-1014', 'Kiryat Motzkin', 'job', 'Prepare recurring reports, validate data, and support KPI monitoring for management teams.', 'open'],
    ['Implementation Analyst', 'Kiryat Yam Tech Delivery', 'Roni Golan', 'jobs15@kyamdelivery.co.il', '04-601-1015', 'Kiryat Yam', 'job', 'Assist in system implementation, user onboarding, and process stabilization after rollout.', 'open'],
    ['Systems Coordinator', 'Tiberias Digital Operations', 'Adva Barak', 'jobs16@tiberiasdigital.co.il', '04-601-1016', 'Tiberias', 'job', 'Coordinate system users, troubleshoot operational issues, and maintain process documentation.', 'open'],
    ['Data Quality Analyst', 'Beit Shean Data Control', 'Neta Mizrahi', 'jobs17@beitsheandata.co.il', '04-601-1017', 'Beit Shean', 'job', 'Review data consistency, detect anomalies, and improve reporting accuracy across teams.', 'open'],
    ['CRM Analyst', 'Kiryat Shmona CRM Center', 'Sahar Amar', 'jobs18@kscrm.co.il', '04-601-1018', 'Kiryat Shmona', 'job', 'Monitor CRM records, improve lead handling workflows, and support sales reporting.', 'open'],
    ['MIS Analyst', 'Nesher MIS Group', 'Galit Saadon', 'jobs19@neshermis.co.il', '04-601-1019', 'Nesher', 'job', 'Maintain management information reports and support operational analysis for decision makers.', 'open'],
    ['Requirements Analyst', 'Tamra Requirements Studio', 'Kareem Nassar', 'jobs20@tamrareq.co.il', '04-601-1020', 'Tamra', 'job', 'Document functional requirements, user stories, and process gaps for system projects.', 'open'],
    ['BI Support Intern', 'Kiryat Ata BI School', 'Noa Tahan', 'intern6@katabi.co.il', '04-602-2006', 'Kiryat Ata', 'internship', 'Support dashboard updates, report preparation, and business data validation tasks.', 'open'],
    ['Systems Analysis Intern', 'Tiberias Insight Academy', 'Amit Gabbay', 'intern7@tiberiasinsight.co.il', '04-602-2007', 'Tiberias', 'internship', 'Participate in requirements analysis and document current-state and future-state processes.', 'open'],
    ['Data Operations Intern', 'Migdal Metrics Lab', 'Sama Hamed', 'intern8@migdalmetrics.co.il', '04-602-2008', 'Migdal HaEmek', 'internship', 'Help clean datasets, validate records, and support business operations reporting.', 'open'],
    ['ERP Support Intern', 'Kiryat Motzkin ERP Center', 'Yotam Vaknin', 'intern9@motzkinerp.co.il', '04-602-2009', 'Kiryat Motzkin', 'internship', 'Assist with ERP user support, ticket tracking, and workflow documentation.', 'open'],
    ['Reporting Intern', 'Kiryat Yam Reports Lab', 'Shani Cohen', 'intern10@kyamreports.co.il', '04-602-2010', 'Kiryat Yam', 'internship', 'Prepare operational reports and support KPI follow-up with business units.', 'open'],
    ['QA Testing Intern', 'Beit Shean QA Works', 'Liel Buskila', 'intern11@beitshanqa.co.il', '04-602-2011', 'Beit Shean', 'internship', 'Execute test scenarios, log defects, and assist in release readiness checks.', 'open'],
    ['PMO Intern', 'Kiryat Shmona Project Office', 'Nadav Azulai', 'intern12@kspmo.co.il', '04-602-2012', 'Kiryat Shmona', 'internship', 'Help maintain project plans, status logs, and milestone tracking sheets.', 'open'],
    ['CRM Operations Intern', 'Nesher CRM Academy', 'Raneen Suleiman', 'intern13@neshercrm.co.il', '04-602-2013', 'Nesher', 'internship', 'Support CRM data entry standards, campaign tracking, and pipeline updates.', 'open'],
    ['Business Analyst Intern', 'Tamra Business Lab', 'Yasmin Kabha', 'intern14@tamraba.co.il', '04-602-2014', 'Tamra', 'internship', 'Shadow analysts in requirements collection, process mapping, and stakeholder notes.', 'open'],
    ['SQL Analytics Intern', 'Carmel SQL Hub', 'Ido Peri', 'intern15@carmelsql.co.il', '04-602-2015', 'Haifa', 'internship', 'Assist with SQL queries, simple reporting tasks, and data validation assignments.', 'open'],
    ['Supply Chain Analytics Project', 'Kiryat Ata Operations Studio', 'Matan Shemesh', 'project6@kaops.co.il', '04-603-3006', 'Kiryat Ata', 'project', 'Analyze supply chain metrics and propose dashboard views for inventory and fulfillment.', 'open'],
    ['Student CRM Migration Project', 'Tiberias CRM Works', 'Rivka Malul', 'project7@tiberiascrm.co.il', '04-603-3007', 'Tiberias', 'project', 'Document CRM migration needs and build a structured opportunity and contact workflow.', 'open'],
    ['Help Desk KPI Project', 'Migdal Service Analytics', 'Aviad Koren', 'project8@migdalservice.co.il', '04-603-3008', 'Migdal HaEmek', 'project', 'Measure ticket response times and create KPI dashboards for support operations.', 'open'],
    ['ERP Usage Monitoring Project', 'Motzkin ERP Insights', 'Sarit Harel', 'project9@motzkinerpinsights.co.il', '04-603-3009', 'Kiryat Motzkin', 'project', 'Track ERP usage patterns and identify gaps in adoption across departments.', 'open'],
    ['Quality Metrics Dashboard Project', 'Kiryat Yam QA Analytics', 'Tomer Dahan', 'project10@kyamqa.co.il', '04-603-3010', 'Kiryat Yam', 'project', 'Create a dashboard for defect trends, test coverage, and release quality metrics.', 'open'],
    ['Admissions Data Project', 'Beit Shean Academic Systems', 'Hodaya Ezra', 'project11@beitshanacademic.co.il', '04-603-3011', 'Beit Shean', 'project', 'Analyze applicant data and design a dashboard for admissions tracking.', 'open'],
    ['Municipal Service BI Project', 'Kiryat Shmona Civic Tech', 'Nir Avrahami', 'project12@kscivictech.co.il', '04-603-3012', 'Kiryat Shmona', 'project', 'Build BI views for municipal requests, service levels, and response trends.', 'open'],
    ['Sales Funnel Reporting Project', 'Nesher Growth Systems', 'Sapir Alfasi', 'project13@neshergrowth.co.il', '04-603-3013', 'Nesher', 'project', 'Create structured reporting for lead stages, conversions, and sales pipeline health.', 'open'],
    ['Process Documentation Project', 'Tamra Process Design', 'Rami Asad', 'project14@tamraprocess.co.il', '04-603-3014', 'Tamra', 'project', 'Map end-to-end workflows and produce clear process documentation for internal teams.', 'open'],
    ['Intern Placement Analytics Project', 'Akko Opportunity Systems', 'Michal Ben Lulu', 'project15@akkoplacement.co.il', '04-603-3015', 'Akko', 'project', 'Analyze student placement outcomes and design a reporting view for internship matching.', 'open']
  ];

  for (const item of seedData) {
    await runQuery(
      `INSERT INTO opportunities
      (title, company, contact_name, contact_email, contact_phone, location, category, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item
    );
  }

  console.log('Seeded opportunities successfully');
}

async function initDb() {
  await runQuery(`PRAGMA foreign_keys = ON`);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'graduate', 'employer', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      location TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('job', 'internship', 'project')),
      description TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      opportunity_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn('opportunities', 'company', 'TEXT');
  await ensureColumn('opportunities', 'contact_name', 'TEXT');
  await ensureColumn('opportunities', 'contact_email', 'TEXT');
  await ensureColumn('opportunities', 'contact_phone', 'TEXT');
  await ensureColumn('opportunities', 'status', "TEXT DEFAULT 'open'");

  await ensureSeedData();
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).send('Access denied');
    }
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

async function getOpportunitiesByCategory(category) {
  return getAll(
    `SELECT id, title, company, contact_name, contact_email, contact_phone, location, category, description, status, created_at
     FROM opportunities
     WHERE category = ?
     ORDER BY id DESC`,
    [category]
  );
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mis-opportunity-hub-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.get('/', (req, res) => {
  res.render('index', { currentPage: 'home' });
});

app.get('/jobs', async (req, res) => {
  try {
    const items = await getOpportunitiesByCategory('job');
    res.render('jobs', {
      currentPage: 'jobs',
      title: 'Jobs',
      subtitle: 'Explore available jobs for Information Systems students and graduates.',
      items
    });
  } catch (error) {
    console.error('Jobs page error:', error);
    res.status(500).render('jobs', {
      currentPage: 'jobs',
      title: 'Jobs',
      subtitle: 'Explore available jobs for Information Systems students and graduates.',
      items: []
    });
  }
});

app.post('/add-job', requireRole(['employer']), async (req, res) => {
  const {
    title,
    company,
    contact_name,
    contact_email,
    contact_phone,
    location,
    description,
    status
  } = req.body;

  try {
    await runQuery(
      `INSERT INTO opportunities
      (title, company, contact_name, contact_email, contact_phone, location, category, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        company || null,
        contact_name || null,
        contact_email || null,
        contact_phone || null,
        location,
        'job',
        description,
        status || 'open'
      ]
    );

    res.redirect('/jobs');
  } catch (error) {
    console.error('Error adding job:', error);
    res.status(500).send('Error adding job');
  }
});

app.post('/delete-job/:id', requireRole(['employer']), async (req, res) => {
  const { id } = req.params;

  try {
    await runQuery('DELETE FROM opportunities WHERE id = ?', [id]);
    res.redirect('/jobs');
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).send('Error deleting job');
  }
});

app.get('/edit-job/:id', requireRole(['employer']), async (req, res) => {
  const { id } = req.params;

  try {
    const job = await getOne('SELECT * FROM opportunities WHERE id = ?', [id]);

    if (!job) {
      return res.status(404).send('Job not found');
    }

    res.render('edit-job', {
      currentPage: 'jobs',
      job
    });
  } catch (error) {
    console.error('Error loading job:', error);
    res.status(500).send('Error loading job');
  }
});

app.post('/update-job/:id', requireRole(['employer']), async (req, res) => {
  const { id } = req.params;
  const {
    title,
    company,
    contact_name,
    contact_email,
    contact_phone,
    location,
    description,
    status
  } = req.body;

  try {
    await runQuery(
      `UPDATE opportunities
       SET title = ?, company = ?, contact_name = ?, contact_email = ?, contact_phone = ?, location = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        title,
        company || null,
        contact_name || null,
        contact_email || null,
        contact_phone || null,
        location,
        description,
        status || 'open',
        id
      ]
    );

    res.redirect('/jobs');
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).send('Error updating job');
  }
});

app.get('/internships', async (req, res) => {
  try {
    const items = await getOpportunitiesByCategory('internship');
    res.render('internships', {
      currentPage: 'internships',
      title: 'Internships',
      subtitle: 'Explore available internships for Information Systems students.',
      items
    });
  } catch (error) {
    console.error('Internships page error:', error);
    res.status(500).render('internships', {
      currentPage: 'internships',
      title: 'Internships',
      subtitle: 'Explore available internships for Information Systems students.',
      items: []
    });
  }
});

app.get('/projects', async (req, res) => {
  try {
    const items = await getOpportunitiesByCategory('project');
    res.render('projects', {
      currentPage: 'projects',
      title: 'Projects',
      subtitle: 'Explore available academic and industry projects.',
      items
    });
  } catch (error) {
    console.error('Projects page error:', error);
    res.status(500).render('projects', {
      currentPage: 'projects',
      title: 'Projects',
      subtitle: 'Explore available academic and industry projects.',
      items: []
    });
  }
});

app.get('/contact', (req, res) => {
  res.render('contact', {
    currentPage: 'contact',
    message: '',
    messageType: ''
  });
});

app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    await runQuery(
      `INSERT INTO contacts (name, email, subject, message)
       VALUES (?, ?, ?, ?)`,
      [name, email, subject, message]
    );

    res.render('contact', {
      currentPage: 'contact',
      message: 'Message sent successfully',
      messageType: 'success'
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).render('contact', {
      currentPage: 'contact',
      message: 'Could not send message',
      messageType: 'error'
    });
  }
});

app.get('/login', (req, res) => {
  res.render('login', {
    currentPage: 'login',
    message: '',
    messageType: ''
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(400).render('login', {
        currentPage: 'login',
        message: 'Invalid email or password',
        messageType: 'error'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).render('login', {
        currentPage: 'login',
        message: 'Invalid email or password',
        messageType: 'error'
      });
    }

    req.session.user = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role
    };

    return redirectByRole(user.role, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('login', {
      currentPage: 'login',
      message: 'An error occurred while logging in',
      messageType: 'error'
    });
  }
});

app.get('/signup', (req, res) => {
  res.render('signup', {
    currentPage: 'signup',
    message: '',
    messageType: ''
  });
});

app.post('/signup', async (req, res) => {
  const { fullname, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await runQuery(
      `INSERT INTO users (fullname, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [fullname, email, hashedPassword, role]
    );

    req.session.user = {
      id: result.lastID,
      fullname,
      email,
      role
    };

    return redirectByRole(role, res);
  } catch (error) {
    const message = error.message.includes('UNIQUE')
      ? 'Email already exists'
      : 'Could not create account';

    res.status(400).render('signup', {
      currentPage: 'signup',
      message,
      messageType: 'error'
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/student-dashboard', requireRole(['student']), (req, res) => {
  res.render('student-dashboard', {
    currentPage: '',
    user: req.session.user
  });
});

app.get('/graduate-dashboard', requireRole(['graduate']), (req, res) => {
  res.render('graduate-dashboard', {
    currentPage: '',
    user: req.session.user
  });
});

app.get('/employer-dashboard', requireRole(['employer']), (req, res) => {
  res.render('employer-dashboard', {
    currentPage: '',
    user: req.session.user
  });
});

app.get('/admin-dashboard', requireRole(['admin']), async (req, res) => {
  try {
    const users = await getAll('SELECT * FROM users');
    const contacts = await getAll('SELECT * FROM contacts');
    const opportunities = await getAll('SELECT * FROM opportunities');

    res.render('admin-dashboard', {
      currentPage: '',
      user: req.session.user,
      stats: {
        usersCount: users.length,
        contactsCount: contacts.length,
        opportunitiesCount: opportunities.length
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).send('Error loading admin dashboard');
  }
});

app.get('/crm', requireRole(['admin']), async (req, res) => {
  try {
    const users = await getAll(
      `SELECT id, fullname, email, role, created_at
       FROM users
       ORDER BY id DESC`
    );

    const opportunities = await getAll(
      `SELECT id, title, company, contact_name, contact_email, contact_phone, location, category, description, status, created_at
       FROM opportunities
       ORDER BY id DESC`
    );

    const contacts = await getAll(
      `SELECT id, name, email, subject, message, created_at
       FROM contacts
       ORDER BY id DESC`
    );

    res.render('crm', {
      currentPage: '',
      users,
      opportunities,
      contacts
    });
  } catch (error) {
    console.error('CRM error:', error);
    res.status(500).send('Error loading CRM');
  }
});

app.get('/edit-opportunity/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const opportunity = await getOne(
      `SELECT id, title, company, contact_name, contact_email, contact_phone, location, category, description, status
       FROM opportunities
       WHERE id = ?`,
      [id]
    );

    if (!opportunity) {
      return res.status(404).send('Opportunity not found');
    }

    res.render('edit-opportunity', {
      currentPage: '',
      opportunity
    });
  } catch (error) {
    console.error('Error loading opportunity:', error);
    res.status(500).send('Error loading opportunity');
  }
});

app.post('/update-opportunity/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const {
    title,
    company,
    contact_name,
    contact_email,
    contact_phone,
    location,
    category,
    description,
    status
  } = req.body;

  try {
    await runQuery(
      `UPDATE opportunities
       SET title = ?, company = ?, contact_name = ?, contact_email = ?, contact_phone = ?, location = ?, category = ?, description = ?, status = ?
       WHERE id = ?`,
      [
        title,
        company || null,
        contact_name || null,
        contact_email || null,
        contact_phone || null,
        location,
        category,
        description,
        status || 'open',
        id
      ]
    );

    res.redirect('/crm');
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).send('Error updating opportunity');
  }
});

app.post('/delete-user/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    await runQuery('DELETE FROM users WHERE id = ?', [id]);
    res.redirect('/crm');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Error deleting user');
  }
});

app.post('/delete-opportunity/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    await runQuery('DELETE FROM opportunities WHERE id = ?', [id]);
    res.redirect('/crm');
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).send('Error deleting opportunity');
  }
});

app.post('/delete-contact/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    await runQuery('DELETE FROM contacts WHERE id = ?', [id]);
    res.redirect('/crm');
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).send('Error deleting contact');
  }
});

app.get('/profile', requireAuth, (req, res) => {
  res.json(req.session.user);
});

app.get('/api/opportunities', async (req, res) => {
  try {
    const rows = await getAll(
      `SELECT id, title, company, contact_name, contact_email, contact_phone, location, category, description, status, created_at
       FROM opportunities
       ORDER BY id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('API opportunities error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/reset-opportunities', async (req, res) => {
  try {
    await runQuery('DELETE FROM applications');
    await runQuery('DELETE FROM opportunities');
    res.send('Opportunities reset successfully. You can now open /seed-opportunities.');
  } catch (error) {
    console.error('Error resetting opportunities:', error);
    res.status(500).send('Error resetting opportunities');
  }
});

app.get('/seed-opportunities', async (req, res) => {
  try {
    await ensureSeedData();
    res.send('Seeded opportunities successfully.');
  } catch (error) {
    console.error('Seed route error:', error);
    res.status(500).send(`Error seeding opportunities: ${error.message}`);
  }
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Startup error:', err.message);
    process.exit(1);
  });