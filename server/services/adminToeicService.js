const {
  parsePaginationQuery,
  parseSearchQuery,
  buildPaginationMeta,
} = require('../utils/adminQuery');
const {
  listAdminToeicTests,
  getAdminToeicTestById,
  createAdminToeicTest,
  updateAdminToeicTest,
  deleteAdminToeicTest,
  listAdminToeicGroupsByTestId,
  getAdminToeicGroupById,
  createAdminToeicGroup,
  updateAdminToeicGroup,
  deleteAdminToeicGroup,
  listAdminToeicQuestionsByTestId,
  getAdminToeicQuestionById,
  createAdminToeicQuestion,
  updateAdminToeicQuestion,
  deleteAdminToeicQuestion,
  getMaxToeicQuestionNumber,
} = require('../models/adminToeicModel');

function normalizeRequiredText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error(`${fieldName} is required`), { status: 400 });
  }

  return value.trim();
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw Object.assign(new Error('Text value must be a string'), { status: 400 });
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizePositiveId(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw Object.assign(new Error(`Invalid ${fieldName}`), { status: 400 });
  }
  return parsed;
}

function normalizePart(value) {
  const part = Number.parseInt(value, 10);
  if (!Number.isFinite(part) || part < 1 || part > 7) {
    throw Object.assign(new Error('Part must be between 1 and 7'), { status: 400 });
  }
  return part;
}

function normalizeOptionalMediaUrl(value, fieldName = 'Media URL') {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw Object.assign(new Error(`${fieldName} must be a string`), { status: 400 });
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isValid = /^https?:\/\/.+/i.test(trimmed) || trimmed.startsWith('/uploads/toeic/');
  if (!isValid) {
    throw Object.assign(new Error(`${fieldName} format is invalid`), { status: 400 });
  }

  return trimmed;
}

function normalizeQuestionNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw Object.assign(new Error('Question number must be a positive integer'), { status: 400 });
  }
  return parsed;
}

function normalizeOptions(value) {
  const raw = value || {};
  const optionKeys = ['A', 'B', 'C', 'D'];
  const next = {};

  optionKeys.forEach((key) => {
    const optionValue = raw[key] ?? raw[key.toLowerCase()];
    if (typeof optionValue !== 'string' || !optionValue.trim()) {
      throw Object.assign(new Error(`Option ${key} is required`), { status: 400 });
    }
    next[key] = optionValue.trim();
  });

  return next;
}

function normalizeCorrectAnswer(value) {
  if (typeof value !== 'string') {
    throw Object.assign(new Error('Correct answer is required'), { status: 400 });
  }

  const answer = value.trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(answer)) {
    throw Object.assign(new Error('Correct answer must be one of A, B, C, D'), { status: 400 });
  }

  return answer;
}

async function ensureToeicTestExists(testId) {
  const test = await getAdminToeicTestById(testId);
  if (!test) {
    throw Object.assign(new Error('TOEIC test not found'), { status: 404 });
  }
  return test;
}

async function ensureToeicGroupBelongsToTest(groupId, testId) {
  if (groupId === null || groupId === undefined || groupId === '') return null;
  const parsedGroupId = normalizePositiveId(groupId, 'group id');
  const group = await getAdminToeicGroupById(parsedGroupId);
  if (!group || Number(group.testId) !== Number(testId)) {
    throw Object.assign(new Error('Question group not found in this test'), { status: 404 });
  }
  return group;
}

async function fetchAdminToeicTests(query) {
  const { page, limit, offset } = parsePaginationQuery(query);
  const search = parseSearchQuery(query);
  const result = await listAdminToeicTests({ limit, offset, search });

  return {
    items: result.items,
    meta: buildPaginationMeta({ page, limit, total: result.total }),
    filters: { search },
  };
}

async function fetchAdminToeicTest(testId) {
  const parsedTestId = normalizePositiveId(testId, 'test id');
  const test = await ensureToeicTestExists(parsedTestId);
  const groups = await listAdminToeicGroupsByTestId(parsedTestId);
  return {
    ...test,
    groups,
  };
}

async function createAdminToeicTestEntry(payload) {
  const title = normalizeRequiredText(payload?.title, 'Title');
  const description = normalizeOptionalText(payload?.description);
  return createAdminToeicTest({ title, description });
}

async function updateAdminToeicTestEntry(testId, payload) {
  const parsedTestId = normalizePositiveId(testId, 'test id');
  await ensureToeicTestExists(parsedTestId);

  const title = normalizeRequiredText(payload?.title, 'Title');
  const description = normalizeOptionalText(payload?.description);

  await updateAdminToeicTest(parsedTestId, { title, description });
  return fetchAdminToeicTest(parsedTestId);
}

async function deleteAdminToeicTestEntry(testId) {
  const parsedTestId = normalizePositiveId(testId, 'test id');
  const existing = await ensureToeicTestExists(parsedTestId);
  await deleteAdminToeicTest(parsedTestId);
  return { success: true, deleted: existing };
}

async function fetchAdminToeicGroups(testId) {
  const parsedTestId = normalizePositiveId(testId, 'test id');
  await ensureToeicTestExists(parsedTestId);
  return listAdminToeicGroupsByTestId(parsedTestId);
}

async function createAdminToeicGroupEntry(testId, payload) {
  const parsedTestId = normalizePositiveId(testId, 'test id');
  await ensureToeicTestExists(parsedTestId);

  return createAdminToeicGroup({
    testId: parsedTestId,
    part: normalizePart(payload?.part),
    audioUrl: normalizeOptionalMediaUrl(payload?.audioUrl, 'Audio URL'),
    imageUrl: normalizeOptionalMediaUrl(payload?.imageUrl, 'Image URL'),
    passageText: normalizeOptionalText(payload?.passageText),
  });
}

async function updateAdminToeicGroupEntry(groupId, payload) {
  const parsedGroupId = normalizePositiveId(groupId, 'group id');
  const group = await getAdminToeicGroupById(parsedGroupId);
  if (!group) {
    throw Object.assign(new Error('Question group not found'), { status: 404 });
  }

  await updateAdminToeicGroup(parsedGroupId, {
    part: normalizePart(payload?.part),
    audioUrl: normalizeOptionalMediaUrl(payload?.audioUrl, 'Audio URL'),
    imageUrl: normalizeOptionalMediaUrl(payload?.imageUrl, 'Image URL'),
    passageText: normalizeOptionalText(payload?.passageText),
  });

  return getAdminToeicGroupById(parsedGroupId);
}

async function deleteAdminToeicGroupEntry(groupId) {
  const parsedGroupId = normalizePositiveId(groupId, 'group id');
  const group = await getAdminToeicGroupById(parsedGroupId);
  if (!group) {
    throw Object.assign(new Error('Question group not found'), { status: 404 });
  }
  await deleteAdminToeicGroup(parsedGroupId);
  return { success: true, deleted: group };
}

async function fetchAdminToeicQuestions(testId, query) {
  const parsedTestId = normalizePositiveId(testId, 'test id');
  await ensureToeicTestExists(parsedTestId);

  const { page, limit, offset } = parsePaginationQuery(query);
  const search = parseSearchQuery(query);
  const part = query?.part ? normalizePart(query.part) : null;

  let groupId = null;
  if (query?.groupId === 'ungrouped') {
    groupId = 'ungrouped';
  } else if (query?.groupId) {
    groupId = normalizePositiveId(query.groupId, 'group id');
  }

  const result = await listAdminToeicQuestionsByTestId({
    testId: parsedTestId,
    limit,
    offset,
    search,
    part,
    groupId,
  });

  return {
    items: result.items,
    meta: buildPaginationMeta({ page, limit, total: result.total }),
    filters: {
      search,
      part,
      groupId: groupId === 'ungrouped' ? 'ungrouped' : groupId,
    },
  };
}

async function fetchAdminToeicQuestion(questionId) {
  const parsedQuestionId = normalizePositiveId(questionId, 'question id');
  const question = await getAdminToeicQuestionById(parsedQuestionId);
  if (!question) {
    throw Object.assign(new Error('TOEIC question not found'), { status: 404 });
  }
  return question;
}

async function createAdminToeicQuestionEntry(testId, payload) {
  const parsedTestId = normalizePositiveId(testId, 'test id');
  await ensureToeicTestExists(parsedTestId);

  const group = await ensureToeicGroupBelongsToTest(payload?.groupId, parsedTestId);
  const part = normalizePart(payload?.part);
  const nextQuestionNumber = await getMaxToeicQuestionNumber(parsedTestId);
  const questionNumber = normalizeQuestionNumber(payload?.questionNumber, nextQuestionNumber + 1);

  if (group && Number(group.part) !== Number(part)) {
    throw Object.assign(new Error('Question part must match selected group part'), { status: 400 });
  }

  return createAdminToeicQuestion({
    testId: parsedTestId,
    groupId: group ? group.id : null,
    questionNumber,
    part,
    questionText: normalizeOptionalText(payload?.questionText),
    options: normalizeOptions(payload?.options),
    correctAnswer: normalizeCorrectAnswer(payload?.correctAnswer),
    explanation: normalizeOptionalText(payload?.explanation),
    audioUrl: normalizeOptionalMediaUrl(payload?.audioUrl, 'Audio URL'),
    imageUrl: normalizeOptionalMediaUrl(payload?.imageUrl, 'Image URL'),
  });
}

async function updateAdminToeicQuestionEntry(questionId, payload) {
  const parsedQuestionId = normalizePositiveId(questionId, 'question id');
  const existing = await getAdminToeicQuestionById(parsedQuestionId);
  if (!existing) {
    throw Object.assign(new Error('TOEIC question not found'), { status: 404 });
  }

  const group = await ensureToeicGroupBelongsToTest(payload?.groupId, existing.testId);
  const part = normalizePart(payload?.part);
  const questionNumber = normalizeQuestionNumber(payload?.questionNumber);

  if (group && Number(group.part) !== Number(part)) {
    throw Object.assign(new Error('Question part must match selected group part'), { status: 400 });
  }

  await updateAdminToeicQuestion(parsedQuestionId, {
    groupId: group ? group.id : null,
    questionNumber,
    part,
    questionText: normalizeOptionalText(payload?.questionText),
    options: normalizeOptions(payload?.options),
    correctAnswer: normalizeCorrectAnswer(payload?.correctAnswer),
    explanation: normalizeOptionalText(payload?.explanation),
    audioUrl: normalizeOptionalMediaUrl(payload?.audioUrl, 'Audio URL'),
    imageUrl: normalizeOptionalMediaUrl(payload?.imageUrl, 'Image URL'),
  });

  return getAdminToeicQuestionById(parsedQuestionId);
}

async function deleteAdminToeicQuestionEntry(questionId) {
  const parsedQuestionId = normalizePositiveId(questionId, 'question id');
  const existing = await getAdminToeicQuestionById(parsedQuestionId);
  if (!existing) {
    throw Object.assign(new Error('TOEIC question not found'), { status: 404 });
  }

  await deleteAdminToeicQuestion(parsedQuestionId);
  return { success: true, deleted: existing };
}

module.exports = {
  fetchAdminToeicTests,
  fetchAdminToeicTest,
  createAdminToeicTestEntry,
  updateAdminToeicTestEntry,
  deleteAdminToeicTestEntry,
  fetchAdminToeicGroups,
  createAdminToeicGroupEntry,
  updateAdminToeicGroupEntry,
  deleteAdminToeicGroupEntry,
  fetchAdminToeicQuestions,
  fetchAdminToeicQuestion,
  createAdminToeicQuestionEntry,
  updateAdminToeicQuestionEntry,
  deleteAdminToeicQuestionEntry,
};
