const {
  getCustomTopicsByUser,
  getCustomTopicWithWords,
  createCustomTopic,
  updateCustomTopic,
  deleteCustomTopic,
  addWordToCustomTopic,
  updateWordInCustomTopic,
  deleteWordFromCustomTopic,
} = require('../models/customCoursesModel');

async function fetchCustomTopics(userId) {
  return getCustomTopicsByUser(userId);
}

async function fetchCustomTopicWithWords(userId, topicId) {
  const topic = await getCustomTopicWithWords(userId, topicId);
  if (!topic) throw Object.assign(new Error('Topic not found'), { status: 404 });
  return topic;
}

async function createTopic(userId, data) {
  if (!data.title || !data.title.trim()) {
    throw Object.assign(new Error('Title is required'), { status: 400 });
  }
  return createCustomTopic(userId, { ...data, title: data.title.trim() });
}

async function updateTopic(userId, topicId, data) {
  if (!data.title || !data.title.trim()) {
    throw Object.assign(new Error('Title is required'), { status: 400 });
  }
  const ok = await updateCustomTopic(userId, topicId, { ...data, title: data.title.trim() });
  if (!ok) throw Object.assign(new Error('Topic not found'), { status: 404 });
}

async function deleteTopic(userId, topicId) {
  const ok = await deleteCustomTopic(userId, topicId);
  if (!ok) throw Object.assign(new Error('Topic not found'), { status: 404 });
}

async function addWord(userId, topicId, wordData) {
  if (!wordData.word || !wordData.mean) {
    throw Object.assign(new Error('word and mean are required'), { status: 400 });
  }
  const result = await addWordToCustomTopic(userId, topicId, wordData);
  if (!result) throw Object.assign(new Error('Topic not found'), { status: 404 });
  return result;
}

async function updateWord(userId, topicId, wordId, wordData) {
  const ok = await updateWordInCustomTopic(userId, topicId, wordId, wordData);
  if (!ok) throw Object.assign(new Error('Word not found'), { status: 404 });
}

async function deleteWord(userId, topicId, wordId) {
  const ok = await deleteWordFromCustomTopic(userId, topicId, wordId);
  if (!ok) throw Object.assign(new Error('Word not found'), { status: 404 });
}

module.exports = {
  fetchCustomTopics,
  fetchCustomTopicWithWords,
  createTopic,
  updateTopic,
  deleteTopic,
  addWord,
  updateWord,
  deleteWord,
};
