import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
import axiosClient from '../../utils/axiosClient';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { useCustomCourses } from '../../hooks/useCustomCourses';
import WordModal from '../../components/detailTopic/WordModal';
import AIGenModal from '../../components/detailTopic/AIGenModal';
import WordDetailOverlay from '../../components/detailTopic/WordDetailOverlay';
import TopicPickerModal from '../../components/detailTopic/TopicPickerModal';
import Flashcard from '../../components/Flashcard';
import Quiz from '../../components/Quiz';
import Listening from '../../components/Listening';
import Typing from '../../components/Typing';
import Match from '../../components/Match';
import { getDashboardUserKey, recordFlashcardSessionProgress, recordStudyModeCompletion } from '../../utils/dashboardProgress';
import { recordGamePlay } from '../../utils/userStats';
import { getSpeechLang } from '../../utils/studyModes';
import { addToSrs, removeFromSrs, reviewItem } from '../../utils/srsStorage';
import {
  hasServerFlashcardId,
  hasServerSrsAccess,
  mapReviewRatingToQualityScore,
  submitSrsReviewBatch,
} from '../../utils/srsApi';
import { xpStudyModeComplete } from '../../utils/xpSystem';
import { recordVocabularyActivity } from '../../utils/vocabActivityApi';

const SVG_ICONS = {
  VOICE: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M2 16.0001H5.88889L11.1834 20.3319C11.2727 20.405 11.3846 20.4449 11.5 20.4449C11.7761 20.4449 12 20.2211 12 19.9449V4.05519C12 3.93977 11.9601 3.8279 11.8871 3.73857C11.7129 3.52485 11.3991 3.49335 11.1854 3.66756L5.88889 8.00007H2C1.44772 8.00007 1 8.44778 1 9.00007V15.0001C1 15.5524 1.44772 16.0001 2 16.0001ZM23 12C23 15.292 21.5539 18.2463 19.2622 20.2622L17.8445 18.8444C19.7758 17.1937 21 14.7398 21 12C21 9.26016 19.7758 6.80629 17.8445 5.15557L19.2622 3.73779C21.5539 5.75368 23 8.70795 23 12ZM18 12C18 13.9004 17.2558 15.6248 16.0497 16.9003L14.6319 15.4826C15.4819 14.5699 16 13.3459 16 12C16 10.6541 15.4819 9.43013 14.6319 8.51742L16.0497 7.09966C17.2558 8.37516 18 10.0996 18 12Z" />
    </svg>
  ),
  CHEVRON: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z" />
    </svg>
  ),
  EDIT: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M15.7279 9.57629L14.3137 8.16207L5 17.4758V18.89H6.41421L15.7279 9.57629ZM17.1421 8.16207L18.5563 6.74786L17.1421 5.33365L15.7279 6.74786L17.1421 8.16207ZM7.24264 20.89H3V16.6474L16.435 3.21233C16.8256 2.8218 17.4587 2.8218 17.8492 3.21233L20.6777 6.04075C21.0682 6.43128 21.0682 7.06444 20.6777 7.45497L7.24264 20.89Z" />
    </svg>
  ),
  DELETE: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z" />
    </svg>
  ),
  BACK: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z" />
    </svg>
  ),
};

const VOCAB_GAMES = [
  { id: 'flashcard', name: 'Flashcard', icon: '🃏', desc: 'Lật thẻ, ôn lại từ nhanh chóng', color: '#8b5cf6' },
  { id: 'quiz', name: 'Trắc nghiệm', icon: '🎯', desc: '4 đáp án, chọn nghĩa đúng', color: '#6366f1' },
  { id: 'typing', name: 'Gõ từ', icon: '⌨️', desc: 'Nhìn nghĩa, gõ lại từ vựng', color: '#f59e0b' },
  { id: 'listen', name: 'Luyện nghe', icon: '🎧', desc: 'Nghe phát âm, điền lại từ', color: '#10b981' },
  { id: 'match', name: 'Nối từ', icon: '🔗', desc: 'Ghép từ vựng với nghĩa đúng', color: '#ec4899' },
];

const IMMERSIVE_MODES = new Set(['flashcard', 'quiz', 'listen', 'typing', 'match']);

function getWordKey(word) {
  return word.id ?? word.flashcardId;
}

function getCurrentStudyUserKey() {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    return getDashboardUserKey(storedUser);
  } catch {
    return 'guest';
  }
}

function trackStudySessionComplete(modeName) {
  if (!IMMERSIVE_MODES.has(modeName)) return;
  recordGamePlay(getCurrentStudyUserKey());
  xpStudyModeComplete(modeName);
  recordVocabularyActivity(modeName);
  const normalizedMode = modeName === 'listen' ? 'listen' : modeName;
  recordStudyModeCompletion(normalizedMode);
}

export default function TopicWords() {
  const { courseId: rawCourseId, topicId } = useParams();
  const { remembered, toggleWord, replaceRememberedInTopic } = useCourseProgress();
  const { customCourses, addWordToTopic, updateWordInTopic, deleteWordFromTopic, addManyWordsToTopic, createTopic } = useCustomCourses();

  const [isWordModalOpen, setWordModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [isAIModalOpen, setAIModalOpen] = useState(false);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [pickerWord, setPickerWord] = useState(null);
  const [pendingDeleteWord, setPendingDeleteWord] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const [studyWordIds, setStudyWordIds] = useState(null);
  const [builtInWords, setBuiltInWords] = useState([]);
  const [builtInStatus, setBuiltInStatus] = useState('idle');
  const [builtInError, setBuiltInError] = useState('');

  const courseId = rawCourseId || 'custom';
  const isCustom = courseId === 'custom';
  const useServerSrs = hasServerSrsAccess();

  // Fetch course info from API instead of static data
  const [courseInfo, setCourseInfo] = useState(null);
  const [courseLoading, setCourseLoading] = useState(!isCustom);
  useEffect(() => {
    if (isCustom) return;
    setCourseLoading(true);
    axiosClient.get(`/courses/${courseId}/topics`)
      .then((res) => {
        let data = res.data || res;
        if (data && data.data && !data.topics) data = data.data;
        setCourseInfo(data);
      })
      .catch((err) => {
        console.error("Fetch course info error:", err);
        setCourseInfo(null);
      })
      .finally(() => {
        setCourseLoading(false);
      });
  }, [isCustom, courseId]);

  const course = isCustom ? null : courseInfo;
  const topic = isCustom
    ? customCourses.find((item) => item.id === topicId)
    : (course?.topics || []).find((item) => item.slug === topicId || String(item.id) === String(topicId));

  const courseTitle = isCustom ? 'Tài liệu của bạn' : course?.courseTitle || course?.title || '';
  const topicTitle = topic?.title || '';
  const topicLang = isCustom ? topic?.lang || 'en' : course?.lang || 'en';
  const builtInTopicWords = !isCustom && topic ? (Array.isArray(topic.words) ? topic.words : []) : [];
  const words = isCustom
    ? topic?.words || []
    : (builtInStatus === 'success' && builtInWords.length > 0 ? builtInWords : builtInTopicWords);

  const topicError = isCustom
    ? (!topic ? 'Chủ đề không tồn tại.' : '')
    : (courseLoading ? '' : (!course ? 'Topic không tồn tại.' : (!topic ? 'Chủ đề không tồn tại.' : '')));

  useEffect(() => {
    if (isCustom) {
      setBuiltInWords([]);
      setBuiltInStatus('idle');
      setBuiltInError('');
      return undefined;
    }

    if (!topic) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadFlashcards() {
      setBuiltInStatus('loading');
      setBuiltInError('');

      try {
        const fetchId = topic?.slug || topicId;
        const res = await axiosClient.get(`/topics/${encodeURIComponent(fetchId)}/flashcards`);
        const data = res?.data || res;

        setBuiltInWords(Array.isArray(data) ? data : []);
        setBuiltInStatus('success');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setBuiltInWords([]);
        setBuiltInStatus('error');
        setBuiltInError(error.message || 'Không thể tải dữ liệu.');
      }
    }

    loadFlashcards();
    return () => controller.abort();
  }, [isCustom, topicId, topic]);

  const backUrl = isCustom ? '/dashboard/courses?tab=custom' : `/dashboard/courses/${courseId}`;

  if (courseLoading) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--gray-light, #64748b)' }}>
        Đang tải thông tin...
      </div>
    );
  }

  if (topicError) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>
        {topicError}
      </div>
    );
  }

  const speakWord = (text, language) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLang(language, topicLang);
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

const activeWords = !studyWordIds
      ? words
      : words.filter((word) => studyWordIds.includes(getWordKey(word)));

  const syncServerReviews = async (items) => {
    if (!useServerSrs || items.length === 0) return;
    try {
      await submitSrsReviewBatch(items);
    } catch (error) {
      console.error('Failed to sync review batch to server.', error);
    }
  };

  const handleSaveWord = (wordData) => {
    if (editingWord) updateWordInTopic(topicId, editingWord.id, wordData);
    else addWordToTopic(topicId, wordData);
  };

  const handleSaveAIWords = (selectedWords) => {
    addManyWordsToTopic(topicId, selectedWords);
  };

  const handleDeleteWord = (wordId) => {
    deleteWordFromTopic(topicId, wordId);
    setPendingDeleteWord(null);
  };

  const openWordModal = (wordObj = null) => {
    setEditingWord(wordObj);
    setWordModalOpen(true);
  };

  const saveRememberedWords = (selectedWordIds, targetWords = activeWords) => {
    replaceRememberedInTopic(targetWords.map((word) => getWordKey(word)), selectedWordIds);
  };

  const handleToggleWord = (wordId) => {
    const word = words.find((item) => getWordKey(item) === wordId);
    const wasRemembered = !!remembered[wordId];
    toggleWord(wordId);

    if (!wasRemembered && word) {
      if (useServerSrs && hasServerFlashcardId(word)) {
        void syncServerReviews([
          { flashcard_id: word.flashcardId, quality: mapReviewRatingToQualityScore('good') },
        ]);
      } else {
        addToSrs(word, topicId, courseId);
      }
      return;
    }

    if (!useServerSrs || !hasServerFlashcardId(word)) {
      removeFromSrs(wordId);
    }
  };

  const handleSaveFlashcard = async (selectedWordIds) => {
    const prevSet = new Set(activeWords.filter((word) => remembered[getWordKey(word)]).map((word) => getWordKey(word)));
    const newSet = new Set(selectedWordIds);
    const serverBatch = [];

    activeWords.forEach((word) => {
      const key = getWordKey(word);
      const isNowRemembered = newSet.has(key);
      const wasRemembered = prevSet.has(key);

      if (useServerSrs && hasServerFlashcardId(word)) {
        if (isNowRemembered && !wasRemembered) {
          serverBatch.push({ flashcard_id: word.flashcardId, quality: mapReviewRatingToQualityScore('good') });
        }
        if (!isNowRemembered && wasRemembered) {
          serverBatch.push({ flashcard_id: word.flashcardId, quality: mapReviewRatingToQualityScore('forgot') });
        }
        return;
      }

      if (isNowRemembered && !wasRemembered) addToSrs(word, topicId, courseId);
      if (!isNowRemembered && wasRemembered) removeFromSrs(key);
    });

    await syncServerReviews(serverBatch);
    saveRememberedWords(selectedWordIds);
    recordFlashcardSessionProgress();
  };

  const handleQuizComplete = async (correctWordIds, wrongWordIds) => {
    const correctSet = new Set(correctWordIds);
    const wrongSet = new Set(wrongWordIds);
    const serverBatch = [];

    activeWords.forEach((word) => {
      const key = getWordKey(word);

      if (useServerSrs && hasServerFlashcardId(word)) {
        if (correctSet.has(key)) {
          serverBatch.push({ flashcard_id: word.flashcardId, quality: mapReviewRatingToQualityScore('good') });
        } else if (wrongSet.has(key)) {
          serverBatch.push({ flashcard_id: word.flashcardId, quality: mapReviewRatingToQualityScore('forgot') });
        }
        return;
      }

      if (correctSet.has(key)) {
        addToSrs(word, topicId, courseId);
        reviewItem(key, 'good');
      } else if (wrongSet.has(key)) {
        addToSrs(word, topicId, courseId);
        reviewItem(key, 'forgot');
      }
    });

    await syncServerReviews(serverBatch);
    saveRememberedWords(correctWordIds);
  };

  const handleModeClick = (modeName) => {
    if (!isCustom && builtInStatus === 'loading' && !words.length) return;
    if (!words.length) return;

    setStudyWordIds(null);
    if (IMMERSIVE_MODES.has(modeName)) {
      setActiveMode(modeName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (activeMode === modeName) setActiveMode(null);
    else setActiveMode(modeName);
  };

  const initialLearnedWordIds = activeWords
    .filter((word) => remembered[getWordKey(word)])
    .map((word) => getWordKey(word));

  const studyModeProps = {
    topicLang,
    words: activeWords,
    allTopicWords: words,
    initialLearnedWordIds,
    onSessionComplete: () => trackStudySessionComplete(activeMode),
    onExit: () => {
      setActiveMode(null);
      setStudyWordIds(null);
    },
    onBackToTopic: () => {
      setActiveMode(null);
      setStudyWordIds(null);
    },
  };

  const handleStudyWrongWords = (wrongWordIds) => {
    setStudyWordIds(wrongWordIds);
    setActiveMode('flashcard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let modeView = null;
  if (activeMode === 'flashcard') {
    modeView = (
      <Flashcard
        {...studyModeProps}
        onSaveLearnedWords={handleSaveFlashcard}
        onStartQuiz={() => {
          setActiveMode('quiz');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  } else if (activeMode === 'quiz') {
    modeView = <Quiz {...studyModeProps} onSaveLearnedWords={handleQuizComplete} onStudyWrongWords={handleStudyWrongWords} />;
  } else if (activeMode === 'listen') {
    modeView = <Listening {...studyModeProps} onSaveLearnedWords={saveRememberedWords} />;
  } else if (activeMode === 'typing') {
    modeView = <Typing {...studyModeProps} onSaveLearnedWords={saveRememberedWords} />;
  } else if (activeMode === 'match') {
    modeView = <Match {...studyModeProps} onSaveLearnedWords={saveRememberedWords} />;
  }

  return (
    <main className={`dash-main cv-subview${isCustom ? ' cv-custom-mode' : ''}`} id="cv-words-view">
      <div className="cv-subview-header">
        <Link className="cv-breadcrumb-btn" to={backUrl}>
          {SVG_ICONS.BACK}
          <span id="cv-back-course-label">{courseTitle}</span>
        </Link>
        <span className="cv-breadcrumb-sep">&gt;</span>
        <span className="cv-breadcrumb-current" id="cv-topic-title">{topicTitle}</span>
      </div>

      {isCustom && !IMMERSIVE_MODES.has(activeMode) ? (
        <div id="cv-custom-toolbar" className="cv-custom-toolbar">
          <button className="btn btn-primary btn-small" id="cv-add-word-btn" onClick={() => openWordModal(null)}>
            + Thêm từ vựng
          </button>
          <button className="cv-btn-ai" id="cv-ai-gen-btn" onClick={() => setAIModalOpen(true)}>
            AI tạo từ hàng loạt
          </button>
        </div>
      ) : null}

      {modeView ? (
        modeView
      ) : (
        <>
          <section className="cv-modes-section">
            <div className="cv-modes-header">
              <h3 className="cv-section-title">Chọn cách học</h3>
            </div>
            <div className="games-vocab-grid" id="games-vocab-grid" style={{ marginTop: '16px', marginBottom: '24px' }}>
              {VOCAB_GAMES.map((game) => (
                <button
                  key={game.id}
                  className={`games-vocab-card${activeMode === game.id ? ' active' : ''}`}
                  id={`game-card-${game.id}`}
                  onClick={() => handleModeClick(game.id)}
                  style={{ '--game-color': game.color }}
                >
                  <span className="games-vocab-icon">{game.icon}</span>
                  <span className="games-vocab-name">{game.name}</span>
                  <span className="games-vocab-desc">{game.desc}</span>
                  <span className="games-vocab-play">Chơi ngay →</span>
                </button>
              ))}
            </div>
          </section>

          <div className="cv-stats-bar">
            <h3 className="cv-section-title cv-stats-title" id="cv-vocab-title">Danh sách từ vựng</h3>
            <span className="cv-stat">
              <span className="cv-stat-dot dot-total"></span>
              Tổng: <strong id="cv-total">{words.length}</strong> từ
            </span>
          </div>

          <section className="cv-vocab-section">
            {!isCustom && builtInStatus === 'loading' ? (
              <div style={{ padding: '18px 0', color: 'var(--gray-text)' }}>
                Đang tải dữ liệu từ vựng...
              </div>
            ) : null}

            <div className="cv-word-table">
              <div className="cv-word-table-head">
                <span>Từ vựng</span>
                <span>Phiên âm</span>
                <span>Nghĩa</span>
                <span>Loại từ</span>
                <span>Ví dụ</span>
                <span className="cv-col-actions">Hành động</span>
              </div>

              <div id="cv-word-rows">
                {words.map((word) => {
                  const wordKey = getWordKey(word);
                  const isDone = !!remembered[wordKey];

                  return (
                    <div
                      key={wordKey}
                      className={`cv-word-row${isDone ? ' cv-word-remembered' : ''}`}
                      id={`cv-row-${wordKey}`}
                      onClick={(event) => {
                        if (event.target.closest('button, label, input, a')) return;
                        setSelectedWord(word);
                        setDetailOpen(true);
                      }}
                    >
                      <div className="cv-cell cv-cell-word">
                        <div className="cv-word-main">
                          <strong className="cv-word-text">{word.word}</strong>
                          <span className="cv-row-chevron" aria-hidden="true">{SVG_ICONS.CHEVRON}</span>
                        </div>
                        <div className="cv-mobile-sub">
                          <button
                            className="cv-voice-btn"
                            title="Nghe phát âm"
                            onClick={(event) => {
                              event.stopPropagation();
                              speakWord(word.word, word.language || topicLang);
                            }}
                          >
                            {SVG_ICONS.VOICE}
                          </button>
                          <span className="cv-trans">{word.transcription || ''}</span>
                        </div>
                      </div>

                      <div className="cv-cell cv-cell-trans cv-cell-trans-desktop">
                        <span className="cv-trans">{word.transcription || ''}</span>
                        <button
                          className="cv-voice-btn cv-voice-desktop"
                          title="Nghe phát âm"
                          onClick={(event) => {
                            event.stopPropagation();
                            speakWord(word.word, word.language || topicLang);
                          }}
                        >
                          {SVG_ICONS.VOICE}
                        </button>
                      </div>

                      <div className="cv-cell cv-cell-mean">
                        <span className="cv-mean">{word.mean || ''}</span>
                      </div>

                      <div className="cv-cell cv-cell-type">
                        <span className="cv-type-badge">{word.wordtype || ''}</span>
                      </div>

                      <div className="cv-cell cv-cell-example">
                        <span className="cv-example">{word.example || ''}</span>
                      </div>

                      <div className="cv-cell cv-cell-actions">
                        {isCustom ? (
                          <>
                            <label className="cv-switch cv-actions-switch" title={isDone ? 'Đã thuộc' : 'Chưa thuộc'}>
                              <input
                                type="checkbox"
                                className="cv-switch-chk cv-switch-chk-extra"
                                checked={isDone}
                                onChange={() => handleToggleWord(wordKey)}
                              />
                              <span className="cv-switch-track"><span className="cv-switch-thumb"></span></span>
                            </label>
                            <button className="cv-action-btn cv-action-edit" title="Sửa từ" onClick={(event) => { event.stopPropagation(); openWordModal(word); }}>
                              {SVG_ICONS.EDIT}
                            </button>
                            <button
                              className="cv-action-btn cv-action-delete"
                              title="Xóa từ"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPendingDeleteWord(word);
                              }}
                            >
                              {SVG_ICONS.DELETE}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div id="cv-empty-words" className={`cv-words-empty${words.length > 0 ? ' cv-hidden' : ''}`}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>EMPTY</div>
                <p>Chưa có từ vựng nào.<br />Hãy thêm từ thủ công hoặc dùng AI tạo từ hàng loạt.</p>
              </div>
            </div>
          </section>
        </>
      )}

      <WordModal
        key={`${editingWord?.id || 'new'}-${isWordModalOpen ? 'open' : 'closed'}`}
        isOpen={isWordModalOpen}
        onClose={() => setWordModalOpen(false)}
        onSave={handleSaveWord}
        existingWord={editingWord}
      />

      <AIGenModal
        isOpen={isAIModalOpen}
        onClose={() => setAIModalOpen(false)}
        onSave={handleSaveAIWords}
        topicLang={topicLang}
      />

      <WordDetailOverlay
        isOpen={isDetailOpen}
        onClose={() => setDetailOpen(false)}
        word={selectedWord}
        topicLang={topicLang}
        showAddBtn={!isCustom}
        onAdd={(word) => {
          setDetailOpen(false);
          setPickerWord(word);
        }}
        onAskAI={(word) => {
          setDetailOpen(false);
          const parts = [];
          parts.push(`Hãy giải thích chi tiết cho tôi về từ "${word.word}"`);
          if (word.transcription) parts.push(`(phiên âm: ${word.transcription})`);
          if (word.mean) parts.push(`- nghĩa: "${word.mean}"`);
          if (word.wordtype) parts.push(`- loại từ: ${word.wordtype}`);
          if (word.example) parts.push(`- ví dụ: "${word.example}"`);
          parts.push('. Bao gồm: cách dùng chi tiết, các nghĩa khác nếu có, thêm ví dụ thực tế, từ đồng nghĩa/trái nghĩa, và mẹo ghi nhớ.');
          window.dispatchEvent(new CustomEvent('pkaAskAI', { detail: { message: parts.join(' ') } }));
        }}
      />

      {pickerWord ? (
        <TopicPickerModal
          isOpen={!!pickerWord}
          onClose={() => setPickerWord(null)}
          word={pickerWord}
          customCourses={customCourses}
          onAdd={(targetTopicId, newWordObj) => {
            addWordToTopic(targetTopicId, newWordObj);
            setPickerWord(null);
          }}
          onCreateTopic={(topicData) => createTopic(topicData)}
        />
      ) : null}

      <ConfirmActionModal
        isOpen={Boolean(pendingDeleteWord)}
        onClose={() => setPendingDeleteWord(null)}
        onConfirm={() => handleDeleteWord(pendingDeleteWord.id)}
        title="Xác nhận xóa từ"
        message={pendingDeleteWord ? `Bạn có chắc muốn xóa từ "${pendingDeleteWord.word}" không?` : ''}
        confirmLabel="Xóa từ"
      />
    </main>
  );
}
