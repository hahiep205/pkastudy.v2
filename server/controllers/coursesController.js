const Joi = require("joi");
const {
  fetchCourses,
  fetchTopicsByCourseSlug,
} = require("../services/coursesService");

const courseSlugSchema = Joi.string()
  .trim()
  .pattern(/^[a-z0-9-]+$/)
  .required();

async function getCourses(req, res, next) {
  try {
    const courses = await fetchCourses();
    res.json({ data: courses });
  } catch (error) {
    next(error);
  }
}

async function getCourseTopics(req, res, next) {
  try {
    const { error, value } = courseSlugSchema.validate(req.params.id);
    if (error) {
      return res.status(400).json({ error: "Invalid course id" });
    }

    const courseData = await fetchTopicsByCourseSlug(value);
    res.json({ data: courseData });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCourses,
  getCourseTopics,
};
