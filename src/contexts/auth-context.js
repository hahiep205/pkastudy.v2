import { createContext } from 'react';

export const guestUser = {
    id: null,
    profileId: null,
    authUserId: null,
    name: 'Guest User',
    email: null,
    role: 'guest',
    status: 'active',
    token: null,
};

export const AuthContext = createContext();

export function normalizeUser(user) {
    if (!user || typeof user !== 'object') {
        return guestUser;
    }

    return {
        id: user.id ?? null,
        profileId: user.profileId ?? null,
        authUserId: user.authUserId ?? null,
        name: user.name || guestUser.name,
        email: user.email || null,
        role: user.role || 'user',
        status: user.status || 'active',
        samplePersonalTopicSeededAt: user.samplePersonalTopicSeededAt || null,
        token: user.token || null,
    };
}

export function getInitialUser() {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? normalizeUser(JSON.parse(storedUser)) : guestUser;
    } catch {
        return guestUser;
    }
}
