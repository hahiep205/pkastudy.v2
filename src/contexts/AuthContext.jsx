import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { supabase } from '../supabase';
import { AuthContext, getInitialUser, guestUser, normalizeUser } from './auth-context';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getInitialUser);

    const applyUser = (nextUser) => {
        const normalized = normalizeUser(nextUser);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
        if (normalized?.token) {
            localStorage.setItem('token', normalized.token);
        } else {
            localStorage.removeItem('token');
        }
        window.dispatchEvent(new CustomEvent('auth:user-changed', { detail: { user: normalized } }));
        return normalized;
    };

    const clearUser = () => {
        setUser(guestUser);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('auth:user-changed', { detail: { user: guestUser } }));
    };

    const login = (userData) => applyUser(userData);

    const logout = async () => {
        clearUser();
        await supabase.auth.signOut().catch(() => undefined);
    };

    useEffect(() => {
        let active = true;

        const syncFromToken = async (accessToken) => {
            if (!accessToken) return false;
            try {
                const result = await axiosClient.post('/auth/session', {
                    accessToken,
                });

                if (active && result?.user) {
                    applyUser({
                        ...result.user,
                        token: result.token || accessToken,
                    });
                    return true;
                }
            } catch {
                return false;
            }
            return false;
        };

        const syncSession = async (session) => {
            if (!session?.access_token) {
                const storedToken = localStorage.getItem('token');
                if (storedToken) {
                    const synced = await syncFromToken(storedToken);
                    if (!synced && active) {
                        clearUser();
                    }
                    return;
                }
                if (active) {
                    clearUser();
                }
                return;
            }

            try {
                const synced = await syncFromToken(session.access_token);
                if (!synced && active) {
                    clearUser();
                }
            } catch {
                if (active) {
                    clearUser();
                }
            }
        };

        const handleUnauthorized = () => {
            clearUser();
            void supabase.auth.signOut().catch(() => undefined);
        };

        void supabase.auth.getSession().then(({ data }) => syncSession(data.session));

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            void syncSession(session);
        });

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => {
            active = false;
            authListener?.subscription?.unsubscribe();
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
