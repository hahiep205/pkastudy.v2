const {
  getAllCourses,
  getCourseBySlug,
  getTopicsByCourseId,
} = require('../models/courseModel');

async function fetchCourses() {
  return getAllCourses();
}

async function fetchTopicsByCourseSlug(courseSlug) {
  const course = await getCourseBySlug(courseSlug);
  if (!course) {
    const error = new Error('Course not found');
    error.status = 404;
    throw error;
  }

  const topics = await getTopicsByCourseId(course.id);

  return {
    courseTitle: course.title,
    topics,
  };
}

module.exports = {
  fetchCourses,
  fetchTopicsByCourseSlug,
};
