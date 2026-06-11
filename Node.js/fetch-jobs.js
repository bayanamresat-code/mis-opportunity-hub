// fetch-jobs.js
// שולף משרות מ-Adzuna API ומכניס ל-PostgreSQL
// הרץ: node Node.js/fetch-jobs.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const ADZUNA_APP_ID  = process.env.ADZUNA_APP_ID  || 'de239714';
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || '899a20b2220af8e7d97cd908713e0826';

// חיפושים — צפון / מרכז / דרום
const SEARCHES = [
  // צפון
  { query: 'information systems',  location: 'Haifa' },
  { query: 'IT manager',           location: 'Haifa' },
  { query: 'ERP',                  location: 'Haifa' },
  { query: 'data analyst',         location: 'Haifa' },
  { query: 'business analyst',     location: 'Nazareth' },
  // מרכז
  { query: 'information systems',  location: 'Tel Aviv' },
  { query: 'BI analyst',           location: 'Tel Aviv' },
  { query: 'CRM',                  location: 'Tel Aviv' },
  { query: 'SAP',                  location: 'Tel Aviv' },
  { query: 'IT manager',           location: 'Tel Aviv' },
  // דרום
  { query: 'IT manager',           location: 'Beer Sheva' },
  { query: 'data analyst',         location: 'Beer Sheva' },
  { query: 'system analyst',       location: 'Ashdod' },
];

async function fetchJobs(query, location) {
  const url = new URL('https://api.adzuna.com/v1/api/jobs/il/search/1');
  url.searchParams.set('app_id',       ADZUNA_APP_ID);
  url.searchParams.set('app_key',      ADZUNA_APP_KEY);
  url.searchParams.set('what',         query);
  url.searchParams.set('where',        location);
  url.searchParams.set('results_per_page', '20');
  url.searchParams.set('content-type', 'application/json');

  const res = await fetch(url.toString());

  if (!res.ok) {
    console.error(`  API error for "${query} @ ${location}": ${res.status}`);
    return [];
  }

  const data = await res.json();
  return data.results || [];
}

async function insertJob(client, job) {
  const title       = job.title               || 'Unknown Title';
  const company     = job.company?.display_name || null;
  const location    = job.location?.display_name || null;
  const description = job.description
    ? job.description.substring(0, 1000)
    : null;
  const applyUrl    = job.redirect_url         || null;
  const source      = 'Adzuna';

  // בדוק אם כבר קיים
  const existing = await client.query(
    `SELECT id FROM opportunities WHERE title = $1 AND company = $2 AND source = $3`,
    [title, company, source]
  );

  if (existing.rows.length > 0) return false;

  await client.query(
    `INSERT INTO opportunities
     (title, company, contact_name, contact_email, contact_phone,
      location, category, description, status, source, external_job_id, employment_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      title, company, null, null, null,
      location, 'job', description, 'open',
      source, applyUrl, null
    ]
  );

  return true;
}

async function main() {
  const client = await pool.connect();
  let totalAdded = 0;
  const regionCounts = { צפון: 0, מרכז: 0, דרום: 0 };

  const northCities  = ['haifa', 'nazareth', 'karmiel', 'acre', 'safed', 'tiberias'];
  const southCities  = ['beer sheva', 'ashdod', 'ashkelon', 'eilat'];

  function getRegion(location) {
    const loc = (location || '').toLowerCase();
    if (northCities.some(c => loc.includes(c))) return 'צפון';
    if (southCities.some(c => loc.includes(c))) return 'דרום';
    return 'מרכז';
  }

  try {
    console.log('Starting job fetch from Adzuna...\n');

    for (const search of SEARCHES) {
      console.log(`Searching: "${search.query}" @ ${search.location}`);
      const jobs = await fetchJobs(search.query, search.location);
      console.log(`Found ${jobs.length} jobs`);

      for (const job of jobs) {
        const added = await insertJob(client, job);
        if (added) {
          totalAdded++;
          const region = getRegion(job.location?.display_name);
          regionCounts[region]++;
          console.log(`  ✓ [${region}] ${job.title} @ ${job.company?.display_name}`);
        }
      }

      // המתן בין בקשות
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\nDone! Added ${totalAdded} new jobs.`);
    console.log('By region:', regionCounts);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();