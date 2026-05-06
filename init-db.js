const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database.db');
const schemaPath = path.join(__dirname, 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('schema.sql file not found');
  process.exit(1);
}
const schema = fs.readFileSync(schemaPath, 'utf8');
const db = new sqlite3.Database(dbPath);
function all(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}
function run(sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));
}
async function ensureColumn(tableName, columnName, definition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  if (!columns.some(c => c.name === columnName)) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}
async function init() {
  try {
    await new Promise((resolve, reject) => db.exec(schema, err => err ? reject(err) : resolve()));
    await ensureColumn('applications', 'notes', 'TEXT');
    await ensureColumn('applications', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await ensureColumn('users', 'preferred_language', "TEXT DEFAULT 'en'");
    await ensureColumn('opportunities', 'status', "TEXT DEFAULT 'open'");
    console.log('Database created/updated successfully');
  } catch (err) {
    console.error('Database init error:', err.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}
init();
