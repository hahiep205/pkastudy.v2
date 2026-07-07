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

const DEFAULT_ADMIN_NAME = 'Admin';
const DEFAULT_DEMO_NAME = 'User Test';

const PUBLIC_COURSES = [
  {
    slug: 'starter-english',
    title: 'Starter English',
    description: 'Foundational vocabulary for daily communication.',
    sort_order: 10,
    topics: [
      {
        slug: 'daily-life',
        title: 'Daily Life',
        description: 'Common words for everyday routines.',
        sort_order: 1,
        words: [
          { word: 'wake', transcription: '/weɪk/', word_type: 'verb', meaning: 'to stop sleeping', example: 'I wake at 6 AM every day.', example_vi: 'I wake at 6 AM every day.', language: 'en' },
          { word: 'brush', transcription: '/brʌʃ/', word_type: 'verb', meaning: 'to clean with a brush', example: 'She brushes her teeth before breakfast.', example_vi: 'She brushes her teeth before breakfast.', language: 'en' },
          { word: 'cook', transcription: '/kʊk/', word_type: 'verb', meaning: 'to prepare food', example: 'My father cooks dinner on weekends.', example_vi: 'My father cooks dinner on weekends.', language: 'en' },
          { word: 'clean', transcription: '/kliːn/', word_type: 'verb', meaning: 'to make free from dirt', example: 'We clean the room every Sunday.', example_vi: 'We clean the room every Sunday.', language: 'en' },
          { word: 'rest', transcription: '/rest/', word_type: 'verb', meaning: 'to relax or sleep', example: 'You should rest after work.', example_vi: 'You should rest after work.', language: 'en' },
        ],
      },
      {
        slug: 'office-basics',
        title: 'Office Basics',
        description: 'Simple office vocabulary for beginners.',
        sort_order: 2,
        words: [
          { word: 'desk', transcription: '/desk/', word_type: 'noun', meaning: 'a table for working', example: 'The laptop is on the desk.', example_vi: 'The laptop is on the desk.', language: 'en' },
          { word: 'chair', transcription: '/tʃeər/', word_type: 'noun', meaning: 'a seat for one person', example: 'Please sit on the chair.', example_vi: 'Please sit on the chair.', language: 'en' },
          { word: 'file', transcription: '/faɪl/', word_type: 'noun', meaning: 'a set of documents', example: 'Save the report in the file.', example_vi: 'Save the report in the file.', language: 'en' },
          { word: 'note', transcription: '/noʊt/', word_type: 'noun', meaning: 'a short written message', example: 'I wrote a note for my teammate.', example_vi: 'I wrote a note for my teammate.', language: 'en' },
          { word: 'plan', transcription: '/plæn/', word_type: 'noun', meaning: 'an idea for the future', example: 'We made a plan for Monday.', example_vi: 'We made a plan for Monday.', language: 'en' },
        ],
      },
    ],
  },
  {
    slug: 'toeic-basics',
    title: 'TOEIC Basics',
    description: 'Core TOEIC words for early practice.',
    sort_order: 20,
    topics: [
      {
        slug: 'registration-rules',
        title: 'Registration and Rules',
        description: 'Words related to sign-up and instructions.',
        sort_order: 1,
        words: [
          { word: 'register', transcription: '/ˈredʒɪstər/', word_type: 'verb', meaning: 'to sign up', example: 'You must register before the class starts.', example_vi: 'You must register before the class starts.', language: 'en' },
          { word: 'submit', transcription: '/səbˈmɪt/', word_type: 'verb', meaning: 'to send in', example: 'Submit the form by Friday.', example_vi: 'Submit the form by Friday.', language: 'en' },
          { word: 'require', transcription: '/rɪˈkwaɪər/', word_type: 'verb', meaning: 'to need', example: 'The job requires experience.', example_vi: 'The job requires experience.', language: 'en' },
          { word: 'policy', transcription: '/ˈpɑːləsi/', word_type: 'noun', meaning: 'a rule or plan', example: 'Read the company policy carefully.', example_vi: 'Read the company policy carefully.', language: 'en' },
          { word: 'deadline', transcription: '/ˈdedlaɪn/', word_type: 'noun', meaning: 'the final time to do something', example: 'The deadline is next Monday.', example_vi: 'The deadline is next Monday.', language: 'en' },
        ],
      },
      {
        slug: 'business-tasks',
        title: 'Business Tasks',
        description: 'Common office and work actions.',
        sort_order: 2,
        words: [
          { word: 'confirm', transcription: '/kənˈfɜːrm/', word_type: 'verb', meaning: 'to say that something is true', example: 'Please confirm the meeting time.', example_vi: 'Please confirm the meeting time.', language: 'en' },
          { word: 'deliver', transcription: '/dɪˈlɪvər/', word_type: 'verb', meaning: 'to bring to a place', example: 'The package will deliver today.', example_vi: 'The package will deliver today.', language: 'en' },
          { word: 'attend', transcription: '/əˈtend/', word_type: 'verb', meaning: 'to go to an event', example: 'She will attend the training session.', example_vi: 'She will attend the training session.', language: 'en' },
          { word: 'budget', transcription: '/ˈbʌdʒɪt/', word_type: 'noun', meaning: 'planned money for spending', example: 'We need to reduce the budget.', example_vi: 'We need to reduce the budget.', language: 'en' },
          { word: 'report', transcription: '/rɪˈpɔːrt/', word_type: 'noun', meaning: 'a written account', example: 'The manager reviewed the report.', example_vi: 'The manager reviewed the report.', language: 'en' },
        ],
      },
    ],
  },
];

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
        sort_order: course.sort_order,
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
      sort_order: course.sort_order,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
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
  for (const course of PUBLIC_COURSES) {
    const courseId = await ensureCourse(course);
    console.log(`  course: ${course.slug} (${courseId})`);

    for (const topic of course.topics) {
      const topicId = await ensureTopic(courseId, topic);
      console.log(`    topic: ${topic.slug} (${topicId})`);
      await insertWords(topicId, topic.words);
      console.log(`      words: ${topic.words.length}`);
    }
  }
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
};
