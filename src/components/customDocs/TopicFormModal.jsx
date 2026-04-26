// TẠO TOPIC CUSTOM

import CustomModal from './CustomModal';
import { languageFlags, languageLabels } from '../../utils/language';

const supportedLanguages = ['en', 'ko', 'ja', 'zh', 'fr'];

export default function TopicFormModal({
    isOpen,
    onClose,
    onSave,
    topicForm,
    setTopicForm,
    editingTopic,
}) {
    return (
        <CustomModal
            isOpen={isOpen}
            onClose={onClose}
            title={editingTopic ? '✏️ Sửa chủ đề' : '📁 Tạo chủ đề mới'}
        >
            <div className="cv-modal-body">
                <div className="cv-form-group">
                    <label className="cv-form-label">
                        Tên chủ đề <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                        className="cv-form-input"
                        maxLength="60"
                        placeholder="Ví dụ: 🏢 Từ vựng văn phòng"
                        value={topicForm.title}
                        onChange={(event) =>
                            setTopicForm({ ...topicForm, title: event.target.value })
                        }
                    />
                </div>
                <div className="cv-form-row">
                    <div className="cv-form-group" style={{ flex: 2 }}>
                        <label className="cv-form-label">Mô tả</label>
                        <textarea
                            className="cv-form-input cv-form-textarea"
                            placeholder="Mô tả ngắn..."
                            rows="2"
                            value={topicForm.description}
                            onChange={(event) =>
                                setTopicForm({ ...topicForm, description: event.target.value })
                            }
                        />
                    </div>
                    <div className="cv-form-group" style={{ flex: 1 }}>
                        <label className="cv-form-label">Ngôn ngữ</label>
                        <select
                            className="cv-form-input cv-form-select"
                            value={topicForm.lang}
                            onChange={(event) =>
                                setTopicForm({ ...topicForm, lang: event.target.value })
                            }
                        >
                            {supportedLanguages.map((languageCode) => (
                                <option key={languageCode} value={languageCode}>
                                    {languageFlags[languageCode]} {languageLabels[languageCode]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className="cv-modal-footer cv-modal-footer-split">
                <button className="btn btn-secondary" onClick={onClose}>
                    Hủy
                </button>
                <button className="btn btn-primary" onClick={onSave}>
                    {editingTopic ? 'Lưu thay đổi' : 'Tạo chủ đề'}
                </button>
            </div>
        </CustomModal>
    );
}
