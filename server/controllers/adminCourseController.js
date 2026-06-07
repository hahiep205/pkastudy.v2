const {
  fetchAdminCourses,
  fetchAdminCourse,
  exportAdminCourseEntry,
  importAdminCourseEntry,
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

async function exportCourse(req, res, next) {
  try {
    const data = await exportAdminCourseEntry(req.params.courseId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function importCourse(req, res, next) {
  try {
    const data = await importAdminCourseEntry(req.body);
    res.status(201).json({ data });
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
  exportCourse,
  importCourse,
  createCourse,
  updateCourse,
  deleteCourse,
};
