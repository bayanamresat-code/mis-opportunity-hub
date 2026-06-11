// fetch-jobs.js
// שולף משרות מ-JSearch (Indeed/LinkedIn/Glassdoor) ומכניס ל-PostgreSQL
// הרץ: node fetch-jobs.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '517a7b0eadmshed411f963ebab9bp18cf6fjsn087ed604b869';

const SEARCHES = [
  { query: 'information systems manager in Israel' },
  { query: 'ERP consultant in Israel' },
  { query: 'BI analyst data in Israel' },
  { query: 'CRM manager in Israel' },
  { query: 'IT manager in Israel' },
];

// מדינות מותרות — רק ישראל
const ALLOWED_COUNTRIES = ['il', 'israel'];

async function fetchJobs(query) {
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1&date_posted=month&country=il`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    console.error(`API error for "${query}": ${res.status}`);
    return [];
  }

  const data = await res.json();
  return data.data || [];
}

function detectSource(job) {
  const publisher = (job.job_publisher || '').toLowerCase();
  if (publisher.includes('linkedin')) return 'LinkedIn';
  if (publisher.includes('glassdoor')) return 'Glassdoor';
  if (publisher.includes('indeed')) return 'Indeed';
  return job.job_publisher || 'JSearch';
}

function getExternalId(job) {
  // מנסה לשלוף ID מה-URL של המשרה
  const url = job.job_apply_link || job.job_google_link || '';
  const match = url.match(/jk=([a-f0-9]+)/i) || url.match(/\/(\d{6,})/);
  return match ? match[1] : job.job_id?.substring(0, 30) || null;
}

function getApplyUrl(job) {
  return job.job_apply_link || job.job_google_link || null;
}

function isIsraelJob(job) {
  const country = (job.job_country || '').toLowerCase();
  const city = (job.job_city || '').toLowerCase();
  const description = (job.job_description || '').toLowerCase();

  // אם המדינה מפורשת ולא ישראל — דחה
  if (country && !ALLOWED_COUNTRIES.includes(country)) return false;

  // אם המדינה ישראל — אשר
  if (ALLOWED_COUNTRIES.includes(country)) return true;

  // אם אין מדינה — בדוק עיר ישראלית בטקסט
  const israelCities = [
    'tel aviv', 'jerusalem', 'haifa', 'beer sheva', 'netanya',
    'petah tikva', 'rishon', 'ashdod', 'holon', 'ramat gan',
    'herzliya', 'kfar saba', 'rehovot', 'modiin', 'eilat',
    'nazareth', 'acre', 'safed', 'tiberias', 'karmiel',
    'יש', 'ישראל', 'תל אביב', 'ירושלים', 'חיפה'
  ];
  return israelCities.some(c => city.includes(c) || description.includes(c));
}

async function insertJob(client, job) {
  // סינון — רק משרות מישראל
  if (!isIsraelJob(job)) {
    console.log(`  ✗ Skipped (not Israel): ${job.job_title} @ ${job.job_country || 'unknown'}`);
    return false;
  }

  const title = job.job_title || 'Unknown Title';
  const company = job.employer_name || null;
  const location = job.job_city
    ? `${job.job_city}${job.job_country ? ', ' + job.job_country : ''}`
    : (job.job_country || 'Israel');
  const description = job.job_description
    ? job.job_description.substring(0, 1000)
    : null;
  const source = detectSource(job);
  const externalId = getExternalId(job);
  const applyUrl = getApplyUrl(job);
  const employmentType = job.job_employment_type || null;

  
  const contactEmail = job.employer_company_email || null;

  const existing = await client.query(
    `SELECT id FROM opportunities WHERE title = $1 AND company = $2 AND source = $3`,
    [title, company, source]
  );

  
  if (existing.rows.length > 0) {
    if (contactEmail) {
      await client.query(
        `UPDATE opportunities SET contact_email = $1 WHERE id = $2 AND contact_email IS NULL`,
        [contactEmail, existing.rows[0].id]
      );
      console.log(`  ↻ Updated email for: ${title}`);
    }
    return false;
  }

  await client.query(
    `INSERT INTO opportunities
     (title, company, contact_name, contact_email, contact_phone,
      location, category, description, status, source, external_job_id, employment_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      title, company, null,
      contactEmail,  // ← שינוי 3: במקום null
      null, location, 'job', description, 'open',
      source, applyUrl || externalId, employmentType
    ]
  );

  return true;
}

async function main() {
  const client = await pool.connect();
  let totalAdded = 0;

  try {
    console.log('Starting job fetch from JSearch...');

    for (const search of SEARCHES) {
      console.log(`\nSearching: "${search.query}"`);
      const jobs = await fetchJobs(search.query);
      console.log(`Found ${jobs.length} jobs`);

      for (const job of jobs) {
        const added = await insertJob(client, job);
        if (added) {
          totalAdded++;
          console.log(`  ✓ Added: ${job.job_title} @ ${job.employer_name}`);
        } else {
          console.log(`  - Skip (exists): ${job.job_title}`);
        }
      }

      // המתן בין בקשות כדי לא לעבור את ה-rate limit
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\nDone! Added ${totalAdded} new jobs.`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();