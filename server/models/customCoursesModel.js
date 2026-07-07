const { ensureSupabaseEnabled, unwrapList, unwrapSingle, resolveProfileId } = require('../lib/supabaseData');

const CUSTOM_TOPICS_COURSE_SLUG = '__custom_user_topics__';
const SAMPLE_PERSONAL_TOPIC_SLUG = '__sample_personal_topic__';
const SAMPLE_PERSONAL_TOPIC_TITLE = 'Bộ tài liệu cá nhân mẫu';
const SAMPLE_PERSONAL_TOPIC_DESCRIPTION = '';
const SAMPLE_PERSONAL_TOPIC_WORDS = [
  {
    word: 'study',
    mean: 'học tập',
    transcription: '/ˈstʌdi/',
    wordtype: 'verb',
    example: 'I study English every day.',
    example_vi: 'Tôi học tiếng Anh mỗi ngày.',
    language: 'en',
  },
  {
    word: 'review',
    mean: 'ôn tập',
    transcription: '/rɪˈvjuː/',
    wordtype: 'verb',
    example: 'Please review the lesson before class.',
    example_vi: 'Hãy ôn lại bài trước giờ học.',
    language: 'en',
  },
  {
    word: 'memory',
    mean: 'trí nhớ',
    transcription: '/ˈmeməri/',
    wordtype: 'noun',
    example: 'Spaced repetition improves memory.',
    example_vi: 'Ôn lặp lại ngắt quãng giúp cải thiện trí nhớ.',
    language: 'en',
  },
  {
    word: 'focus',
    mean: 'tập trung',
    transcription: '/ˈfoʊkəs/',
    wordtype: 'verb',
    example: 'I focus best in the morning.',
    example_vi: 'Tôi tập trung tốt nhất vào buổi sáng.',
    language: 'en',
  },
  {
    word: 'progress',
    mean: 'tiến bộ',
    transcription: '/ˈprɑːɡres/',
    wordtype: 'noun',
    example: 'Small steps create real progress.',
    example_vi: 'Những bước nhỏ tạo ra tiến bộ thật sự.',
    language: 'en',
  },
];

async function ensureCustomTopicsCourseId() {
  const admin = ensureSupabaseEnabled();
  const existing = unwrapSingle(await admin
    .from('courses')
    .select('id')
    .eq('slug', CUSTOM_TOPICS_COURSE_SLUG)
    .limit(1)
    .maybeSingle());

  if (existing?.id) {
    return existing.id;
  }

  const rows = unwrapList(await admin
    .from('courses')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1));

  const nextSortOrder = Number(rows[0]?.sort_order || 0) + 1000;
  const inserted = unwrapSingle(await admin
    .from('courses')
    .insert({
      slug: CUSTOM_TOPICS_COURSE_SLUG,
      title: 'Custom Topics Anchor',
      description: 'System course used internally for user-owned custom topics.',
      language: 'en',
      sort_order: nextSortOrder,
    })
    .select('id')
    .single());

  return inserted.id;
}

async function getCustomTopicsByUser(userId) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);

  const topics = unwrapList(await admin
    .from('topics')
    .select('id, slug, title, description, language, created_at')
    .eq('owner_user_id', profileId)
    .order('created_at', { ascending: false }));

  if (!topics.length) return [];

  const words = unwrapList(await admin
    .from('flashcards')
    .select('id, topic_id, word, transcription, meaning, word_type, example, example_vi, language')
    .in('topic_id', topics.map((topic) => topic.id))
    .order('id', { ascending: true }));

  const wordsByTopicId = new Map();
  words.forEach((word) => {
    const topicWords = wordsByTopicId.get(word.topic_id) || [];
    topicWords.push({
      id: word.id,
      topic_id: word.topic_id,
      word: word.word,
      transcription: word.transcription,
      mean: word.meaning,
      wordtype: word.word_type,
      example: word.example,
      example_vi: word.example_vi,
      language: word.language,
    });
    wordsByTopicId.set(word.topic_id, topicWords);
  });

  return topics.map((topic) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    language: topic.language || 'en',
    created_at: topic.created_at,
    word_count: (wordsByTopicId.get(topic.id) || []).length,
    words: wordsByTopicId.get(topic.id) || [],
  }));
}

async function getCustomTopicWithWords(userId, topicId) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  const topic = unwrapSingle(await admin
    .from('topics')
    .select('id, course_id, slug, title, description, language, sort_order, created_at, updated_at')
    .eq('id', topicId)
    .eq('owner_user_id', profileId)
    .limit(1)
    .maybeSingle());

  if (!topic) return null;

  const words = unwrapList(await admin
    .from('flashcards')
    .select('id, word, transcription, meaning, word_type, example, example_vi, language')
    .eq('topic_id', topicId)
    .order('id', { ascending: true }));

  return {
    ...topic,
    language: topic.language || 'en',
    words: words.map((word) => ({
      id: word.id,
      word: word.word,
      transcription: word.transcription,
      mean: word.meaning,
      wordtype: word.word_type,
      example: word.example,
      example_vi: word.example_vi,
      language: word.language,
    })),
  };
}

async function createCustomTopic(userId, { title, description, language }) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  const customCourseId = await ensureCustomTopicsCourseId();
  const inserted = unwrapSingle(await admin
    .from('topics')
    .insert({
      course_id: customCourseId,
      title,
      description: description || null,
      language: language || 'en',
      owner_user_id: profileId,
      sort_order: 0,
    })
    .select('id, title, description, language')
    .single());

  return {
    id: inserted.id,
    title: inserted.title,
    description: inserted.description,
    language: inserted.language || 'en',
    words: [],
  };
}

async function ensureSamplePersonalTopicForUser(userId) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);

  const existingTopics = unwrapList(await admin
    .from('topics')
    .select('id, slug, title')
    .eq('owner_user_id', profileId)
    .order('created_at', { ascending: true }));

  const normalizedSampleTitle = SAMPLE_PERSONAL_TOPIC_TITLE.trim().toLowerCase();
  const sampleAlreadyExists = existingTopics.some((topic) => {
    const normalizedTitle = String(topic.title || '').trim().toLowerCase();
    return topic.slug === SAMPLE_PERSONAL_TOPIC_SLUG || normalizedTitle === normalizedSampleTitle;
  });

  if (sampleAlreadyExists) {
    return false;
  }

  const customCourseId = await ensureCustomTopicsCourseId();
  try {
    const inserted = unwrapSingle(await admin
      .from('topics')
      .insert({
        course_id: customCourseId,
        slug: SAMPLE_PERSONAL_TOPIC_SLUG,
        title: SAMPLE_PERSONAL_TOPIC_TITLE,
        description: SAMPLE_PERSONAL_TOPIC_DESCRIPTION,
        language: 'en',
        owner_user_id: profileId,
        sort_order: 0,
      })
      .select('id')
      .single());

    for (const word of SAMPLE_PERSONAL_TOPIC_WORDS) {
      await addWordToCustomTopic(userId, inserted.id, word);
    }

    return true;
  } catch (error) {
    if (error?.code === '23505' || String(error?.message || '').toLowerCase().includes('duplicate')) {
      return false;
    }
    throw error;
  }
}

async function updateCustomTopic(userId, topicId, { title, description, language }) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  const payload = {
    title,
    description: description || null,
  };
  if (language) {
    payload.language = language;
  }
  const result = await admin
    .from('topics')
    .update(payload)
    .eq('id', topicId)
    .eq('owner_user_id', profileId)
    .select('id');

  return unwrapList(result).length > 0;
}

async function deleteCustomTopic(userId, topicId) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  const result = await admin
    .from('topics')
    .delete()
    .eq('id', topicId)
    .eq('owner_user_id', profileId)
    .select('id');

  return unwrapList(result).length > 0;
}

async function addWordToCustomTopic(userId, topicId, wordData) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  const topic = unwrapSingle(await admin
    .from('topics')
    .select('id')
    .eq('id', topicId)
    .eq('owner_user_id', profileId)
    .limit(1)
    .maybeSingle());
  if (!topic) return null;

  const { word, mean, transcription, wordtype, example, example_vi, language } = wordData;
  const inserted = unwrapSingle(await admin
    .from('flashcards')
    .insert({
      topic_id: topicId,
      word,
      transcription: transcription || null,
      meaning: mean,
      word_type: wordtype || null,
      example: example || null,
      example_vi: example_vi || null,
      language: language || 'en',
    })
    .select('id')
    .single());

  return { id: inserted.id, word, mean, transcription, wordtype, example, example_vi, language: language || 'en' };
}

async function updateWordInCustomTopic(userId, topicId, wordId, wordData) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  const topic = unwrapSingle(await admin
    .from('topics')
    .select('id')
    .eq('id', topicId)
    .eq('owner_user_id', profileId)
    .limit(1)
    .maybeSingle());
  if (!topic) return false;

  const { word, mean, transcription, wordtype, example, example_vi } = wordData;
  const result = await admin
    .from('flashcards')
    .update({
      word,
      transcription: transcription || null,
      meaning: mean,
      word_type: wordtype || null,
      example: example || null,
      example_vi: example_vi || null,
    })
    .eq('id', wordId)
    .eq('topic_id', topicId)
    .select('id');

  return unwrapList(result).length > 0;
}

async function deleteWordFromCustomTopic(userId, topicId, wordId) {
  const admin = ensureSupabaseEnabled();
  const profileId = await resolveProfileId(userId);
  const topic = unwrapSingle(await admin
    .from('topics')
    .select('id')
    .eq('id', topicId)
    .eq('owner_user_id', profileId)
    .limit(1)
    .maybeSingle());
  if (!topic) return false;

  const result = await admin
    .from('flashcards')
    .delete()
    .eq('id', wordId)
    .eq('topic_id', topicId)
    .select('id');

  return unwrapList(result).length > 0;
}

module.exports = {
  CUSTOM_TOPICS_COURSE_SLUG,
  getCustomTopicsByUser,
  getCustomTopicWithWords,
  createCustomTopic,
  ensureSamplePersonalTopicForUser,
  updateCustomTopic,
  deleteCustomTopic,
  addWordToCustomTopic,
  updateWordInCustomTopic,
  deleteWordFromCustomTopic,
};
