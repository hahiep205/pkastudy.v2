const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const mysql = require('mysql2/promise');

const listeningPath = path.join(__dirname, '../../src/data/toeicListeningTests.generated.json');
const readingPath = path.join(__dirname, '../../src/data/toeicReadingTests.generated.json');

async function connectDB() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'pkastudy',
  });
}

function parsePartNumber(partLabel) {
  if (!partLabel) return 0;
  const match = String(partLabel).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

async function seedData() {
  let connection;
  try {
    connection = await connectDB();
    console.log('Connected to DB');

    // Read JSON files
    const listeningData = JSON.parse(fs.readFileSync(listeningPath, 'utf8'));
    const readingData = JSON.parse(fs.readFileSync(readingPath, 'utf8'));

    // Clear existing TOEIC tests (since we'll replace the dummy "Full Test 1" with real tests, or add to them)
    // We'll just delete all tests and recreate
    await connection.execute('DELETE FROM Toeic_Tests');
    console.log('Cleared existing TOEIC tests.');

    const allTests = [];
    
    // Process Listening Tests
    for (const lTest of listeningData.tests) {
      // Create a corresponding Full Test if we find a matching Reading test
      const rTest = readingData.tests.find(r => r.id === lTest.id.replace('listening', 'reading'));
      
      const title = lTest.name.replace('Listening ', ''); // e.g. "Đề 1"
      const desc = lTest.desc;

      const [testResult] = await connection.execute(
        'INSERT INTO Toeic_Tests (title, description) VALUES (?, ?)',
        [title, desc]
      );
      const testId = testResult.insertId;
      console.log(`Created Test: ${title} (ID: ${testId})`);

      // Helper to insert sections
      const insertSections = async (sections, isReading = false) => {
        for (const section of sections) {
          const sectionAudioUrl = section.audioUrl || null;

          // Grouping logic: Questions with the same groupIndex OR sharedPassage in the same section should share a group.
          // Wait, for Listening, groupIndex is used. For Reading, sharedPassage is used.
          // We can also group by section if there's a section audio.
          
          let currentGroup = null;
          let currentGroupId = null;
          let currentGroupIdentifier = null; // groupIndex or sharedPassage string

          for (const q of section.questions) {
            const qPart = parsePartNumber(q.toeicPart || section.label);
            const isGrouped = q.groupIndex != null || q.sharedPassage != null || sectionAudioUrl != null;
            
            // If it's grouped, we need to create or reuse a group.
            // Let's identify the group by groupIndex or sharedPassage
            const identifier = q.groupIndex != null ? `group-${q.groupIndex}` : (q.sharedPassage ? q.sharedPassage : null);

            if (isGrouped && (identifier !== currentGroupIdentifier || currentGroupId === null)) {
               // Create new group
               currentGroupIdentifier = identifier;
               const [groupResult] = await connection.execute(
                 'INSERT INTO Toeic_Question_Groups (test_id, part, audio_url, image_url, passage_text) VALUES (?, ?, ?, ?, ?)',
                 [testId, qPart, sectionAudioUrl, null, q.sharedPassage || null] // We can refine image/passage later
               );
               currentGroupId = groupResult.insertId;
            }

            const optionsMap = {};
            if (Array.isArray(q.options)) {
              q.options.forEach(opt => {
                optionsMap[opt.key] = opt.text;
              });
            }

            await connection.execute(
              'INSERT INTO Toeic_Questions (test_id, group_id, question_number, part, question_text, options, correct_answer, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                testId,
                isGrouped ? currentGroupId : null,
                q.displayNumber,
                qPart,
                q.prompt || q.instruction || null,
                JSON.stringify(optionsMap),
                q.correctKey || '',
                q.audioUrl || null,
                q.imageUrl || null
              ]
            );
          }
        }
      };

      await insertSections(lTest.sections, false);
      if (rTest) {
        await insertSections(rTest.sections, true);
      }
    }

    console.log('TOEIC Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding TOEIC data:', err);
  } finally {
    if (connection) await connection.end();
  }
}

seedData();
