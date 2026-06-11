// fetch-jobs.js
// שולף משרות מ-Google Jobs דרך SerpApi ומכניס ל-PostgreSQL
// הרץ: node Node.js/fetch-jobs.js

const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SERPAPI_KEY = process.env.SERPAPI_KEY || '05b6a7cdad8c5dbb32cd8690bc8124348768a6e453b2be3db85c1ee1c2189aa7';

// חיפושים — צפון / מרכז / דרום
const SEARCHES = [
  // צפון
  'מנתח מערכות מידע חיפה',
  'IT manager Haifa Israel',
  'ERP consultant Haifa Israel',
  'BI analyst Haifa Israel',
  // מרכז
  'מנתח מערכות מידע תל אביב',
  'IT manager Tel Aviv Israel',
  'data analyst Tel Aviv Israel',
  'SAP consultant Tel Aviv Israel',
  // דרום
  'IT manager Beer Sheva Israel',
  'מנתח מערכות מידע באר שבע',
];

async function fetchJobs(query) {
  try {
    const { data } = await axios.get('https://serpapi.com/search', {
      params: {
        engine:  'google_jobs',
        q:       query,
        hl:      'iw',
        gl:      'il',
        api_key: SERPAPI_KEY,
      },
      timeout: 15000
    });

    return data.jobs_results || [];
  } catch (err) {
    console.error(`  API error for "${query}": ${err.message}`);
    return [];
  }
}

function detectSource(job) {
  const via = (job.via || '').toLowerCase();
  if (via.includes('drushim'))   return 'Drushim';
  if (via.includes('alljobs'))   return 'AllJobs';
  if (via.includes('linkedin'))  return 'LinkedIn';
  if (via.includes('glassdoor')) return 'Glassdoor';
  if (via.includes('indeed'))    return 'Indeed';
  return job.via || 'Google Jobs';
}

function extractEmail(text) {
  const match = (text || '').match(/[\w.-]+@[\w.-]+\.\w+/);
  return match ? match[0] : null;
}

function extractPhone(text) {
  const match = (text || '').match(/0\d{1,2}-?\d{7}/);
  return match ? match[0] : null;
}

async function insertJob(client, job) {
  const title       = job.title             || 'Unknown Title';
  const company     = job.company_name      || null;
  const location    = job.location          || null;
  const description = job.description
    ? job.description.substring(0, 1000)
    : null;
  const applyUrl    = job.related_links?.[0]?.link || null;
  const source      = detectSource(job);

  // בדוק אם כבר קיים
  const existing = await client.query(
    `SELECT id FROM opportunities WHERE title = $1 AND company = $2 AND source = $3`,
    [title, company, source]
  );
  if (existing.rows.length > 0) return false;

  const email = extractEmail(description);
  const phone = extractPhone(description);

  await client.query(
    `INSERT INTO opportunities
     (title, company, contact_name, contact_email, contact_phone,
      location, category, description, status, source, external_job_id, employment_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      title, company, null, email, phone,
      location, 'job', description, 'open',
      source, applyUrl, job.detected_extensions?.schedule_type || null
    ]
  );

  return true;
}

async function main() {
  const client = await pool.connect();
  let totalAdded = 0;
  const sourceCounts = {};

  try {
    console.log('Starting job fetch from Google Jobs (SerpApi)...\n');

    for (const search of SEARCHES) {
      console.log(`Searching: "${search}"`);
      const jobs = await fetchJobs(search);
      console.log(`Found ${jobs.length} jobs`);

      for (const job of jobs) {
        const added = await insertJob(client, job);
        if (added) {
          totalAdded++;
          const src = detectSource(job);
          sourceCounts[src] = (sourceCounts[src] || 0) + 1;
          console.log(`  ✓ [${src}] ${job.title} @ ${job.company_name}`);
        }
      }

      // המתן בין בקשות
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\nDone! Added ${totalAdded} new jobs.`);
    console.log('By source:', sourceCounts);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
