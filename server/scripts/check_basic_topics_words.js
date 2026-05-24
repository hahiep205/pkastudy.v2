const pool = require('../db');

async function main() {
  try {
    const [topics] = await pool.query('SELECT id, slug, title FROM Topics WHERE course_id = 1 LIMIT 5');
    for (const topic of topics) {
      const [words] = await pool.query('SELECT word, meaning FROM Flashcards WHERE topic_id = ?', [topic.id]);
      console.log(`Topic: ${topic.title} (slug: ${topic.slug}, id: ${topic.id})`);
      console.log(`Words (${words.length}): ${words.map(w => `${w.word} (${w.meaning})`).join(', ')}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
