import { useMemo, useState } from 'react';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
import { Link, useLocation } from 'react-router-dom';
import TopicFormModal from '../../components/customDocs/TopicFormModal';
import { coursesData } from '../../data/coursesData';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { useCustomCourses } from '../../hooks/useCustomCourses';
import { languageLabels } from '../../utils/language';

export default function Courses() {
    const location = useLocation();
    const [activeLang, setActiveLang] = useState(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');

        return tab === 'english' || tab === 'korean' || tab === 'custom' ? tab : 'english';
    });
    const [modalType, setModalType] = useState(null);
    const [editingTopic, setEditingTopic] = useState(null);
    const [topicForm, setTopicForm] = useState({ title: '', description: '', lang: 'en' });
    const [toastMessage, setToastMessage] = useState('');
    const [pendingDeleteTopic, setPendingDeleteTopic] = useState(null);
    const { customCourses, createTopic, updateTopic, deleteTopic } = useCustomCourses();
    const { remembered } = useCourseProgress();

    const coursesConfig = useMemo(() => {
        const allCourses = Object.values(coursesData);

        return {
            en: allCourses.filter((course) => course.lang === 'en'),
            ko: allCourses.filter((course) => course.lang === 'ko'),
        };
    }, []);

    const getTopicProgress = (topic) => {
        if (!topic.words?.length) {
            return { pct: 0, done: 0, total: 0 };
        }

        const total = topic.words.length;
        const done = topic.words.filter((word) => remembered[word.id]).length;

        return {
            pct: Math.round((done / total) * 100),
            done,
            total,
        };
    };

    const handleOpenTopicForm = (topic = null) => {
        if (topic) {
            setEditingTopic(topic);
            setTopicForm({
                title: topic.title,
                description: topic.description,
                lang: topic.lang || 'en',
            });
        } else {
            setEditingTopic(null);
            setTopicForm({ title: '', description: '', lang: 'en' });
        }

        setModalType('topic-form');
    };

    const handleSaveTopic = () => {
        if (!topicForm.title.trim()) {
            setToastMessage('Vui lòng nhập tên chủ đề');
            return;
        }

        if (editingTopic) {
            updateTopic(editingTopic.id, topicForm);
        } else {
            createTopic(topicForm);
        }

        setModalType(null);
        setToastMessage('');
    };

    const handleDeleteTopic = (topicId) => {
        deleteTopic(topicId);
        setPendingDeleteTopic(null);
        setToastMessage('Đã xóa chủ đề');
    };

    return (
        <main className="dash-main courses-page" id="page-courses">
            <section className="courses-banner reveal">
                <div className="courses-banner-text">
                    <div className="welcome-eyebrow">Thư viện tài liệu</div>
                    <h1 className="welcome-title">Học từ vựng cùng pkastudy!</h1>
                    <p className="welcome-sub">
                        Chọn ngôn ngữ bạn muốn học và khám phá các tài liệu được tuyển chọn kỹ lưỡng.
                    </p>
                </div>
                <div className="courses-banner-badges">
                    <div className="courses-stat-pill">
                        <span className="courses-stat-num">2</span>
                        <span className="courses-stat-label">Ngôn ngữ</span>
                    </div>
                    <div className="courses-stat-pill">
                        <span className="courses-stat-num">2</span>
                        <span className="courses-stat-label">Bộ tài liệu</span>
                    </div>
                </div>
            </section>

            <div className="lang-tabs-wrapper">
                <div className="lang-tabs">
                    <button className={`lang-tab-btn ${activeLang === 'english' ? 'active' : ''}`} onClick={() => setActiveLang('english')}>
                        <span className="lang-tab-name">Tiếng Anh</span>
                        <span className="lang-tab-count">1 bộ tài liệu</span>
                    </button>

                    <button className={`lang-tab-btn ${activeLang === 'korean' ? 'active' : ''}`} onClick={() => setActiveLang('korean')}>
                        <span className="lang-tab-name">Tiếng Hàn</span>
                        <span className="lang-tab-count">1 bộ tài liệu</span>
                    </button>

                    <button className={`lang-tab-btn ${activeLang === 'custom' ? 'active' : ''}`} onClick={() => setActiveLang('custom')}>
                        <span className="lang-tab-name">Cá nhân</span>
                        <span className="lang-tab-count">{customCourses.length} chủ đề</span>
                    </button>
                </div>
            </div>

            {activeLang === 'english' && (
                <div className="lang-content" id="lang-english">
                    <div className="lang-content-header">
                        <div>
                            <div className="card-eyebrow">Tiếng Anh</div>
                            <h2 className="card-title-text">Tài liệu học tập</h2>
                        </div>
                        <span className="badge badge-progress">1 bộ tài liệu</span>
                    </div>

                    <div className="doc-list">
                        {coursesConfig.en.map((course, index) => (
                            <div className="doc-card reveal revealed" key={course.id}>
                                <div className="doc-icon-wrap doc-icon-blue">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                        <path d="M5 4H15V8H19V20H5V4ZM3.9985 2C3.44749 2 3 2.44405 3 2.9918V21.0082C3 21.5447 3.44476 22 3.9934 22H20.0066C20.5551 22 21 21.5489 21 21.0082V7L15 2H3.9985ZM10.4999 7.5C10.4999 9.70914 8.70914 11.5 6.49999 11.5V13.5C9.81371 13.5 12.4999 10.8137 12.4999 7.5H10.4999ZM7.5 7.5H5.5C5.5 9.70914 7.29086 11.5 9.5 11.5V9.5C8.39543 9.5 7.5 8.60457 7.5 7.5Z" />
                                    </svg>
                                </div>
                                <div className="doc-info">
                                    <div className="doc-meta-row">
                                        <span className="doc-type-badge type-pdf">TOEIC</span>
                                    </div>
                                    <h3 className="doc-name">
                                        {index + 1}. {course.title}
                                    </h3>
                                    <p className="doc-desc">
                                        Bộ 600 từ vựng cốt lõi được phân loại theo chủ đề: văn phòng, tài chính, du lịch, sức khỏe và hơn thế nữa.
                                    </p>
                                    <div className="doc-tags">
                                        <span className="doc-tag">Vocabulary</span>
                                        <span className="doc-tag">Words</span>
                                    </div>
                                </div>
                                <div className="doc-action">
                                    <Link to={`/dashboard/courses/${course.id}`} className="btn btn-primary btn-small">
                                        Học ngay
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeLang === 'korean' && (
                <div className="lang-content" id="lang-korean">
                    <div className="lang-content-header">
                        <div>
                            <div className="card-eyebrow">Tiếng Hàn</div>
                            <h2 className="card-title-text">Tài liệu học tập</h2>
                        </div>
                        <span className="badge badge-review">1 bộ tài liệu</span>
                    </div>

                    <div className="doc-list">
                        {coursesConfig.ko.map((course, index) => (
                            <div className="doc-card reveal revealed" key={course.id}>
                                <div className="doc-icon-wrap doc-icon-pink">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                        <path d="M5 4H15V8H19V20H5V4ZM3.9985 2C3.44749 2 3 2.44405 3 2.9918V21.0082C3 21.5447 3.44476 22 3.9934 22H20.0066C20.5551 22 21 21.5489 21 21.0082V7L15 2H3.9985ZM10.4999 7.5C10.4999 9.70914 8.70914 11.5 6.49999 11.5V13.5C9.81371 13.5 12.4999 10.8137 12.4999 7.5H10.4999ZM7.5 7.5H5.5C5.5 9.70914 7.29086 11.5 9.5 11.5V9.5C8.39543 9.5 7.5 8.60457 7.5 7.5Z" />
                                    </svg>
                                </div>
                                <div className="doc-info">
                                    <div className="doc-meta-row">
                                        <span className="doc-type-badge type-pdf">TOPIK 1</span>
                                    </div>
                                    <h3 className="doc-name">
                                        {index + 1}. {course.title}
                                    </h3>
                                    <p className="doc-desc">
                                        Từ vựng sơ cấp 1 và 2 bám sát đề thi TOPIK thực tế với đầy đủ phiên âm và ví dụ minh họa.
                                    </p>
                                    <div className="doc-tags">
                                        <span className="doc-tag">Cơ bản</span>
                                        <span className="doc-tag">Mới bắt đầu</span>
                                    </div>
                                </div>
                                <div className="doc-action">
                                    <Link to={`/dashboard/courses/${course.id}`} className="btn btn-primary btn-small">
                                        Học ngay
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeLang === 'custom' && (
                <div className="lang-content" id="lang-custom">
                    <div className="lang-content-header">
                        <div>
                            <div className="card-eyebrow">Của bạn</div>
                            <h2 className="card-title-text">Tài liệu cá nhân</h2>
                        </div>
                        <button className="btn btn-primary btn-small" id="cv-create-topic-btn" onClick={() => handleOpenTopicForm()}>
                            + Tạo chủ đề
                        </button>
                    </div>

                    <div className="doc-list" id="cv-custom-list">
                        {customCourses.length === 0 ? (
                            <div className="cv-empty-state reveal revealed" style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center"
                            }}>
                                <div className="cv-empty-icon">📚</div>
                                <h3 className="cv-empty-title" style={{ marginTop: "8px" }}>
                                    Chưa có chủ đề nào
                                </h3>
                                <button className="btn btn-primary btn-small" style={{ marginTop: "8px" }} onClick={() => handleOpenTopicForm()}>
                                    + Tạo chủ đề đầu tiên
                                </button>
                            </div>
                        ) : (
                            customCourses.map((topic) => {
                                const progress = getTopicProgress(topic);

                                return (
                                    <div className="doc-card cv-custom-card reveal revealed" key={topic.id}>
                                        <div className="doc-icon-wrap cv-custom-icon-wrap">
                                            <span className="cv-custom-card-emoji">📓</span>
                                        </div>
                                        <div className="doc-info">
                                            <div className="doc-meta-row">
                                                <span className="doc-type-badge cv-custom-badge">CÁ NHÂN</span>
                                                <span className="doc-level">
                                                    {languageLabels[topic.lang] || 'Ngôn ngữ'} · {progress.total} từ
                                                </span>
                                            </div>
                                            <h3 className="doc-name">{topic.title}</h3>
                                            <p className="doc-desc">{topic.description || 'Chủ đề từ vựng cá nhân của bạn'}</p>
                                            <div className="cv-custom-card-progress">
                                                <div className="cv-custom-card-bar">
                                                    <div className="cv-custom-card-bar-fill" style={{ width: `${progress.pct}%` }}></div>
                                                </div>
                                                <span className="cv-custom-card-pct">
                                                    {progress.done}/{progress.total}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="cv-custom-card-actions">
                                            <Link to={`/dashboard/courses/custom/topic/${topic.id}`} className="btn btn-primary btn-small cv-cc-learn">
                                                Học ngay
                                            </Link>
                                            <div className="cv-icon-btns">
                                                <button
                                                    className="cv-icon-btn cv-cc-edit"
                                                    title="Sửa chủ đề"
                                                    onClick={() => handleOpenTopicForm(topic)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                    className="cv-icon-btn cv-cc-delete"
                                                    title="Xóa chủ đề"
                                                    style={{ '--icon-color': 'var(--red)' }}
                                                    onClick={() => setPendingDeleteTopic(topic)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            <TopicFormModal
                isOpen={modalType === 'topic-form'}
                onClose={() => {
                    setModalType(null);
                    setToastMessage('');
                }}
                onSave={handleSaveTopic}
                topicForm={topicForm}
                setTopicForm={setTopicForm}
                editingTopic={editingTopic}
                toastMessage={toastMessage}
                onToastHide={() => setToastMessage('')}
            />
            <ConfirmActionModal
                isOpen={Boolean(pendingDeleteTopic)}
                onClose={() => setPendingDeleteTopic(null)}
                onConfirm={() => handleDeleteTopic(pendingDeleteTopic.id)}
                title="Xác nhận xóa chủ đề"
                message={pendingDeleteTopic ? `Bạn có chắc muốn xóa chủ đề "${pendingDeleteTopic.title}" không?` : ''}
                confirmLabel="Xóa chủ đề"
            />
        </main>
    );
}
