const bcrypt = require('bcryptjs');
const pool = require('../db');
require('dotenv').config();

const users = [
  { email: 'admin@pkastudy.local', password: 'Admin123!', name: 'Admin User' },
  { email: 'test@pkastudy.local', password: 'Test1234', name: 'Test User' },
];

async function createUsers() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const user of users) {
      const [existingUsers] = await connection.query('SELECT id FROM Users WHERE email = ?', [user.email]);
      if (existingUsers.length > 0) {
        console.log(`Skipped existing user: ${user.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      const [result] = await connection.query(
        'INSERT INTO Users (email, password_hash, name) VALUES (?, ?, ?)',
        [user.email, hashedPassword, user.name]
      );

      const userId = result.insertId;
      await connection.query(
        'INSERT INTO User_Progress (user_id, current_xp, level, current_streak, last_study_date) SELECT ?, 0, 1, 0, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM User_Progress WHERE user_id = ?)',
        [userId, userId]
      );

      console.log(`Created user: ${user.email} (id ${userId})`);
    }

    await connection.commit();
    console.log('User seed complete.');
  } catch (error) {
    await connection.rollback();
    console.error('Failed to create users:', error);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

createUsers();
