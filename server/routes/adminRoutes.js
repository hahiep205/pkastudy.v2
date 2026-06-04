const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { adminMiddleware } = require('../middlewares/adminMiddleware');
const { getAdminMeta } = require('../controllers/adminMetaController');
const {
  getSummary,
  getRegistrations,
} = require('../controllers/adminOverviewController');
const {
  getUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
} = require('../controllers/adminUserController');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/adminCourseController');
const {
  getTopicsByCourse,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
  reorderTopics,
} = require('../controllers/adminTopicController');
const {
  getFlashcardsByTopic,
  getFlashcard,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
} = require('../controllers/adminFlashcardController');
const {
  getToeicTests,
  getToeicTest,
  createToeicTest,
  updateToeicTest,
  deleteToeicTest,
  getToeicGroups,
  createToeicGroup,
  updateToeicGroup,
  deleteToeicGroup,
  getToeicQuestions,
  getToeicQuestion,
  createToeicQuestion,
  updateToeicQuestion,
  deleteToeicQuestion,
} = require('../controllers/adminToeicController');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/meta', getAdminMeta);

router.get('/overview/summary', getSummary);
router.get('/overview/registrations', getRegistrations);

router.get('/users', getUsers);
router.get('/users/:userId', getUser);
router.patch('/users/:userId/role', updateUserRole);
router.patch('/users/:userId/status', updateUserStatus);

router.get('/courses', getCourses);
router.get('/courses/:courseId', getCourse);
router.post('/courses', createCourse);
router.put('/courses/:courseId', updateCourse);
router.delete('/courses/:courseId', deleteCourse);
router.get('/courses/:courseId/topics', getTopicsByCourse);
router.post('/courses/:courseId/topics', createTopic);
router.patch('/courses/:courseId/topics/reorder', reorderTopics);
router.get('/topics/:topicId', getTopic);
router.put('/topics/:topicId', updateTopic);
router.delete('/topics/:topicId', deleteTopic);
router.get('/topics/:topicId/flashcards', getFlashcardsByTopic);
router.post('/topics/:topicId/flashcards', createFlashcard);
router.get('/flashcards/:flashcardId', getFlashcard);
router.put('/flashcards/:flashcardId', updateFlashcard);
router.delete('/flashcards/:flashcardId', deleteFlashcard);

router.get('/toeic/tests', getToeicTests);
router.get('/toeic/tests/:testId', getToeicTest);
router.post('/toeic/tests', createToeicTest);
router.put('/toeic/tests/:testId', updateToeicTest);
router.delete('/toeic/tests/:testId', deleteToeicTest);
router.get('/toeic/tests/:testId/groups', getToeicGroups);
router.post('/toeic/tests/:testId/groups', createToeicGroup);
router.put('/toeic/groups/:groupId', updateToeicGroup);
router.delete('/toeic/groups/:groupId', deleteToeicGroup);
router.get('/toeic/tests/:testId/questions', getToeicQuestions);
router.post('/toeic/tests/:testId/questions', createToeicQuestion);
router.get('/toeic/questions/:questionId', getToeicQuestion);
router.put('/toeic/questions/:questionId', updateToeicQuestion);
router.delete('/toeic/questions/:questionId', deleteToeicQuestion);

module.exports = router;
