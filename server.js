const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Choose storage dir (Render / local)
const storageDir = process.env.RENDER
  ? '/opt/render/project/src/storage'
  : __dirname;

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const DATABASE = path.join(storageDir, 'database.db');

// SQLite connection
const db = new sqlite3.Database(DATABASE, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Schema + seed
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
        ('Business Analyst', 'Haifa', 'job', 'Analyze business needs and support digital transformation projects.'),
        ('Data Analyst Intern', 'Haifa', 'internship', 'Support analytics reporting and dashboard preparation.'),
        ('CRM System Project', 'Safed', 'project', 'Design and document a CRM solution for healthcare workflows.')
      `);
    }
  });
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
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

// Make currentUser available in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// DB helpers
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

// Auth helpers
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }

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

// Routes

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
    res.status(500).render('jobs', {
      currentPage: 'jobs',
      title: 'Jobs',
      subtitle: 'Explore available jobs for Information Systems students and graduates.',
      items: []
    });
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
      `INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)`,
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
      `INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)`,
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

app.get('/student-dashboard', requireRole(['student']), async (req, res) => {
  res.render('student-dashboard', {
    currentPage: '',
    user: req.session.user
  });
});

app.get('/graduate-dashboard', requireRole(['graduate']), async (req, res) => {
  res.render('graduate-dashboard', {
    currentPage: '',
    user: req.session.user
  });
});

app.get('/employer-dashboard', requireRole(['employer']), async (req, res) => {
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

app.get('/crm', requireRole(['admin', 'employer']), async (req, res) => {
  try {
    const users = await getAll(
      `SELECT fullname, email, role, created_at FROM users ORDER BY id DESC`
    );
    const opportunities = await getAll(
      `SELECT title, location, category, description, created_at FROM opportunities ORDER BY id DESC`
    );
    const contacts = await getAll(
      `SELECT name, email, subject, message, created_at FROM contacts ORDER BY id DESC`
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

app.get('/profile', requireAuth, (req, res) => {
  res.json(req.session.user);
});

app.get('/api/opportunities', async (req, res) => {
  try {
    const rows = await getAll(
      `SELECT id, title, location, category, description, created_at FROM opportunities ORDER BY id DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});