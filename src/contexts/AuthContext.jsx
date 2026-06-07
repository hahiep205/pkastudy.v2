import { useEffect, useState } from 'react';
import { AuthContext, getInitialUser, guestUser, normalizeUser } from './auth-context';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getInitialUser);

    const login = (userData) => {
        const normalized = normalizeUser(userData);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
        if (normalized?.token) {
            localStorage.setItem('token', normalized.token);
        }
        window.dispatchEvent(new CustomEvent('auth:user-changed', { detail: { user: normalized } }));
    };

    const logout = () => {
        setUser(guestUser);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('auth:user-changed', { detail: { user: guestUser } }));
    };

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(guestUser);
            window.dispatchEvent(new CustomEvent('auth:user-changed', { detail: { user: guestUser } }));
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
