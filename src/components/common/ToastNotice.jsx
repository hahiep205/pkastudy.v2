import { useEffect } from 'react';

export default function ToastNotice({ message, type = 'error', onHide, duration = 2600 }) {
    useEffect(() => {
        if (!message || !onHide) return undefined;

        const timeoutId = window.setTimeout(() => {
            onHide();
        }, duration);

        return () => window.clearTimeout(timeoutId);
    }, [duration, message, onHide]);

    return (
        <div
            className={`cv-toast ${message ? 'cv-toast-show' : ''} cv-toast-${type}`}
            role="status"
            aria-live="polite"
        >
            {message}
        </div>
    );
}
