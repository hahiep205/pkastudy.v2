import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coursesData } from '../../data/coursesData';
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
import { recordFlashcardSessionProgress } from '../../utils/dashboardProgress';
import { getSpeechLang } from '../../utils/studyModes';

const SVG_ICONS = {
    VOICE_SM: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
            <path d="M2 16.0001H5.88889L11.1834 20.3319C11.2727 20.405 11.3846 20.4449 11.5 20.4449C11.7761 20.4449 12 20.2211 12 19.9449V4.05519C12 3.93977 11.9601 3.8279 11.8871 3.73857C11.7129 3.52485 11.3991 3.49335 11.1854 3.66756L5.88889 8.00007H2C1.44772 8.00007 1 8.44778 1 9.00007V15.0001C1 15.5524 1.44772 16.0001 2 16.0001ZM23 12C23 15.292 21.5539 18.2463 19.2622 20.2622L17.8445 18.8444C19.7758 17.1937 21 14.7398 21 12C21 9.26016 19.7758 6.80629 17.8445 5.15557L19.2622 3.73779C21.5539 5.75368 23 8.70795 23 12ZM18 12C18 13.9004 17.2558 15.6248 16.0497 16.9003L14.6319 15.4826C15.4819 14.5699 16 13.3459 16 12C16 10.6541 15.4819 9.43013 14.6319 8.51742L16.0497 7.09966C17.2558 8.37516 18 10.0996 18 12Z" />
        </svg>
    ),
    VOICE_MD: (
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

const MODES = [
    { mode: 'flashcard', name: 'Flashcard', desc: 'Lật thẻ, nhớ từ nhanh' },
    { mode: 'quiz', name: 'Quiz', desc: '4 đáp án, chọn đúng' },
    { mode: 'listen', name: 'Listening', desc: 'Nghe và điền lại từ' },
    { mode: 'typing', name: 'Typing', desc: 'Nhìn nghĩa và gõ lại từ' },
    { mode: 'match', name: 'Match', desc: 'Nối từ với nghĩa đúng' },
];

const IMMERSIVE_MODES = new Set(['flashcard', 'quiz', 'listen', 'typing', 'match']);

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
    const [activeMode, setActiveMode] = useState(null);

    const courseId = rawCourseId || 'custom';
    const isCustom = courseId === 'custom';

    let courseTitle = '';
    let topicTitle = '';
    let topicLang = 'en';
    let words = [];

    if (isCustom) {
        courseTitle = 'Tài liệu của bạn';
        const topic = customCourses.find((item) => item.id === topicId);
        if (!topic) return <div>Chủ đề không tồn tại</div>;
        topicTitle = topic.title;
        topicLang = topic.lang || 'en';
        words = topic.words;
    } else {
        const course = coursesData[courseId];
        if (!course) return <div>Khóa học không tồn tại</div>;
        courseTitle = course.title;
        const topic = course.topics.find((item) => item.id === topicId);
        if (!topic) return <div>Chủ đề không tồn tại</div>;
        topicTitle = topic.title;
        topicLang = course.lang || 'en';
        words = topic.words;
    }

    const backUrl = isCustom ? '/dashboard/courses?tab=custom' : `/dashboard/courses/${courseId}`;

    const handleSaveWord = (wordData) => {
        if (editingWord) {
            updateWordInTopic(topicId, editingWord.id, wordData);
        } else {
            addWordToTopic(topicId, wordData);
        }
    };

    const handleSaveAIWords = (selectedWords) => {
        addManyWordsToTopic(topicId, selectedWords);
    };

    const openWordModal = (wordObj = null) => {
        setEditingWord(wordObj);
        setWordModalOpen(true);
    };

    const speakWord = (text, langStr) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = getSpeechLang(langStr, topicLang);
        ut.rate = 0.85;
        window.speechSynthesis.speak(ut);
    };

    const handleModeClick = (modeName) => {
        if (IMMERSIVE_MODES.has(modeName)) {
            setActiveMode(modeName);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (activeMode === modeName) {
            setActiveMode(null);
        } else {
            setActiveMode(modeName);
            setTimeout(() => {
                document.getElementById('cv-mode-area')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 80);
        }
    };

    const saveRememberedWords = (selectedWordIds) => {
        replaceRememberedInTopic(words.map((word) => word.id), selectedWordIds);
    };

    const handleSaveFlashcard = (selectedWordIds) => {
        saveRememberedWords(selectedWordIds);
        recordFlashcardSessionProgress();
    };

    const doneCount = words.filter((word) => remembered[word.id]).length;
    const initialLearnedWordIds = words.filter((word) => remembered[word.id]).map((word) => word.id);

    const studyModeProps = {
        topicLang,
        words,
        initialLearnedWordIds,
        onExit: () => setActiveMode(null),
        onBackToTopic: () => setActiveMode(null),
    };

    let modeView = null;

    if (activeMode === 'flashcard') {
        modeView = <Flashcard {...studyModeProps} onSaveLearnedWords={handleSaveFlashcard} />;
    } else if (activeMode === 'quiz') {
        modeView = <Quiz {...studyModeProps} onSaveLearnedWords={saveRememberedWords} />;
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

            {isCustom && !IMMERSIVE_MODES.has(activeMode) && (
                <div id="cv-custom-toolbar" className="cv-custom-toolbar">
                    <button className="btn btn-primary btn-small" id="cv-add-word-btn" onClick={() => openWordModal(null)}>+ Thêm từ vựng</button>
                    <button className="cv-btn-ai" id="cv-ai-gen-btn" onClick={() => setAIModalOpen(true)}>✨ AI tạo từ hàng loạt</button>
                </div>
            )}

            {modeView ? (
                modeView
            ) : (
                <>
                    <section className="cv-modes-section">
                        <h3 className="cv-section-title">Chọn cách học</h3>
                        <div className="cv-modes-grid" id="cv-modes-grid">
                            {MODES.map(({ mode, icon, name, desc }) => (
                                <button
                                    key={mode}
                                    className={`cv-mode-card${activeMode === mode ? ' active' : ''}`}
                                    data-mode={mode}
                                    onClick={() => handleModeClick(mode)}
                                >
                                    <div className="cv-mode-card-icon">{icon}</div>
                                    <div className="cv-mode-card-name">{name}</div>
                                    <div className="cv-mode-card-desc">{desc}</div>
                                    {!IMMERSIVE_MODES.has(mode) ? <span className="cv-soon-badge">Sắp có</span> : null}
                                </button>
                            ))}
                        </div>
                    </section>

                    <div id="cv-mode-area" className={activeMode ? '' : 'cv-hidden'}>
                        {activeMode && (
                            <div className="cv-coming-soon">
                                <div className="cv-cs-icon">Coming soon..</div>
                                <h3>Đang phát triển</h3>
                                <p>Chế độ <strong>{MODES.find((item) => item.mode === activeMode)?.name}</strong> sẽ sớm ra mắt.<br />Theo dõi các cập nhật của pkastudy nhé.</p>
                            </div>
                        )}
                    </div>

                    <div className="cv-stats-bar">
                        <span className="cv-stat"><span className="cv-stat-dot dot-total"></span>Tổng: <strong id="cv-total">{words.length}</strong> từ</span>
                        <span className="cv-stat"><span className="cv-stat-dot dot-done"></span>Đã thuộc: <strong id="cv-done">{doneCount}</strong></span>
                        <span className="cv-stat"><span className="cv-stat-dot dot-left"></span>Chưa thuộc: <strong id="cv-left">{words.length - doneCount}</strong></span>
                    </div>

                    <section className="cv-vocab-section">
                        <h3 className="cv-section-title" id="cv-vocab-title">Danh sách từ vựng</h3>
                        <div className="cv-word-table">
                            <div className="cv-word-table-head">
                                <span>Từ vựng</span>
                                <span>Phiên âm</span>
                                <span>Nghĩa</span>
                                <span>Loại từ</span>
                                <span>Ví dụ</span>
                                <span>Đã thuộc</span>
                                <span className="cv-col-actions">Hành động</span>
                            </div>

                            <div id="cv-word-rows">
                                {words.map((w) => {
                                    const isDone = !!remembered[w.id];
                                    return (
                                        <div
                                            key={w.id}
                                            className={`cv-word-row${isDone ? ' cv-word-remembered' : ''}`}
                                            id={`cv-row-${w.id}`}
                                            onClick={(event) => {
                                                if (event.target.closest('button, label, input, a')) return;
                                                setSelectedWord(w);
                                                setDetailOpen(true);
                                            }}
                                        >
                                            <div className="cv-cell cv-cell-word">
                                                <div className="cv-word-main">
                                                    <strong className="cv-word-text">{w.word}</strong>
                                                    <span className="cv-row-chevron" aria-hidden="true">{SVG_ICONS.CHEVRON}</span>
                                                </div>
                                                <div className="cv-mobile-sub">
                                                    <button className="cv-voice-btn" title="Nghe phat am" onClick={(event) => { event.stopPropagation(); speakWord(w.word, w.language || topicLang); }}>
                                                        {SVG_ICONS.VOICE_SM}
                                                    </button>
                                                    <span className="cv-trans">{w.transcription || ''}</span>
                                                </div>
                                            </div>

                                            <div className="cv-cell cv-cell-trans cv-cell-trans-desktop">
                                                <span className="cv-trans">{w.transcription || ''}</span>
                                                <button className="cv-voice-btn cv-voice-desktop" title="Nghe phát âm" onClick={(event) => { event.stopPropagation(); speakWord(w.word, w.language || topicLang); }}>
                                                    {SVG_ICONS.VOICE_MD}
                                                </button>
                                            </div>

                                            <div className="cv-cell cv-cell-mean">
                                                <span className="cv-mean">{w.mean || ''}</span>
                                            </div>

                                            <div className="cv-cell cv-cell-type">
                                                <span className="cv-type-badge">{w.wordtype || ''}</span>
                                            </div>

                                            <div className="cv-cell cv-cell-example">
                                                <span className="cv-example">{w.example || ''}</span>
                                            </div>

                                            <div className="cv-cell cv-cell-remember">
                                                <label className="cv-switch" title={isDone ? 'Đã thuộc' : 'Chưa thuộc'}>
                                                    <input
                                                        type="checkbox"
                                                        className="cv-switch-chk"
                                                        checked={isDone}
                                                        onChange={() => toggleWord(w.id)}
                                                    />
                                                    <span className="cv-switch-track"><span className="cv-switch-thumb"></span></span>
                                                </label>
                                            </div>

                                            <div className="cv-cell cv-cell-actions">
                                                {isCustom ? (
                                                    <>
                                                        <label className="cv-switch cv-actions-switch" title={isDone ? 'Đã thuộc' : 'Chưa thuộc'}>
                                                            <input
                                                                type="checkbox"
                                                                className="cv-switch-chk cv-switch-chk-extra"
                                                                checked={isDone}
                                                                onChange={() => toggleWord(w.id)}
                                                            />
                                                            <span className="cv-switch-track"><span className="cv-switch-thumb"></span></span>
                                                        </label>
                                                        <button className="cv-action-btn cv-action-edit" title="Sửa từ" onClick={(event) => { event.stopPropagation(); openWordModal(w); }}>
                                                            {SVG_ICONS.EDIT}
                                                        </button>
                                                        <button className="cv-action-btn cv-action-delete" title="Xóa từ" onClick={(event) => {
                                                            event.stopPropagation();
                                                            if (window.confirm(`Xóa từ \"${w.word}\"?`)) deleteWordFromTopic(topicId, w.id);
                                                        }}>
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
                                <p>Chưa có từ vựng nào.<br />Hãy thêm từ thủ công hoặc dùng AI tạo từ hàng lọat.</p>
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
                    parts.push(`Hãy giải thích chi tiết cho tôi về từ \"${word.word}\"`);
                    if (word.transcription) parts.push(`(phiên âm: ${word.transcription})`);
                    if (word.mean) parts.push(`- nghĩa: \"${word.mean}\"`);
                    if (word.wordtype) parts.push(`- loại từ: ${word.wordtype}`);
                    if (word.example) parts.push(`- ví dụ: \"${word.example}\"`);
                    parts.push('. Bao gồm: cách dùng chi tiết, các nghĩa khác (nếu có), thêm ví dụ thực tế, tự đồng nghĩa/trái nghĩa, và mẹo ghi nhớ.');
                    window.dispatchEvent(new CustomEvent('pkaAskAI', { detail: { message: parts.join(' ') } }));
                }}
            />
            {pickerWord && (
                <TopicPickerModal
                    isOpen={!!pickerWord}
                    onClose={() => setPickerWord(null)}
                    word={pickerWord}
                    customCourses={customCourses}
                    onAdd={(targetTopicId, newWordObj) => {
                        addWordToTopic(targetTopicId, newWordObj);
                        alert(`Đã thêm \"${newWordObj.word}\" vào danh sách!`);
                        setPickerWord(null);
                    }}
                    onCreateTopic={(topicData) => {
                        createTopic(topicData);
                    }}
                />
            )}
        </main>
    );
}
