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
    const selectedCount = selectedWordIds.length;
    const totalWords = words.length;

    return (
        <div className="flashcard-completion">
            <div className="flashcard-completion-hero">
                <div className="flashcard-completion-head">
                    <div className="flashcard-completion-head-main">
                        <span className="flashcard-completion-kicker">Study Complete</span>
                        <h3>{title}:  <span className="flashcard-checklist-status">{selectedCount} / {totalWords} từ</span></h3>
                        <p className="flashcard-completion-subtitle">
                            Rà lại những từ bạn thật sự đã nhớ chắc trước khi lưu kết quả học.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flashcard-checklist-shell">
                {/* <div className="flashcard-checklist-head">
                    <div>
                        <strong>Đánh dấu lại những từ đã thuộc</strong>
                    </div>
                    
                </div> */}

                <div className="flashcard-checklist">
                    <div className="flashcard-check-table-head" role="row">
                        <span>Check</span>
                        <span>Từ</span>
                        <span>Nghĩa</span>
                    </div>

                    <div className="flashcard-check-table-body">
                        {words.map((word) => {
                            const checked = selectedWordIds.includes(word.id);
                            return (
                                <label key={word.id} className={`flashcard-check-row${checked ? ' is-checked' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggleWord(word.id)}
                                    />
                                    <span className="flashcard-check-indicator" aria-hidden="true">
                                        <span className="flashcard-check-indicator-dot" />
                                    </span>
                                    <strong className="flashcard-check-word" data-label="Từ">{word.word}</strong>
                                    <span className="flashcard-check-mean" data-label="Nghĩa">{word.mean || 'Chưa có nghĩa'}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
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
