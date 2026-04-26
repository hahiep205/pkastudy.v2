import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TopicFormModal from '../../components/customDocs/TopicFormModal';
import { coursesData } from '../../data/coursesData';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { useCustomCourses } from '../../hooks/useCustomCourses';

export default function CourseTopics() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { remembered } = useCourseProgress();
    const { customCourses, createTopic, updateTopic, deleteTopic } = useCustomCourses();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [topicForm, setTopicForm] = useState({ title: '', description: '', lang: 'en' });

    const openTopicModal = (topicId = null) => {
        if (topicId) {
            const topic = customCourses.find((customTopic) => customTopic.id === topicId);
            setEditingTopic(topic || null);
            setTopicForm({
                title: topic?.title || '',
                description: topic?.description || '',
                lang: topic?.lang || 'en',
            });
        } else {
            setEditingTopic(null);
            setTopicForm({ title: '', description: '', lang: 'en' });
        }

        setModalOpen(true);
    };

    const handleSaveTopic = () => {
        if (!topicForm.title.trim()) {
            alert('Vui lòng nhập tên chủ đề');
            return;
        }

        if (editingTopic) {
            updateTopic(editingTopic.id, topicForm);
        } else {
            createTopic(topicForm);
        }

        setModalOpen(false);
    };

    const handleDeleteTopic = (event, topicId) => {
        event.stopPropagation();

        if (window.confirm('Hành động này sẽ xóa toàn bộ từ vựng trong chủ đề và không thể hoàn tác. Tiếp tục?')) {
            deleteTopic(topicId);
        }
    };

    let title = '';
    let topics = [];

    if (courseId === 'custom') {
        title = 'Tài liệu của bạn';
        topics = customCourses.map((course) => ({
            id: course.id,
            title: course.title,
            description: course.description || 'Chủ đề tùy chỉnh',
            words: course.words,
        }));
    } else {
        const course = coursesData[courseId];

        if (!course) {
            return (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>⚠️ Khóa học không tồn tại hoặc đang phát triển.</h2>
                    <br />
                    <button className="btn btn-secondary" onClick={() => navigate('/dashboard/courses')}>
                        Quay lại
                    </button>
                </div>
            );
        }

        title = course.title;
        topics = course.topics;
    }

    return (
        <main className="dash-main cv-subview" id="cv-topics-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="cv-subview-header">
                <Link className="cv-breadcrumb-btn" to="/dashboard/courses">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z" />
                    </svg>
                    <span id="cv-back-course-label">{courseId === 'custom' ? 'Tài liệu của bạn' : 'Tất cả tài liệu'}</span>
                </Link>
                <span className="cv-breadcrumb-sep">›</span>
                <span className="cv-breadcrumb-current" id="cv-topic-title">
                    {title}
                </span>
            </div>

            {courseId === 'custom' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={() => openTopicModal()}>
                        + Tạo chủ đề mới
                    </button>
                </div>
            )}

            <div className="cv-topics-grid">
                {topics.length === 0 && courseId === 'custom' && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-text)', gridColumn: '1 / -1' }}>
                        Bạn chưa có tài liệu cá nhân nào. Hãy quay lại trang Khóa học và chuyển sang tab "Cá nhân" để thêm nhé!
                    </div>
                )}
                {topics.map((topic) => {
                    const total = topic.words.length;
                    const done = topic.words.filter((word) => remembered[word.id]).length;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                    const match = topic.title.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u);
                    const emoji = match ? match[0].trim() : '📚';
                    const textTitle = match ? topic.title.replace(match[0], '').trim() : topic.title;

                    return (
                        <div
                            key={topic.id}
                            className="cv-topic-card reveal"
                            onClick={() => navigate(`/dashboard/courses/${courseId}/topic/${topic.id}`)}
                        >
                            <div className="cv-topic-left">
                                <div className="cv-topic-emoji">{emoji}</div>
                                <div className="cv-topic-info">
                                    <div className="cv-topic-name">{textTitle}</div>
                                    <div className="cv-topic-desc">{topic.description || `${total} từ vựng mới`}</div>
                                </div>
                            </div>
                            <div className="cv-topic-right">
                                {courseId === 'custom' ? (
                                    <div className="cv-icon-btns">
                                        <button
                                            className="cv-icon-btn cv-cc-edit"
                                            title="Sửa chủ đề"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openTopicModal(topic.id);
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                                <path d="M15.7279 9.57629L14.3137 8.16207L5 17.4758V18.89H6.41421L15.7279 9.57629ZM17.1421 8.16207L18.5563 6.74786L17.1421 5.33365L15.7279 6.74786L17.1421 8.16207ZM7.24264 20.89H3V16.6474L16.435 3.21233C16.8256 2.8218 17.4587 2.8218 17.8492 3.21233L20.6777 6.04075C21.0682 6.43128 21.0682 7.06444 20.6777 7.45497L7.24264 20.89Z" />
                                            </svg>
                                        </button>
                                        <button
                                            className="cv-icon-btn cv-cc-delete"
                                            title="Xóa chủ đề"
                                            style={{ '--icon-color': 'var(--red)' }}
                                            onClick={(event) => handleDeleteTopic(event, topic.id)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                                <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="cv-topic-progress-wrap">
                                        <div className="cv-topic-bar">
                                            <div className="cv-topic-bar-fill" style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <span className="cv-topic-pct">
                                            {done}/{total}
                                        </span>
                                    </div>
                                )}
                                <svg className="cv-topic-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" />
                                </svg>
                            </div>
                        </div>
                    );
                })}
            </div>

            <TopicFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveTopic}
                topicForm={topicForm}
                setTopicForm={setTopicForm}
                editingTopic={editingTopic}
            />
        </main>
    );
}
