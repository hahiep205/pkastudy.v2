import { useEffect, useRef, useState } from 'react';
import StudyCompletionPanel from './studyModes/StudyCompletionPanel';
import { getInitialRememberedSelection, getSpeechLang } from '../utils/studyModes';

const EXIT_CLICK_SELECTOR = '.topbar, .sidebar, .mobile-nav, .sidebar-overlay';

const LANGUAGE_LABELS = {
    en: 'Tiếng Anh',
    ko: 'Tiếng Hàn',
    ja: 'Tiếng Nhật',
    zh: 'Tiếng Trung',
    fr: 'Tiếng Nhấp',
};

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

const FLASHCARD_GRADIENTS = [
    { front: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', back: 'linear-gradient(135deg, #2dd4bf 0%, #3b82f6 100%)' },
    { front: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', back: 'linear-gradient(135deg, #3b82f6 0%, #34d399 100%)' },
    { front: 'linear-gradient(135deg, #fbbf24 0%, #ec4899 100%)', back: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)' },
    { front: 'linear-gradient(135deg, #fb7185 0%, #a78bfa 100%)', back: 'linear-gradient(135deg, #34d399 0%, #3b82f6 100%)' },
    { front: 'linear-gradient(135deg, #3b82f6 0%, #a78bfa 100%)', back: 'linear-gradient(135deg, #ec4899 0%, #fbbf24 100%)' },
    { front: 'linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)', back: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' },
    { front: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)', back: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)' },
    { front: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', back: 'linear-gradient(135deg, #fbbf24 0%, #3b82f6 100%)' },
    { front: 'linear-gradient(135deg, #38bdf8 0%, #a3e635 100%)', back: 'linear-gradient(135deg, #d946ef 0%, #f59e0b 100%)' },
    { front: 'linear-gradient(135deg, #f87171 0%, #8b5cf6 100%)', back: 'linear-gradient(135deg, #2dd4bf 0%, #3b82f6 100%)' },
];

function getCardTheme(word, index) {
    if (!word) return FLASHCARD_GRADIENTS[0];

    const source = `${word.id ?? ''}-${word.word ?? ''}-${index}`;
    const hash = Array.from(source).reduce((total, char) => total + char.charCodeAt(0), 0);
    return FLASHCARD_GRADIENTS[hash % FLASHCARD_GRADIENTS.length];
}

export default function Flashcard({
    topicLang = 'en',
    words,
    initialLearnedWordIds = [],
    onSaveLearnedWords,
    onExit,
    onBackToTopic,
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedWordIds, setSelectedWordIds] = useState(() => getInitialRememberedSelection(words, initialLearnedWordIds));
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const sessionLockedRef = useRef(false);

    useEffect(() => {
        setCurrentIndex(0);
        setIsFlipped(false);
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

    const totalCards = words.length;
    const currentWord = words[currentIndex];
    const isLastCard = currentIndex === totalCards - 1;
    const progressLabel = totalCards ? `${currentIndex + 1}/${totalCards}` : '0/0';
    const currentWordRemembered = currentWord ? selectedWordIds.includes(currentWord.id) : false;
    const currentTheme = getCardTheme(currentWord, currentIndex);
    const languageLabel = LANGUAGE_LABELS[currentWord?.language || topicLang] || 'Từ vựng';

    const toggleSelectedWord = (wordId) => {
        setSelectedWordIds((prev) => (
            prev.includes(wordId)
                ? prev.filter((id) => id !== wordId)
                : [...prev, wordId]
        ));
    };

    const handlePrevious = () => {
        if (!totalCards) return;
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
        setIsFlipped(false);
    };

    const handleNext = () => {
        if (!totalCards) return;
        setCurrentIndex((prev) => Math.min(prev + 1, totalCards - 1));
        setIsFlipped(false);
    };

    const handleComplete = () => {
        setIsCompleted(true);
        setIsFlipped(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = () => {
        onSaveLearnedWords?.(selectedWordIds);
        setIsSaved(true);
        sessionLockedRef.current = true;
        onBackToTopic?.();
    };

    const handlePlayAgain = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setSelectedWordIds(getInitialRememberedSelection(words, initialLearnedWordIds));
        setIsCompleted(false);
        setIsSaved(false);
        sessionLockedRef.current = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const speakCurrentWord = () => {
        if (!currentWord || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentWord.word);
        utterance.lang = getSpeechLang(currentWord.language, topicLang);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const toggleFlip = () => {
        setIsFlipped((prev) => !prev);
    };

    const handleCardKeyDown = (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggleFlip();
    };

    if (!words.length) {
        return (
            <section className="flashcard-shell">
                <div className="flashcard-empty">
                    <h3>Topic này chưa có từ vựng</h3>
                    <p>Hãy thêm từ vựng trước khi bắt đầu flashcard.</p>
                    <button type="button" className="btn btn-secondary" onClick={onBackToTopic}>
                        Quay lại
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="flashcard-shell">
            <div className="flashcard-header-meta">
                <div className="flashcard-progress">
                    <span>Tiến độ:</span>
                    <strong>{isCompleted ? `${totalCards}/${totalCards}` : progressLabel}</strong>
                </div>
                <div className="flashcard-header-actions">
                    <button type="button" className="btn btn-secondary flashcard-header-btn" onClick={handlePlayAgain}>
                        Học lại
                    </button>
                    <button type="button" className="btn btn-secondary flashcard-header-btn" onClick={onBackToTopic}>
                        Thoát
                    </button>
                </div>
            </div>

            {!isCompleted ? (
                <>
                    <div className="flashcard-stage">
                        <div className={`flashcard-card${isFlipped ? ' is-flipped' : ''}`}>
                            <div
                                className="flashcard-card-inner"
                                role="button"
                                tabIndex={0}
                                aria-label="Lat the flashcard"
                                onClick={toggleFlip}
                                onKeyDown={handleCardKeyDown}
                            >
                                <div className="flashcard-face flashcard-face-front" style={{ background: currentTheme.front }}>
                                    <div className="flashcard-face-topline">Từ {languageLabel}</div>
                                    <div className="flashcard-face-center">
                                        <strong className="flashcard-word">{currentWord.word}</strong>
                                        <span className="flashcard-wordtype flashcard-wordtype-front">{currentWord.wordtype || 'VOCABULARY'}</span>
                                        <span className="flashcard-transcription">{currentWord.transcription || '/dang-cap-nhat/'}</span>
                                    </div>
                                    <div className="flashcard-face-hint" style={{ margin: '10px 0 0' }}>Nhấn space hoặc click để lật lại</div>
                                </div>

                                <div className="flashcard-face flashcard-face-back" style={{ background: currentTheme.back }}>
                                    <div className="flashcard-back-layout">
                                        <div className="flashcard-face-topline">Nghĩa tiếng Việt</div>
                                        <div className="flashcard-back-center">
                                            <strong className="flashcard-meaning flashcard-meaning-hero">{currentWord.mean || 'Chưa có nghĩa'}</strong>
                                            <div className="flashcard-detail-row flashcard-audio-row">
                                                <div className="flashcard-example-pill-copy">
                                                    <span className="flashcard-field-label">Phiên âm</span>
                                                    <span className="flashcard-transcription flashcard-transcription-back">{currentWord.transcription || '/dang-cap-nhat/'}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary flashcard-voice-btn"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        speakCurrentWord();
                                                    }}
                                                    aria-label="Nghe phát âm"
                                                >
                                                    {SPEAKER_ICON}
                                                </button>
                                            </div>
                                            <div className="flashcard-example-pill">
                                                <div className="flashcard-example-pill-copy">
                                                    <span className="flashcard-field-label">Ví dụ</span>
                                                    <span className="flashcard-example flashcard-example-main">{currentWord.example || 'Chưa có ví dụ tiếng Anh'}</span>
                                                    <span className="flashcard-example flashcard-example-vi">{currentWord.example_vi || 'Chưa có ví dụ tiếng Việt'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flashcard-face-hint flashcard-face-hint-back">
                                            Nhấn space hoặc click để lật lại
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flashcard-actions">
                        <button type="button" className="btn btn-primary flashcard-action-btn" onClick={handlePrevious} disabled={currentIndex === 0}>
                            <span className="flashcard-nav-icon">{ARROW_LEFT_ICON}</span>
                            <span>TRƯỚC</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary flashcard-action-btn flashcard-action-btn-icon"
                            onClick={(event) => {
                                event.stopPropagation();
                                speakCurrentWord();
                            }}
                            aria-label="Nghe phát âm"
                        >
                            {SPEAKER_ICON} Nghe
                        </button>
                        <label className="flashcard-action-switch" title={currentWordRemembered ? 'Đã thuộc' : 'Chưa thuộc'}>
                            <span className="flashcard-action-switch-label">THUỘC</span>
                            <input
                                type="checkbox"
                                className="cv-switch-chk"
                                checked={currentWordRemembered}
                                onChange={() => toggleSelectedWord(currentWord.id)}
                            />
                            <span className="cv-switch-track"><span className="cv-switch-thumb"></span></span>
                        </label>
                        {isLastCard ? (
                            <button type="button" className="btn btn-primary flashcard-action-btn" onClick={handleComplete}>
                                <span>Xong</span>
                            </button>
                        ) : (
                            <button type="button" className="btn btn-primary flashcard-action-btn" onClick={handleNext}>
                                <span>Tiếp</span>
                                <span className="flashcard-nav-icon">{ARROW_RIGHT_ICON}</span>
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <StudyCompletionPanel
                    summary={<><strong>Tong ket:</strong> Bạn đã đánh dấu {selectedWordIds.length}/{totalCards} từ.</>}
                    title="Chọn lại danh sách từ đã thuộc"
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
