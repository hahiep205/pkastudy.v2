/**
 * Migration script: Custom Courses & Word Progress
 * Run with: node server/scripts/migrate-custom-courses.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../db');

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('Running migration: custom courses & word progress...');

    // 1. Add user_id + is_custom to Topics (ignore if already exists)
    try {
      await conn.query('ALTER TABLE Topics ADD COLUMN user_id INT DEFAULT NULL');
      console.log('  ✓ Added user_id column to Topics');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('  ~ user_id already exists, skipping');
      else throw e;
    }

    try {
      await conn.query('ALTER TABLE Topics ADD COLUMN is_custom TINYINT(1) NOT NULL DEFAULT 0');
      console.log('  ✓ Added is_custom column to Topics');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('  ~ is_custom already exists, skipping');
      else throw e;
    }

    // 2. Add FK if not there yet (catch duplicate)
    try {
      await conn.query('ALTER TABLE Topics ADD CONSTRAINT fk_topics_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE');
      console.log('  ✓ Added FK fk_topics_user');
    } catch (e) {
      if (e.code === 'ER_DUP_KEY' || e.errno === 1826 || e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
        console.log('  ~ FK fk_topics_user already exists, skipping');
      } else throw e;
    }

    // Allow NULL course_id for custom topics (if strict FK, we loosen it)
    // Built-in topics always have a valid course_id; custom ones won't.
    // The simplest fix: use a sentinel course_id of 0 OR drop the FK for now.
    // We'll just allow course_id = 0 by making it nullable for custom rows.
    try {
      await conn.query('ALTER TABLE Topics MODIFY COLUMN course_id INT DEFAULT NULL');
      console.log('  ✓ Made course_id nullable in Topics');
    } catch (e) {
      console.log('  ~ course_id already nullable or FK prevents change:', e.message);
    }

    // 3. Create User_Word_Progress table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS User_Word_Progress (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id      INT NOT NULL,
        flashcard_id INT NOT NULL,
        is_remembered TINYINT(1) NOT NULL DEFAULT 0,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_word (user_id, flashcard_id),
        CONSTRAINT fk_uwp_user       FOREIGN KEY (user_id)      REFERENCES Users(id)      ON DELETE CASCADE,
        CONSTRAINT fk_uwp_flashcard  FOREIGN KEY (flashcard_id) REFERENCES Flashcards(id) ON DELETE CASCADE,
        INDEX idx_uwp_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('  ✓ Created / verified User_Word_Progress table');

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
