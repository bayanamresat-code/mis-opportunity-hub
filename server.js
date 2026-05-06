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
  store: new pgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
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
    ['Gal Employer', 'employer@hub.local', 'Employer123!', 'employer']
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
    ['Business Analyst - North 1', 'Matrix North', 'Rami Levi', 'rami.levi@matrix.local', '050-700-1001', 'Haifa', 'job', 'Entry role focused on reporting, process mapping, and dashboard support.', 'open'],
    ['Data Analyst Intern - Cohort 1', 'Campus Data', 'Nadine Farah', 'nadine.farah@campusdata.local', '050-700-1021', 'Nazareth', 'internship', 'Hands-on analytics internship for MIS students.', 'open'],
    ['CRM Optimization Project - Cycle 1', 'Hub CRM', 'Yousef Khoury', 'yousef.khoury@hubcrm.local', '050-700-1036', 'Nof HaGalil', 'project', 'Applied project for CRM workflow redesign and KPI tracking.', 'open']
  ];

  for (const row of rows) {
    await runQuery(
      `INSERT INTO opportunities
      (title, company_name, contact_name, contact_email, contact_phone, location, category, description, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      row
    );
  }
}

async function seedDemoData() {
  const contactCount = await getOne('SELECT COUNT(*)::int AS count FROM contacts');
  if (contactCount && contactCount.count === 0) {
    await runQuery(`
      INSERT INTO contacts (name, email, subject, message) VALUES
      ('Dana Student','dana@student.local','Need internship support','Looking for BI internship in the north.'),
      ('Rami Employer','rami@company.local','Need candidates','Searching for MIS graduates for analyst role.')
    `);
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
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('404', { currentPage: '' });
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
    sql += ` AND (title ILIKE $${i} OR description ILIKE $${i + 1} OR location ILIKE $${i + 2} OR company_name ILIKE $${i + 3})`;
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
  res.render('jobs', { currentPage: 'jobs', title: 'Jobs', subtitle: 'Open analyst, BI, ERP and MIS jobs in northern Israel.', items });
});

app.get('/internships', async (req, res) => {
  const items = await getAll(`SELECT * FROM opportunities WHERE category = 'internship' ORDER BY id DESC`);
  res.render('internships', { currentPage: 'internships', title: 'Internships', subtitle: 'Student and graduate internships with contact details and clear status.', items });
});

app.get('/projects', async (req, res) => {
  const items = await getAll(`SELECT * FROM opportunities WHERE category = 'project' ORDER BY id DESC`);
  res.render('projects', { currentPage: 'projects', title: 'Projects', subtitle: 'Applied MIS projects with CRM-style visibility and real contacts.', items });
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
  res.render('contact', { currentPage: 'contact', flash: null });
});

app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  await runQuery(
    'INSERT INTO contacts (name,email,subject,message) VALUES ($1,$2,$3,$4)',
    [name, email, subject, message]
  );
  res.render('contact', {
    currentPage: 'contact',
    flash: { type: 'success', text: 'Message sent successfully.' }
  });
});

app.get('/login', (req, res) => {
  res.render('login', { currentPage: 'login', flash: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await getOne('SELECT * FROM users WHERE email = $1', [email]);

  if (!user) {
    return res.status(400).render('login', {
      currentPage: 'login',
      flash: { type: 'error', text: 'Invalid email or password.' }
    });
  }

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) {
    return res.status(400).render('login', {
      currentPage: 'login',
      flash: { type: 'error', text: 'Invalid email or password.' }
    });
  }

  req.session.user = {
    id: user.id,
    fullname: user.fullname,
    email: user.email,
    role: user.role
  };

  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).send('Session error');
    }
    return redirectByRole(user.role, res);
  });
});

app.get('/signup', (req, res) => {
  res.render('signup', { currentPage: 'signup', flash: null });
});

app.post('/signup', async (req, res) => {
  const { fullname, email, password, role } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const created = await runQuery(
      'INSERT INTO users (fullname,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id',
      [fullname, email, hash, role]
    );

    req.session.user = {
      id: created.rows[0].id,
      fullname,
      email,
      role
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).send('Session error');
      }
      return redirectByRole(role, res);
    });
  } catch (error) {
    res.status(400).render('signup', {
      currentPage: 'signup',
      flash: { type: 'error', text: 'Email already exists or input is invalid.' }
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/student-dashboard', requireRole(['student']), async (req, res) => {
  const apps = await getAll(`
    SELECT a.*, o.title, o.category, o.company_name, o.location
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.user_id = $1
    ORDER BY a.id DESC
  `, [req.session.user.id]);

  const suggested = await getAll(`SELECT * FROM opportunities ORDER BY id DESC LIMIT 8`);

  res.render('student-dashboard', {
    currentPage: '',
    user: req.session.user,
    apps,
    suggested
  });
});

app.get('/graduate-dashboard', requireRole(['graduate']), async (req, res) => {
  const apps = await getAll(`
    SELECT a.*, o.title, o.category, o.company_name, o.location
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.user_id = $1
    ORDER BY a.id DESC
  `, [req.session.user.id]);

  const suggested = await getAll(`SELECT * FROM opportunities ORDER BY id DESC LIMIT 8`);

  res.render('graduate-dashboard', {
    currentPage: '',
    user: req.session.user,
    apps,
    suggested
  });
});

app.get('/employer-dashboard', requireRole(['employer']), async (req, res) => {
  const items = await getAll('SELECT * FROM opportunities ORDER BY id DESC LIMIT 12');
  res.render('employer-dashboard', { currentPage: '', user: req.session.user, items });
});

app.get('/admin-dashboard', requireRole(['admin']), async (req, res) => {
  const usersCount = await getOne('SELECT COUNT(*)::int AS c FROM users');
  const contactsCount = await getOne('SELECT COUNT(*)::int AS c FROM contacts');
  const opportunitiesCount = await getOne('SELECT COUNT(*)::int AS c FROM opportunities');
  const appsCount = await getOne('SELECT COUNT(*)::int AS c FROM applications');
  const byCategory = await getAll('SELECT category, COUNT(*)::int AS total FROM opportunities GROUP BY category ORDER BY category');
  const byStatus = await getAll('SELECT status, COUNT(*)::int AS total FROM applications GROUP BY status ORDER BY status');

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
  const users = await getAll('SELECT id, fullname, email, role, created_at FROM users ORDER BY id DESC');
  const opportunities = await getAll('SELECT * FROM opportunities ORDER BY id DESC');
  const contacts = await getAll('SELECT * FROM contacts ORDER BY id DESC');
  const applications = await getAll(`
    SELECT a.id, a.status, a.notes, a.created_at, u.fullname, u.email, o.title, o.category, o.company_name
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
});

app.get('/manage/opportunity/new', requireRole(['admin', 'employer']), (req, res) => {
  res.render('opportunity-form', {
    currentPage: '',
    item: null,
    action: '/manage/opportunity/new',
    pageTitle: 'Add Opportunity'
  });
});

app.post('/manage/opportunity/new', requireRole(['admin', 'employer']), async (req, res) => {
  const {
    title,
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    location,
    category,
    description,
    status
  } = req.body;

  await runQuery(
    `INSERT INTO opportunities
    (title, company_name, contact_name, contact_email, contact_phone, location, category, description, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      title,
      company_name || null,
      contact_name || null,
      contact_email || null,
      contact_phone || null,
      location,
      category,
      description,
      status || 'open'
    ]
  );

  res.redirect('/crm');
});

app.get('/manage/opportunity/:id/edit', requireRole(['admin', 'employer']), async (req, res) => {
  const item = await getOne('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
  if (!item) return res.status(404).render('404', { currentPage: '' });

  res.render('opportunity-form', {
    currentPage: '',
    item,
    action: `/manage/opportunity/${item.id}/edit`,
    pageTitle: 'Edit Opportunity'
  });
});

app.post('/manage/opportunity/:id/edit', requireRole(['admin', 'employer']), async (req, res) => {
  const {
    title,
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    location,
    category,
    description,
    status
  } = req.body;

  await runQuery(
    `UPDATE opportunities
     SET title=$1, company_name=$2, contact_name=$3, contact_email=$4, contact_phone=$5,
         location=$6, category=$7, description=$8, status=$9
     WHERE id=$10`,
    [
      title,
      company_name || null,
      contact_name || null,
      contact_email || null,
      contact_phone || null,
      location,
      category,
      description,
      status,
      req.params.id
    ]
  );

  res.redirect('/crm');
});

app.post('/manage/opportunity/:id/delete', requireRole(['admin', 'employer']), async (req, res) => {
  await runQuery('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
  res.redirect('/crm');
});

app.post('/apply/:id', requireRole(['student', 'graduate']), async (req, res) => {
  try {
    await runQuery(
      'INSERT INTO applications (user_id, opportunity_id, status, notes) VALUES ($1,$2,$3,$4)',
      [req.session.user.id, req.params.id, 'pending', 'Applied from portal']
    );
  } catch (error) {
  }
  res.redirect('back');
});

app.post('/applications/:id/status', requireRole(['admin']), async (req, res) => {
  await runQuery(
    'UPDATE applications SET status=$1, notes=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3',
    [req.body.status, req.body.notes || '', req.params.id]
  );
  res.redirect('/crm');
});

app.get('/ai-assistant', requireAuth, (req, res) => {
  res.render('ai-assistant', { currentPage: 'ai', messages: [] });
});

app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const prompt = (req.body.message || '').trim();
  const stats = await getAll('SELECT category, COUNT(*)::int AS total FROM opportunities GROUP BY category ORDER BY category');
  const latest = await getAll('SELECT title, location, category FROM opportunities ORDER BY id DESC LIMIT 5');

  let response = 'AI assistant response:\n\n';

  if (!prompt) {
    response += 'Please write a question.';
  } else if (/skill|skills|כישורים/i.test(prompt)) {
    response += 'Top relevant areas include SQL, reporting, BI, ERP familiarity, analytics, QA, and project coordination.';
  } else if (/crm|summary|status|סכם|סטטוס/i.test(prompt)) {
    response += 'CRM focus should be reviewing pending applications, promoting accepted projects, and keeping statuses updated across the pipeline.';
  } else {
    response += 'Use this assistant for job matching, skills summaries, CRM summaries, and drafting short responses. Latest opportunities: ' +
      latest.map(x => `${x.title} (${x.location})`).join(', ') + '.';
  }

  response += '\n\nOpportunities by category: ' + stats.map(s => `${s.category}=${s.total}`).join(', ') + '.';

  await runQuery(
    'INSERT INTO ai_messages (user_role,prompt,response) VALUES ($1,$2,$3)',
    [req.session.user.role, prompt, response]
  );

  res.json({ answer: response });
});

app.get('/api/charts', requireRole(['admin']), async (req, res) => {
  const byCategory = await getAll('SELECT category AS label, COUNT(*)::int AS value FROM opportunities GROUP BY category ORDER BY category');
  const byStatus = await getAll('SELECT status AS label, COUNT(*)::int AS value FROM applications GROUP BY status ORDER BY status');
  const byLocation = await getAll('SELECT location AS label, COUNT(*)::int AS value FROM opportunities GROUP BY location ORDER BY value DESC, label ASC LIMIT 10');

  res.json({ byCategory, byStatus, byLocation });
});

app.use((req, res) => {
  res.status(404).render('404', { currentPage: '' });
});

async function startServer() {
  await initDb();
  await pool.query('SELECT 1');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});