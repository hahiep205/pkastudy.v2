const {
  fetchAdminCourses,
  fetchAdminCourse,
  createAdminCourseEntry,
  updateAdminCourseEntry,
  deleteAdminCourseEntry,
} = require('../services/adminCourseService');

async function getCourses(req, res, next) {
  try {
    const data = await fetchAdminCourses(req.query);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function getCourse(req, res, next) {
  try {
    const data = await fetchAdminCourse(req.params.courseId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function createCourse(req, res, next) {
  try {
    const data = await createAdminCourseEntry(req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
}

async function updateCourse(req, res, next) {
  try {
    const data = await updateAdminCourseEntry(req.params.courseId, req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const data = await deleteAdminCourseEntry(req.params.courseId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
};
