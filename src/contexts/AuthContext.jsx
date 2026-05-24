import { useState } from 'react';
import { AuthContext, getInitialUser } from './auth-context';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getInitialUser);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData?.token) {
            localStorage.setItem('token', userData.token);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
