import listeningTestsData from "../data/toeicListeningTests.generated.json";
import readingTestsData from "../data/toeicReadingTests.generated.json";
import {
  getStoredUser,
  getUserScopedJson,
  setUserScopedJson,
} from "./userStorage";

const STORAGE_KEY = "pka_toeic_guest_history_v1";
const GUEST_TEST_COUNT = 2;

function getListeningScaledScore(rawScore) {
  let safeRaw = Number(rawScore || 0);
  if (safeRaw < 0) safeRaw = 0;
  if (safeRaw > 100) safeRaw = 100;
  if (safeRaw >= 93) return 495;
  if (safeRaw <= 6) return 5;
  return Math.round((5 + ((safeRaw - 6) / 87) * 490) / 5) * 5;
}

function getReadingScaledScore(rawScore) {
  let safeRaw = Number(rawScore || 0);
  if (safeRaw < 0) safeRaw = 0;
  if (safeRaw > 100) safeRaw = 100;
  if (safeRaw >= 97) return 495;
  if (safeRaw <= 9) return 5;
  return Math.round((5 + ((safeRaw - 9) / 88) * 490) / 5) * 5;
}

function buildQuestionId(testKey, questionId) {
  return `${testKey}:${questionId}`;
}

function getCorrectIndex(options = [], correctKey = "") {
  return options.findIndex(
    (option) =>
      String(option?.key || "").trim().toUpperCase() ===
      String(correctKey || "").trim().toUpperCase(),
  );
}

function normalizeListeningSection(testKey, section) {
  const questions = Array.isArray(section?.questions) ? section.questions : [];
  return {
    ...section,
    questions: questions.map((question) => ({
      ...question,
      id: buildQuestionId(testKey, question.id),
      sourceQuestionId: question.id,
      skill: "Listening",
      partLabel: question.toeicPart,
      audioUrl: question.audioUrl || section.audioUrl || "",
      correct: getCorrectIndex(question.options, question.correctKey),
    })),
  };
}

function normalizeReadingSection(testKey, section) {
  const questions = Array.isArray(section?.questions) ? section.questions : [];
  return {
    ...section,
    questions: questions.map((question) => ({
      ...question,
      id: buildQuestionId(testKey, question.id),
      sourceQuestionId: question.id,
      skill: "Reading",
      partLabel: question.toeicPart,
      audioUrl: question.audioUrl || "",
      correct: getCorrectIndex(question.options, question.correctKey),
    })),
  };
}

function createPracticeModes(testKey, title, listeningSections, readingSections) {
  const partMap = new Map();

  [...listeningSections, ...readingSections].forEach((section) => {
    const questions = Array.isArray(section.questions) ? section.questions : [];
    if (!questions.length) return;
    const partLabel = questions[0]?.toeicPart || questions[0]?.partLabel;
    if (!partLabel) return;
    partMap.set(partLabel, {
      id: `practice-${testKey}-${partLabel.toLowerCase().replace(/\s+/g, "-")}`,
      testId: testKey,
      partKey: partLabel,
      title,
      desc: `Luyen tap ${partLabel} cua ${title}.`,
      icon: "📚",
      questions,
    });
  });

  const metadata = [
    {
      id: "part1-picture",
      label: "Part 1",
      title: "Picture Description",
      desc: "Xem hinh, nghe bon cau mo ta va chon dap an dung nhat.",
      icon: "📸",
      type: "listening",
      partKey: "PART 1",
    },
    {
      id: "part2-response",
      label: "Part 2",
      title: "Question-Response",
      desc: "Nghe cau hoi hoac cau noi ngan roi chon phan hoi phu hop nhat.",
      icon: "💬",
      type: "listening",
      partKey: "PART 2",
    },
    {
      id: "part3-conversations",
      label: "Part 3",
      title: "Conversations",
      desc: "Nghe hoi thoai ngan va tra loi cau hoi trac nghiem.",
      icon: "👥",
      type: "listening",
      partKey: "PART 3",
    },
    {
      id: "part4-talks",
      label: "Part 4",
      title: "Talks",
      desc: "Nghe bai noi ngan va chon dap an dung nhat.",
      icon: "📢",
      type: "listening",
      partKey: "PART 4",
    },
    {
      id: "part5-reading",
      label: "Part 5",
      title: "Incomplete Sentences",
      desc: "Doc cau chua hoan chinh va chon dap an phu hop.",
      icon: "📝",
      type: "reading",
      partKey: "PART 5",
    },
    {
      id: "part6-reading",
      label: "Part 6",
      title: "Text Completion",
      desc: "Doc doan van ngan va chon dap an phu hop voi cho trong.",
      icon: "📄",
      type: "reading",
      partKey: "PART 6",
    },
    {
      id: "part7-reading",
      label: "Part 7",
      title: "Reading Comprehension",
      desc: "Doc passage va tra loi cau hoi ve noi dung bai doc.",
      icon: "📖",
      type: "reading",
      partKey: "PART 7",
    },
  ];

  return metadata.map((mode) => ({
    ...mode,
    topics: partMap.has(mode.partKey)
      ? [
          {
            ...partMap.get(mode.partKey),
            practiceType: mode.id,
          },
        ]
      : [],
  }));
}

function createFullTestQuestions(testKey, listeningSections, readingSections) {
  return [...listeningSections, ...readingSections]
    .flatMap((section) => section.questions || [])
    .sort((a, b) => Number(a.displayNumber || 0) - Number(b.displayNumber || 0))
    .map((question) => ({
      id: question.id,
      sourceQuestionId: question.sourceQuestionId,
      displayNumber: question.displayNumber,
      skill: question.skill,
      toeicPart: question.toeicPart,
      partLabel: question.toeicPart,
      prompt: question.prompt || "",
      passage: question.sharedPassage || "",
      imageUrl: question.imageUrl || "",
      audioUrl: question.audioUrl || "",
      instruction: question.instruction || "",
      options: Array.isArray(question.options)
        ? question.options.map((option) => option.text)
        : [],
      rawOptions: Array.isArray(question.options) ? question.options : [],
      correctKey: question.correctKey,
      correct: getCorrectIndex(question.options, question.correctKey),
      explanation: question.explanation || "",
    }));
}

function buildGuestToeicTests() {
  const listeningTests = Array.isArray(listeningTestsData?.tests)
    ? listeningTestsData.tests.slice(0, GUEST_TEST_COUNT)
    : [];
  const readingTests = Array.isArray(readingTestsData?.tests)
    ? readingTestsData.tests.slice(0, GUEST_TEST_COUNT)
    : [];

  return listeningTests.map((listeningTest, index) => {
    const readingTest = readingTests[index];
    const testKey = `guest-toeic-test-${index + 1}`;
    const title = `Guest TOEIC Test ${index + 1}`;
    const listeningSections = Array.isArray(listeningTest?.sections)
      ? listeningTest.sections.map((section) =>
          normalizeListeningSection(testKey, section),
        )
      : [];
    const readingSections = Array.isArray(readingTest?.sections)
      ? readingTest.sections.map((section) =>
          normalizeReadingSection(testKey, section),
        )
      : [];

    return {
      id: testKey,
      apiId: testKey,
      title,
      name: title,
      desc: "De TOEIC san cho guest user lam ngay khong can login.",
      listeningTest: {
        id: `listening-${testKey}`,
        apiId: testKey,
        name: `Listening Test ${index + 1}`,
        desc: listeningTest?.desc || "Luyen nghe TOEIC cho guest user.",
        sections: listeningSections,
      },
      readingTest: {
        id: `reading-${testKey}`,
        apiId: testKey,
        name: `Reading Test ${index + 1}`,
        desc: readingTest?.desc || "Luyen doc TOEIC cho guest user.",
        sections: readingSections,
      },
      fullTest: {
        id: `fulltest-${testKey}`,
        apiId: testKey,
        name: `TOEIC Test ${index + 1}`,
        desc: "Mo phong bai thi TOEIC day du Listening va Reading cho guest user.",
        questions: createFullTestQuestions(
          testKey,
          listeningSections,
          readingSections,
        ),
      },
      practiceModes: createPracticeModes(
        testKey,
        title,
        listeningSections,
        readingSections,
      ),
    };
  });
}

const GUEST_TOEIC_TESTS = buildGuestToeicTests();

function buildAnswerMap(answerEntries = []) {
  const map = {};
  answerEntries.forEach((answer) => {
    if (!answer?.question_id) return;
    map[String(answer.question_id)] = answer.selected || null;
  });
  return map;
}

export function isGuestToeicTestId(testId) {
  return GUEST_TOEIC_TESTS.some((test) => test.id === testId);
}

export function getGuestToeicTests() {
  return GUEST_TOEIC_TESTS.map((test) => ({
    id: test.id,
    apiId: test.apiId,
    title: test.title,
    name: test.name,
    desc: test.desc,
  }));
}

export function getGuestToeicListeningTests() {
  return GUEST_TOEIC_TESTS.map((test) => ({
    ...test.listeningTest,
  }));
}

export function getGuestToeicReadingTests() {
  return GUEST_TOEIC_TESTS.map((test) => ({
    ...test.readingTest,
  }));
}

export function getGuestToeicFullTestVariants() {
  return GUEST_TOEIC_TESTS.map((test) => ({
    ...test.fullTest,
  }));
}

export function getGuestToeicPracticeModes() {
  const grouped = new Map();

  GUEST_TOEIC_TESTS.forEach((test) => {
    test.practiceModes.forEach((mode) => {
      const existing = grouped.get(mode.id);
      if (existing) {
        existing.topics.push(...mode.topics);
      } else {
        grouped.set(mode.id, {
          ...mode,
          topics: [...mode.topics],
        });
      }
    });
  });

  return Array.from(grouped.values());
}

export function getGuestToeicTestDetail(testId) {
  return GUEST_TOEIC_TESTS.find((test) => test.id === testId) || null;
}

export function readGuestToeicHistory() {
  const storedUser = getStoredUser();
  const history = getUserScopedJson(STORAGE_KEY, [], storedUser);
  return Array.isArray(history) ? history : [];
}

function writeGuestToeicHistory(history) {
  setUserScopedJson(STORAGE_KEY, history, getStoredUser());
}

export function submitGuestToeicAnswers({
  testId,
  answers = [],
  isPartial = false,
}) {
  const test = getGuestToeicTestDetail(testId);
  if (!test) {
    throw new Error("Test not found");
  }

  const questions = test.fullTest.questions || [];
  const answerMap = buildAnswerMap(answers);
  const correctAnswersMap = {};
  let listeningCorrect = 0;
  let readingCorrect = 0;

  questions.forEach((question) => {
    correctAnswersMap[question.id] = question.correctKey;
    const selectedAnswer = answerMap[String(question.id)] || null;
    const isCorrect =
      String(selectedAnswer || "").trim().toUpperCase() ===
      String(question.correctKey || "").trim().toUpperCase();

    if (!isCorrect) return;
    if (question.skill === "Listening") listeningCorrect += 1;
    else readingCorrect += 1;
  });

  const listeningScore = getListeningScaledScore(listeningCorrect);
  const readingScore = getReadingScaledScore(readingCorrect);
  const totalScore = listeningScore + readingScore;

  if (!isPartial) {
    const history = readGuestToeicHistory();
    history.unshift({
      id: `guest-record-${Date.now()}`,
      test_id: test.id,
      test_title: test.title,
      listening_score: listeningScore,
      reading_score: readingScore,
      total_score: totalScore,
      created_at: new Date().toISOString(),
    });
    writeGuestToeicHistory(history.slice(0, 20));
  }

  return {
    listeningScore,
    readingScore,
    totalScore,
    listeningCorrect,
    readingCorrect,
    xpAwarded: isPartial ? 0 : 50,
    newLevel: null,
    levelUp: false,
    correctAnswersMap,
  };
}
