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

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'graduate', 'employer', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('job', 'internship', 'project')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.get('SELECT COUNT(*) AS count FROM opportunities', [], (err, row) => {
    if (!err && row && row.count === 0) {
      db.run(`
        INSERT INTO opportunities (title, location, category, description) VALUES
        const seedData = [
['Business Analyst ', 'Galilee Data Solutions', 'Maya Cohen', 'jobs1@galileedata.co.il', '04-601-1001', 'Haifa', 'job', 'Entry-to-junior role focused on analysis, reporting, and process improvement.', 'open'],
['Data Analyst ', 'Carmel Insight Labs', 'Noam Levi', 'jobs2@carmelinsight.co.il', '04-601-1002', 'Yokneam', 'job', 'Support dashboards, KPI reporting, and SQL-based analytics for business teams.', 'open'],
['BI Analyst ', 'NazTech Analytics', 'Rana Khoury', 'jobs3@naztech.co.il', '04-601-1003', 'Nazareth', 'job', 'Build reports and support decision-making processes for operations teams.', 'open'],
['ERP Support Specialist ', 'Karmiel Systems Group', 'Lior Dayan', 'jobs4@karmielsystems.co.il', '04-601-1004', 'Karmiel', 'job', 'Support ERP workflows, user training, and operational data quality.', 'open'],
['Information Systems Coordinator ', 'Acre Process Hub', 'Shira Azulay', 'jobs5@acreprocess.co.il', '04-601-1005', 'Acre', 'job', 'Coordinate systems users, documentation, and cross-team process updates.', 'open'],
['Project Coordinator ', 'Tirat Digital Ops', 'Daniel Haddad', 'jobs6@tiratdigital.co.il', '04-601-1006', 'Tirat Carmel', 'job', 'Track project tasks, schedules, and stakeholder communication.', 'open'],
['Operations Analyst ', 'Afula Metrics Center', 'Yarden Moyal', 'jobs7@afulametrics.co.il', '04-601-1007', 'Afula', 'job', 'Monitor operational KPIs and improve workflow efficiency.', 'open'],
['QA Analyst ', 'Nof Quality Tech', 'Moran Peretz', 'jobs8@nofquality.co.il', '04-601-1008', 'Nof HaGalil', 'job', 'Run functional tests, document bugs, and support release quality.', 'open'],
['PMO Assistant ', 'Safed PMO Partners', 'Tamar Biton', 'jobs9@safedpmo.co.il', '04-601-1009', 'Safed', 'job', 'Assist PMO reporting, status tracking, and project governance.', 'open'],
['SQL Reporting Analyst ', 'Bialik Reporting House', 'Eran Malka', 'jobs10@bialikreporting.co.il', '04-601-1010', 'Kiryat Bialik', 'job', 'Create SQL reports and support analytics-driven decisions.', 'open'],
['CRM Administrator ', 'Haifa CRM Works', 'Hila Rosen', 'jobs11@haifacrm.co.il', '04-601-1011', 'Haifa', 'job', 'Manage CRM data quality, pipelines, and user support.', 'open'],
['Systems Analyst ', 'Yokneam Flow Systems', 'Amit Sela', 'jobs12@yokneamflow.co.il', '04-601-1012', 'Yokneam', 'job', 'Analyze system requirements and document business processes.', 'open'],
['Implementation Specialist ', 'Nazareth Rollout Team', 'Rim Nassar', 'jobs13@nazrollout.co.il', '04-601-1013', 'Nazareth', 'job', 'Support onboarding and implementation of business systems.', 'open'],
['Junior Product Analyst ', 'Karmiel Product Analytics', 'Gal Ben David', 'jobs14@karmielproduct.co.il', '04-601-1014', 'Karmiel', 'job', 'Monitor product usage and build analytical summaries.', 'open'],
['Customer Success Analyst', 'Acre Service Insights', 'Lena Saad', 'jobs15@acreservice.co.il', '04-601-1015', 'Acre', 'job', 'Track customer metrics and improve support workflows.', 'open'],
['Business Analyst ', 'Tirat Strategy Systems', 'Ofek Cohen', 'jobs16@tiratstrategy.co.il', '04-601-1016', 'Tirat Carmel', 'job', 'Support reporting and operational improvement initiatives.', 'open'],
['Data Analyst ', 'Afula Data Point', 'Sapir Elkayam', 'jobs17@afuladatapoint.co.il', '04-601-1017', 'Afula', 'job', 'Analyze trends and build business performance reports.', 'open'],
['BI Analyst ', 'Nof BI Studio', 'Keren Mizrahi', 'jobs18@nofbi.co.il', '04-601-1018', 'Nof HaGalil', 'job', 'Create visual dashboards and BI summaries.', 'open'],
['ERP Support Specialist ', 'Safed ERP Care', 'Ori Azulai', 'jobs19@safederp.co.il', '04-601-1019', 'Safed', 'job', 'Assist ERP users and operational documentation.', 'open'],
['Information Systems Coordinator - North 20', 'Bialik Systems Desk', 'Yael Golan', 'jobs20@bialiksystems.co.il', '04-601-1020', 'Kiryat Bialik', 'job', 'Coordinate system-related processes and reporting.', 'open'],
['Data Analyst Intern ', 'Nazareth Student Analytics', 'Maya Yassin', 'intern1@nazstudent.co.il', '04-602-2001', 'Nazareth', 'internship', 'Hands-on analytics internship for students in information systems.', 'open'],
['BI Intern ', 'Karmiel BI Lab', 'Niv Bar', 'intern2@karmielbi.co.il', '04-602-2002', 'Karmiel', 'internship', 'Support dashboarding and KPI analysis.', 'open'],
['ERP Intern ', 'Acre ERP Academy', 'Roei Maman', 'intern3@acreerp.co.il', '04-602-2003', 'Acre', 'internship', 'Assist ERP process mapping and support activities.', 'open'],
['QA Intern ', 'Tirat QA Center', 'Sivan Ohana', 'intern4@tiratqa.co.il', '04-602-2004', 'Tirat Carmel', 'internship', 'Participate in testing and documentation.', 'open'],
['Project Management Intern ', 'Afula PM Track', 'Dean Tzuberi', 'intern5@afulapm.co.il', '04-602-2005', 'Afula', 'internship', 'Help track project timelines and action items.', 'open'],
['Operations Intern ', 'Nof Operations Lab', 'Rasha Daher', 'intern6@nofops.co.il', '04-602-2006', 'Nof HaGalil', 'internship', 'Support business operations reporting and coordination.', 'open'],
['Systems Support Intern', 'Safed Support Desk', 'Mika Iluz', 'intern7@safedsupport.co.il', '04-602-2007', 'Safed', 'internship', 'Assist users and document system support issues.', 'open'],
['CRM Intern ', 'Bialik CRM Campus', 'Gilad Ezra', 'intern8@bialikcrm.co.il', '04-602-2008', 'Kiryat Bialik', 'internship', 'Support CRM updates and data quality activities.', 'open'],
['Business Analysis Intern ', 'Haifa Analysis Track', 'Hadar Katz', 'intern9@haifaanalysis.co.il', '04-602-2009', 'Haifa', 'internship', 'Analyze workflows and prepare business documentation.', 'open'],
['Product Intern ', 'Yokneam Product Studio', 'Adi Turgeman', 'intern10@yokneamproduct.co.il', '04-602-2010', 'Yokneam', 'internship', 'Support product reporting and user feedback analysis.', 'open'],
['Data Analyst Intern - Cohort 11', 'Nazareth Data Practice', 'Mira Salameh', 'intern11@nazdatapractice.co.il', '04-602-2011', 'Nazareth', 'internship', 'Practice reporting and basic SQL analysis.', 'open'],
['BI Intern ', 'Karmiel Insight Academy', 'Tom Shitrit', 'intern12@karmielinsight.co.il', '04-602-2012', 'Karmiel', 'internship', 'Prepare dashboards and summaries for teams.', 'open'],
['ERP Intern ', 'Acre Process School', 'Eden Sharabi', 'intern13@acreprocessschool.co.il', '04-602-2013', 'Acre', 'internship', 'Support process improvement with ERP data.', 'open'],
['QA Intern ', 'Tirat Release Lab', 'Ariel Dahan', 'intern14@tiratrelease.co.il', '04-602-2014', 'Tirat Carmel', 'internship', 'Help validate system releases and fixes.', 'open'],
['Project Management Intern ', 'Afula Delivery Track', 'Shoval Marciano', 'intern15@afuladelivery.co.il', '04-602-2015', 'Afula', 'internship', 'Support coordination and reporting of project execution.', 'open'],
['CRM Optimization Project ', 'Nof CRM Projects', 'Alaa Khateeb', 'project1@nofcrm.co.il', '04-603-3001', 'Nof HaGalil', 'project', 'Applied project for CRM workflow redesign and KPI tracking.', 'open'],
['BI Dashboard Project', 'Safed Dashboard Works', 'Lihi Vaknin', 'project2@safeddash.co.il', '04-603-3002', 'Safed', 'project', 'Create a dashboard for operational and academic reporting.', 'open'],
['ERP Process Mapping Project ', 'Bialik ERP Studio', 'Elad Harari', 'project3@bialikerp.co.il', '04-603-3003', 'Kiryat Bialik', 'project', 'Map ERP-related business processes and recommend improvements.', 'open'],
['Inventory Analytics Project ', 'Haifa Inventory Lab', 'Neta Ben Nun', 'project4@haifainventory.co.il', '04-603-3004', 'Haifa', 'project', 'Analyze stock and inventory data to improve planning.', 'open'],
['Student Placement Portal Project ', 'Yokneam Placement Systems', 'Tal Ronen', 'project5@yokneamplacement.co.il', '04-603-3005', 'Yokneam', 'project', 'Build workflows for opportunity matching and placement tracking.', 'open'],
['Recruitment Workflow Project ', 'Nazareth Recruiting Tech', 'Yasmin Harb', 'project6@nazrecruiting.co.il', '04-603-3006', 'Nazareth', 'project', 'Improve candidate pipeline visibility and CRM updates.', 'open'],
['Customer Service KPI Project', 'Karmiel Service Metrics', 'Orel Nahum', 'project7@karmielservice.co.il', '04-603-3007', 'Karmiel', 'project', 'Track service metrics and analyze support quality.', 'open'],
['Project Tracking Dashboard ', 'Acre Progress Dash', 'Shahar Tahan', 'project8@acreprogress.co.il', '04-603-3008', 'Acre', 'project', 'Build progress dashboards for active initiatives.', 'open'],
['Admissions Reporting Project ', 'Tirat Admissions Data', 'Reut Ashkenazi', 'project9@tiratadmissions.co.il', '04-603-3009', 'Tirat Carmel', 'project', 'Improve admissions reporting and trend analysis.', 'open'],
['Operations Automation Project ', 'Afula Automation House', 'Maor Buzaglo', 'project10@afulaautomation.co.il', '04-603-3010', 'Afula', 'project', 'Automate recurring reporting and approval tasks.', 'open'],
['CRM Optimization Project ', 'Nof CRM Projects', 'Aseel Zidan', 'project11@nofcrm.co.il', '04-603-3011', 'Nof HaGalil', 'project', 'Improve CRM data structure and status handling.', 'open'],
['BI Dashboard Project ', 'Safed Dashboard Works', 'Rotem Abadi', 'project12@safeddash.co.il', '04-603-3012', 'Safed', 'project', 'Extend analytical reporting and chart coverage.', 'open'],
['ERP Process Mapping Project ', 'Bialik ERP Studio', 'Itay Peri', 'project13@bialikerp.co.il', '04-603-3013', 'Kiryat Bialik', 'project', 'Document ERP flow and support redesign.', 'open'],
['Inventory Analytics Project ', 'Haifa Inventory Lab', 'Noy Kadosh', 'project14@haifainventory.co.il', '04-603-3014', 'Haifa', 'project', 'Build inventory summaries and forecasting sheets.', 'open'],
['Student Placement Portal Project', 'Yokneam Placement Systems', 'Noa Edri', 'project15@yokneamplacement.co.il', '04-603-3015', 'Yokneam', 'project', 'Enhance portal matching flows and reporting.', 'open']
];
      `);
    }
  });
});

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

async function getOpportunitiesByCategory(category) {
  return getAll(
    `
      SELECT id, title, location, category, description, created_at
      FROM opportunities
      WHERE category = ?
      ORDER BY id DESC
    `,
    [category]
  );
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


app.get('/', (req, res) => {
  res.render('index', { currentPage: 'home' });
});

// JOBS PAGE
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
    res.status(500).render('jobs', {
      currentPage: 'jobs',
      title: 'Jobs',
      subtitle: 'Explore available jobs for Information Systems students and graduates.',
      items: []
    });
  }
});

// ADD JOB
app.post('/add-job', requireRole(['employer']), async (req, res) => {
  const { title, location, description } = req.body;

  try {
    await runQuery(
      `INSERT INTO opportunities (title, location, category, description)
       VALUES (?, ?, ?, ?)`,
      [title, location, 'job', description]
    );

    res.redirect('/jobs');
  } catch (error) {
    console.error('Error adding job:', error);
    res.status(500).send('Error adding job');
  }
});

// DELETE JOB
app.post('/delete-job/:id', requireRole(['employer']), async (req, res) => {
  try {
    await runQuery('DELETE FROM opportunities WHERE id = ?', [id]);
    res.redirect('/jobs');
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).send('Error deleting job');
  }
});

// EDIT JOB PAGE
app.get('/edit-job/:id', requireRole(['employer']), async (req, res) => {
  const id = req.params.id;

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

// UPDATE JOB
app.post('/update-job/:id', requireRole(['employer']), async (req, res) => {
  const id = req.params.id;
  const { title, location, description } = req.body;

  try {
    await runQuery(
      `UPDATE opportunities
       SET title = ?, location = ?, description = ?
       WHERE id = ?`,
      [title, location, description, id]
    );

    res.redirect('/jobs');
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).send('Error updating job');
  }
});

// INTERNSHIPS
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
    res.status(500).render('internships', {
      currentPage: 'internships',
      title: 'Internships',
      subtitle: 'Explore available internships for Information Systems students.',
      items: []
    });
  }
});

// PROJECTS
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
    res.status(500).render('projects', {
      currentPage: 'projects',
      title: 'Projects',
      subtitle: 'Explore available academic and industry projects.',
      items: []
    });
  }
});

// CONTACT
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
    res.status(500).render('contact', {
      currentPage: 'contact',
      message: 'Could not send message',
      messageType: 'error'
    });
  }
});

// LOGIN
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
    res.status(500).render('login', {
      currentPage: 'login',
      message: 'An error occurred while logging in',
      messageType: 'error'
    });
  }
});

// SIGNUP
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

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// DASHBOARDS
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
    res.status(500).send('Error loading admin dashboard');
  }
});

// CRM
app.get('/crm', requireRole(['admin']), async (req, res) => {
  try {
    const users = await getAll(
      `SELECT id, fullname, email, role, created_at FROM users ORDER BY id DESC`
    );

    const opportunities = await getAll(
      `SELECT id, title, location, category, description, created_at FROM opportunities ORDER BY id DESC`
    );

    const contacts = await getAll(
      `SELECT id, name, email, subject, message, created_at FROM contacts ORDER BY id DESC`
    );

    res.render('crm', {
      currentPage: '',
      users,
      opportunities,
      contacts
    });
  } catch (error) {
    res.status(500).send('Error loading CRM');
  }
});


// EDIT OPPORTUNITY PAGE
app.get('/edit-opportunity/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const opportunity = await getOne(
      'SELECT id, title, location, category, description FROM opportunities WHERE id = ?',
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

// UPDATE OPPORTUNITY
app.post('/update-opportunity/:id', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { title, location, category, description } = req.body;

  try {
    await runQuery(
      `
        UPDATE opportunities
        SET title = ?, location = ?, category = ?, description = ?
        WHERE id = ?
      `,
      [title, location, category, description, id]
    );

    res.redirect('/crm');
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).send('Error updating opportunity');
  }
});

// DELETE USER
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

// DELETE OPPORTUNITY
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

// DELETE CONTACT
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

// API
app.get('/api/opportunities', async (req, res) => {
  try {
    const rows = await getAll(
      `SELECT id, title, location, category, description, created_at
       FROM opportunities
       ORDER BY id DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// 404 - תמיד בסוף
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});