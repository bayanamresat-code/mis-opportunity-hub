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

const db = new sqlite3.Database(DATABASE, err => {
  if (err) console.error('Failed to connect to database:', err.message);
  else console.log('Connected to SQLite database');
});

const defaultOpportunities = [
  ['מנהל/ת מערכות מידע (CIO)', 'ישומים לבכירים / חברת השמה', 'נציג שירות', 'isumim@bezeqint.net', '050-4581441', 'עכו', 'job',
    'CIO לחברה תעשייתית גלובלית: אסטרטגיית IT, תשתיות, ERP (Infor M3), סייבר, דיגיטציה, ניהול צוות בארץ ובחברות בנות.',
    'open'],
  ['מנהל/ת מערכות מידע (CIO) לארגון חברתי', 'IT Solutions LTD', 'נציג שירות', 'info@it-solutions.co.il', '03-7522110', 'תל אביב יפו', 'job',
    'CIO לארגון חברתי בפריסה ארצית: הובלת אסטרטגיית מערכות מידע ודיגיטל, טרנספורמציה דיגיטלית, ניהול תשתיות, ERP/CRM, BI ו-AI.',
    'open'],
  ['מנהל/ת מערכות מידע לחברה יצרנית וקמעונאית', 'אורגנייז השמת עובדים בע"מ', 'נציג שירות', 'or@or-ganize.co.il', '055-9646196', 'קדימה צורן', 'job',
    'ניהול מלא של מערך ERP Priority, קופות ו-BI, ניהול פרויקטים וניהול 5 עובדים ועולמות אאוטסורסינג.',
    'open'],

  ['מנהל/ת אגף מערכות מידע (CIO) לויצו העולמית', 'ויצו', 'משאבי אנוש ', 'shimritn@wizo.org', '03-6923726', 'מספר מקומות', 'job',
    'הובלה אסטרטגית של מערכות מידע, תשתיות ודיגיטל, חדשנות, BI ו-AI, ניהול צוות של כ-20 עובדים, חברות בהנהלת הארגון.',
    'open'],
  ['מנהל/ת מערכות מידע Priority + O365', 'דנאל (רמלה)', 'דנאל סיעוד', 'inquiriesdanel@edanel.co.il', '077-8051038', 'רמלה (אזור צריפין)', 'job',
    'אחזקה, תמיכה ופיתוח של Priority ו-O365, תמיכת משתמשים, ניהול ספקים, פרויקטים, הדרכות וטיפול בתקלות.',
    'open'],
  ['מנמ"ר/ית לחברת נדל"ן', 'השמה גרופ גיוס ויעוץ בע"מ', 'עדי זיברט בנימין', 'adi.hasama@gmail.com', '054-3340105', 'מספר מקומות', 'job',
    'אפיון, פיתוח, יישום והטמעה של מערכות מידע, BI, Priority, תשתיות ואבטחת מידע, אחריות תקציב ותוכניות עבודה.',
    'open'],

  ['מנהל מערכות מידע ואחזקה (IT CNC Maintenance)', 'אהרון יוסף ובניו תעשיות זיווד', 'נציג שירות', 'ay-ltd.com', '08-8673402', 'גן יבנה (אזור אשדוד)', 'job',
    'ניהול מערכות מחשוב ושרתי הארגון (Priority, SQL, SolidWorks), תחזוקת מכונות CNC, רשתות, אבטחת מידע ותקלות ייצור.',
    'open'],
  ['מנהל/ת מחלקת יישומים ארגוניים', 'תדיראן גרופ', 'נציג שירות', 'service-tadiran@tadiran-group.co.il', '054-1466-491', 'פתח תקווה', 'job',
    'ניהול מקצועי של מחלקת יישומים: SAP, Priority, CRM, BI, דאטה, אוטומציות ואינטגרציות, פרויקטים חוצי ארגון וניהול צוותים.',
    'open'],

  ['Data Analyst Intern', 'Nazareth Student Analytics', 'Maya Yassin', 'intern1@nazstudent.co.il', '04-602-2001', 'Nazareth', 'internship',
    'Hands-on analytics internship for students in information systems.',
    'open'],
  ['BI Intern', 'Karmiel BI Lab', 'Niv Bar', 'intern2@karmielbi.co.il', '04-602-2002', 'Karmiel', 'internship',
    'Support dashboarding and KPI analysis.',
    'open'],
  ['ERP Intern', 'Acre ERP Academy', 'Roei Maman', 'intern3@acreerp.co.il', '04-602-2003', 'Acre', 'internship',
    'Assist ERP process mapping and support activities.',
    'open'],

  ['CRM Optimization Project', 'Nof CRM Projects', 'Alaa Khateeb', 'project1@nofcrm.co.il', '04-603-3001', 'Nof HaGalil', 'project',
    'Applied project for CRM workflow redesign and KPI tracking.',
    'open'],
  ['BI Dashboard Project', 'Safed Dashboard Works', 'Lihi Vaknin', 'project2@safeddash.co.il', '04-603-3002', 'Safed', 'project',
    'Create a dashboard for operational and academic reporting.',
    'open'],
  ['ERP Process Mapping Project', 'Bialik ERP Studio', 'Elad Harari', 'project3@bialikerp.co.il', '04-603-3003', 'Kiryat Bialik', 'project',
    'Map ERP-related business processes and recommend improvements.',
    'open']
];

const defaultEmployers = [
  ['מנהלת בר לב בע"מ', 'שירות למפעלים', 'מנכ"ל', 'אבנר סבן', '04-9550301', 'barlev@barlev.org'],
  ['בית תוכנה (Keysoft?)', 'בית תוכנה', 'מנכ"ל ובעלים', 'אלי סמדר', '04-9510533', 'info@keysoft.co.il'],
  ['אבן קיסר בע"מ', 'משטחי אבן מקוריים', 'מנכ"ל', 'עידן רון', '04-6109800', 'officebl@caesarstone.com'],
  ['אסטרון – מנעולי ירדני בע"מ', 'עבודות פרזול ובניין', 'מנכ"ל', 'גדעון שמי', '04-8761112', 'yafa@astron.co.il'],
  ['בז מכלולים תעופתיים בע"מ', 'מוצרי תעופה', 'מנכ"ל', 'איתן כהן', '04-9569000', 'honi@bazaircraft.com'],
  ['י.ש.ר אריזה בע"מ', 'אריזה', 'מנכ"ל', 'סיוון כפרי', '04-9558004', 'sivan@ysr.co.il'],
  ['נירוסטה צפון בע"מ', 'ייצור מוצרי נירוסטה', 'מנכ"ל', 'שלום לוי', '04-9555533', 'mazal@n-zafon.com'],
  ['ספירל סולושנס בע"מ', 'בית תוכנה', 'מנכ"ל', 'מתי זינדר', '04-9554020', 'jobs@spiralsolutions.com'],
  ['מוקד מכשירים מדויקים', 'עיבוד שבבי מדויק', 'מנכ"לים', 'דני אילון, אהוד גופר', '04-8161700', 'iris@mokedltd.com'],
  ['אלום קוסטיקה בע"מ', 'פתרונות מוצרי אלומיניום', 'מנכ"ל', 'שלומי קוסטיקה', '04-9913074', 'office@alumk.co.il']
];

function migrateOpportunitiesTable(callback) {
  db.all(`PRAGMA table_info(opportunities)`, [], (err, rows) => {
    if (err) {
      console.error('Error reading opportunities schema:', err.message);
      return callback?.(err);
    }

    const existingColumns = rows.map(r => r.name);
    const migrations = [];

    if (!existingColumns.includes('company')) migrations.push(`ALTER TABLE opportunities ADD COLUMN company TEXT`);
    if (!existingColumns.includes('contact_name')) migrations.push(`ALTER TABLE opportunities ADD COLUMN contact_name TEXT`);
    if (!existingColumns.includes('contact_email')) migrations.push(`ALTER TABLE opportunities ADD COLUMN contact_email TEXT`);
    if (!existingColumns.includes('contact_phone')) migrations.push(`ALTER TABLE opportunities ADD COLUMN contact_phone TEXT`);
    if (!existingColumns.includes('status')) migrations.push(`ALTER TABLE opportunities ADD COLUMN status TEXT DEFAULT 'open'`);

    let pending = migrations.length;
    if (pending === 0) return callback?.();

    migrations.forEach(sql => {
      db.run(sql, migrationErr => {
        if (migrationErr) console.error('Migration error:', migrationErr.message);
        else console.log('Migration applied:', sql);
        pending -= 1;
        if (pending === 0) callback?.();
      });
    });
  });
}

function normalizeOpportunitiesData() {
  db.run(`UPDATE opportunities SET status = 'open' WHERE status IS NULL`);
}

function seedOpportunities() {
  if (!Array.isArray(defaultOpportunities)) {
    console.error('defaultOpportunities is not an array');
    return;
  }

  defaultOpportunities.forEach((item, index) => {
    if (!Array.isArray(item) || item.length < 9) {
      console.error('Invalid seed item at index', index, item);
      return;
    }

    const [
      title,
      company,
      contact_name,
      contact_email,
      contact_phone,
      location,
      category,
      description,
      status
    ] = item;

    db.get(
      `SELECT id FROM opportunities WHERE title = ? AND location = ? AND category = ?`,
      [title, location, category],
      (err, row) => {
        if (err) {
          console.error('Seed check error:', err.message);
          return;
        }
if (!row) {
  db.run(
    `INSERT INTO opportunities
     (title, company, contact_name, contact_email, contact_phone, location, category, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, company, contact_name, contact_email, contact_phone, location, category, description, status],
    insertErr => {
      if (insertErr) console.error('Seed insert error:', insertErr.message);
    }
  );
}
         else {
          db.run(
            `UPDATE opportunities
             SET company = ?,
                 contact_name = ?,
                 contact_email = ?,
                 contact_phone = ?,
                 description = ?,
                 status = ?
             WHERE id = ?`,
            [company, contact_name, contact_email, contact_phone, description, status, row.id],
            updateErr => {
              if (updateErr) console.error('Seed update error:', updateErr.message);
            }
          );
        }
      }
    );
  });
}

function seedEmployers() {
  defaultEmployers.forEach(item => {
    db.get(
      `SELECT id FROM employers WHERE company_name = ?`,
      [item[0]],
      (err, row) => {
        if (err) {
          console.error('Employer seed check error:', err.message);
          return;
        }

        if (!row) {
          db.run(
            `INSERT INTO employers
             (company_name, industry, contact_role, contact_name, phone, email)
             VALUES (?, ?, ?, ?, ?, ?)`,
            item,
            insertErr => {
              if (insertErr) console.error('Employer seed insert error:', insertErr.message);
            }
          );
        }
      }
    );
  });
}

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

  db.run(`
    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      industry TEXT,
      contact_role TEXT,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  migrateOpportunitiesTable(err => {
    if (err) return;
    normalizeOpportunitiesData();
    seedOpportunities();
    seedEmployers();
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
    SELECT id, title, company, contact_name, contact_email, contact_phone,
           location, category, description, status, created_at
    FROM opportunities
    WHERE category = ?
    ORDER BY id DESC
    `,
    [category]
  );
}

async function searchOpportunities(filters = {}) {
  let sql = `
    SELECT id, title, company, contact_name, contact_email, contact_phone,
           location, category, description, status, created_at
    FROM opportunities
    WHERE 1=1
  `;
  const params = [];

  if (filters.q && filters.q.trim() !== '') {
    sql += ` AND (title LIKE ? OR company LIKE ? OR description LIKE ?)`;
    const keyword = `%${filters.q.trim()}%`;
    params.push(keyword, keyword, keyword);
  }

  if (filters.category && filters.category.trim() !== '') {
    sql += ` AND category = ?`;
    params.push(filters.category.trim());
  }

  if (filters.location && filters.location.trim() !== '') {
    sql += ` AND location LIKE ?`;
    params.push(`%${filters.location.trim()}%`);
  }

  if (filters.status && filters.status.trim() !== '') {
    sql += ` AND status = ?`;
    params.push(filters.status.trim());
  }

  if (filters.company && filters.company.trim() !== '') {
    sql += ` AND company LIKE ?`;
    params.push(`%${filters.company.trim()}%`);
  }

  sql += ` ORDER BY id DESC`;
  return getAll(sql, params);
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

app.get('/', async (req, res) => {
  try {
    const employers = await getAll(
      `SELECT id, company_name, industry, contact_role, contact_name, phone, email
       FROM employers
       ORDER BY id DESC`
    );

    res.render('index', {
      currentPage: 'home',
      employers
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('index', {
      currentPage: 'home',
      employers: []
    });
  }
});
app.get('/add-opportunity', requireRole(['admin']), (req, res) => {
  res.render('add-opportunity', {
    currentPage: 'add-opportunity',
    selectedType: req.query.type || ''
  });
});


app.post('/add-opportunity', requireRole(['admin']), (req, res) => {
  const {
    title,
    company,
    contact_name,
    contact_email,
    contact_phone,
    location,
    category,
    description
  } = req.body;



  db.run(
    `INSERT INTO opportunities
     (title, company, contact_name, contact_email, contact_phone, location, category, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      company,
      contact_name,
      contact_email,
      contact_phone,
      location,
      category,
      description,
      'open'

    ],
    function (err) {
      if (err) {
        console.error('Add opportunity error:', err.message);
        return res.status(500).send('Error adding opportunity');
      }

      res.redirect('/crm');
    }
  );
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

app.get('/search', async (req, res) => {
  try {
    const filters = {
      q: req.query.q || '',
      category: req.query.category || '',
      location: req.query.location || '',
      status: req.query.status || '',
      company: req.query.company || ''
    };

    const items = await searchOpportunities(filters);

    res.render('search', {
      currentPage: 'search',
      title: 'Advanced Search',
      filters,
      items
    });
  } catch (error) {
    console.error('Error searching opportunities:', error);
    res.status(500).render('search', {
      currentPage: 'search',
      title: 'Advanced Search',
      filters: { q: '', category: '', location: '', status: '', company: '' },
      items: []
    });
  }
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

app.get('/crm', requireRole(['admin']), async (req, res) => {
  try {
    const users = await getAll(
      `SELECT id, fullname, email, role, created_at
       FROM users
       ORDER BY id DESC`
    );

    const opportunities = await getAll(
      `SELECT id, title, company, contact_name, contact_email, contact_phone,
              location, category, description, status, created_at
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
    console.error('Error loading CRM:', error);
    res.status(500).send('Error loading CRM');
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
      `SELECT id, title, company, contact_name, contact_email, contact_phone,
              location, category, description, status, created_at
       FROM opportunities
       ORDER BY id DESC`
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

