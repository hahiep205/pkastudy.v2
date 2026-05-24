const pool = require('../db');

async function main() {
  try {
    const [courses] = await pool.query('SELECT id, slug, title FROM Courses');
    console.log('--- Courses ---');
    console.log(courses);

    const [topics] = await pool.query('SELECT id, course_id, slug, title FROM Topics');
    console.log('\n--- Topics ---');
    console.log(topics);

    const [flashcards] = await pool.query('SELECT topic_id, COUNT(*) as count FROM Flashcards GROUP BY topic_id');
    console.log('\n--- Flashcard count per topic ---');
    console.log(flashcards);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
