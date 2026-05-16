import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const generatedPath = path.join(repoRoot, "src", "data", "toeicReadingTests.generated.json");
const rawBase = "C:/Users/hahie/OneDrive/Desktop/craw-data/crawl-reading/readingde1";

const part1Path = path.join(rawBase, "Part1", "thi-th-toeic-online-1-reading-part-1-thi-tr-c-nghi-m.json");
const part2Path = path.join(rawBase, "Part2", "thi-th-toeic-online-1-reading-part-2-thi-tr-c-nghi-m.json");
const part3Path = path.join(rawBase, "Part3", "thi-th-toeic-online-1-reading-part-3-thi-tr-c-nghi-m.json");

const PART6_GROUP_STARTS = [31, 35, 39, 43];
const PART7A_GROUP_STARTS = [1, 3, 5, 7, 9, 12, 15, 19, 23, 27];
const PART7B_GROUP_STARTS = [1, 5, 10, 15, 20, 25];
const PART7A_IMAGE_RULES = [
  { start: 3, end: 4, imageSourceNumber: 3 },
  { start: 5, end: 6, imageSourceNumber: 5 },
  { start: 7, end: 8, imageSourceNumber: 8 },
  { start: 9, end: 11, imageSourceNumber: 9 },
  { start: 12, end: 14, imageSourceNumber: 12 },
  { start: 15, end: 18, imageSourceNumber: 19 },
  { start: 19, end: 22, imageSourceNumber: 19 },
  { start: 23, end: 25, imageSourceNumber: 23 },
  { start: 26, end: 29, imageSourceNumber: 27 },
];
const PART7B_IMAGE_RULES = [
  { start: 1, end: 4, imageSourceNumber: 1 },
  { start: 5, end: 9, imageSourceNumber: 5 },
  { start: 10, end: 14, imageSourceNumber: 10 },
  { start: 15, end: 19, imageSourceNumber: 15 },
  { start: 20, end: 24, imageSourceNumber: 20 },
  { start: 25, end: 29, imageSourceNumber: 25 },
];
const READING_PROMPT_OVERRIDES = {
  Part2: {
    1: "Where most likely would the information be found?",
  },
};
const PART1_ANSWER_KEYS = {
  1: "B", 2: "D", 3: "C", 4: "B", 5: "D", 6: "D", 7: "A", 8: "D", 9: "A", 10: "B",
  11: "A", 12: "B", 13: "A", 14: "C", 15: "D", 16: "C", 17: "D", 18: "B", 19: "A", 20: "A",
  21: "D", 22: "A", 23: "B", 24: "A", 25: "D", 26: "D", 27: "C", 28: "C", 29: "C", 30: "B",
  31: "D", 32: "D", 33: "C", 34: "B", 35: "C", 36: "A", 37: "B", 38: "A", 39: "A", 40: "C",
  41: "B", 42: "C", 43: "A", 44: "A", 45: "B", 46: "A",
};
const PART2_ANSWER_KEYS = {
  1: "C", 2: "B", 3: "B", 4: "C", 5: "B", 6: "D", 7: "A", 8: "B", 9: "A", 10: "D",
  11: "B", 12: "B", 13: "A", 14: "B", 15: "A", 16: "C", 17: "D", 18: "C", 19: "A", 20: "C",
  21: "D", 22: "C", 23: "C", 24: "D", 25: "A", 26: "D", 27: "B", 28: "C", 29: "A",
};
const PART3_ANSWER_KEYS = {
  1: "D", 2: "B", 3: "C", 4: "C", 5: "B", 6: "C", 7: "C", 8: "A", 9: "C", 10: "A",
  11: "A", 12: "B", 13: "C", 14: "C", 15: "C", 16: "D", 17: "B", 18: "A", 19: "B", 20: "D",
  21: "C", 22: "A", 23: "B", 24: "B", 25: "A", 26: "C", 27: "C", 28: "D", 29: "B",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\u2019/g, "'")
    .trim();
}

function normalizeAssetUrl(url) {
  if (!url) return "";
  const rawValue = String(url).trim();
  if (!/^https?:\/\//i.test(rawValue)) return rawValue;
  try {
    return encodeURI(decodeURI(rawValue));
  } catch {
    return encodeURI(rawValue);
  }
}

function withAnswerKey(questions, answerKeys) {
  return questions.map((question) => ({
    ...question,
    correctKey: answerKeys[question.sourceNumber] || null,
  }));
}

function isPassageLike(text) {
  const value = normalizeText(text);
  if (!value) return false;
  return /^Directions:/i.test(value) || /^Questions\s+\d+-\d+\s+refer to the following/i.test(value);
}

function buildGroups(questionCount, startNumbers) {
  return startNumbers.map((start, index) => ({
    start,
    end: index < startNumbers.length - 1 ? startNumbers[index + 1] - 1 : questionCount,
    groupIndex: index + 1,
  }));
}

function findGroup(number, groups) {
  return groups.find((group) => number >= group.start && number <= group.end) || null;
}

function findImageRule(number, rules = []) {
  return rules.find((rule) => number >= rule.start && number <= rule.end) || null;
}

function findQuestionByNumber(rawQuestions, number) {
  return rawQuestions.find((question) => question.number === number) || null;
}

function getPromptOverride(sectionFolder, sourceNumber) {
  return READING_PROMPT_OVERRIDES[sectionFolder]?.[sourceNumber] || "";
}

function buildPart1Questions(rawQuestions) {
  const groups = buildGroups(rawQuestions.length, PART6_GROUP_STARTS);
  const passages = new Map();

  rawQuestions.forEach((question) => {
    const group = findGroup(question.number, groups);
    if (group && question.number === group.start && question.question_text) {
      passages.set(group.groupIndex, normalizeText(question.question_text));
    }
  });

  return rawQuestions.map((question) => {
    const displayNumber = 100 + question.number;
    const group = question.part === "PART 6" ? findGroup(question.number, groups) : null;
    const isPart6Lead = Boolean(group && question.number === group.start);

    return {
      id: `rt1-part1-q${displayNumber}`,
      displayNumber,
      sourceNumber: question.number,
      toeicPart: question.part,
      prompt: question.part === "PART 5" ? normalizeText(question.question_text) : null,
      sharedPassage: group ? passages.get(group.groupIndex) || null : null,
      imageUrl: normalizeAssetUrl(question.image_url),
      options: Object.entries(question.options || {}).map(([key, text]) => ({
        key,
        text: normalizeText(text),
      })),
      correctKey: PART1_ANSWER_KEYS[question.number] || null,
      explanation: null,
      groupIndex: group?.groupIndex ?? null,
      groupLead: isPart6Lead,
      sourceRef: {
        partFolder: "Part1",
        originalNumber: question.number,
      },
    };
  });
}

function buildPart7Questions(rawQuestions, sectionId, sectionFolder, baseNumber, groupStarts, imageRules = []) {
  const groups = buildGroups(rawQuestions.length, groupStarts);
  const groupMeta = new Map();

  rawQuestions.forEach((question) => {
    const group = findGroup(question.number, groups);
    if (!group) return;

    const current = groupMeta.get(group.groupIndex) || { imageUrl: "", sharedPassage: null };

    const imageRule = findImageRule(question.number, imageRules);
    const mappedImageQuestion = imageRule ? findQuestionByNumber(rawQuestions, imageRule.imageSourceNumber) : null;
    const mappedImageUrl = normalizeAssetUrl(mappedImageQuestion?.image_url);

    if (!current.imageUrl && mappedImageUrl) {
      current.imageUrl = mappedImageUrl;
    }

    if (!current.imageUrl && question.image_url) {
      current.imageUrl = normalizeAssetUrl(question.image_url);
    }

    if (!current.sharedPassage && question.number === group.start && isPassageLike(question.question_text)) {
      current.sharedPassage = normalizeText(question.question_text);
    }

    groupMeta.set(group.groupIndex, current);
  });

  return rawQuestions.map((question) => {
    const displayNumber = baseNumber + question.number - 1;
    const group = findGroup(question.number, groups);
    const meta = group ? groupMeta.get(group.groupIndex) : null;
    const isTextOnlyLead = Boolean(group && question.number === group.start && meta?.sharedPassage && !meta?.imageUrl);

    return {
      id: `${sectionId}-q${displayNumber}`,
      displayNumber,
      sourceNumber: question.number,
      toeicPart: "PART 7",
      prompt: normalizeText(getPromptOverride(sectionFolder, question.number)) || (isTextOnlyLead ? null : normalizeText(question.question_text)),
      sharedPassage: meta?.sharedPassage || null,
      imageUrl: meta?.imageUrl || "",
      options: Object.entries(question.options || {}).map(([key, text]) => ({
        key,
        text: normalizeText(text),
      })),
      correctKey: null,
      explanation: null,
      groupIndex: group?.groupIndex ?? null,
      groupLead: Boolean(group && question.number === group.start),
      sourceRef: {
        partFolder: sectionFolder,
        originalNumber: question.number,
      },
    };
  });
}

function buildReadingTest1() {
  const part1 = readJson(part1Path);
  const part2 = readJson(part2Path);
  const part3 = readJson(part3Path);

  const section1Questions = buildPart1Questions(part1.questions);
  const section2Questions = withAnswerKey(buildPart7Questions(
    part2.questions,
    "rt1-part2",
    "Part2",
    147,
    PART7A_GROUP_STARTS,
    PART7A_IMAGE_RULES
  ), PART2_ANSWER_KEYS);
  const section3Questions = withAnswerKey(buildPart7Questions(
    part3.questions,
    "rt1-part3",
    "Part3",
    176,
    PART7B_GROUP_STARTS,
    PART7B_IMAGE_RULES
  ), PART3_ANSWER_KEYS).filter((question) => question.displayNumber <= 200);

  return {
    id: "reading-test-1",
    name: "Đề Reading 1",
    desc: "Đề đọc được chuẩn hóa từ bộ crawl Reading TOEIC 1.",
    status: "ready",
    hasAnswerKey: true,
    sections: [
      {
        id: "rt1-part1",
        label: "Part 1",
        title: "Reading Part 5 + Part 6",
        desc: "46 câu đầu tiên, gồm TOEIC Part 5 và Part 6.",
        questionCount: section1Questions.length,
        toeicParts: ["PART 5", "PART 6"],
        questions: section1Questions,
      },
      {
        id: "rt1-part2",
        label: "Part 2",
        title: "Reading Part 7A",
        desc: "29 câu đọc hiểu đầu của Part 7, từ câu 147 đến 175.",
        questionCount: section2Questions.length,
        toeicParts: ["PART 7"],
        questions: section2Questions,
      },
      {
        id: "rt1-part3",
        label: "Part 3",
        title: "Reading Part 7B",
        desc: "29 câu đọc hiểu tiếp theo của Part 7, từ câu 176 đến 204.",
        questionCount: section3Questions.length,
        toeicParts: ["PART 7"],
        questions: section3Questions,
      },
    ],
  };
}

function buildReadingTest2Placeholder() {
  return {
    id: "reading-test-2",
    name: "Đề Reading 2",
    desc: "Khung đề thứ hai đã sẵn sàng, sẽ nối dữ liệu sau.",
    status: "draft",
    hasAnswerKey: false,
    sections: [
      {
        id: "rt2-part1",
        label: "Part 1",
        title: "Reading Part 5 + Part 6",
        desc: "Phần dữ liệu sẽ được bổ sung sau.",
        questionCount: 0,
        toeicParts: ["PART 5", "PART 6"],
        questions: [],
      },
      {
        id: "rt2-part2",
        label: "Part 2",
        title: "Reading Part 7A",
        desc: "Phần dữ liệu sẽ được bổ sung sau.",
        questionCount: 0,
        toeicParts: ["PART 7"],
        questions: [],
      },
      {
        id: "rt2-part3",
        label: "Part 3",
        title: "Reading Part 7B",
        desc: "Phần dữ liệu sẽ được bổ sung sau.",
        questionCount: 0,
        toeicParts: ["PART 7"],
        questions: [],
      },
    ],
  };
}

function main() {
  const payload = {
    schemaVersion: "1.0.0",
    tests: [buildReadingTest1(), buildReadingTest2Placeholder()],
  };

  fs.writeFileSync(generatedPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log("Generated Reading Test data for test 1 and placeholder test 2.");
}

main();
