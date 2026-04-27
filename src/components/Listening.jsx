import { useEffect, useMemo, useRef, useState } from 'react';
import StudyCompletionPanel from './studyModes/StudyCompletionPanel';
import {
    buildTypingQuestions,
    buildHintMask,
    getInitialRememberedSelection,
    getNextHintState,
    getSpeechLang,
    maskWordInExample,
    normalizeTypingAnswer,
} from '../utils/studyModes';

const EXIT_CLICK_SELECTOR = '.topbar, .sidebar, .mobile-nav, .sidebar-overlay';
const MAX_HINT_LEVEL = 4;
const MAX_EXAMPLE_VIEWS = 1;

const ARROW_LEFT_ICON = (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 6l-6 6 6 6" />
    </svg>
);

const ARROW_RIGHT_ICON = (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6-6 6" />
    </svg>
);

const SPEAKER_ICON = (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18 6a8.5 8.5 0 0 1 0 12" />
    </svg>
);

function getEmptyAttempt() {
    return {
        typedValue: '',
        isChecked: false,
        isCorrect: false,
        hintLevel: 0,
        revealedIndices: [],
        exampleViewCount: 0,
        isExampleVisible: false,
    };
}

function createDraftRememberedSelection(questions, attemptsByWordId, initialLearnedWordIds) {
    const initialIds = new Set(initialLearnedWordIds);

    questions.forEach((question) => {
        if (attemptsByWordId[question.wordId]?.isCorrect) {
            initialIds.add(question.wordId);
        }
    });

    return Array.from(initialIds);
}

export default function Listening({
    topicLang = 'en',
    words,
    initialLearnedWordIds = [],
    onSaveLearnedWords,
    onExit,
    onBackToTopic,
}) {
    const [questions, setQuestions] = useState(() => buildTypingQuestions(words));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [attemptsByWordId, setAttemptsByWordId] = useState({});
    const [selectedWordIds, setSelectedWordIds] = useState(() => getInitialRememberedSelection(words, initialLearnedWordIds));
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const inputRef = useRef(null);
    const sessionLockedRef = useRef(false);

    useEffect(() => {
        setQuestions(buildTypingQuestions(words));
        setCurrentIndex(0);
        setAttemptsByWordId({});
        setSelectedWordIds(getInitialRememberedSelection(words, initialLearnedWordIds));
        setIsCompleted(false);
        setIsSaved(false);
        sessionLockedRef.current = false;
    }, [words, initialLearnedWordIds]);

    useEffect(() => {
        if (!words.length) return undefined;

        const handleExitClick = (event) => {
            if (sessionLockedRef.current) return;
            if (!event.target.closest(EXIT_CLICK_SELECTOR)) return;
            onExit?.();
        };

        document.addEventListener('pointerdown', handleExitClick, true);
        return () => document.removeEventListener('pointerdown', handleExitClick, true);
    }, [onExit, words.length]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (!isCompleted) {
            inputRef.current?.focus();
        }
    }, [currentIndex, isCompleted]);

    const totalQuestions = questions.length;
    const currentQuestion = questions[currentIndex];
    const currentAttempt = currentQuestion ? (attemptsByWordId[currentQuestion.wordId] || getEmptyAttempt()) : getEmptyAttempt();
    const answeredCount = Object.values(attemptsByWordId).filter((attempt) => attempt.isChecked).length;
    const correctCount = Object.values(attemptsByWordId).filter((attempt) => attempt.isCorrect).length;
    const progressLabel = totalQuestions ? `${currentIndex + 1}/${totalQuestions}` : '0/0';
    const remainingHints = Math.max(0, MAX_HINT_LEVEL - currentAttempt.hintLevel);

    const maskedExample = useMemo(() => {
        if (!currentQuestion) return '';
        return maskWordInExample(currentQuestion.word.example || '', currentQuestion.word.word || '');
    }, [currentQuestion]);

    const currentHintMask = useMemo(() => {
        if (!currentQuestion || currentAttempt.hintLevel === 0) return '';
        return buildHintMask(currentQuestion.word.word || '', currentAttempt.revealedIndices || []);
    }, [currentQuestion, currentAttempt.hintLevel, currentAttempt.revealedIndices]);

    const toggleSelectedWord = (wordId) => {
        setSelectedWordIds((prev) => (
            prev.includes(wordId)
                ? prev.filter((id) => id !== wordId)
                : [...prev, wordId]
        ));
    };

    const updateAttempt = (wordId, updater) => {
        setAttemptsByWordId((prev) => {
            const current = prev[wordId] || getEmptyAttempt();
            return {
                ...prev,
                [wordId]: updater(current),
            };
        });
    };

    const speakCurrentWord = () => {
        if (!currentQuestion?.word || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentQuestion.word.word);
        utterance.lang = getSpeechLang(currentQuestion.word.language, topicLang);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const handleInputChange = (event) => {
        if (!currentQuestion || currentAttempt.isChecked) return;
        const nextValue = event.target.value;
        updateAttempt(currentQuestion.wordId, (attempt) => ({
            ...attempt,
            typedValue: nextValue,
        }));
    };

    const handleCheck = () => {
        if (!currentQuestion || currentAttempt.isChecked) return;
        const normalizedInput = normalizeTypingAnswer(currentAttempt.typedValue);
        if (!normalizedInput) return;

        const normalizedAnswer = normalizeTypingAnswer(currentQuestion.word.word);
        const isCorrect = normalizedInput === normalizedAnswer;

        updateAttempt(currentQuestion.wordId, (attempt) => ({
            ...attempt,
            isChecked: true,
            isCorrect,
        }));
    };

    const handleHint = () => {
        if (!currentQuestion || currentAttempt.isChecked || currentAttempt.hintLevel >= MAX_HINT_LEVEL) return;

        const nextHint = getNextHintState(
            currentQuestion.word.word || '',
            currentAttempt.revealedIndices || [],
            currentAttempt.hintLevel || 0,
        );

        updateAttempt(currentQuestion.wordId, (attempt) => ({
            ...attempt,
            hintLevel: nextHint.hintLevel,
            revealedIndices: nextHint.revealedIndices,
        }));
    };

    const handleToggleExample = () => {
        if (!currentQuestion || currentAttempt.isChecked || currentAttempt.exampleViewCount >= MAX_EXAMPLE_VIEWS) return;

        updateAttempt(currentQuestion.wordId, (attempt) => ({
            ...attempt,
            exampleViewCount: 1,
            isExampleVisible: true,
        }));
    };

    const handlePrevious = () => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
    };

    const handleComplete = () => {
        const nextSelection = createDraftRememberedSelection(questions, attemptsByWordId, initialLearnedWordIds);
        setSelectedWordIds(getInitialRememberedSelection(words, nextSelection));
        setIsCompleted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePlayAgain = () => {
        setQuestions(buildTypingQuestions(words));
        setCurrentIndex(0);
        setAttemptsByWordId({});
        setSelectedWordIds(getInitialRememberedSelection(words, initialLearnedWordIds));
        setIsCompleted(false);
        setIsSaved(false);
        sessionLockedRef.current = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = () => {
        onSaveLearnedWords?.(selectedWordIds);
        setIsSaved(true);
        sessionLockedRef.current = true;
        onBackToTopic?.();
    };

    const handleInputKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleCheck();
        }
    };

    if (!words.length) {
        return (
            <section className="flashcard-shell listening-shell">
                <div className="flashcard-empty">
                    <h3>Topic này chưa có từ vựng</h3>
                    <p>Hãy thêm từ vựng trước khi bắt đầu listening.</p>
                    <button type="button" className="btn btn-secondary" onClick={onBackToTopic}>
                        Quay lại
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="flashcard-shell listening-shell">
            <div className="flashcard-header-meta">
                <div className="flashcard-progress">
                    <span>Tiến độ:</span>
                    <strong>{isCompleted ? `${totalQuestions}/${totalQuestions}` : progressLabel}</strong>
                </div>
                <div className="flashcard-header-actions">
                    <button type="button" className="btn btn-secondary flashcard-header-btn" onClick={handlePlayAgain}>
                        Làm lại
                    </button>
                    <button type="button" className="btn btn-secondary flashcard-header-btn" onClick={onBackToTopic}>
                        Thoát
                    </button>
                </div>
            </div>

            {!isCompleted ? (
                <>
                    <div className="listening-stage">
                        <div className="listening-card">
                            <div className="listening-card-main">
                                <div className="listening-topline-row">
                                    <span className="listening-topline">Listening</span>
                                    <span className="listening-substat">Đã check {answeredCount}/{totalQuestions}</span>
                                </div>

                                <div className="listening-prompt-card">
                                    <span className="listening-prompt-label">Nghe và điền lại</span>
                                    <h3>Hãy nghe phát âm và nhập lại đúng từ vừa nghe</h3>
                                    <p>Bạn có {MAX_HINT_LEVEL} lượt gợi ý mỗi câu và chỉ được xem ví dụ 1 lần cho mỗi câu.</p>
                                </div>

                                <div className="listening-tool-row">
                                    <button
                                        type="button"
                                        className="btn btn-primary flashcard-action-btn flashcard-action-btn-icon"
                                        onClick={speakCurrentWord}
                                        aria-label="Nghe phát âm"
                                    >
                                        {SPEAKER_ICON} Nghe
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary listening-helper-btn"
                                        onClick={handleHint}
                                        disabled={currentAttempt.isChecked || remainingHints === 0}
                                    >
                                        Gợi ý ({remainingHints})
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary listening-helper-btn"
                                        onClick={handleToggleExample}
                                        disabled={currentAttempt.isChecked || currentAttempt.exampleViewCount >= MAX_EXAMPLE_VIEWS}
                                    >
                                        Xem ví dụ
                                    </button>
                                </div>

                                <div className="listening-answer-box">
                                    <label className="listening-input-label" htmlFor="listening-answer-input">Nhập đáp án</label>
                                    <div className="listening-input-row">
                                        <input
                                            id="listening-answer-input"
                                            ref={inputRef}
                                            type="text"
                                            className="listening-answer-input"
                                            value={currentAttempt.typedValue}
                                            onChange={handleInputChange}
                                            onKeyDown={handleInputKeyDown}
                                            disabled={currentAttempt.isChecked}
                                            autoComplete="off"
                                            spellCheck="false"
                                            placeholder="Nhập từ bạn vừa nghe"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary listening-check-btn"
                                            onClick={handleCheck}
                                            disabled={currentAttempt.isChecked || !normalizeTypingAnswer(currentAttempt.typedValue)}
                                        >
                                            Check
                                        </button>
                                    </div>
                                </div>

                                <div className="listening-support-grid">
                                    <div className="listening-support-card">
                                        <span className="listening-support-label">Gợi ý</span>
                                        <div className="listening-hint-mask">{currentHintMask || 'Chưa dùng gợi ý'}</div>
                                    </div>

                                    <div className="listening-support-card">
                                        <span className="listening-support-label">Ví dụ</span>
                                        <div className={`listening-example-copy${currentAttempt.isExampleVisible ? '' : ' is-muted'}`}>
                                            {currentAttempt.isExampleVisible
                                                ? (maskedExample || 'Chưa có ví dụ phù hợp để hiển thị.')
                                                : 'Nhấn "Xem ví dụ" để mở ví dụ có ẩn từ khóa.'}
                                        </div>
                                    </div>
                                </div>

                                {currentAttempt.isChecked ? (
                                    <div className={`listening-feedback${currentAttempt.isCorrect ? ' is-correct' : ' is-wrong'}`}>
                                        <strong>{currentAttempt.isCorrect ? 'Chính xác' : 'Chưa đúng'}</strong>
                                        <span>
                                            {currentAttempt.isCorrect
                                                ? `Bạn đã nhập đúng: ${currentQuestion.word.word}`
                                                : `Đáp án đúng là ${currentQuestion.word.word}`}
                                        </span>
                                        {currentQuestion.word.transcription ? <span>Phiên âm: {currentQuestion.word.transcription}</span> : null}
                                        {currentQuestion.word.mean ? <span>Nghĩa: {currentQuestion.word.mean}</span> : null}
                                    </div>
                                ) : (
                                    <div className="listening-feedback listening-feedback-pending">
                                        <strong>Mời nghe và nhập lại</strong>
                                        <span>Sau khi bấm Check, câu trả lời sẽ được khóa.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="listening-actions">
                        <button type="button" className="btn btn-primary flashcard-action-btn" onClick={handlePrevious} disabled={currentIndex === 0}>
                            <span className="flashcard-nav-icon">{ARROW_LEFT_ICON}</span>
                            <span>TRƯỚC</span>
                        </button>
                        {currentIndex === totalQuestions - 1 ? (
                            <button type="button" className="btn btn-primary flashcard-action-btn" onClick={handleComplete} disabled={!currentAttempt.isChecked}>
                                <span>Xem kết quả</span>
                            </button>
                        ) : (
                            <button type="button" className="btn btn-primary flashcard-action-btn" onClick={handleNext} disabled={!currentAttempt.isChecked}>
                                <span>Tiếp</span>
                                <span className="flashcard-nav-icon">{ARROW_RIGHT_ICON}</span>
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <StudyCompletionPanel
                    summary={<><strong>Tổng kết:</strong> Bạn gõ đúng {correctCount}/{totalQuestions} câu và đã đánh dấu thuộc {selectedWordIds.length} từ.</>}
                    metrics={[
                        { label: 'Số câu đúng', value: `${correctCount}/${totalQuestions}` },
                        { label: 'Tỉ lệ', value: `${Math.round((correctCount / totalQuestions) * 100)}%` },
                    ]}
                    title="Xác nhận lại danh sách từ đã thuộc sau listening"
                    words={words}
                    selectedWordIds={selectedWordIds}
                    onToggleWord={toggleSelectedWord}
                    onPlayAgain={handlePlayAgain}
                    onSave={handleSave}
                    isSaved={isSaved}
                />
            )}
        </section>
    );
}
