const { getTests, getTestById, getTestGroupsByTestId, getQuestionsByTestId, insertTestRecord, getTestHistoryByUserId } = require('../models/toeicModel');
const { addXpService } = require('./progressService');
const { getListeningScaledScore, getReadingScaledScore } = require('../utils/toeicScoreMapping');

const PRACTICE_MODE_METADATA = [
  {
    id: "part1-picture",
    label: "Part 1",
    title: "Picture Description",
    desc: "Xem hình, nghe bốn câu mô tả và chọn đáp án A/B/C/D đúng nhất với bức ảnh.",
    icon: "📸",
    type: "listening"
  },
  {
    id: "part2-response",
    label: "Part 2",
    title: "Question-Response",
    desc: "Nghe một câu hỏi hoặc câu nói ngắn, rồi chọn phản hồi A/B/C phù hợp nhất.",
    icon: "💬",
    type: "listening"
  },
  {
    id: "part3-conversations",
    label: "Part 3",
    title: "Conversations",
    desc: "Nghe đoạn hội thoại ngắn và trả lời câu hỏi trắc nghiệm A/B/C/D về nội dung vừa nghe.",
    icon: "👥",
    type: "listening"
  },
  {
    id: "part4-talks",
    label: "Part 4",
    title: "Talks",
    desc: "Nghe bài nói hoặc thông báo ngắn của một người và chọn đáp án A/B/C/D đúng nhất.",
    icon: "📢",
    type: "listening"
  },
  {
    id: "part5-reading",
    label: "Part 5",
    title: "Incomplete Sentences",
    desc: "Đọc câu chưa hoàn chỉnh và chọn đáp án A/B/C/D phù hợp nhất để điền vào chỗ trống.",
    icon: "📝",
    type: "reading"
  },
  {
    id: "part6-reading",
    label: "Part 6",
    title: "Text Completion",
    desc: "Đọc đoạn văn ngắn và chọn đáp án A/B/C/D phù hợp nhất với từng chỗ trống.",
    icon: "📄",
    type: "reading"
  },
  {
    id: "part7-reading",
    label: "Part 7",
    title: "Reading Comprehension",
    desc: "Đọc passage và trả lời câu hỏi A/B/C/D về ý chính, chi tiết và suy luận.",
    icon: "📖",
    type: "reading"
  }
];
async function getTestsList() {
  return await getTests();
}

async function getTestDetails(testId) {
  const test = await getTestById(testId);
  if (!test) return null;

  const groups = await getTestGroupsByTestId(testId);
  const questions = await getQuestionsByTestId(testId);
  
  // Remove correct_answer
  const safeQuestions = questions.map(q => {
    const { correct_answer, ...safeQ } = q;
    return safeQ;
  });

  // Grouping logic
  const groupedQuestions = [];
  const singleQuestions = [];

  const groupMap = new Map();
  groups.forEach(g => {
    groupMap.set(g.id, { ...g, questions: [] });
  });

  safeQuestions.forEach(q => {
    if (q.group_id && groupMap.has(q.group_id)) {
      groupMap.get(q.group_id).questions.push(q);
    } else {
      singleQuestions.push(q);
    }
  });

  groupMap.forEach(g => groupedQuestions.push(g));

  return {
    ...test,
    groups: groupedQuestions,
    single_questions: singleQuestions,
  };
}

async function submitTest(userId, testId, userAnswers, isPartial = false) {
  const test = await getTestById(testId);
  if (!test) throw new Error('Test not found');

  const questions = await getQuestionsByTestId(testId);
  
  let readingCorrect = 0;
  let listeningCorrect = 0;

  const correctAnswersMap = {};

  questions.forEach(q => {
    correctAnswersMap[q.id] = q.correct_answer;
    const userAnswer = userAnswers.find(ans => ans.question_id === q.id);
    if (userAnswer && userAnswer.selected === q.correct_answer) {
      if (q.part >= 1 && q.part <= 4) {
        listeningCorrect++;
      } else {
        readingCorrect++;
      }
    }
  });

  // Calculate Scale Score using the realistic TOEIC mapping
  const listeningScore = getListeningScaledScore(listeningCorrect);
  const readingScore = getReadingScaledScore(readingCorrect);
  const totalScore = readingScore + listeningScore;

  let xpResult = null;
  if (!isPartial) {
    await insertTestRecord(userId, testId, readingScore, listeningScore, totalScore);
    // Award 500 XP for completing a full test
    xpResult = await addXpService(userId, 500);
  }

  return {
    readingScore,
    listeningScore,
    totalScore,
    readingCorrect,
    listeningCorrect,
    xpAwarded: isPartial ? 0 : 500,
    newLevel: xpResult ? xpResult.newLevel : null,
    levelUp: xpResult ? xpResult.levelUp : false,
    correctAnswersMap
  };
}

async function getPracticeModes() {
  const tests = await getTestsList();
  
  const modes = PRACTICE_MODE_METADATA.map(mode => {
    return {
      id: mode.id,
      label: mode.label,
      title: mode.title,
      desc: mode.desc,
      icon: mode.icon,
      type: mode.type,
      topics: tests.map(test => ({
        id: `practice-${test.id}-${mode.id}`,
        testId: test.id,
        partKey: mode.label.toUpperCase(),
        title: test.title || test.name,
        desc: `Luyện tập ${mode.label} của ${test.title || test.name}.`,
        icon: "📚",
        practiceType: mode.id,
      }))
    };
  });
  
  return modes;
}

async function getTestHistory(userId) {
  return await getTestHistoryByUserId(userId);
}

module.exports = {
  getTestsList,
  getTestDetails,
  submitTest,
  getPracticeModes,
  getTestHistory,
};
