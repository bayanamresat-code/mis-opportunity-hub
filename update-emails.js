// update-emails.js
// מעדכן contact_email ו-contact_phone למשרות קיימות בבסיס הנתונים
// הרץ: node update-emails.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const updates = [
  // [title, company, contact_name, contact_email, contact_phone]
  ['מנהל/ת מערכות מידע (CIO)', 'ישומים לבכירים / חברת השמה', 'נציג שירות', 'isumim@bezeqint.net', '050-4581441'],
  ['מנהל/ת מערכות מידע (CIO) לארגון חברתי', 'IT Solutions LTD', 'נציג שירות', 'info@it-solutions.co.il', '03-7522110'],
  ['מנהל/ת מערכות מידע לחברה יצרנית וקמעונאית', 'אורגנייז השמת עובדים בע"מ', 'נציג שירות', 'or@or-ganize.co.il', '055-9646196'],
  ['מנהל/ת אגף מערכות מידע (CIO) לויצו העולמית', 'ויצו', 'משאבי אנוש', 'shimritn@wizo.org', '03-6923726'],
  ['מנהל/ת מערכות מידע Priority + O365', 'דנאל (רמלה)', 'דנאל סיעוד', 'inquiriesdanel@edanel.co.il', '077-8051038'],
  ['מנמ"ר/ית לחברת נדל"ן', 'השמה גרופ גיוס ויעוץ בע"מ', 'עדי זיברט בנימין', 'adi.hasama@gmail.com', '054-3340105'],
  ['מנהל מערכות מידע ואחזקה (IT CNC Maintenance)', 'אהרון יוסף ובניו תעשיות זיווד', 'נציג שירות', null, '08-8673402'],
  ['מנהל/ת מחלקת יישומים ארגוניים', 'תדיראן גרופ', 'נציג שירות', 'service-tadiran@tadiran-group.co.il', '054-1466-491'],
];

async function main() {
  const client = await pool.connect();
  let updated = 0;

  try {
    for (const [title, company, contact_name, email, phone] of updates) {
      const result = await client.query(
        `UPDATE opportunities
         SET contact_name = $1, contact_email = $2, contact_phone = $3
         WHERE title = $4 AND company = $5`,
        [contact_name, email, phone, title, company]
      );
      if (result.rowCount > 0) {
        updated++;
        console.log(`✓ עודכן: ${title}`);
      } else {
        console.log(`✗ לא נמצא: ${title}`);
      }
    }
    console.log(`\nסה"כ עודכנו: ${updated} משרות`);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
