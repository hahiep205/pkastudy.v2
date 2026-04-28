import CustomModal from '../customDocs/CustomModal';

export default function ConfirmActionModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận',
    message,
    confirmLabel = 'Xóa',
    cancelLabel = 'Hủy',
}) {
    return (
        <CustomModal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="cv-modal-body">
                <p className="cv-confirm-copy">{message}</p>
            </div>
            <div className="cv-modal-footer cv-modal-footer-split">
                <button className="btn btn-secondary" type="button" onClick={onClose}>
                    {cancelLabel}
                </button>
                <button className="btn btn-danger" type="button" onClick={onConfirm}>
                    {confirmLabel}
                </button>
            </div>
        </CustomModal>
    );
}
