import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
import ToastNotice from '../../components/common/ToastNotice';
import CustomModal from '../../components/customDocs/CustomModal';
import axiosClient from '../../utils/axiosClient';

const PAGE_SIZE = 8;

function createEmptyTestForm() {
    return {
        title: '',
        description: '',
    };
}

function ToeicTestFormModal({ isOpen, mode, form, onChange, onClose, onSubmit, submitting }) {
    const isEdit = mode === 'edit';

    return (
        <CustomModal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Chỉnh sửa đề TOEIC' : 'Tạo đề TOEIC'}>
            <div className="cv-modal-body manager-form-grid">
                <label className="manager-field manager-field-full">
                    <span>Tên đề</span>
                    <input
                        value={form.title}
                        onChange={(event) => onChange('title', event.target.value)}
                        placeholder="ETS 2023 Test 1"
                    />
                </label>

                <label className="manager-field manager-field-full">
                    <span>Mô tả</span>
                    <textarea
                        rows="4"
                        value={form.description}
                        onChange={(event) => onChange('description', event.target.value)}
                        placeholder="Ghi chú ngắn về đề, nguồn đề hoặc phạm vi luyện tập"
                    />
                </label>
            </div>
            <div className="cv-modal-footer cv-modal-footer-split">
                <button className="btn btn-secondary" type="button" onClick={onClose}>Hủy</button>
                <button className="btn btn-primary" type="button" onClick={onSubmit} disabled={submitting}>
                    {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật đề' : 'Tạo đề'}
                </button>
            </div>
        </CustomModal>
    );
}

async function fetchAllQuestionsByTest(testId) {
    const firstPage = await axiosClient.get(`/admin/toeic/tests/${testId}/questions?page=1&limit=100`);
    let items = firstPage.items || [];
    const totalPages = firstPage.meta?.totalPages || 1;

    for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
        const nextPage = await axiosClient.get(`/admin/toeic/tests/${testId}/questions?page=${currentPage}&limit=100`);
        items = items.concat(nextPage.items || []);
    }

    return items;
}

export default function ManagerToeic() {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const deferredSearch = useDeferredValue(searchInput);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [testsData, setTestsData] = useState({ items: [], meta: null, filters: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ message: '', type: 'error' });
    const [modalMode, setModalMode] = useState('');
    const [form, setForm] = useState(createEmptyTestForm());
    const [editingTest, setEditingTest] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [expandedTestId, setExpandedTestId] = useState(null);
    const [expandedQuestionsMap, setExpandedQuestionsMap] = useState({});
    const [expandingId, setExpandingId] = useState(null);

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

        axiosClient.get(`/admin/toeic/tests?${params.toString()}`)
            .then((data) => {
                if (!active) return;
                setTestsData(data);
            })
            .catch((err) => {
                if (!active) return;
                setTestsData({ items: [], meta: null, filters: null });
                setError(err.response?.data?.error || err.message || 'Không tải được danh sách đề TOEIC.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [page, search]);

    const meta = testsData?.meta;
    const items = testsData?.items || [];

    useEffect(() => {
        if (!loading && meta?.totalPages > 0 && page > meta.totalPages) {
            setPage(meta.totalPages);
        }
    }, [loading, meta?.totalPages, page]);

    const closeForm = () => {
        setModalMode('');
        setEditingTest(null);
        setForm(createEmptyTestForm());
    };

    const openCreateModal = () => {
        setEditingTest(null);
        setForm(createEmptyTestForm());
        setModalMode('create');
    };

    const openEditModal = (test) => {
        setEditingTest(test);
        setForm({
            title: test.title || '',
            description: test.description || '',
        });
        setModalMode('edit');
    };

    const updateForm = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const refetchTests = async (nextPage = page) => {
        const params = new URLSearchParams();
        params.set('page', String(nextPage));
        params.set('limit', String(PAGE_SIZE));
        if (search) params.set('search', search);

        const data = await axiosClient.get(`/admin/toeic/tests?${params.toString()}`);
        setTestsData(data);
    };

    const handleSubmitTest = async () => {
        setSubmitting(true);

        try {
            if (modalMode === 'edit' && editingTest) {
                await axiosClient.put(`/admin/toeic/tests/${editingTest.id}`, form);
                setToast({ message: `Đã cập nhật đề ${form.title}.`, type: 'success' });
            } else {
                await axiosClient.post('/admin/toeic/tests', form);
                setToast({ message: `Đã tạo đề ${form.title}.`, type: 'success' });
            }

            closeForm();
            setPage(1);
            await refetchTests(modalMode === 'create' ? 1 : page);
        } catch (err) {
            setToast({
                message: err.response?.data?.error || err.message || 'Lưu đề TOEIC thất bại.',
                type: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTest = async () => {
        if (!pendingDelete?.id) return;

        setSubmitting(true);
        try {
            await axiosClient.delete(`/admin/toeic/tests/${pendingDelete.id}`);
            setToast({ message: `Đã xóa đề ${pendingDelete.title}.`, type: 'success' });
            setPendingDelete(null);
            const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
            if (nextPage !== page) setPage(nextPage);
            await refetchTests(nextPage);
        } catch (err) {
            setToast({
                message: err.response?.data?.error || err.message || 'Xóa đề TOEIC thất bại.',
                type: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleTestDetails = async (testId) => {
        if (expandedTestId === testId) {
            setExpandedTestId(null);
            return;
        }

        setExpandedTestId(testId);

        if (expandedQuestionsMap[testId]) return;

        setExpandingId(testId);
        try {
            const allQuestions = await fetchAllQuestionsByTest(testId);
            setExpandedQuestionsMap((current) => ({
                ...current,
                [testId]: allQuestions,
            }));
        } catch (err) {
            setToast({
                message: err.response?.data?.error || err.message || 'Không tải được danh sách câu hỏi của đề.',
                type: 'error',
            });
        } finally {
            setExpandingId(null);
        }
    };

    const partSummaryByTest = useMemo(() => {
        const summary = {};

        Object.entries(expandedQuestionsMap).forEach(([testId, questions]) => {
            const next = {};
            (questions || []).forEach((question) => {
                if (!next[question.part]) next[question.part] = [];
                next[question.part].push(question);
            });
            summary[testId] = next;
        });

        return summary;
    }, [expandedQuestionsMap]);

    return (
        <main className="manager-page">
            <section className="manager-panel">
                <div className="manager-panel-head manager-panel-head-wrap">
                    <div>
                        <h2>Đề thi TOEIC</h2>
                        <p className="manager-muted-text">
                            Tạo đề, chỉnh sửa đề hiện có và xem toàn bộ danh sách câu hỏi theo từng Part trong từng đề.
                        </p>
                    </div>
                    <button type="button" className="manager-primary-btn" onClick={openCreateModal}>
                        Tạo đề TOEIC
                    </button>
                </div>

                <div className="manager-toolbar manager-toolbar-courses">
                    <label className="manager-field manager-field-grow">
                        <span>Tìm kiếm</span>
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Tìm theo tên đề hoặc mô tả"
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
                            <article key={`toeic-skeleton-${index}`} className="manager-content-card manager-card-skeleton">
                                <div className="manager-card-skeleton-block"></div>
                                <div className="manager-card-skeleton-line"></div>
                                <div className="manager-card-skeleton-line short"></div>
                            </article>
                        ))
                    ) : null}

                    {!loading && !items.length ? (
                        <div className="manager-chart-empty">Không có đề TOEIC nào khớp với bộ lọc hiện tại.</div>
                    ) : null}

                    {!loading && items.map((test) => {
                        const isExpanded = expandedTestId === test.id;
                        const partMap = partSummaryByTest[test.id] || {};

                        return (
                            <article key={test.id} className="manager-content-card">
                                <div className="manager-content-card-top">
                                    <div className="manager-content-main">
                                        <span className="manager-content-label">Đề #{test.id}</span>
                                        <h3>{test.title}</h3>
                                    </div>
                                    <span className="manager-table-pill">Parts: {test.partsUsed || 0}</span>
                                </div>

                                <p className="manager-muted-text manager-card-description">
                                    {test.description || 'Chưa có mô tả cho đề thi này.'}
                                </p>

                                <div className="manager-course-metrics">
                                    <div>
                                        <span>Nhóm câu hỏi</span>
                                        <strong>{test.groupCount}</strong>
                                    </div>
                                    <div>
                                        <span>Câu hỏi</span>
                                        <strong>{test.questionCount}</strong>
                                    </div>
                                    <div>
                                        <span>Ngày tạo</span>
                                        <strong>{new Date(test.createdAt).toLocaleDateString('vi-VN')}</strong>
                                    </div>
                                </div>

                                <div className="manager-table-actions">
                                    <Link to={`/manager/toeic/${test.id}`} className="manager-inline-action">
                                        Mở builder
                                    </Link>
                                    <button type="button" className="manager-table-action" onClick={() => openEditModal(test)}>
                                        Sửa
                                    </button>
                                    <button type="button" className="manager-table-action is-danger" onClick={() => setPendingDelete(test)}>
                                        Xóa
                                    </button>
                                </div>

                                {isExpanded ? (
                                    <div className="manager-toeic-test-parts">
                                        {!expandedQuestionsMap[test.id] && expandingId === test.id ? (
                                            <div className="manager-chart-empty manager-chart-empty-compact">Đang tải danh sách câu hỏi theo part...</div>
                                        ) : null}

                                        {expandedQuestionsMap[test.id] ? (
                                            [1, 2, 3, 4, 5, 6, 7].map((part) => {
                                                const partQuestions = partMap[part] || [];
                                                if (!partQuestions.length) return null;

                                                return (
                                                    <section key={part} className="manager-toeic-part-block">
                                                        <div className="manager-panel-head manager-panel-head-wrap">
                                                            <div>
                                                                <h3>Part {part}</h3>
                                                                <p className="manager-muted-text">{partQuestions.length} câu hỏi</p>
                                                            </div>
                                                            <Link to={`/manager/toeic/${test.id}?part=${part}`} className="manager-inline-action">
                                                                Xem toàn bộ part
                                                            </Link>
                                                        </div>

                                                        <div className="manager-toeic-question-list">
                                                            {partQuestions.map((question) => (
                                                                <article
                                                                    key={question.id}
                                                                    className="manager-toeic-question-item is-clickable"
                                                                    onClick={() => {
                                                                        navigate(`/manager/toeic/${test.id}?part=${part}&question=${question.id}&edit=1`);
                                                                    }}
                                                                >
                                                                    <div className="manager-content-main">
                                                                        <span className="manager-content-label">Câu #{question.questionNumber}</span>
                                                                        <strong>{question.questionText || 'Câu hỏi không có nội dung text'}</strong>
                                                                    </div>
                                                                    <div className="manager-table-actions">
                                                                        <Link
                                                                            to={`/manager/toeic/${test.id}?part=${part}&question=${question.id}`}
                                                                            className="manager-table-action"
                                                                            onClick={(event) => event.stopPropagation()}
                                                                        >
                                                                            Chi tiết
                                                                        </Link>
                                                                        <Link
                                                                            to={`/manager/toeic/${test.id}?part=${part}&question=${question.id}&edit=1`}
                                                                            className="manager-table-action"
                                                                            onClick={(event) => event.stopPropagation()}
                                                                        >
                                                                            Sửa
                                                                        </Link>
                                                                    </div>
                                                                </article>
                                                            ))}
                                                        </div>
                                                    </section>
                                                );
                                            })
                                        ) : null}
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}
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

            <ToeicTestFormModal
                isOpen={modalMode === 'create' || modalMode === 'edit'}
                mode={modalMode}
                form={form}
                onChange={updateForm}
                onClose={closeForm}
                onSubmit={handleSubmitTest}
                submitting={submitting}
            />

            <ConfirmActionModal
                isOpen={Boolean(pendingDelete)}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleDeleteTest}
                title="Xóa đề TOEIC này?"
                message={pendingDelete ? `Đề "${pendingDelete.title}" và toàn bộ nhóm câu hỏi, câu hỏi bên trong sẽ bị xóa.` : ''}
                confirmLabel={submitting ? 'Đang xóa...' : 'Xóa đề'}
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
