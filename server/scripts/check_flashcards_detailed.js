const pool = require('../db');

async function main() {
  try {
    const [flashcards] = await pool.query('SELECT f.id, f.topic_id, t.title as topic_title, t.slug as topic_slug, f.word, f.meaning FROM Flashcards f JOIN Topics t ON f.topic_id = t.id');
    console.log('--- Flashcards Join Topics ---');
    console.log(JSON.stringify(flashcards, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();
