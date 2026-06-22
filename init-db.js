require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


async function init() {
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL');
    // ─── Create Tables (only if not exist) ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fullname TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'graduate', 'employer', 'admin')),
        skills TEXT DEFAULT '',
        cv_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        location TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('job', 'internship', 'project')),
        description TEXT,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'draft')),
        source TEXT,
        external_job_id TEXT,
        employment_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        cv_uploaded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_employer_contacts (
        id SERIAL PRIMARY KEY,
        employer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        preferred_channel TEXT DEFAULT 'email' CHECK(preferred_channel IN ('email', 'whatsapp', 'meeting')),
        meeting_requested BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'done')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS employers (
        id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL,
        industry TEXT,
        contact_role TEXT,
        contact_name TEXT,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables ready');

    // ─── Seed Opportunities (only if empty) ─────────────────────────────────────
    const existingOps = await client.query('SELECT COUNT(*) FROM opportunities');
    if (parseInt(existingOps.rows[0].count) === 0) {
      const opportunities = [
        ['מנהל/ת מערכות מידע (CIO)', 'ישומים לבכירים / חברת השמה', null, null, null, 'עכו', 'job', 'CIO לחברה תעשייתית גלובלית: אסטרטגיית IT, תשתיות, ERP (Infor M3), סייבר, דיגיטציה, ניהול צוות בארץ ובחברות בנות.', 'open', 'AllJobs', '8639251', 'משרה מלאה'],
        ['מנהל/ת מערכות מידע (CIO) לארגון חברתי', 'IT Solutions LTD', null, null, null, 'תל אביב יפו', 'job', 'CIO לארגון חברתי בפריסה ארצית: הובלת אסטרטגיית מערכות מידע ודיגיטל, טרנספורמציה דיגיטלית, ניהול תשתיות, ERP/CRM, BI ו-AI.', 'open', 'AllJobs', '8623397', 'משרה מלאה'],
        ['מנהל/ת מערכות מידע לחברה יצרנית וקמעונאית', 'אורגנייז השמת עובדים בע"מ', null, null, null, 'קדימה צורן', 'job', 'ניהול מלא של מערך ERP Priority, קופות ו-BI, ניהול פרויקטים וניהול 5 עובדים ועולמות אאוטסורסינג.', 'open', 'AllJobs', '8639903', 'משרה מלאה'],
        ['מנהל/ת מערכות מידע - צפון', 'חברה חסויה', null, null, null, 'כרמיאל, עכו', 'job', 'מנהל/ת מערכות מידע לחברה בינלאומית, ניסיון בחברה תעשייתית גלובלית, ניהול צוות, פיתוח והטמעת מערכות מידע.', 'open', 'AllJobs', '8640368', 'משרה מלאה'],
        ['מנהל/ת מערכות מידע ראשי/ת', 'נת"ע - נתיבי תחבורה עירוניים', null, null, null, 'חולון', 'job', 'ניהול כולל, תכנון ויישום מערכות מידע, דגש על BI, ERP, SharePoint, ניהול לו"ז, תקציב והפעלת ספקים וצוותים.', 'open', 'AllJobs', '8629525', 'משרה מלאה'],
        ['Data Analyst Intern', 'Nazareth Student Analytics', 'Maya Yassin', 'intern1@nazstudent.co.il', '04-602-2001', 'Nazareth', 'internship', 'Hands-on analytics internship for students in information systems.', 'open', null, null, null],
        ['BI Intern', 'Karmiel BI Lab', 'Niv Bar', 'intern2@karmielbi.co.il', '04-602-2002', 'Karmiel', 'internship', 'Support dashboarding and KPI analysis.', 'open', null, null, null],
        ['CRM Optimization Project', 'Nof CRM Projects', 'Alaa Khateeb', 'project1@nofcrm.co.il', '04-603-3001', 'Nof HaGalil', 'project', 'Applied project for CRM workflow redesign and KPI tracking.', 'open', null, null, null],
        ['BI Dashboard Project', 'Safed Dashboard Works', 'Lihi Vaknin', 'project2@safeddash.co.il', '04-603-3002', 'Safed', 'project', 'Create a dashboard for operational and academic reporting.', 'open', null, null, null],
      ];

      for (const op of opportunities) {
        await client.query(
          `INSERT INTO opportunities
           (title, company, contact_name, contact_email, contact_phone, location, category, description, status, source, external_job_id, employment_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          op
        );
      }
      console.log(`Seeded ${opportunities.length} opportunities`);
    } else {
      console.log(`Opportunities already exist (${existingOps.rows[0].count} rows), skipping seed`);
    }

    // ─── Seed Employers (only if empty) ─────────────────────────────────────────
    const existingEmployers = await client.query('SELECT COUNT(*) FROM employers');
    if (parseInt(existingEmployers.rows[0].count) === 0) {
      const employers = [
        ['מנהלת בר לב בע"מ', 'שירות למפעלים', 'מנכ"ל', 'אבנר סבן', '04-9550301', 'barlev@barlev.org'],
        ['בית תוכנה (Keysoft)', 'בית תוכנה', 'מנכ"ל ובעלים', 'אלי סמדר', '04-9510533', 'info@keysoft.co.il'],
        ['אבן קיסר בע"מ', 'משטחי אבן מקוריים', 'מנכ"ל', 'עידן רון', '04-6109800', 'officebl@caesarstone.com'],
      ];
      for (const emp of employers) {
        await client.query(
          `INSERT INTO employers (company_name, industry, contact_role, contact_name, phone, email)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          emp
        );
      }
      console.log(`Seeded ${employers.length} employers`);
    } else {
      console.log(`Employers already exist (${existingEmployers.rows[0].count} rows), skipping seed`);
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Init error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

init();