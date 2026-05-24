const pool = require('../db');

async function main() {
  try {
    const [courses] = await pool.query('SELECT id, slug, title FROM Courses WHERE id IN (2, 3, 4)');
    for (const course of courses) {
      console.log(`\n=== Course: ${course.title} (slug: ${course.slug}) ===`);
      const [topics] = await pool.query('SELECT id, slug, title FROM Topics WHERE course_id = ?', [course.id]);
      for (const topic of topics) {
        console.log(`  Topic: ${topic.title} (slug: ${topic.slug}, id: ${topic.id})`);
        const [words] = await pool.query('SELECT word FROM Flashcards WHERE topic_id = ?', [topic.id]);
        console.log(`    Words: ${words.map(w => w.word).join(', ')}`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
