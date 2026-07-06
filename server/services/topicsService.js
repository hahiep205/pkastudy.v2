const {
  getTopicBySlug,
  getFlashcardsByTopicId,
} = require('../models/topicModel');
const { getOrSet, deleteByPrefix } = require('../lib/ttlCache');

const TOPIC_CACHE_PREFIX = 'topics:';
const TOPIC_FLASHCARDS_TTL_MS = 5 * 60 * 1000;

async function fetchFlashcardsByTopicSlug(topicSlug) {
  return getOrSet(`${TOPIC_CACHE_PREFIX}${topicSlug}:flashcards`, TOPIC_FLASHCARDS_TTL_MS, async () => {
    const topic = await getTopicBySlug(topicSlug);
    if (!topic) {
      const error = new Error('Topic not found');
      error.status = 404;
      throw error;
    }

    return getFlashcardsByTopicId(topic.id);
  });
}

function invalidateTopicCache() {
  deleteByPrefix(TOPIC_CACHE_PREFIX);
}

module.exports = {
  fetchFlashcardsByTopicSlug,
  invalidateTopicCache,
};
