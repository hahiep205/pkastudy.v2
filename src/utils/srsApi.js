import { buildApiUrl } from './apiClient';

const QUALITY_SCORE_MAP = {
  forgot: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  const user = getStoredUser();
  return user?.token || null;
}

export function hasServerSrsAccess() {
  return Boolean(getAuthToken());
}

function buildAuthHeaders() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || fallbackMessage);
  }
  return payload;
}

export async function fetchDueReviews() {
  const response = await fetch(buildApiUrl('api/srs/due'), {
    headers: buildAuthHeaders(),
  });
  const payload = await parseJsonResponse(response, 'Không thể tải danh sách ôn tập.');
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function fetchReviewQueue() {
  const response = await fetch(buildApiUrl('api/srs/queue'), {
    headers: buildAuthHeaders(),
  });
  const payload = await parseJsonResponse(response, 'KhĂ´ng thá»ƒ táº£i hĂ ng Ä‘á»£i Ă´n táº­p.');
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function enqueueImmediateReviews(flashcardIds) {
  const response = await fetch(buildApiUrl('api/srs/enqueue'), {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ flashcard_ids: flashcardIds }),
  });
  const payload = await parseJsonResponse(response, 'Khong the dua tu vao hang doi SRS.');
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function submitSrsReviewBatch(reviewItems) {
  const response = await fetch(buildApiUrl('api/srs/review'), {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(reviewItems),
  });
  const payload = await parseJsonResponse(response, 'Không thể lưu kết quả ôn tập.');
  return Array.isArray(payload.data) ? payload.data : [];
}

export function mapReviewRatingToQualityScore(rating) {
  const score = QUALITY_SCORE_MAP[rating];
  if (typeof score !== 'number') {
    throw new Error(`Unsupported review rating: ${rating}`);
  }
  return score;
}

export function hasServerFlashcardId(word) {
  return Number.isInteger(word?.flashcardId) && word.flashcardId > 0;
}
