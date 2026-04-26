// CHỨC NĂNG THÊM WORD VÀO DANH SÁCH CUSTOM

import { useEffect, useRef, useState } from 'react';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';

const CHECK_ICON = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z" /></svg>;
const ADD_ICON = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z" /></svg>;

function extractEmoji(title) {
    const match = title?.trim().match(/^\p{Emoji}/u);
    return match ? match[0] : '📝';
}

export default function TopicPickerModal({ isOpen, onClose, word, customCourses, onAdd, onCreateTopic }) {
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');
    const inputRef = useRef();

    useOverlayBehavior(isOpen, onClose);

    useEffect(() => {
        if (isCreatingNew && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreatingNew]);

    if (!isOpen || !word) return null;

    const handleConfirmNew = () => {
        const name = newTopicName.trim();
        if (!name) {
            alert('Vui lòng nhập tên danh sách');
            return;
        }
        const wordLang = word.language || 'en';
        const newTopic = onCreateTopic({ title: name, description: '', lang: wordLang });
        if (newTopic) {
            onAdd(newTopic.id, { ...word, language: word.language || wordLang });
        }
    };

    const handleAddSelected = () => {
        if (!selectedTopicId) return;
        const target = customCourses.find(t => t.id === selectedTopicId);
        if (!target) return;

        const isDuplicate = target.words.some(w => w.word.toLowerCase() === word.word.toLowerCase());
        if (isDuplicate) {
            alert(`⚠️ Từ "${word.word}" đã có trong "${target.title}"`);
            onClose();
            return;
        }
        onAdd(selectedTopicId, { ...word, language: word.language || 'en' });
    };

    return (
        <div className="cv-topic-picker-overlay cv-tp-active" onClick={onClose}>
            <div className="cv-topic-picker-box" id="cv-topic-picker-box" onClick={(e) => e.stopPropagation()}>
                <div className="cv-modal-header" style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <h3>📚 Thêm vào bộ từ của tôi</h3>
                    <button className="cv-modal-close" type="button" onClick={onClose}>&times;</button>
                </div>
                <div className="cv-modal-body">
                    <p style={{ fontSize: '.83rem', color: 'var(--gray-light)', marginBottom: '14px' }}>
                        Chọn danh sách để thêm từ <strong style={{ color: 'var(--dark-blue)' }}>"{word.word}"</strong>:
                    </p>

                    {customCourses.length === 0 ? (
                        <div className="cv-tp-empty">
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
                            <p>Bạn chưa có danh sách nào.<br />Hãy tạo danh sách đầu tiên bên dưới!</p>
                        </div>
                    ) : (
                        <div className="cv-tp-topic-list">
                            {customCourses.map(t => (
                                <div
                                    key={t.id}
                                    className={`cv-tp-topic-item ${selectedTopicId === t.id ? 'cv-tp-selected' : ''}`}
                                    onClick={() => setSelectedTopicId(t.id)}
                                >
                                    <div className="cv-tp-topic-emoji">{extractEmoji(t.title)}</div>
                                    <div className="cv-tp-topic-info">
                                        <div className="cv-tp-topic-name">{t.title}</div>
                                        <div className="cv-tp-topic-count">{t.words.length} từ vựng</div>
                                    </div>
                                    <div className="cv-tp-check">{CHECK_ICON}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div
                        className="cv-tp-create-row"
                        role="button"
                        tabIndex="0"
                        onClick={() => setIsCreatingNew(!isCreatingNew)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsCreatingNew(!isCreatingNew); }}
                    >
                        {ADD_ICON} Tạo danh sách mới
                    </div>

                    <div className={`cv-tp-new-wrap ${isCreatingNew ? 'cv-tp-new-visible' : ''}`}>
                        <label style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--gray-light)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                            Tên danh sách mới
                        </label>
                        <input
                            ref={inputRef}
                            className="cv-form-input"
                            placeholder="Ví dụ: 🏢 Từ vựng văn phòng"
                            maxLength="60"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmNew(); }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button className="btn btn-primary btn-small" onClick={handleConfirmNew}>
                                Tạo và thêm vào
                            </button>
                        </div>
                    </div>
                </div>
                <div className="cv-modal-footer cv-modal-footer-split">
                    <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
                    <button
                        className="btn btn-primary"
                        disabled={customCourses.length === 0 || !selectedTopicId}
                        style={(customCourses.length === 0 || !selectedTopicId) ? { opacity: '.45', cursor: 'not-allowed' } : {}}
                        onClick={handleAddSelected}
                    >
                        Thêm vào
                    </button>
                </div>
            </div>
        </div>
    );
}
