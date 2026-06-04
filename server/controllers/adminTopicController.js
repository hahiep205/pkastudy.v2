const {
  fetchAdminTopicsByCourse,
  fetchAdminTopic,
  createAdminTopicEntry,
  updateAdminTopicEntry,
  deleteAdminTopicEntry,
  reorderAdminTopicEntries,
} = require('../services/adminTopicService');

async function getTopicsByCourse(req, res, next) {
  try {
    const data = await fetchAdminTopicsByCourse(req.params.courseId, req.query);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function getTopic(req, res, next) {
  try {
    const data = await fetchAdminTopic(req.params.topicId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function createTopic(req, res, next) {
  try {
    const data = await createAdminTopicEntry(req.params.courseId, req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

async function updateTopic(req, res, next) {
  try {
    const data = await updateAdminTopicEntry(req.params.topicId, req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function deleteTopic(req, res, next) {
  try {
    const data = await deleteAdminTopicEntry(req.params.topicId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function reorderTopics(req, res, next) {
  try {
    const data = await reorderAdminTopicEntries(req.params.courseId, req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTopicsByCourse,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
  reorderTopics,
};
