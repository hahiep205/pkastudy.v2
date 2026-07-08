const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  supabaseAdmin,
  ensureSupabaseAuthUser,
} = require('../supabase');
const {
  ensureProfileRecord,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_DEMO_EMAIL,
  DEFAULT_DEMO_PASSWORD,
} = require('../models/userModel');
const {
  loadPublicCoursesCatalog,
  loadToeicTestSourceData,
} = require('../lib/publicCatalog');

const DEFAULT_ADMIN_NAME = 'Admin';
const DEFAULT_DEMO_NAME = 'User Test';

function assertConfigured() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
}

async function upsertAuthAndProfile({ email, password, name, role }) {
  const authUser = await ensureSupabaseAuthUser({ email, password, name });
  if (!authUser?.id) {
    throw new Error(`Failed to create or update Supabase auth user for ${email}.`);
  }

  const profile = await ensureProfileRecord({
    authUserId: authUser.id,
    email,
    name,
    role,
    status: 'active',
  });

  return { authUser, profile };
}

async function ensureCourse(course) {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('courses')
    .select('id')
    .eq('slug', course.slug)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing?.id) {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update({
        title: course.title,
        description: course.description,
        language: 'en',
        sort_order: course.sort_order ?? course.sortOrder ?? null,
      })
      .eq('id', existing.id)
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({
      slug: course.slug,
      title: course.title,
      description: course.description,
      language: 'en',
      sort_order: course.sort_order ?? course.sortOrder ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function seedToeicTests() {
  assertConfigured();
  const { listeningData, readingData } = loadToeicTestSourceData();

  console.log('Seeding TOEIC tests, groups, and questions...');
  await supabaseAdmin.from('toeic_questions').delete().neq('id', 0);
  await supabaseAdmin.from('toeic_question_groups').delete().neq('id', 0);
  await supabaseAdmin.from('toeic_tests').delete().neq('id', 0);

  for (const listeningTest of listeningData.tests || []) {
    const testNumber = listeningTest.id.match(/\d+/)?.[0] || '';
    const matchingReadingTest = (readingData.tests || []).find((test) => test.id.endsWith(testNumber));
    const title = `TOEIC Test ${testNumber || listeningTest.name}`;
    const description = 'Đề luyện TOEIC gồm phần Listening và Reading, phù hợp để làm quen cấu trúc bài thi và rèn luyện tốc độ làm bài.';

    const { data: insertedTest, error: testError } = await supabaseAdmin
      .from('toeic_tests')
      .insert({
        title,
        description,
      })
      .select('id')
      .single();

    if (testError) throw testError;

    const testId = insertedTest.id;

    const insertSections = async (sections = []) => {
      for (const section of sections) {
        const sectionAudioUrl = section.audioUrl || null;
        let currentGroupId = null;
        let currentGroupKey = null;

        for (const question of section.questions || []) {
          const part = Number(String(question.toeicPart || section.label).match(/\d+/)?.[0] || 0);
          const groupKey = question.groupIndex != null
            ? `group:${question.groupIndex}`
            : question.sharedPassage
              ? `passage:${question.sharedPassage}`
              : sectionAudioUrl || question.audioUrl
                ? `audio:${sectionAudioUrl || question.audioUrl}`
                : null;
          const needsGroup = Boolean(groupKey);

          if (needsGroup && (currentGroupId == null || currentGroupKey !== groupKey)) {
            const { data: insertedGroup, error: groupError } = await supabaseAdmin
              .from('toeic_question_groups')
              .insert({
                test_id: testId,
                part,
                audio_url: sectionAudioUrl,
                image_url: null,
                passage_text: question.sharedPassage || null,
              })
              .select('id')
              .single();

            if (groupError) throw groupError;

            currentGroupId = insertedGroup.id;
            currentGroupKey = groupKey;
          } else if (!needsGroup) {
            currentGroupId = null;
            currentGroupKey = null;
          }

          const optionsMap = {};
          for (const option of question.options || []) {
            optionsMap[option.key] = option.text;
          }

          const { error: questionError } = await supabaseAdmin
            .from('toeic_questions')
            .insert({
              test_id: testId,
              group_id: currentGroupId,
              question_number: question.displayNumber,
              part,
              question_text: question.prompt || question.instruction || '',
              options: optionsMap,
              correct_answer: question.correctKey || '',
              explanation: question.explanation || null,
              audio_url: question.audioUrl || null,
              image_url: question.imageUrl || null,
            });

          if (questionError) throw questionError;
        }
      }
    };

    await insertSections(listeningTest.sections);
    await insertSections(matchingReadingTest?.sections || []);
    console.log(`  TOEIC test: ${title} (${testId})`);
  }

  console.log(`TOEIC tests seeded: ${(listeningData.tests || []).length}`);
}

async function ensureTopic(courseId, topic) {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('topics')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', topic.slug)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  const payload = {
    course_id: courseId,
    owner_user_id: null,
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    language: 'en',
    shared_from_topic_id: null,
    is_custom: false,
    sort_order: topic.sort_order,
  };

  if (existing?.id) {
    const { data, error } = await supabaseAdmin
      .from('topics')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single();

    if (error) throw error;

    await supabaseAdmin.from('flashcards').delete().eq('topic_id', data.id);
    return data.id;
  }

  const { data, error } = await supabaseAdmin
    .from('topics')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function insertWords(topicId, words) {
  for (const word of words) {
    const payload = {
      topic_id: topicId,
      external_id: null,
      word: word.word,
      transcription: word.transcription,
      meaning: word.meaning,
      word_type: word.word_type,
      example: word.example,
      example_vi: word.example_vi,
      language: word.language || 'en',
    };

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('flashcards')
      .select('id')
      .eq('topic_id', topicId)
      .eq('word', word.word)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from('flashcards')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
      continue;
    }

    const { error } = await supabaseAdmin
      .from('flashcards')
      .insert(payload);

    if (error) throw error;
  }
}

async function seedPublicCatalog() {
  assertConfigured();

  console.log('Seeding public courses, topics, and sample flashcards...');
  const publicCourses = await loadPublicCoursesCatalog();

  for (const course of publicCourses) {
    const courseId = await ensureCourse(course);
    console.log(`  course: ${course.slug} (${courseId})`);

    for (const topic of course.topics) {
      const topicId = await ensureTopic(courseId, topic);
      console.log(`    topic: ${topic.slug} (${topicId})`);
      await insertWords(topicId, topic.words);
      console.log(`      words: ${topic.words.length}`);
    }
  }

  await seedToeicTests();
}

async function seedUsersOnly() {
  assertConfigured();

  console.log('Seeding admin and test auth users...');
  const seededAdmin = await upsertAuthAndProfile({
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    name: DEFAULT_ADMIN_NAME,
    role: 'admin',
  });
  console.log(`  admin: ${seededAdmin.profile.email} (${seededAdmin.profile.profileId})`);

  const seededUser = await upsertAuthAndProfile({
    email: DEFAULT_DEMO_EMAIL,
    password: DEFAULT_DEMO_PASSWORD,
    name: DEFAULT_DEMO_NAME,
    role: 'user',
  });
  console.log(`  user: ${seededUser.profile.email} (${seededUser.profile.profileId})`);
}

async function seedSupabaseProduction() {
  await seedUsersOnly();
  await seedPublicCatalog();
  console.log('Supabase production seed completed successfully.');
}

if (require.main === module) {
  const mode = process.argv[2] || 'all';

  const runner = mode === '--users-only' || mode === 'users'
    ? seedUsersOnly
    : mode === '--toeic-only' || mode === 'toeic'
      ? seedToeicTests
    : mode === '--public-only' || mode === 'public'
      ? seedPublicCatalog
      : seedSupabaseProduction;

  runner().catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  seedSupabaseProduction,
  seedUsersOnly,
  seedPublicCatalog,
  seedToeicTests,
};
