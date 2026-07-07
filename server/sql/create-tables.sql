CREATE DATABASE IF NOT EXISTS pkastudy;
USE pkastudy;

CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) DEFAULT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_name (name),
  INDEX idx_users_role_status (role, status),
  INDEX idx_users_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS User_Progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  current_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  current_streak INT NOT NULL DEFAULT 0,
  last_study_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_progress_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  language VARCHAR(20) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_courses_sort_order (sort_order)
);

CREATE TABLE IF NOT EXISTS Topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  slug VARCHAR(120) DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  shared_from_topic_id INT DEFAULT NULL,
  language VARCHAR(20) NOT NULL DEFAULT 'en',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_topics_course FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_topics_shared_from_topic FOREIGN KEY (shared_from_topic_id) REFERENCES Topics(id) ON DELETE SET NULL,
  INDEX idx_topics_course_id (course_id)
);

CREATE TABLE IF NOT EXISTS Flashcards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic_id INT NOT NULL,
  external_id VARCHAR(50) DEFAULT NULL,
  word VARCHAR(255) NOT NULL,
  transcription VARCHAR(255) DEFAULT NULL,
  meaning VARCHAR(255) NOT NULL,
  word_type VARCHAR(100) DEFAULT NULL,
  example TEXT DEFAULT NULL,
  example_vi TEXT DEFAULT NULL,
  language VARCHAR(20) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_flashcards_topic FOREIGN KEY (topic_id) REFERENCES Topics(id) ON DELETE CASCADE,
  INDEX idx_flashcards_topic_id (topic_id)
);

CREATE TABLE IF NOT EXISTS SRS_Reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  flashcard_id INT NOT NULL,
  interval_days INT NOT NULL DEFAULT 1,
  ef DECIMAL(4,2) NOT NULL DEFAULT 2.50,
  repetition INT NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL,
  last_reviewed_at DATETIME DEFAULT NULL,
  fail_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_srs_reviews_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  CONSTRAINT fk_srs_reviews_flashcard FOREIGN KEY (flashcard_id) REFERENCES Flashcards(id) ON DELETE CASCADE,
  CONSTRAINT uq_srs_reviews_user_flashcard UNIQUE (user_id, flashcard_id),
  INDEX idx_srs_reviews_user_due (user_id, next_review_date),
  INDEX idx_srs_reviews_flashcard_id (flashcard_id)
);

INSERT INTO Courses (slug, title, description, language, sort_order)
SELECT 'toeic-basic', 'TOEIC Basic', 'Foundational TOEIC vocabulary and themes.', 'en', 1
WHERE NOT EXISTS (SELECT 1 FROM Courses WHERE slug = 'toeic-basic');

DELETE FROM Courses WHERE slug = 'topik1-basic';

DELETE t
FROM Topics t
JOIN Courses c ON c.id = t.course_id
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-contract', '📄 Lesson 1: Contracts', 'Từ vựng TOEIC theo chủ đề Contracts trong ngữ cảnh công việc và giao tiếp thực tế.', 1
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-finance', '📣 Lesson 2: Marketing', 'Từ vựng TOEIC theo chủ đề Marketing trong ngữ cảnh công việc và giao tiếp thực tế.', 2
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-travel', 'Lesson 3: Warranties', 'Từ vựng TOEIC theo chủ đề Warranties trong ngữ cảnh công việc và giao tiếp thực tế.', 3
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-health', 'Lesson 4: Business Planning', 'Từ vựng TOEIC theo chủ đề Business Planning trong ngữ cảnh công việc và giao tiếp thực tế.', 4
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-marketing', '🎤 Lesson 5: Conferences', 'Từ vựng TOEIC theo chủ đề Conferences trong ngữ cảnh công việc và giao tiếp thực tế.', 5
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-it', '💻 Lesson 6: Computers', 'Từ vựng TOEIC theo chủ đề Computers trong ngữ cảnh công việc và giao tiếp thực tế.', 6
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-realestate', 'Lesson 7: Office Technology', 'Từ vựng TOEIC theo chủ đề Office Technology trong ngữ cảnh công việc và giao tiếp thực tế.', 7
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-restaurant', '📋 Lesson 8: Office Procedures', 'Từ vựng TOEIC theo chủ đề Office Procedures trong ngữ cảnh công việc và giao tiếp thực tế.', 8
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-education', '🔌 Lesson 9: Electronics', 'Từ vựng TOEIC theo chủ đề Electronics trong ngữ cảnh công việc và giao tiếp thực tế.', 9
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-legal', '✉️ Lesson 10: Correspondence', 'Từ vựng TOEIC theo chủ đề Correspondence trong ngữ cảnh công việc và giao tiếp thực tế.', 10
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-manufacturing', '📢 Lesson 11: Job Advertising & Recruiting', 'Từ vựng TOEIC theo chủ đề Job Advertising & Recruiting trong ngữ cảnh công việc và giao tiếp thực tế.', 11
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-environment', '📝 Lesson 12: Applying & Interviewing', 'Từ vựng TOEIC theo chủ đề Applying & Interviewing trong ngữ cảnh công việc và giao tiếp thực tế.', 12
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-hr', '👥 Lesson 13: Hiring & Training', 'Từ vựng TOEIC theo chủ đề Hiring & Training trong ngữ cảnh công việc và giao tiếp thực tế.', 13
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-retail', '💵 Lesson 14: Salaries & Benefits', 'Từ vựng TOEIC theo chủ đề Salaries & Benefits trong ngữ cảnh công việc và giao tiếp thực tế.', 14
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-media', '🏆 Lesson 15: Promotions & Awards', 'Từ vựng TOEIC theo chủ đề Promotions & Awards trong ngữ cảnh công việc và giao tiếp thực tế.', 15
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-negotiation', 'Lesson 16: Shopping', 'Từ vựng TOEIC theo chủ đề Shopping trong ngữ cảnh công việc và giao tiếp thực tế.', 16
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-hotel', '📦 Lesson 17: Ordering Supplies', 'Từ vựng TOEIC theo chủ đề Ordering Supplies trong ngữ cảnh công việc và giao tiếp thực tế.', 17
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-rd', '🚚 Lesson 18: Shipping', 'Từ vựng TOEIC theo chủ đề Shipping trong ngữ cảnh công việc và giao tiếp thực tế.', 18
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-analytics', '🧾 Lesson 19: Invoices', 'Từ vựng TOEIC theo chủ đề Invoices trong ngữ cảnh công việc và giao tiếp thực tế.', 19
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-transport', '📚 Lesson 20: Inventory', 'Từ vựng TOEIC theo chủ đề Inventory trong ngữ cảnh công việc và giao tiếp thực tế.', 20
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-trade', '🏦 Lesson 21: Banking', 'Từ vựng TOEIC theo chủ đề Banking trong ngữ cảnh công việc và giao tiếp thực tế.', 21
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-projectmgmt', '📊 Lesson 22: Accounting', 'Từ vựng TOEIC theo chủ đề Accounting trong ngữ cảnh công việc và giao tiếp thực tế.', 22
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-investment', '📈 Lesson 23: Investments', 'Từ vựng TOEIC theo chủ đề Investments trong ngữ cảnh công việc và giao tiếp thực tế.', 23
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-digital', '🧮 Lesson 24: Taxes', 'Từ vựng TOEIC theo chủ đề Taxes trong ngữ cảnh công việc và giao tiếp thực tế.', 24
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-property', '🏢 Lesson 25: Property & Departments', 'Từ vựng TOEIC theo chủ đề Property & Departments trong ngữ cảnh công việc và giao tiếp thực tế.', 25
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-boardmeetings', '🪑 Lesson 26: Board Meetings', 'Từ vựng TOEIC theo chủ đề Board Meetings trong ngữ cảnh công việc và giao tiếp thực tế.', 26
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-quality', '✅ Lesson 27: Quality Control', 'Từ vựng TOEIC theo chủ đề Quality Control trong ngữ cảnh công việc và giao tiếp thực tế.', 27
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-productdev', '🧪 Lesson 28: Product Development', 'Từ vựng TOEIC theo chủ đề Product Development trong ngữ cảnh công việc và giao tiếp thực tế.', 28
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-leasing', '🔑 Lesson 29: Renting & Leasing', 'Từ vựng TOEIC theo chủ đề Renting & Leasing trong ngữ cảnh công việc và giao tiếp thực tế.', 29
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-restaurant-select', 'Lesson 30: Selecting a Restaurant', 'Từ vựng TOEIC theo chủ đề Selecting a Restaurant trong ngữ cảnh công việc và giao tiếp thực tế.', 30
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-eatingout', '🍴 Lesson 31: Eating Out', 'Từ vựng TOEIC theo chủ đề Eating Out trong ngữ cảnh công việc và giao tiếp thực tế.', 31
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-lunch', '🥪 Lesson 32: Ordering Lunch', 'Từ vựng TOEIC theo chủ đề Ordering Lunch trong ngữ cảnh công việc và giao tiếp thực tế.', 32
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-cooking', '👨Lesson 33: Cooking as a Career', 'Từ vựng TOEIC theo chủ đề Cooking as a Career trong ngữ cảnh công việc và giao tiếp thực tế.', 33
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-events', '🎉 Lesson 34: Events', 'Từ vựng TOEIC theo chủ đề Events trong ngữ cảnh công việc và giao tiếp thực tế.', 34
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-generaltravel', '✈️ Lesson 35: General Travel', 'Từ vựng TOEIC theo chủ đề General Travel trong ngữ cảnh công việc và giao tiếp thực tế.', 35
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-airlines', '🛫 Lesson 36: Airlines', 'Từ vựng TOEIC theo chủ đề Airlines trong ngữ cảnh công việc và giao tiếp thực tế.', 36
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-trains', '🚆 Lesson 37: Trains', 'Từ vựng TOEIC theo chủ đề Trains trong ngữ cảnh công việc và giao tiếp thực tế.', 37
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-hotels', '🏨 Lesson 38: Hotels', 'Từ vựng TOEIC theo chủ đề Hotels trong ngữ cảnh công việc và giao tiếp thực tế.', 38
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-carrentals', '🚗 Lesson 39: Car Rentals', 'Từ vựng TOEIC theo chủ đề Car Rentals trong ngữ cảnh công việc và giao tiếp thực tế.', 39
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-movies', '🎬 Lesson 40: Movies', 'Từ vựng TOEIC theo chủ đề Movies trong ngữ cảnh công việc và giao tiếp thực tế.', 40
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-theater', '🎭 Lesson 41: Theater', 'Từ vựng TOEIC theo chủ đề Theater trong ngữ cảnh công việc và giao tiếp thực tế.', 41
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-music', '🎵 Lesson 42: Music', 'Từ vựng TOEIC theo chủ đề Music trong ngữ cảnh công việc và giao tiếp thực tế.', 42
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-museums', 'Lesson 43: Museums', 'Từ vựng TOEIC theo chủ đề Museums trong ngữ cảnh công việc và giao tiếp thực tế.', 43
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-media-news', '📰 Lesson 44: Media', 'Từ vựng TOEIC theo chủ đề Media trong ngữ cảnh công việc và giao tiếp thực tế.', 44
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-doctor', '🩺 Lesson 45: Doctor’s Office', 'Từ vựng TOEIC theo chủ đề Doctor’s Office trong ngữ cảnh công việc và giao tiếp thực tế.', 45
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-dentist', '🦷 Lesson 46: Dentist’s Office', 'Từ vựng TOEIC theo chủ đề Dentist’s Office trong ngữ cảnh công việc và giao tiếp thực tế.', 46
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-healthinsurance', '💳 Lesson 47: Health Insurance', 'Từ vựng TOEIC theo chủ đề Health Insurance trong ngữ cảnh công việc và giao tiếp thực tế.', 47
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-hospitals', '🏥 Lesson 48: Hospitals', 'Từ vựng TOEIC theo chủ đề Hospitals trong ngữ cảnh công việc và giao tiếp thực tế.', 48
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-pharmacy', '💊 Lesson 49: Pharmacy', 'Từ vựng TOEIC theo chủ đề Pharmacy trong ngữ cảnh công việc và giao tiếp thực tế.', 49
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Topics (course_id, slug, title, description, sort_order)
SELECT c.id, 'toeic-review', '🔄 Lesson 50: Review', 'Từ vựng TOEIC theo chủ đề Review trong ngữ cảnh công việc và giao tiếp thực tế.', 50
FROM Courses c
WHERE c.slug = 'toeic-basic';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w001', 'abide by', '/əˈbaɪd baɪ/', 'tuân theo, chấp hành', 'phrasal verb', 'All staff must abide by the terms of the contract.', 'Tất cả nhân viên phải tuân theo các điều khoản của hợp đồng.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w002', 'agreement', '/əˈɡrimənt/', 'thỏa thuận, hợp đồng', 'noun', 'The two companies signed a sales agreement last week.', 'Hai công ty đã ký một thỏa thuận bán hàng vào tuần trước.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w003', 'assurance', '/əˈʃrəns/', 'sự bảo đảm, cam đoan', 'noun', 'We need assurance that the supplier will deliver on time.', 'Chúng tôi cần sự bảo đảm rằng nhà cung cấp sẽ giao hàng đúng hạn.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w004', 'cancellation', '/ˌknsəˈleɪʃən/', 'sự hủy bỏ', 'noun', 'The cancellation of the order affected this month’s revenue.', 'Việc hủy đơn hàng đã ảnh hưởng đến doanh thu của tháng này.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w005', 'determine', '/dɪˈtɜrmɪn/', 'xác định, quyết định', 'verb', 'The legal team will determine whether the clause is valid.', 'Bộ phận pháp lý sẽ xác định xem điều khoản đó có hợp lệ hay không.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w006', 'engage', '/ɪnˈɡeɪdʒ/', 'thuê, ký hợp đồng với', 'verb', 'The company plans to engage an outside consultant.', 'Công ty dự định thuê một chuyên gia tư vấn bên ngoài.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w007', 'establish', '/ɪˈstblɪʃ/', 'thiết lập, quy định rõ', 'verb', 'The contract establishes each party’s responsibilities.', 'Hợp đồng quy định rõ trách nhiệm của mỗi bên.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w008', 'obligate', '/ˈɑblɪɡeɪt/', 'ràng buộc, bắt buộc', 'verb', 'This clause obligates the buyer to pay within 30 days.', 'Điều khoản này buộc người mua phải thanh toán trong vòng 30 ngày.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w009', 'provision', '/prəˈvɪʒən/', 'điều khoản', 'noun', 'Please review the payment provision before signing.', 'Vui lòng xem lại điều khoản thanh toán trước khi ký.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w010', 'resolve', '/rɪˈzɑlv/', 'giải quyết', 'verb', 'The two sides met to resolve the dispute quickly.', 'Hai bên đã gặp nhau để nhanh chóng giải quyết tranh chấp.'
FROM Topics t
WHERE t.slug = 'toeic-contract';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w013', 'attract', '/əˈtrkt/', 'thu hút', 'verb', 'The new advertisement attracted many first-time buyers.', 'Mẫu quảng cáo mới đã thu hút nhiều người mua lần đầu.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w014', 'compare', '/kəmˈper/', 'so sánh', 'verb', 'Customers often compare prices before making a purchase.', 'Khách hàng thường so sánh giá trước khi quyết định mua hàng.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w015', 'competition', '/ˌkɑmpəˈtɪʃən/', 'sự cạnh tranh, đối thủ cạnh tranh', 'noun', 'Strong competition forced the company to lower its prices.', 'Sự cạnh tranh mạnh đã buộc công ty phải hạ giá sản phẩm.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w016', 'consume', '/kənˈsum/', 'tiêu thụ', 'verb', 'Young consumers consume most of their content on mobile devices.', 'Người tiêu dùng trẻ hiện xem phần lớn nội dung của họ trên thiết bị di động.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w017', 'convince', '/kənˈvɪns/', 'thuyết phục', 'verb', 'The sales team tried to convince retailers to stock the product.', 'Nhóm bán hàng đã cố gắng thuyết phục các cửa hàng nhập sản phẩm này.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w018', 'currently', '/ˈkɜrəntli/', 'hiện tại, vào lúc này', 'adverb', 'The product is currently available in five countries.', 'Hiện tại sản phẩm này đang có mặt ở năm quốc gia.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w019', 'fad', '/fd/', 'mốt nhất thời', 'noun', 'The manager warned that the trend might just be a fad.', 'Người quản lý cảnh báo rằng xu hướng đó có thể chỉ là mốt nhất thời.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w020', 'inspiration', '/ˌɪnspəˈreɪʃən/', 'nguồn cảm hứng', 'noun', 'The design team found inspiration in customer feedback.', 'Nhóm thiết kế đã tìm được cảm hứng từ phản hồi của khách hàng.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w021', 'market', '/ˈmɑrkɪt/', 'thị trường; tiếp thị', 'noun / verb', 'The company plans to market the app to college students.', 'Công ty dự định tiếp thị ứng dụng này tới sinh viên đại học.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w022', 'persuasion', '/pərˈsweɪʒən/', 'sự thuyết phục', 'noun', 'Good marketing depends on persuasion as well as timing.', 'Marketing hiệu quả phụ thuộc vào khả năng thuyết phục cũng như thời điểm phù hợp.'
FROM Topics t
WHERE t.slug = 'toeic-finance';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w025', 'characteristic', '/ˌkrəktəˈrɪstɪk/', 'đặc điểm, tính chất', 'noun', 'Durability is an important characteristic of this device.', 'Độ bền là một đặc điểm quan trọng của thiết bị này.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w026', 'consequence', '/ˈkɑnsəkwens/', 'hậu quả, hệ quả', 'noun', 'A late repair may have serious consequences for customers.', 'Việc sửa chữa chậm trễ có thể gây ra hậu quả nghiêm trọng cho khách hàng.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w027', 'consider', '/kənˈsɪdər/', 'xem xét, cân nhắc', 'verb', 'Please consider the warranty terms before buying the product.', 'Vui lòng cân nhắc các điều khoản bảo hành trước khi mua sản phẩm.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w028', 'cover', '/ˈkʌvər/', 'bảo hành cho, bao gồm', 'verb', 'The warranty covers parts and labor for one year.', 'Gói bảo hành bao gồm linh kiện và công sửa chữa trong một năm.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w029', 'expiration', '/ˌekspəˈreɪʃən/', 'sự hết hạn', 'noun', 'Please note the expiration of your warranty next month.', 'Xin lưu ý rằng bảo hành của bạn sẽ hết hạn vào tháng sau.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w030', 'frequently', '/ˈfrikwəntli/', 'thường xuyên', 'adverb', 'Customers frequently ask whether accidental damage is included.', 'Khách hàng thường xuyên hỏi liệu hư hỏng do vô ý có được bao gồm hay không.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w031', 'imply', '/ɪmˈplaɪ/', 'hàm ý, ngụ ý', 'verb', 'The guarantee does not imply free replacement in every case.', 'Cam kết bảo hành không có nghĩa là trường hợp nào cũng được đổi mới miễn phí.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w032', 'promise', '/ˈprɑmɪs/', 'lời hứa, cam kết', 'noun / verb', 'The brand promises fast support for defective items.', 'Thương hiệu này cam kết hỗ trợ nhanh đối với các sản phẩm bị lỗi.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w033', 'protect', '/prəˈtekt/', 'bảo vệ', 'verb', 'An extended warranty can protect your investment.', 'Gói bảo hành mở rộng có thể giúp bảo vệ khoản đầu tư của bạn.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w034', 'reputation', '/ˌrepjəˈteɪʃən/', 'uy tín, danh tiếng', 'noun', 'The company has a strong reputation for honoring warranties.', 'Công ty có danh tiếng tốt trong việc thực hiện đúng cam kết bảo hành.'
FROM Topics t
WHERE t.slug = 'toeic-travel';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w037', 'address', '/əˈdres/', 'giải quyết, xử lý', 'verb', 'The plan addresses the company’s biggest financial concerns.', 'Kế hoạch này giải quyết những vấn đề tài chính lớn nhất của công ty.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w038', 'avoid', '/əˈvɔɪd/', 'tránh', 'verb', 'We need to avoid unnecessary costs during the first quarter.', 'Chúng ta cần tránh những chi phí không cần thiết trong quý đầu tiên.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w039', 'demonstrate', '/ˈdemənstreɪt/', 'chứng minh, thể hiện', 'verb', 'The report demonstrates strong demand in urban areas.', 'Bản báo cáo cho thấy nhu cầu tại khu vực thành thị đang rất cao.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w040', 'evaluate', '/ɪˈvæljueɪt/', 'đánh giá, nhận xét', 'verb', 'Managers will evaluate each proposal before approval.', 'Các quản lý sẽ đánh giá từng đề xuất trước khi phê duyệt.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w041', 'gather', '/ˈɡər/', 'thu thập', 'verb', 'The team gathered market data from several regions.', 'Nhóm đã thu thập dữ liệu thị trường từ nhiều khu vực khác nhau.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w042', 'offer', '/ˈɔfər/', 'đề nghị; cung cấp', 'verb / noun', 'The company will offer a lower price to attract new clients.', 'Công ty sẽ đưa ra mức giá thấp hơn để thu hút khách hàng mới.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w043', 'primarily', '/praɪˈmerərəli/', 'chủ yếu', 'adverb', 'The campaign is primarily aimed at small businesses.', 'Chiến dịch này chủ yếu nhắm đến các doanh nghiệp nhỏ.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w044', 'risk', '/rɪsk/', 'rủi ro', 'noun / verb', 'Expanding too quickly may increase financial risk.', 'Việc mở rộng quá nhanh có thể làm tăng rủi ro tài chính.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w045', 'strategy', '/ˈstrætɪdʒi/', 'chiến lược', 'noun', 'Their growth strategy focuses on online sales.', 'Chiến lược tăng trưởng của họ tập trung vào bán hàng trực tuyến.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w046', 'strong', '/strɔŋ/', 'mạnh, vững', 'adjective', 'The company showed strong performance last year.', 'Công ty đã cho thấy kết quả hoạt động rất mạnh trong năm ngoái.'
FROM Topics t
WHERE t.slug = 'toeic-health';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w049', 'agenda', '/əˈdʒɛndə/', 'chương trình nghị sự', 'noun', 'The conference agenda includes three keynote speeches.', 'Chương trình hội nghị bao gồm ba bài phát biểu chính.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w050', 'assemble', '/əˈsembəl/', 'tập hợp, lắp ráp', 'verb', 'Participants will assemble in the main hall at 9 a.m.', 'Những người tham dự sẽ tập trung tại sảnh chính lúc 9 giờ sáng.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w051', 'beforehand', '/bɪˈfɔrhnd/', 'trước đó, trước khi diễn ra', 'adverb', 'Please review the schedule beforehand.', 'Vui lòng xem trước lịch trình từ trước.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w052', 'complication', '/ˌkɑmpləˈkeɪʃən/', 'sự phức tạp, trục trặc', 'noun', 'A flight delay caused complications for several speakers.', 'Việc chuyến bay bị hoãn đã gây ra nhiều trở ngại cho một số diễn giả.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w053', 'courier', '/ˈkʊriər/', 'dịch vụ chuyển phát, người đưa thư', 'noun', 'The documents were sent by courier to the hotel.', 'Các tài liệu đã được gửi bằng dịch vụ chuyển phát đến khách sạn.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w054', 'express', '/ɪkˈspres/', 'chuyển phát nhanh', 'adjective / noun', 'We chose express delivery for the conference materials.', 'Chúng tôi đã chọn giao hàng nhanh cho các tài liệu của hội nghị.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w055', 'fold', '/fold/', 'gấp lại', 'verb', 'Please fold the brochures and place them on each seat.', 'Vui lòng gấp các tờ giới thiệu và đặt chúng lên từng ghế.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w056', 'layout', '/ˈleɪat/', 'bố cục, cách sắp xếp', 'noun', 'The room layout allows space for group discussions.', 'Cách bố trí phòng chừa đủ không gian cho các buổi thảo luận nhóm.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w057', 'mention', '/ˈmenʃən/', 'đề cập', 'verb', 'The speaker did not mention the schedule change.', 'Diễn giả đã không nhắc đến việc thay đổi lịch trình.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

INSERT INTO Flashcards (topic_id, external_id, word, transcription, meaning, word_type, example, example_vi)
SELECT t.id, 'w058', 'petition', '/pəˈtɪʃən/', 'bản kiến nghị', 'noun', 'Attendees signed a petition to extend the workshop series.', 'Người tham dự đã ký vào một bản kiến nghị để kéo dài chuỗi hội thảo.'
FROM Topics t
WHERE t.slug = 'toeic-marketing';

CREATE TABLE IF NOT EXISTS Toeic_Tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Toeic_Question_Groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  part INT NOT NULL,
  audio_url VARCHAR(255) DEFAULT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  passage_text TEXT DEFAULT NULL,
  CONSTRAINT fk_toeic_group_test FOREIGN KEY (test_id) REFERENCES Toeic_Tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Toeic_Questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  group_id INT DEFAULT NULL,
  question_number INT NOT NULL,
  part INT NOT NULL,
  question_text TEXT DEFAULT NULL,
  options JSON NOT NULL,
  correct_answer VARCHAR(10) NOT NULL,
  audio_url VARCHAR(255) DEFAULT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  CONSTRAINT fk_toeic_questions_test FOREIGN KEY (test_id) REFERENCES Toeic_Tests(id) ON DELETE CASCADE,
  CONSTRAINT fk_toeic_questions_group FOREIGN KEY (group_id) REFERENCES Toeic_Question_Groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Toeic_Test_Records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  test_id INT NOT NULL,
  reading_score INT NOT NULL DEFAULT 0,
  listening_score INT NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_toeic_test_records_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  CONSTRAINT fk_toeic_test_records_test FOREIGN KEY (test_id) REFERENCES Toeic_Tests(id) ON DELETE CASCADE
);

INSERT INTO Toeic_Tests (title, description)
SELECT 'Full Test 1', 'Đề thi thử TOEIC mô phỏng thực tế'
WHERE NOT EXISTS (SELECT 1 FROM Toeic_Tests WHERE title = 'Full Test 1');

-- Seed Group for Part 3 (Conversation)
INSERT INTO Toeic_Question_Groups (test_id, part, audio_url, passage_text)
SELECT id, 3, 'part3_audio_1.mp3', NULL
FROM Toeic_Tests WHERE title = 'Full Test 1';

-- Seed Questions for that Group
INSERT INTO Toeic_Questions (test_id, group_id, question_number, part, question_text, options, correct_answer)
SELECT t.id, g.id, 32, 3, 'What are the speakers discussing?', '{"A":"A travel itinerary","B":"A new software program","C":"A marketing campaign","D":"A job applicant"}', 'B'
FROM Toeic_Tests t JOIN Toeic_Question_Groups g ON t.id = g.test_id
WHERE t.title = 'Full Test 1' AND g.part = 3 LIMIT 1;

INSERT INTO Toeic_Questions (test_id, group_id, question_number, part, question_text, options, correct_answer)
SELECT t.id, g.id, 33, 3, 'Where does the man work?', '{"A":"At a bank","B":"At an advertising agency","C":"At a software company","D":"At a hotel"}', 'C'
FROM Toeic_Tests t JOIN Toeic_Question_Groups g ON t.id = g.test_id
WHERE t.title = 'Full Test 1' AND g.part = 3 LIMIT 1;

-- Seed Single Question for Part 5
INSERT INTO Toeic_Questions (test_id, group_id, question_number, part, question_text, options, correct_answer)
SELECT id, NULL, 101, 5, 'Please submit your report ______ Friday.', '{"A":"in","B":"at","C":"by","D":"on"}', 'C'
FROM Toeic_Tests WHERE title = 'Full Test 1';
