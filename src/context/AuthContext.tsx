import { Toaster } from '@/components/ui/sonner';
import { fetchSheet } from '@/lib/fetchers';
import type { UserPermissions } from '@/types/sheets';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthState {
    loggedIn: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    user: UserPermissions;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('auth');
        if (!stored) {
            setLoading(false);
            return;
        }

        try {
            const parsed = JSON.parse(stored);
            const { username, password, user: storedUser } = parsed;

            // ── Immediately restore session from localStorage so there is no
            //    login-page flash on reload while the background check runs. ──
            if (storedUser) {
                setUserPermissions(storedUser);
                setLoggedIn(true);
            }
            setLoading(false);

            // ── Background re-validation against Supabase ──────────────────
            // If credentials are no longer valid the user will be logged out.
            // If there is a network/fetch error we keep the existing session
            // alive (do NOT wipe localStorage) — this prevents reload from
            // logging the user out when Supabase is temporarily unreachable.
            fetchSheet('USER')
                .then((res) => {
                    const user = (res as UserPermissions[]).find(
                        (u) => u.username === username && u.password === password
                    );
                    if (user) {
                        // Refresh stored user data in case permissions changed
                        setUserPermissions(user);
                        setLoggedIn(true);
                        localStorage.setItem('auth', JSON.stringify({ username, password, user }));
                    } else {
                        // Credentials are no longer valid — force logout
                        localStorage.removeItem('auth');
                        setLoggedIn(false);
                        setUserPermissions(null);
                    }
                })
                .catch((error) => {
                    // Network/Supabase error — keep the existing session alive
                    console.warn('Background auth re-validation failed (keeping session):', error);
                });
        } catch (error) {
            console.error('Error parsing stored auth data:', error);
            localStorage.removeItem('auth');
            setLoading(false);
        }
    }, []);

    async function login(username: string, password: string) {
        try {
            const users = (await fetchSheet('USER')) as UserPermissions[];
            const user = users.find((user) => user.username === username && user.password === password);
            if (user === undefined) {
                return false;
            }

            localStorage.setItem('auth', JSON.stringify({ username, password, user }));
            setUserPermissions(user);
            setLoggedIn(true);
            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    }

    function logout() {
        localStorage.removeItem('auth');
        setLoggedIn(false);
        setUserPermissions(null);
    }

    // Create a default user object to prevent undefined errors
    const defaultUser: UserPermissions = userPermissions || {} as UserPermissions;

    return (
        <AuthContext.Provider value={{
            login,
            loggedIn,
            logout,
            user: defaultUser,
            loading
        }}>
            {children}
            <Toaster expand richColors theme="light" closeButton />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};