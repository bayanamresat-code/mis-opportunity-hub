const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE = path.join(__dirname, 'database.db');

const db = new sqlite3.Database(DATABASE, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
      SELECT
        id,
        title,
        location,
        category,
        description,
        created_at
      FROM opportunities
      WHERE category = ?
      ORDER BY id DESC
    `,
    [category]
  );
}

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
    console.error('Jobs page error:', error.message);
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
    console.error('Internships page error:', error.message);
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
    console.error('Projects page error:', error.message);
    res.status(500).render('projects', {
      currentPage: 'projects',
      title: 'Projects',
      subtitle: 'Explore available academic and industry projects.',
      items: []
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

    res.render('login', {
      currentPage: 'login',
      message: `Login successful. Welcome, ${user.fullname}!`,
      messageType: 'success'
    });
  } catch (error) {
    console.error('Login error:', error.message);
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

    await runQuery(
      `
        INSERT INTO users (fullname, email, password, role)
        VALUES (?, ?, ?, ?)
      `,
      [fullname, email, hashedPassword, role]
    );

    res.render('signup', {
      currentPage: 'signup',
      message: 'Account created successfully. You can now log in.',
      messageType: 'success'
    });
  } catch (error) {
    console.error('Signup error:', error.message);

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
      `
        INSERT INTO contacts (name, email, subject, message)
        VALUES (?, ?, ?, ?)
      `,
      [name, email, subject, message]
    );

    res.render('contact', {
      currentPage: 'contact',
      message: 'Message sent successfully',
      messageType: 'success'
    });
  } catch (error) {
    console.error('Contact error:', error.message);
    res.status(500).render('contact', {
      currentPage: 'contact',
      message: 'Could not send message',
      messageType: 'error'
    });
  }
});

app.get('/api/opportunities', async (req, res) => {
  try {
    const rows = await getAll(
      `
        SELECT
          id,
          title,
          location,
          category,
          description,
          created_at
        FROM opportunities
        ORDER BY id DESC
      `
    );

    res.json(rows);
  } catch (error) {
    console.error('API opportunities error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const rows = await getAll(
      `
        SELECT
          id,
          fullname,
          email,
          role,
          created_at
        FROM users
        ORDER BY id DESC
      `
    );

    res.json(rows);
  } catch (error) {
    console.error('API users error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/contacts', async (req, res) => {
  try {
    const rows = await getAll(
      `
        SELECT
          id,
          name,
          email,
          subject,
          message,
          created_at
        FROM contacts
        ORDER BY id DESC
      `
    );

    res.json(rows);
  } catch (error) {
    console.error('API contacts error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});