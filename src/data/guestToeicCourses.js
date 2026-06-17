import { TOEIC_BASIC_LESSONS_1_TO_50 } from "./toeicBasicLessons";

const VERY_EASY_TOEIC_TOPICS = [
  {
    id: "easy-lesson-1",
    title: "Lesson 1: Office Basics",
    description:
      "Tu vung TOEIC co ban ve van phong va giao tiep cong so cho nguoi moi bat dau.",
    words: [
      {
        id: "ve001",
        word: "contract",
        language: "en",
        transcription: "/'kɒntrækt/",
        mean: "hop dong",
        wordtype: "noun",
        example: "They signed a contract yesterday.",
        example_vi: "Ho da ky mot hop dong vao hom qua.",
      },
      {
        id: "ve002",
        word: "establish",
        language: "en",
        transcription: "/ɪˈstæblɪʃ/",
        mean: "thiet lap, thanh lap",
        wordtype: "verb",
        example: "The company was established in 2010.",
        example_vi: "Cong ty duoc thanh lap vao nam 2010.",
      },
      {
        id: "ve003",
        word: "determine",
        language: "en",
        transcription: "/dɪˈtɜːrmɪn/",
        mean: "xac dinh, quyet dinh",
        wordtype: "verb",
        example: "We need to determine the cause of the problem.",
        example_vi: "Chung ta can xac dinh nguyen nhan cua van de.",
      },
      {
        id: "ve004",
        word: "office",
        language: "en",
        transcription: "/ˈɒfɪs/",
        mean: "van phong",
        wordtype: "noun",
        example: "She works in a modern office.",
        example_vi: "Co ay lam viec trong mot van phong hien dai.",
      },
      {
        id: "ve005",
        word: "colleague",
        language: "en",
        transcription: "/ˈkɒliːɡ/",
        mean: "dong nghiep",
        wordtype: "noun",
        example: "My colleagues are very helpful.",
        example_vi: "Cac dong nghiep cua toi rat huu ich.",
      },
      {
        id: "ve006",
        word: "meeting",
        language: "en",
        transcription: "/ˈmiːtɪŋ/",
        mean: "cuoc hop",
        wordtype: "noun",
        example: "The meeting starts at 9 AM.",
        example_vi: "Cuoc hop bat dau luc 9 gio sang.",
      },
      {
        id: "ve007",
        word: "manager",
        language: "en",
        transcription: "/ˈmænɪdʒər/",
        mean: "quan ly",
        wordtype: "noun",
        example: "The manager approved the plan.",
        example_vi: "Nguoi quan ly da phe duyet ke hoach.",
      },
      {
        id: "ve008",
        word: "report",
        language: "en",
        transcription: "/rɪˈpɔːrt/",
        mean: "bao cao",
        wordtype: "noun",
        example: "Please submit your weekly report.",
        example_vi: "Vui long nop bao cao hang tuan cua ban.",
      },
      {
        id: "ve009",
        word: "schedule",
        language: "en",
        transcription: "/ˈʃedjuːl/",
        mean: "lich trinh",
        wordtype: "noun",
        example: "Check your schedule for tomorrow.",
        example_vi: "Kiem tra lich trinh cua ban cho ngay mai.",
      },
      {
        id: "ve010",
        word: "file",
        language: "en",
        transcription: "/faɪl/",
        mean: "tep, ho so",
        wordtype: "noun",
        example: "Please file these documents.",
        example_vi: "Vui long luu tru nhung tai lieu nay.",
      },
    ],
  },
  {
    id: "easy-lesson-2",
    title: "Lesson 2: Daily Operations",
    description:
      "Tu vung ve hoat dong va dich vu hang ngay trong doanh nghiep.",
    words: [
      {
        id: "ve011",
        word: "resolve",
        language: "en",
        transcription: "/rɪˈzɒlv/",
        mean: "giai quyet",
        wordtype: "verb",
        example: "They resolved the dispute quickly.",
        example_vi: "Ho da giai quyet tranh chap mot cach nhanh chong.",
      },
      {
        id: "ve012",
        word: "agree",
        language: "en",
        transcription: "/əˈɡriː/",
        mean: "dong y",
        wordtype: "verb",
        example: "We agree on the terms.",
        example_vi: "Chung toi dong y ve cac dieu khoan.",
      },
      {
        id: "ve013",
        word: "provide",
        language: "en",
        transcription: "/prəˈvaɪd/",
        mean: "cung cap",
        wordtype: "verb",
        example: "They provide financial services.",
        example_vi: "Ho cung cap dich vu tai chinh.",
      },
      {
        id: "ve014",
        word: "customer",
        language: "en",
        transcription: "/ˈkʌstəmər/",
        mean: "khach hang",
        wordtype: "noun",
        example: "The customer is always right.",
        example_vi: "Khach hang luon luon dung.",
      },
      {
        id: "ve015",
        word: "service",
        language: "en",
        transcription: "/ˈsɜːrvɪs/",
        mean: "dich vu",
        wordtype: "noun",
        example: "The service here is excellent.",
        example_vi: "Dich vu o day rat xuat sac.",
      },
      {
        id: "ve016",
        word: "phone",
        language: "en",
        transcription: "/foʊn/",
        mean: "dien thoai",
        wordtype: "noun",
        example: "Please answer the phone.",
        example_vi: "Vui long nghe dien thoai.",
      },
      {
        id: "ve017",
        word: "email",
        language: "en",
        transcription: "/ˈiːmeɪl/",
        mean: "thu dien tu",
        wordtype: "noun",
        example: "Send me an email with details.",
        example_vi: "Gui cho toi email voi cac chi tiet.",
      },
      {
        id: "ve018",
        word: "message",
        language: "en",
        transcription: "/ˈmesɪdʒ/",
        mean: "tin nhan",
        wordtype: "noun",
        example: "I left a message for him.",
        example_vi: "Toi da de lai tin nhan cho anh ay.",
      },
      {
        id: "ve019",
        word: "reply",
        language: "en",
        transcription: "/rɪˈplaɪ/",
        mean: "tra loi",
        wordtype: "verb",
        example: "Please reply to the email soon.",
        example_vi: "Vui long tra loi email som.",
      },
      {
        id: "ve020",
        word: "request",
        language: "en",
        transcription: "/rɪˈkwest/",
        mean: "yeu cau",
        wordtype: "noun",
        example: "We received your request.",
        example_vi: "Chung toi da nhan duoc yeu cau cua ban.",
      },
    ],
  },
  {
    id: "easy-lesson-3",
    title: "Lesson 3: Logistics and Events",
    description:
      "Tu vung ve logistics, chuan bi su kien va van chuyen co ban trong TOEIC.",
    words: [
      {
        id: "ve021",
        word: "cancel",
        language: "en",
        transcription: "/ˈkænsəl/",
        mean: "huy bo",
        wordtype: "verb",
        example: "The flight was canceled.",
        example_vi: "Chuyen bay da bi huy.",
      },
      {
        id: "ve022",
        word: "deliver",
        language: "en",
        transcription: "/dɪˈlɪvər/",
        mean: "giao hang",
        wordtype: "verb",
        example: "The package was delivered on time.",
        example_vi: "Goi hang duoc giao dung gio.",
      },
      {
        id: "ve023",
        word: "attend",
        language: "en",
        transcription: "/əˈtend/",
        mean: "tham du",
        wordtype: "verb",
        example: "She attended the conference.",
        example_vi: "Co ay da tham du hoi nghi.",
      },
      {
        id: "ve024",
        word: "prepare",
        language: "en",
        transcription: "/prɪˈper/",
        mean: "chuan bi",
        wordtype: "verb",
        example: "He prepared the presentation.",
        example_vi: "Anh ay da chuan bi bai thuyet trinh.",
      },
      {
        id: "ve025",
        word: "event",
        language: "en",
        transcription: "/ɪˈvent/",
        mean: "su kien",
        wordtype: "noun",
        example: "The event was a great success.",
        example_vi: "Su kien da rat thanh cong.",
      },
      {
        id: "ve026",
        word: "invite",
        language: "en",
        transcription: "/ɪnˈvaɪt/",
        mean: "moi",
        wordtype: "verb",
        example: "They invited all employees.",
        example_vi: "Ho da moi tat ca nhan vien.",
      },
      {
        id: "ve027",
        word: "guest",
        language: "en",
        transcription: "/ɡest/",
        mean: "khach moi",
        wordtype: "noun",
        example: "All guests must register.",
        example_vi: "Tat ca khach moi phai dang ky.",
      },
      {
        id: "ve028",
        word: "package",
        language: "en",
        transcription: "/ˈpækɪdʒ/",
        mean: "goi hang",
        wordtype: "noun",
        example: "The package arrived this morning.",
        example_vi: "Goi hang da den sang nay.",
      },
      {
        id: "ve029",
        word: "ship",
        language: "en",
        transcription: "/ʃɪp/",
        mean: "van chuyen",
        wordtype: "verb",
        example: "We ship to all countries.",
        example_vi: "Chung toi van chuyen den moi quoc gia.",
      },
      {
        id: "ve030",
        word: "venue",
        language: "en",
        transcription: "/ˈvenjuː/",
        mean: "dia diem to chuc",
        wordtype: "noun",
        example: "The venue can hold 500 people.",
        example_vi: "Dia diem co the chua 500 nguoi.",
      },
    ],
  },
];

function normalizeWords(words = []) {
  return words.map((word) => ({
    ...word,
    remembered: false,
  }));
}

function normalizeTopics(topics = []) {
  return topics.map((topic, index) => ({
    ...topic,
    slug: topic.slug || topic.id,
    sortOrder: topic.sortOrder || index + 1,
    wordCount: topic.words?.length || topic.wordCount || 0,
    vocabularyCount: topic.words?.length || topic.vocabularyCount || 0,
    words: normalizeWords(topic.words || []),
  }));
}

const GUEST_TOEIC_COURSE_MAP = {
  "toeic-very-easy": {
    id: "toeic-very-easy",
    slug: "toeic-very-easy",
    title: "Very Easy TOEIC Vocabulary",
    description:
      "Tu vung TOEIC cuc ky co ban danh cho guest user hoc ngay khong can dang nhap.",
    language: "en",
    lang: "en",
    sortOrder: 1,
    topics: normalizeTopics(VERY_EASY_TOEIC_TOPICS),
  },
  "toeic-basic": {
    id: "toeic-basic",
    slug: "toeic-basic",
    title: "600 Essential Words for the TOEIC",
    description:
      "Bo 50 chu de tu vung TOEIC cot loi de guest user co the hoc truc tiep va luu tien trinh ngay.",
    language: "en",
    lang: "en",
    sortOrder: 2,
    topics: normalizeTopics(TOEIC_BASIC_LESSONS_1_TO_50),
  },
};

export function isGuestReadyCourseId(courseId) {
  return Boolean(GUEST_TOEIC_COURSE_MAP[courseId]);
}

export function getGuestReadyCourseById(courseId) {
  const course = GUEST_TOEIC_COURSE_MAP[courseId];
  if (!course) return null;

  return {
    ...course,
    topics: normalizeTopics(course.topics),
  };
}

export function getGuestReadyCourseTopics(courseId) {
  const course = getGuestReadyCourseById(courseId);
  if (!course) return null;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    courseTitle: course.title,
    description: course.description,
    language: course.language,
    lang: course.lang,
    topics: normalizeTopics(course.topics),
  };
}

export function getGuestReadyCourseSummaries() {
  return Object.values(GUEST_TOEIC_COURSE_MAP)
    .map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      language: course.language,
      lang: course.lang,
      sortOrder: course.sortOrder,
      topic_count: course.topics.length,
      vocabulary_count: course.topics.reduce(
        (sum, topic) => sum + (topic.words?.length || 0),
        0,
      ),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function mergeGuestReadyCourses(courses = []) {
  const mergedMap = new Map();

  courses.forEach((course) => {
    const key = course.slug || course.id;
    mergedMap.set(key, course);
  });

  getGuestReadyCourseSummaries().forEach((course) => {
    mergedMap.set(course.slug, {
      ...mergedMap.get(course.slug),
      ...course,
    });
  });

  return Array.from(mergedMap.values()).sort((a, b) => {
    const aOrder = Number(a.sortOrder || a.sort_order || 9999);
    const bOrder = Number(b.sortOrder || b.sort_order || 9999);
    return aOrder - bOrder;
  });
}
