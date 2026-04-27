export default function StudyCompletionPanel({
    summary,
    metrics = [],
    title = 'Chọn lại danh sách từ đã thuộc',
    words,
    selectedWordIds,
    onToggleWord,
    onPlayAgain,
    onSave,
    isSaved = false,
}) {
    return (
        <div className="flashcard-completion">
            <div className="flashcard-completion-head">
                <div className="flashcard-completion-head-main">
                    <div className="flashcard-completion-head-topline">
                        <div className="flashcard-summary-pill flashcard-summary-pill-merged">
                            <span>{summary}</span>
                        </div>
                        {metrics.length ? (
                            <div className="study-summary-metrics">
                                {metrics.map((metric) => (
                                    <div key={metric.label} className="flashcard-summary-pill">
                                        <strong>{metric.label}:</strong> {metric.value}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <h3>{title}</h3>
                </div>
            </div>

            <div className="flashcard-checklist">
                {words.map((word) => {
                    const checked = selectedWordIds.includes(word.id);
                    return (
                        <label key={word.id} className={`flashcard-check-row${checked ? ' is-checked' : ''}`}>
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleWord(word.id)}
                            />
                            <span className="flashcard-check-main">
                                <strong>{word.word}</strong>
                                <span>{word.mean || 'Chưa có nghĩa'}</span>
                            </span>
                        </label>
                    );
                })}
            </div>

            <div className="flashcard-completion-actions">
                {!isSaved ? (
                    <>
                        <button type="button" className="btn btn-secondary" onClick={onPlayAgain}>
                            Học lại
                        </button>
                        <button type="button" className="btn btn-primary" onClick={onSave}>
                            Hoàn thành
                        </button>
                    </>
                ) : null}
            </div>
        </div>
    );
}
