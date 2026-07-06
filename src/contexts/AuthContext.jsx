import { useEffect, useState } from 'react';
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
                const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
                const authUser = userData?.user;
                if (userError || !authUser?.id) {
                    return false;
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, legacy_user_id, email, name, role, status')
                    .eq('id', authUser.id)
                    .maybeSingle();

                if (profileError) {
                    return false;
                }

                if (active) {
                    applyUser({
                        id: profile?.legacy_user_id ?? null,
                        profileId: authUser.id,
                        authUserId: authUser.id,
                        email: profile?.email || authUser.email,
                        name: profile?.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email,
                        role: profile?.role || 'user',
                        status: profile?.status || 'active',
                        token: accessToken,
                    });
                    return true;
                }

                return Boolean(profile);
            } catch {
                return false;
            }
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
