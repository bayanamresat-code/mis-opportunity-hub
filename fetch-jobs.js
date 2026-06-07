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
  { query: 'information systems manager Israel' },
  { query: 'ERP consultant Israel' },
  { query: 'BI analyst Israel' },
  { query: 'CRM manager Israel' },
  { query: 'IT manager Israel' },
];

async function fetchJobs(query, location) {
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1&date_posted=month`;

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

async function insertJob(client, job) {
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

  // בדוק אם כבר קיים (לפי כותרת + חברה)
  const existing = await client.query(
    `SELECT id FROM opportunities WHERE title = $1 AND company = $2 AND source = $3`,
    [title, company, source]
  );

  if (existing.rows.length > 0) {
    return false; // כבר קיים
  }

  await client.query(
    `INSERT INTO opportunities
     (title, company, contact_name, contact_email, contact_phone,
      location, category, description, status, source, external_job_id, employment_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      title,
      company,
      null,
      null,
      null,
      location,
      'job',
      description,
      'open',
      source,
      applyUrl || externalId, // שמור את ה-URL המלא כ-external_job_id
      employmentType
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