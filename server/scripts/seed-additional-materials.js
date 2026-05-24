const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'pkastudy',
  });

  try {
    console.log('Seeding additional TOEIC study material vocabulary topics...');

    // Get toeic-basic course id
    const [courses] = await connection.execute('SELECT id FROM Courses WHERE slug = ?', ['toeic-basic']);
    if (courses.length === 0) {
      console.error('Course toeic-basic not found!');
      return;
    }
    const courseId = courses[0].id;

    const newTopics = [
      {
        slug: 'toeic-very-easy',
        title: '📚 Very Easy TOEIC Vocabulary',
        description: 'Từ vựng cơ bản dành cho người mới bắt đầu (Mục tiêu dưới 450).',
        sort_order: 51,
        words: [
          { word: 'contract', transcription: "/'kɒntrækt/", word_type: 'n.', meaning: 'hợp đồng', example: 'They signed a contract yesterday.', example_vi: 'Họ đã ký một hợp đồng vào hôm qua.' },
          { word: 'establish', transcription: "/ɪ'stæblɪʃ/", word_type: 'v.', meaning: 'thiết lập, thành lập', example: 'The company was established in 2010.', example_vi: 'Công ty được thành lập vào năm 2010.' },
          { word: 'determine', transcription: "/dɪ'tɜːmɪn/", word_type: 'v.', meaning: 'quyết định, xác định', example: 'We need to determine the cause of the problem.', example_vi: 'Chúng ta cần xác định nguyên nhân của vấn đề.' },
          { word: 'resolve', transcription: "/rɪ'zɒlv/", word_type: 'v.', meaning: 'giải quyết', example: 'They resolved the dispute quickly.', example_vi: 'Họ đã giải quyết tranh chấp một cách nhanh chóng.' },
          { word: 'agree', transcription: "/ə'ɡriː/", word_type: 'v.', meaning: 'đồng ý', example: 'We agree on the terms.', example_vi: 'Chúng tôi đồng ý về các điều khoản.' },
          { word: 'provide', transcription: "/prə'vaɪd/", word_type: 'v.', meaning: 'cung cấp', example: 'They provide financial services.', example_vi: 'Họ cung cấp dịch vụ tài chính.' },
          { word: 'cancel', transcription: "/'kænsəl/", word_type: 'v.', meaning: 'hủy bỏ', example: 'The flight was canceled.', example_vi: 'Chuyến bay đã bị hủy.' },
          { word: 'deliver', transcription: "/dɪ'lɪvər/", word_type: 'v.', meaning: 'giao hàng', example: 'The package was delivered on time.', example_vi: 'Gói hàng được giao đúng giờ.' },
          { word: 'attend', transcription: "/ə'tend/", word_type: 'v.', meaning: 'tham dự', example: 'She attended the conference.', example_vi: 'Cô ấy đã tham dự hội nghị.' },
          { word: 'prepare', transcription: "/prɪ'peər/", word_type: 'v.', meaning: 'chuẩn bị', example: 'He prepared the presentation.', example_vi: 'Anh ấy đã chuẩn bị bài thuyết trình.' }
        ]
      },
      {
        slug: 'toeic-starter',
        title: '📚 Starter TOEIC Vocabulary',
        description: 'Từ vựng khởi động, rèn luyện nghe đọc (Mục tiêu 450 - 550).',
        sort_order: 52,
        words: [
          { word: 'register', transcription: "/'redʒɪstər/", word_type: 'v.', meaning: 'đăng ký', example: 'You must register for the course.', example_vi: 'Bạn phải đăng ký khóa học.' },
          { word: 'require', transcription: "/rɪ'kwaɪər/", word_type: 'v.', meaning: 'yêu cầu', example: 'The job requires travel.', example_vi: 'Công việc này yêu cầu đi lại.' },
          { word: 'submit', transcription: "/səb'mɪt/", word_type: 'v.', meaning: 'nộp', example: 'Submit your report by Friday.', example_vi: 'Nộp báo cáo của bạn trước thứ Sáu.' },
          { word: 'approve', transcription: "/ə'pruːv/", word_type: 'v.', meaning: 'chấp thuận', example: 'The board approved the budget.', example_vi: 'Ban giám đốc đã phê duyệt ngân sách.' },
          { word: 'delay', transcription: "/dɪ'leɪ/", word_type: 'v.', meaning: 'trì hoãn', example: 'The train was delayed.', example_vi: 'Chuyến tàu đã bị hoãn.' },
          { word: 'promote', transcription: "/prə'məʊt/", word_type: 'v.', meaning: 'thăng chức, quảng bá', example: 'She was promoted to manager.', example_vi: 'Cô ấy đã được thăng chức lên quản lý.' },
          { word: 'conduct', transcription: "/kən'dʌkt/", word_type: 'v.', meaning: 'tiến hành', example: 'They conducted a survey.', example_vi: 'Họ đã tiến hành một cuộc khảo sát.' },
          { word: 'confirm', transcription: "/kən'fɜːm/", word_type: 'v.', meaning: 'xác nhận', example: 'Please confirm your email.', example_vi: 'Vui lòng xác nhận email của bạn.' },
          { word: 'participate', transcription: "/pɑː'tɪsɪpeɪt/", word_type: 'v.', meaning: 'tham gia', example: 'Everyone participated in the meeting.', example_vi: 'Mọi người đều tham gia cuộc họp.' },
          { word: 'invoice', transcription: "/'tɜːmɪn/", word_type: 'n.', meaning: 'hóa đơn', example: 'Please pay the invoice.', example_vi: 'Vui lòng thanh toán hóa đơn.' }
        ]
      },
      {
        slug: 'toeic-hackers',
        title: '📚 Hackers TOEIC Vocabulary',
        description: 'Từ vựng nâng cao bám sát xu hướng đề khó (Mục tiêu 650 - 850).',
        sort_order: 53,
        words: [
          { word: 'negotiate', transcription: "/nɪ'ɡəʊʃɪeɪt/", word_type: 'v.', meaning: 'thương lượng', example: 'They negotiated a new deal.', example_vi: 'Họ đã thương lượng một thỏa thuận mới.' },
          { word: 'cooperate', transcription: "/kəʊ'ɒpəreɪt/", word_type: 'v.', meaning: 'hợp tác', example: 'We need to cooperate with them.', example_vi: 'Chúng ta cần hợp tác với họ.' },
          { word: 'comply', transcription: "/kəm'plaɪ/", word_type: 'v.', meaning: 'tuân thủ', example: 'All products must comply with regulations.', example_vi: 'Tất cả sản phẩm phải tuân thủ quy định.' },
          { word: 'implement', transcription: "/'implɪmənt/", word_type: 'v.', meaning: 'thực hiện, triển khai', example: 'We will implement the new policy.', example_vi: 'Chúng tôi sẽ triển khai chính sách mới.' },
          { word: 'substitute', transcription: "/'sʌbstɪtjuːt/", word_type: 'v.', meaning: 'thay thế', example: 'You can substitute butter with oil.', example_vi: 'Bạn có thể thay thế bơ bằng dầu.' },
          { word: 'postpone', transcription: "/pəʊst'pəʊn/", word_type: 'v.', meaning: 'hoãn lại', example: 'The match was postponed.', example_vi: 'Trận đấu đã bị hoãn lại.' },
          { word: 'accumulate', transcription: "/ə'kjuːmjəleɪt/", word_type: 'v.', meaning: 'tích lũy', example: 'You can accumulate points.', example_vi: 'Bạn có thể tích lũy điểm.' },
          { word: 'collaborate', transcription: "/kə'læbəreɪt/", word_type: 'v.', meaning: 'cộng tác', example: 'We collaborate on this project.', example_vi: 'Chúng tôi cộng tác trong dự án này.' },
          { word: 'prohibit', transcription: "/prə'hɪbɪt/", word_type: 'v.', meaning: 'cấm', example: 'Smoking is prohibited.', example_vi: 'Hút thuốc bị cấm.' },
          { word: 'evaluate', transcription: "/e'væljueɪt/", word_type: 'v.', meaning: 'đánh giá', example: 'The performance was evaluated.', example_vi: 'Hiệu suất đã được đánh giá.' }
        ]
      }
    ];

    for (const t of newTopics) {
      // Check if topic exists
      const [existing] = await connection.execute('SELECT id FROM Topics WHERE slug = ? AND course_id = ?', [t.slug, courseId]);
      let topicId;
      
      if (existing.length > 0) {
        topicId = existing[0].id;
        console.log(`Topic already exists: ${t.title} (ID: ${topicId}). Updating description...`);
        await connection.execute('UPDATE Topics SET description = ? WHERE id = ?', [t.description, topicId]);
      } else {
        const [insertRes] = await connection.execute(
          'INSERT INTO Topics (course_id, slug, title, description, sort_order) VALUES (?, ?, ?, ?, ?)',
          [courseId, t.slug, t.title, t.description, t.sort_order]
        );
        topicId = insertRes.insertId;
        console.log(`Created new topic: ${t.title} (ID: ${topicId})`);
      }

      // Add words
      for (const w of t.words) {
        const [existingWord] = await connection.execute('SELECT id FROM Flashcards WHERE topic_id = ? AND word = ?', [topicId, w.word]);
        if (existingWord.length === 0) {
          await connection.execute(
            'INSERT INTO Flashcards (topic_id, word, transcription, meaning, word_type, example, example_vi) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [topicId, w.word, w.transcription, w.meaning, w.word_type, w.example, w.example_vi]
          );
          console.log(`  Added word: ${w.word}`);
        }
      }
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await connection.end();
  }
}

seed();
