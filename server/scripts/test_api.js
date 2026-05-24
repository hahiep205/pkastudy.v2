const http = require('http');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const baseURL = 'http://localhost:4000/api';
  try {
    const topics = [
      'easy-lesson-1', 'easy-lesson-2', 'easy-lesson-3',
      'starter-lesson-1', 'starter-lesson-2', 'starter-lesson-3',
      'hackers-lesson-1', 'hackers-lesson-2', 'hackers-lesson-3'
    ];
    for (const slug of topics) {
      console.log(`\n=== API: /topics/${slug}/flashcards ===`);
      const res = await getJson(`${baseURL}/topics/${slug}/flashcards`);
      const words = res.data ? res.data.map(w => w.word) : [];
      console.log(`Words: ${words.join(', ')}`);
    }
  } catch (error) {
    console.error('Error fetching API:', error.message);
  }
}

main();
