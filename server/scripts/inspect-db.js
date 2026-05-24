const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function inspect() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'pkastudy',
  });

  try {
    console.log('Scanning all questions for option/correct_answer mismatches...');
    const [questions] = await connection.query('SELECT * FROM Toeic_Questions');
    let mismatches = 0;

    questions.forEach(q => {
      let parsed = {};
      try {
        parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      } catch (e) {
        console.log(`Failed to parse options for Q#${q.id}`);
      }

      const keys = Object.keys(parsed);
      const match = keys.find(k => k.trim().toUpperCase() === q.correct_answer?.trim().toUpperCase());

      if (!match) {
        mismatches++;
        console.log(`Mismatch found in Q#${q.id} (Part ${q.part}, Test ${q.test_id}, QNum ${q.question_number}):`);
        console.log(`  correct_answer: "${q.correct_answer}"`);
        console.log(`  options keys:`, keys);
        console.log(`  options:`, JSON.stringify(parsed));
      }
    });

    console.log(`Total mismatch questions: ${mismatches} / ${questions.length}`);

  } catch (error) {
    console.error('Error during inspection:', error);
  } finally {
    await connection.end();
  }
}

inspect();
