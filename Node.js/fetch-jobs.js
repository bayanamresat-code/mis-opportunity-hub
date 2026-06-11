// fetch-jobs.js
// סורק Drushim ו-AllJobs ישירות ומכניס ל-PostgreSQL
// הרץ: node Node.js/fetch-jobs.js

const { Pool } = require('pg');
const axios = require('axios');
const cheerio = require('cheerio');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const IS_KEYWORDS = [
  'מערכות מידע', 'מנתח מערכות', 'מיישם מערכות',
  'ERP', 'CRM', 'SQL', 'BI', 'Data Analyst',
  'Business Analyst', 'Help Desk', 'תמיכה טכנית',
  'Priority', 'SAP', 'אפיון', 'Power BI', 'Database',
  'IT manager', 'מנהל IT', 'אנליסט'
];

// חיפושים — צפון / מרכז / דרום
const SEARCHES = [
  // צפון
  { source: 'Drushim', url: 'https://www.drushim.co.il/jobs/cat13/?q=%D7%9E%D7%A2%D7%A8%D7%9B%D7%95%D7%AA+%D7%9E%D7%99%D7%93%D7%A2&regionIds=5' },
  { source: 'Drushim', url: 'https://www.drushim.co.il/jobs/cat13/?q=IT&regionIds=5' },
  // מרכז
  { source: 'Drushim', url: 'https://www.drushim.co.il/jobs/cat13/?q=%D7%9E%D7%A2%D7%A8%D7%9B%D7%95%D7%AA+%D7%9E%D7%99%D7%93%D7%A2&regionIds=2' },
  { source: 'Drushim', url: 'https://www.drushim.co.il/jobs/cat13/?q=IT&regionIds=2' },
  // דרום
  { source: 'Drushim', url: 'https://www.drushim.co.il/jobs/cat13/?q=%D7%9E%D7%A2%D7%A8%D7%9B%D7%95%D7%AA+%D7%9E%D7%99%D7%93%D7%A2&regionIds=3' },
  // AllJobs
  { source: 'AllJobs', url: 'https://www.alljobs.co.il/SearchResults.aspx/q/%D7%9E%D7%A2%D7%A8%D7%9B%D7%95%D7%AA-%D7%9E%D7%99%D7%93%D7%A2' },
  { source: 'AllJobs', url: 'https://www.alljobs.co.il/SearchResults.aspx/q/IT-manager' },
];

function isRelevantJob(text) {
  const lower = text.toLowerCase();
  return IS_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

function extractEmail(text) {
  const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return match ? match[0] : null;
}

function extractPhone(text) {
  const match = text.match(/0\d{1,2}-?\d{7}/);
  return match ? match[0] : null;
}

async function scrapeDrushim(url) {
  const jobs = [];
  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    $('.job-item, .job-box, [class*="job"]').each((i, el) => {
      const text = $(el).text().trim();
      if (!isRelevantJob(text)) return;

      const title   = $(el).find('h2, h3, .job-title, [class*="title"]').first().text().trim() || text.substring(0, 60);
      const company = $(el).find('.company, [class*="company"], [class*="employer"]').first().text().trim() || null;
      const location = $(el).find('.location, [class*="location"], [class*="city"]').first().text().trim() || null;
      const link    = $(el).find('a').first().attr('href') || url;
      const applyUrl = link.startsWith('http') ? link : `https://www.drushim.co.il${link}`;

      if (title.length > 5) {
        jobs.push({ title, company, location, description: text.substring(0, 1000), applyUrl, source: 'Drushim' });
      }
    });
  } catch (err) {
    console.error(`  Error scraping Drushim: ${err.message}`);
  }
  return jobs;
}

async function scrapeAllJobs(url) {
  const jobs = [];
  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    $('.job-item, .position, [class*="job"], [class*="position"]').each((i, el) => {
      const text = $(el).text().trim();
      if (!isRelevantJob(text)) return;

      const title    = $(el).find('h2, h3, .title, [class*="title"]').first().text().trim() || text.substring(0, 60);
      const company  = $(el).find('.company, [class*="company"]').first().text().trim() || null;
      const location = $(el).find('.location, [class*="location"]').first().text().trim() || null;
      const link     = $(el).find('a').first().attr('href') || url;
      const applyUrl = link.startsWith('http') ? link : `https://www.alljobs.co.il${link}`;

      if (title.length > 5) {
        jobs.push({ title, company, location, description: text.substring(0, 1000), applyUrl, source: 'AllJobs' });
      }
    });
  } catch (err) {
    console.error(`  Error scraping AllJobs: ${err.message}`);
  }
  return jobs;
}

async function insertJob(client, job) {
  const { title, company, location, description, applyUrl, source } = job;

  const existing = await client.query(
    `SELECT id FROM opportunities WHERE title = $1 AND company = $2 AND source = $3`,
    [title, company, source]
  );
  if (existing.rows.length > 0) return false;

  const email = extractEmail(description || '');
  const phone = extractPhone(description || '');

  await client.query(
    `INSERT INTO opportunities
     (title, company, contact_name, contact_email, contact_phone,
      location, category, description, status, source, external_job_id, employment_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [title, company, null, email, phone, location, 'job', description, 'open', source, applyUrl, null]
  );

  return true;
}

async function main() {
  const client = await pool.connect();
  let totalAdded = 0;
  const sourceCounts = {};

  try {
    console.log('Starting job fetch from Drushim & AllJobs...\n');

    for (const search of SEARCHES) {
      console.log(`Scraping: ${search.source} — ${search.url}`);

      const jobs = search.source === 'Drushim'
        ? await scrapeDrushim(search.url)
        : await scrapeAllJobs(search.url);

      console.log(`Found ${jobs.length} relevant jobs`);

      for (const job of jobs) {
        const added = await insertJob(client, job);
        if (added) {
          totalAdded++;
          sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
          console.log(`  ✓ [${job.source}] ${job.title} @ ${job.company || 'unknown'}`);
        }
      }

      await new Promise(r => setTimeout(r, 2000));
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