import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
import ToastNotice from '../../components/common/ToastNotice';
import CustomModal from '../../components/customDocs/CustomModal';
import axiosClient from '../../utils/axiosClient';

const PAGE_SIZE = 8;

function slugifyFilePart(value) {
    return String(value || 'toeic-test')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

function downloadJsonFile(data, fileName) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8',
    });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
}

function createEmptyTestForm() {
    return {
        title: '',
        description: '',
    };
}

function ToeicTestFormModal({
    isOpen,
    mode,
    form,
    onChange,
    onClose,
    onSubmit,
    submitting,
}) {
    const isEdit = mode === 'edit';

    return (
        <CustomModal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Chỉnh sửa đề TOEIC' : 'Tạo đề TOEIC'}>
            <div className="cv-modal-body manager-form-grid">
                <label className="manager-field">
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

export default function ManagerToeic() {
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
    const [exportingTestId, setExportingTestId] = useState(null);
    const [importing, setImporting] = useState(false);
    const importInputRef = useRef(null);

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

    const handleExportTest = async (test) => {
        if (!test?.id) return;

        setExportingTestId(test.id);
        try {
            const data = await axiosClient.get(`/admin/toeic/tests/${test.id}/export`);
            const fileName = `${slugifyFilePart(test.title)}.toeic-test-export.v1.json`;
            downloadJsonFile(data, fileName);
            setToast({ message: `Đã export đề ${test.title}.`, type: 'success' });
        } catch (err) {
            setToast({
                message: err.response?.data?.error || err.message || 'Export đề TOEIC thất bại.',
                type: 'error',
            });
        } finally {
            setExportingTestId(null);
        }
    };

    const handleImportButtonClick = () => {
        importInputRef.current?.click();
    };

    const handleImportTest = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setImporting(true);
        try {
            const rawText = await file.text();
            let payload;

            try {
                payload = JSON.parse(rawText);
            } catch {
                throw new Error('File JSON không hợp lệ.');
            }

            const data = await axiosClient.post('/admin/toeic/tests/import', payload);
            setPage(1);
            await refetchTests(1);
            setToast({
                message: `Đã import đề ${data.test?.title || payload?.test?.title || file.name}.`,
                type: 'success',
            });
        } catch (err) {
            setToast({
                message: err.response?.data?.error || err.message || 'Import đề TOEIC thất bại.',
                type: 'error',
            });
        } finally {
            setImporting(false);
        }
    };

    return (
        <main className="manager-page">
            <section className="manager-panel">
                <div className="manager-panel-head manager-panel-head-wrap">
                    <div>
                        <h2>Đề thi TOEIC</h2>
                        <p className="manager-muted-text">
                            Tạo đề, chỉnh sửa đề hiện có và quản lý nhanh các đề thi TOEIC trong hệ thống.
                        </p>
                    </div>
                    <div className="manager-head-actions">
                        <input
                            ref={importInputRef}
                            type="file"
                            accept=".json,application/json"
                            className="manager-course-import-input"
                            onChange={handleImportTest}
                        />
                        <button
                            type="button"
                            className="manager-secondary-btn manager-course-import-btn"
                            onClick={handleImportButtonClick}
                            disabled={importing}
                        >
                            {importing ? 'Đang import...' : 'Import'}
                        </button>
                        <button type="button" className="manager-primary-btn" onClick={openCreateModal}>
                            Tạo đề TOEIC
                        </button>
                    </div>
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

                    {!loading && items.map((test) => (
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
                                    Xem chi tiết
                                </Link>
                                <button type="button" className="manager-table-action" onClick={() => openEditModal(test)}>
                                    Sửa
                                </button>
                                <button
                                    type="button"
                                    className="manager-table-action"
                                    onClick={() => handleExportTest(test)}
                                    disabled={Number(exportingTestId) === Number(test.id)}
                                >
                                    {Number(exportingTestId) === Number(test.id) ? 'Đang export...' : 'Export'}
                                </button>
                                <button type="button" className="manager-table-action is-danger" onClick={() => setPendingDelete(test)}>
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
