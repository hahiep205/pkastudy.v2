import { useDeferredValue, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
import ToastNotice from '../../components/common/ToastNotice';
import CustomModal from '../../components/customDocs/CustomModal';
import axiosClient from '../../utils/axiosClient';

const PAGE_SIZE = 8;

function createEmptyCourseForm() {
    return {
        title: '',
        slug: '',
        description: '',
        thumbnailUrl: '',
        language: 'en',
    };
}

function CourseFormModal({ isOpen, mode, form, onChange, onClose, onSubmit, submitting }) {
    const isEdit = mode === 'edit';

    return (
        <CustomModal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học'}>
            <div className="cv-modal-body manager-form-grid">
                <label className="manager-field">
                    <span>Tên khóa học</span>
                    <input
                        value={form.title}
                        onChange={(event) => onChange('title', event.target.value)}
                        placeholder="TOEIC Starter"
                    />
                </label>

                <label className="manager-field">
                    <span>Slug</span>
                    <input
                        value={form.slug}
                        onChange={(event) => onChange('slug', event.target.value)}
                        placeholder="toeic-starter"
                    />
                </label>

                <label className="manager-field manager-field-full">
                    <span>Mô tả</span>
                    <textarea
                        rows="4"
                        value={form.description}
                        onChange={(event) => onChange('description', event.target.value)}
                        placeholder="Mô tả ngắn về khóa học"
                    />
                </label>

                <label className="manager-field manager-field-full">
                    <span>Liên kết ảnh thumbnail</span>
                    <input
                        value={form.thumbnailUrl}
                        onChange={(event) => onChange('thumbnailUrl', event.target.value)}
                        placeholder="https://example.com/course-thumb.jpg"
                    />
                </label>

                <label className="manager-field">
                    <span>Ngôn ngữ</span>
                    <input
                        value={form.language}
                        onChange={(event) => onChange('language', event.target.value)}
                        placeholder="en"
                    />
                </label>
            </div>
            <div className="cv-modal-footer cv-modal-footer-split">
                <button className="btn btn-secondary" type="button" onClick={onClose}>
                    Hủy
                </button>
                <button className="btn btn-primary" type="button" onClick={onSubmit} disabled={submitting}>
                    {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật khóa học' : 'Tạo khóa học'}
                </button>
            </div>
        </CustomModal>
    );
}

export default function ManagerCourses() {
    const [searchInput, setSearchInput] = useState('');
    const deferredSearch = useDeferredValue(searchInput);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [coursesData, setCoursesData] = useState({ items: [], meta: null, filters: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ message: '', type: 'error' });
    const [modalMode, setModalMode] = useState('');
    const [form, setForm] = useState(createEmptyCourseForm());
    const [editingCourse, setEditingCourse] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setPage(1);
            setSearch(deferredSearch.trim());
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [deferredSearch]);

    useEffect(() => {
        let active = true;
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(PAGE_SIZE));
        if (search) params.set('search', search);

        setLoading(true);
        setError('');

        axiosClient.get(`/admin/courses?${params.toString()}`)
            .then((data) => {
                if (!active) return;
                setCoursesData(data);
            })
            .catch((err) => {
                if (!active) return;
                setCoursesData({ items: [], meta: null, filters: null });
                setError(err.response?.data?.error || err.message || 'Không tải được danh sách khóa học.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [page, search]);

    const meta = coursesData?.meta;
    const items = coursesData?.items || [];

    useEffect(() => {
        if (!loading && meta?.totalPages > 0 && page > meta.totalPages) {
            setPage(meta.totalPages);
        }
    }, [loading, meta?.totalPages, page]);

    const closeForm = () => {
        setModalMode('');
        setEditingCourse(null);
        setForm(createEmptyCourseForm());
    };

    const openCreateModal = () => {
        setEditingCourse(null);
        setForm(createEmptyCourseForm());
        setModalMode('create');
    };

    const openEditModal = (course) => {
        setEditingCourse(course);
        setForm({
            title: course.title || '',
            slug: course.slug || '',
            description: course.description || '',
            thumbnailUrl: course.thumbnailUrl || '',
            language: course.language || 'en',
        });
        setModalMode('edit');
    };

    const updateForm = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const refetchCourses = async (nextPage = page) => {
        const params = new URLSearchParams();
        params.set('page', String(nextPage));
        params.set('limit', String(PAGE_SIZE));
        if (search) params.set('search', search);

        const data = await axiosClient.get(`/admin/courses?${params.toString()}`);
        setCoursesData(data);
    };

    const handleSubmitCourse = async () => {
        setSubmitting(true);

        try {
            if (modalMode === 'edit' && editingCourse) {
                await axiosClient.put(`/admin/courses/${editingCourse.id}`, form);
                setToast({ message: `Đã cập nhật khóa học ${form.title}.`, type: 'success' });
            } else {
                await axiosClient.post('/admin/courses', form);
                setToast({ message: `Đã tạo khóa học ${form.title}.`, type: 'success' });
            }

            closeForm();
            setPage(1);
            await refetchCourses(modalMode === 'create' ? 1 : page);
        } catch (err) {
            setToast({
                message: err.response?.data?.error || err.message || 'Lưu khóa học thất bại.',
                type: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!pendingDelete?.id) return;

        setSubmitting(true);
        try {
            await axiosClient.delete(`/admin/courses/${pendingDelete.id}`);
            setToast({ message: `Đã xóa khóa học ${pendingDelete.title}.`, type: 'success' });
            setPendingDelete(null);
            const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
            if (nextPage !== page) {
                setPage(nextPage);
            }
            await refetchCourses(nextPage);
        } catch (err) {
            setToast({
                message: err.response?.data?.error || err.message || 'Xóa khóa học thất bại.',
                type: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="manager-page">
            <section className="manager-panel">
                <div className="manager-panel-head manager-panel-head-wrap">
                    <div>
                        <h2>Khóa học</h2>
                        <p className="manager-muted-text">
                            Quản lý khóa học, ảnh thumbnail, slug và cấu trúc nội dung cấp khóa học trong hệ thống.
                        </p>
                    </div>
                    <button type="button" className="manager-primary-btn" onClick={openCreateModal}>
                        Tạo khóa học
                    </button>
                </div>

                <div className="manager-toolbar manager-toolbar-courses">
                    <label className="manager-field manager-field-grow">
                        <span>Tìm kiếm</span>
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Tìm theo tên hoặc slug"
                        />
                    </label>
                    <button
                        type="button"
                        className="manager-secondary-btn"
                        onClick={() => {
                            setSearchInput('');
                            setSearch('');
                            setPage(1);
                        }}
                    >
                        Đặt lại
                    </button>
                </div>

                {error ? <p className="manager-error-text">{error}</p> : null}

                <div className="manager-card-grid">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <article key={`course-skeleton-${index}`} className="manager-content-card manager-card-skeleton">
                                <div className="manager-card-skeleton-block"></div>
                                <div className="manager-card-skeleton-line"></div>
                                <div className="manager-card-skeleton-line short"></div>
                            </article>
                        ))
                    ) : null}

                    {!loading && !items.length ? (
                        <div className="manager-chart-empty">Không có khóa học nào khớp với bộ lọc hiện tại.</div>
                    ) : null}

                    {!loading && items.map((course) => (
                        <article key={course.id} className="manager-content-card">
                            <div className="manager-content-card-top">
                                <div className="manager-content-main">
                                    <span className="manager-content-label">Khóa học #{course.id}</span>
                                    <h3>{course.title}</h3>
                                </div>
                                <span className="manager-table-pill">{course.language}</span>
                            </div>

                            <div className="manager-course-thumbnail">
                                {course.thumbnailUrl ? (
                                    <img src={course.thumbnailUrl} alt={course.title} />
                                ) : (
                                    <div className="manager-course-thumbnail-empty">Chưa có ảnh</div>
                                )}
                            </div>

                            <p className="manager-muted-text manager-card-description">{course.description || 'Chưa có mô tả.'}</p>

                            <div className="manager-course-metrics">
                                <div>
                                    <span>Chủ đề</span>
                                    <strong>{course.topicCount}</strong>
                                </div>
                                <div>
                                    <span>Thẻ từ</span>
                                    <strong>{course.vocabularyCount}</strong>
                                </div>
                            </div>

                            <div className="manager-course-meta">
                                <span className="manager-course-slug">Slug: {course.slug}</span>
                                <span>Cập nhật: {new Date(course.updatedAt).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <div className="manager-table-actions">
                                <Link to={`/manager/courses/${course.id}/topics`} className="manager-inline-action">
                                    Chủ đề và từ
                                </Link>
                                <button type="button" className="manager-table-action" onClick={() => openEditModal(course)}>
                                    Sửa
                                </button>
                                <button
                                    type="button"
                                    className="manager-table-action is-danger"
                                    onClick={() => setPendingDelete(course)}
                                >
                                    Xóa
                                </button>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="manager-pagination">
                    <button
                        type="button"
                        className="manager-secondary-btn"
                        disabled={!meta || meta.page <= 1 || loading}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                        Trước
                    </button>
                    <span className="manager-pagination-status">
                        Trang {meta?.page || 1} / {meta?.totalPages || 1}
                    </span>
                    <button
                        type="button"
                        className="manager-secondary-btn"
                        disabled={!meta || meta.page >= meta.totalPages || loading || !meta?.totalPages}
                        onClick={() => setPage((current) => current + 1)}
                    >
                        Sau
                    </button>
                </div>
            </section>

            <CourseFormModal
                isOpen={modalMode === 'create' || modalMode === 'edit'}
                mode={modalMode}
                form={form}
                onChange={updateForm}
                onClose={closeForm}
                onSubmit={handleSubmitCourse}
                submitting={submitting}
            />

            <ConfirmActionModal
                isOpen={Boolean(pendingDelete)}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleDeleteCourse}
                title="Xóa khóa học này?"
                message={pendingDelete ? `Khóa học "${pendingDelete.title}" và toàn bộ chủ đề, thẻ từ bên trong sẽ bị xóa.` : ''}
                confirmLabel={submitting ? 'Đang xóa...' : 'Xóa khóa học'}
                cancelLabel="Hủy"
            />

            {toast.message ? (
                <ToastNotice
                    message={toast.message}
                    type={toast.type}
                    onHide={() => setToast({ message: '', type: 'error' })}
                />
            ) : null}
        </main>
    );
}
