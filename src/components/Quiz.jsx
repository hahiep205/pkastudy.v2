import { useEffect, useRef, useState } from 'react';
import StudyCompletionPanel from './studyModes/StudyCompletionPanel';
import { buildQuizQuestions, getInitialRememberedSelection, getSpeechLang } from '../utils/studyModes';

const EXIT_CLICK_SELECTOR = '.topbar, .sidebar, .mobile-nav, .sidebar-overlay';

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

function createDraftRememberedSelection(questions, answersByWordId, initialLearnedWordIds) {
    const initialIds = new Set(initialLearnedWordIds);

    questions.forEach((question) => {
        if (answersByWordId[question.wordId]?.isCorrect) {
            initialIds.add(question.wordId);
        }
    });

    return Array.from(initialIds);
}

export default function Quiz({
    topicLang = 'en',
    words,
    initialLearnedWordIds = [],
    onSaveLearnedWords,
    onExit,
    onBackToTopic,
}) {
    const [questions, setQuestions] = useState(() => buildQuizQuestions(words));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answersByWordId, setAnswersByWordId] = useState({});
    const [selectedWordIds, setSelectedWordIds] = useState(() => getInitialRememberedSelection(words, initialLearnedWordIds));
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const sessionLockedRef = useRef(false);

    useEffect(() => {
        setQuestions(buildQuizQuestions(words));
        setCurrentIndex(0);
        setAnswersByWordId({});
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

    const totalQuestions = questions.length;
    const currentQuestion = questions[currentIndex];
    const currentAnswer = currentQuestion ? answersByWordId[currentQuestion.wordId] : null;
    const answeredCount = Object.keys(answersByWordId).length;
    const correctCount = Object.values(answersByWordId).filter((answer) => answer.isCorrect).length;
    const progressLabel = totalQuestions ? `${currentIndex + 1}/${totalQuestions}` : '0/0';
    const hasEnoughWords = words.length >= 4;
    const hasFullChoiceSet = questions.every((question) => question.choices.length === 4);

    const toggleSelectedWord = (wordId) => {
        setSelectedWordIds((prev) => (
            prev.includes(wordId)
                ? prev.filter((id) => id !== wordId)
                : [...prev, wordId]
        ));
    };

    const speakCurrentWord = () => {
        if (!currentQuestion?.word || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentQuestion.word.word);
        utterance.lang = getSpeechLang(currentQuestion.word.language, topicLang);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const handleSelectChoice = (choice) => {
        if (!currentQuestion || currentAnswer) return;

        setAnswersByWordId((prev) => ({
            ...prev,
            [currentQuestion.wordId]: {
                choiceId: choice.id,
                choiceText: choice.text,
                isCorrect: choice.isCorrect,
            },
        }));
    };

    const handlePrevious = () => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
    };

    const handleComplete = () => {
        const nextSelection = createDraftRememberedSelection(questions, answersByWordId, initialLearnedWordIds);
        setSelectedWordIds(getInitialRememberedSelection(words, nextSelection));
        setIsCompleted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePlayAgain = () => {
        setQuestions(buildQuizQuestions(words));
        setCurrentIndex(0);
        setAnswersByWordId({});
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

    if (!words.length) {
        return (
            <section className="flashcard-shell quiz-shell">
                <div className="flashcard-empty">
                    <h3>Topic này chưa có từ vựng</h3>
                    <p>Hãy thêm từ vựng trước khi bắt đầu Quiz.</p>
                    <button type="button" className="btn btn-secondary" onClick={onBackToTopic}>
                        Quay lại
                    </button>
                </div>
            </section>
        );
    }

    if (!hasEnoughWords || !hasFullChoiceSet) {
        return (
            <section className="flashcard-shell quiz-shell">
                <div className="flashcard-empty">
                    <h3>Quiz cần ít nhất 4 đáp án phân biệt</h3>
                    <p>
                        Topic hiện tại có {words.length} từ, nhưng cần đủ dữ liệu để tạo 4 lựa chọn không bị trùng nghĩa.
                        Hãy bổ sung thêm từ vựng hoặc mở rộng topic rồi thử lại.
                    </p>
                    <button type="button" className="btn btn-secondary" onClick={onBackToTopic}>
                        Quay lại
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="flashcard-shell quiz-shell">
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
                    <div className="quiz-stage">
                        <div className="quiz-card">
                            <div className="quiz-card-main">
                                <div className="quiz-topline-row">
                                    <span className="quiz-topline">Quiz</span>
                                    <span className="quiz-substat">Đã trả lời {answeredCount}/{totalQuestions}</span>
                                </div>

                                <div className="quiz-word-block">
                                    <strong className="quiz-word">{currentQuestion.word.word}</strong>
                                    <div className="quiz-word-meta">
                                        <span>{currentQuestion.word.wordtype || 'Vocabulary'}</span>
                                        <span>{currentQuestion.word.transcription || '/dang-cap-nhat/'}</span>
                                    </div>
                                </div>

                                <div className="quiz-prompt-box">
                                    <span className="quiz-prompt-label">Chọn nghĩa đúng</span>
                                    <p className="quiz-prompt-copy">Đâu là nghĩa tiếng Việt phù hợp nhất với từ trên?</p>
                                </div>

                                <div className="quiz-choice-grid">
                                    {currentQuestion.choices.map((choice, index) => {
                                        const isSelected = currentAnswer?.choiceId === choice.id;
                                        const isCorrect = currentAnswer && choice.isCorrect;
                                        const isWrong = isSelected && currentAnswer && !choice.isCorrect;
                                        return (
                                            <button
                                                key={choice.id}
                                                type="button"
                                                className={`quiz-choice-btn${isSelected ? ' is-selected' : ''}${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}
                                                onClick={() => handleSelectChoice(choice)}
                                                disabled={!!currentAnswer}
                                            >
                                                <span className="quiz-choice-key">{index + 1}</span>
                                                <span className="quiz-choice-copy">{choice.text}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {currentAnswer ? (
                                    <div className={`quiz-feedback${currentAnswer.isCorrect ? ' is-correct' : ' is-wrong'}`}>
                                        <strong>{currentAnswer.isCorrect ? 'Chính xác' : 'Chưa đúng'}</strong>
                                        <span>
                                            Đáp án đúng là <strong>{currentQuestion.correctText}</strong>
                                            {currentQuestion.word.example ? ` - Ví dụ: ${currentQuestion.word.example}` : ''}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="quiz-feedback quiz-feedback-pending">
                                        <strong>Mời chọn 1 đáp án</strong>
                                        <span>Quiz sẽ khóa đáp án ngay sau khi bạn chọn.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="quiz-actions">
                        <button type="button" className="btn btn-primary flashcard-action-btn" onClick={handlePrevious} disabled={currentIndex === 0}>
                            <span className="flashcard-nav-icon">{ARROW_LEFT_ICON}</span>
                            <span>TRƯỚC</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary flashcard-action-btn flashcard-action-btn-icon"
                            onClick={speakCurrentWord}
                            aria-label="Nghe phát âm"
                        >
                            {SPEAKER_ICON} Nghe
                        </button>
                        {currentIndex === totalQuestions - 1 ? (
                            <button type="button" className="btn btn-primary flashcard-action-btn" onClick={handleComplete} disabled={!currentAnswer}>
                                <span>Xem kết quả</span>
                            </button>
                        ) : (
                            <button type="button" className="btn btn-primary flashcard-action-btn" onClick={handleNext} disabled={!currentAnswer}>
                                <span>Tiếp</span>
                                <span className="flashcard-nav-icon">{ARROW_RIGHT_ICON}</span>
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <StudyCompletionPanel
                    summary={<><strong>Tổng kết:</strong> Bạn trả lời đúng {correctCount}/{totalQuestions} câu và đánh dấu đã thuộc {selectedWordIds.length} từ.</>}
                    metrics={[
                        { label: 'Số câu đúng', value: `${correctCount}/${totalQuestions}` },
                        { label: 'Tỉ lệ', value: `${Math.round((correctCount / totalQuestions) * 100)}%` },
                    ]}
                    title="Xác nhận lại danh sách từ đã thuộc sau Quiz"
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
