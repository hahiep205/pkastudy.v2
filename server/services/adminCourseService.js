const {
  listAdminCourses,
  getAdminCourseById,
  getAdminCourseBySlug,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
} = require('../models/adminCourseModel');
const {
  parsePaginationQuery,
  parseSearchQuery,
  buildPaginationMeta,
} = require('../utils/adminQuery');

function normalizeOptionalText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeRequiredText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw Object.assign(new Error(`${fieldName} is required`), { status: 400 });
  }

  return value.trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeSlug(value, titleFallback) {
  const base = typeof value === 'string' && value.trim() ? value.trim() : titleFallback;
  const slug = slugify(base);

  if (!slug) {
    throw Object.assign(new Error('Valid slug is required'), { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw Object.assign(new Error('Slug format is invalid'), { status: 400 });
  }

  return slug;
}

function normalizeLanguage(value) {
  const language = typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : 'en';
  if (!/^[a-z]{2,10}(-[a-z]{2,10})?$/i.test(language)) {
    throw Object.assign(new Error('Language format is invalid'), { status: 400 });
  }
  return language;
}

function normalizeSortOrder(value) {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw Object.assign(new Error('Sort order must be an integer'), { status: 400 });
  }
  return parsed;
}

function normalizeThumbnailUrl(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw Object.assign(new Error('Thumbnail URL must be a string'), { status: 400 });
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!/^https?:\/\/.+/i.test(trimmed) && !/^[./]/.test(trimmed) && !/^[a-z0-9_-]+[./]/i.test(trimmed)) {
    throw Object.assign(new Error('Thumbnail URL format is invalid'), { status: 400 });
  }

  return trimmed;
}

async function ensureUniqueCourseSlug(slug, excludeCourseId = null) {
  const existing = await getAdminCourseBySlug(slug);
  if (existing && Number(existing.id) !== Number(excludeCourseId)) {
    throw Object.assign(new Error('Course slug already exists'), { status: 400 });
  }
}

async function fetchAdminCourses(query) {
  const { page, limit, offset } = parsePaginationQuery(query);
  const search = parseSearchQuery(query);
  const result = await listAdminCourses({ limit, offset, search });

  return {
    items: result.items,
    meta: buildPaginationMeta({
      page,
      limit,
      total: result.total,
    }),
    filters: {
      search,
    },
  };
}

async function fetchAdminCourse(courseId) {
  const parsedCourseId = Number.parseInt(courseId, 10);
  if (!Number.isFinite(parsedCourseId) || parsedCourseId <= 0) {
    throw Object.assign(new Error('Invalid course id'), { status: 400 });
  }

  const course = await getAdminCourseById(parsedCourseId);
  if (!course) {
    throw Object.assign(new Error('Course not found'), { status: 404 });
  }

  return course;
}

async function createAdminCourseEntry(payload) {
  const title = normalizeRequiredText(payload?.title, 'Title');
  const slug = normalizeSlug(payload?.slug, title);
  const description = normalizeOptionalText(payload?.description);
  const thumbnailUrl = normalizeThumbnailUrl(payload?.thumbnailUrl);
  const language = normalizeLanguage(payload?.language);
  const sortOrder = normalizeSortOrder(payload?.sortOrder);

  await ensureUniqueCourseSlug(slug);

  return createAdminCourse({
    slug,
    title,
    description,
    thumbnailUrl,
    language,
    sortOrder,
  });
}

async function updateAdminCourseEntry(courseId, payload) {
  const parsedCourseId = Number.parseInt(courseId, 10);
  if (!Number.isFinite(parsedCourseId) || parsedCourseId <= 0) {
    throw Object.assign(new Error('Invalid course id'), { status: 400 });
  }

  const existingCourse = await getAdminCourseById(parsedCourseId);
  if (!existingCourse) {
    throw Object.assign(new Error('Course not found'), { status: 404 });
  }

  const title = normalizeRequiredText(payload?.title, 'Title');
  const slug = normalizeSlug(payload?.slug, title);
  const description = normalizeOptionalText(payload?.description);
  const thumbnailUrl = normalizeThumbnailUrl(payload?.thumbnailUrl);
  const language = normalizeLanguage(payload?.language);
  const sortOrder = normalizeSortOrder(payload?.sortOrder);

  await ensureUniqueCourseSlug(slug, parsedCourseId);

  await updateAdminCourse(parsedCourseId, {
    slug,
    title,
    description,
    thumbnailUrl,
    language,
    sortOrder,
  });

  return getAdminCourseById(parsedCourseId);
}

async function deleteAdminCourseEntry(courseId) {
  const parsedCourseId = Number.parseInt(courseId, 10);
  if (!Number.isFinite(parsedCourseId) || parsedCourseId <= 0) {
    throw Object.assign(new Error('Invalid course id'), { status: 400 });
  }

  const existingCourse = await getAdminCourseById(parsedCourseId);
  if (!existingCourse) {
    throw Object.assign(new Error('Course not found'), { status: 404 });
  }

  await deleteAdminCourse(parsedCourseId);

  return {
    success: true,
    deleted: existingCourse,
  };
}

module.exports = {
  fetchAdminCourses,
  fetchAdminCourse,
  createAdminCourseEntry,
  updateAdminCourseEntry,
  deleteAdminCourseEntry,
};
