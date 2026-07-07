// THÊM TỪ VỰNG THỦ CÔNG

import { useState } from 'react';
import ToastNotice from '../common/ToastNotice';
import CustomModal from '../customDocs/CustomModal';

const WORD_TYPES = ['danh từ', 'động từ', 'tính từ', 'trạng từ', 'cụm từ', 'thành ngữ', 'khác'];

export default function WordModal({ isOpen, onClose, onSave, existingWord }) {
    const [word, setWord] = useState(existingWord?.word || '');
    const [transcription, setTranscription] = useState(existingWord?.transcription || '');
    const [meaning, setMeaning] = useState(existingWord?.mean || '');
    const [wordType, setWordType] = useState(existingWord?.wordtype || 'danh từ');
    const [example, setExample] = useState(existingWord?.example || '');
    const [toastMessage, setToastMessage] = useState('');

    const handleSave = () => {
        if (!word.trim()) {
            setToastMessage('Vui lòng nhập từ vựng!');
            return;
        }

        onSave({
            word: word.trim(),
            transcription: transcription.trim(),
            mean: meaning.trim(),
            wordtype: wordType,
            example: example.trim(),
        });
        setToastMessage('');
        onClose();
    };

    return (
        <CustomModal isOpen={isOpen} onClose={onClose} title={existingWord ? '✏️ Sửa từ vựng' : '➕ Thêm từ vựng mới'}>
            <ToastNotice message={toastMessage} onHide={() => setToastMessage('')} />
            <div className="cv-modal-body">
                <div className="cv-form-row">
                    <div className="cv-form-group">
                        <label className="cv-form-label">
                            Từ vựng <span style={{ color: 'var(--red)' }}>*</span>
                        </label>
                        <input
                            className="cv-form-input"
                            placeholder="schedule"
                            value={word}
                            onChange={(event) => {
                                setWord(event.target.value);
                                if (toastMessage) setToastMessage('');
                            }}
                        />
                    </div>
                    <div className="cv-form-group">
                        <label className="cv-form-label">Phiên âm</label>
                        <input
                            className="cv-form-input"
                            placeholder="/ˈʃɛdjuːl/"
                            value={transcription}
                            onChange={(event) => setTranscription(event.target.value)}
                        />
                    </div>
                </div>
                <div className="cv-form-row">
                    <div className="cv-form-group">
                        <label className="cv-form-label">
                            Nghĩa tiếng Việt
                        </label>
                        <input
                            className="cv-form-input"
                            placeholder="có thể để trống nếu chưa biết nghĩa"
                            value={meaning}
                            onChange={(event) => {
                                setMeaning(event.target.value);
                                if (toastMessage) setToastMessage('');
                            }}
                        />
                    </div>
                    <div className="cv-form-group">
                        <label className="cv-form-label">Loại từ</label>
                        <select className="cv-form-input cv-form-select" value={wordType} onChange={(event) => setWordType(event.target.value)}>
                            {WORD_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="cv-form-group">
                    <label className="cv-form-label">Câu ví dụ</label>
                    <input
                        className="cv-form-input"
                        placeholder="I have a busy schedule this week."
                        value={example}
                        onChange={(event) => setExample(event.target.value)}
                    />
                </div>
            </div>
            <div className="cv-modal-footer cv-modal-footer-split">
                <button className="btn btn-secondary" onClick={onClose}>
                    Hủy
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                    {existingWord ? 'Lưu thay đổi' : 'Thêm từ'}
                </button>
            </div>
        </CustomModal>
    );
}
