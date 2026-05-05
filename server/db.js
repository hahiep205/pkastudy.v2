require('dotenv').config();
const mysql = require('mysql2/promise');

const defaultConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'pkastudy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
};

const pool = process.env.DB_URL
  ? mysql.createPool(process.env.DB_URL)
  : mysql.createPool(defaultConfig);

module.exports = pool;
