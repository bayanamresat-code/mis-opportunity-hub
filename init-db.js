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

db.exec(schema, (err) => {
  if (err) {
    console.error('Error creating database:', err.message);
    process.exit(1);
  }

  db.all(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    [],
    (tableErr, tables) => {
      if (tableErr) {
        console.error('Error reading tables:', tableErr.message);
      } else {
        console.log('Tables:', tables.map(t => t.name));
        console.log('Database created successfully');
      }

      db.close((closeErr) => {
        if (closeErr) {
          console.error('Error closing database:', closeErr.message);
        }
      });
    }
  );
});