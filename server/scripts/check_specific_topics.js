const pool = require('../db');

async function main() {
  try {
    const [topics] = await pool.query("SELECT * FROM Topics WHERE slug IN ('toeic-very-easy', 'toeic-starter', 'toeic-hackers')");
    console.log('--- Matching Topics ---');
    console.log(topics);

    for (const t of topics) {
      const [words] = await pool.query('SELECT word FROM Flashcards WHERE topic_id = ?', [t.id]);
      console.log(`Topic ID: ${t.id}, slug: ${t.slug}, title: ${t.title}`);
      console.log(`Words (${words.length}): ${words.map(w => w.word).join(', ')}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
