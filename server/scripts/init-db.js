const fs = require('fs');
const path = require('path');
const pool = require('../db');
require('dotenv').config();

async function initDatabase() {
  const sqlPath = path.join(__dirname, '../sql/create-tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await pool.getConnection();
  try {
    await connection.query(sql);
    console.log('Database tables created successfully.');
  } finally {
    connection.release();
    await pool.end();
  }
}

initDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
