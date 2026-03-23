"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import type { UserResponse, LoginRequest, RegisterRequest } from "./types";
import { authApi, cartApi } from "./api";
import { guestCart } from "./guest-cart";

interface AuthContextType {
    user: UserResponse | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<UserResponse>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Sayfa yüklendiğinde cookie ile backend'e doğrulat
    // HttpOnly cookie olduğu için JS'den kontrol edemiyoruz, sessizce deneriz
    useEffect(() => {
        authApi.getProfile()
            .then((profile) => setUser(profile ?? null))
            .catch(() => {
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (data: LoginRequest) => {
        // Backend cookie set eder, response body sadece user döner
        const user = await authApi.login(data);
        setUser(user);

        // Guest sepetindeki ürünleri backend'e senkronize et
        const guestItems = guestCart.toSyncPayload();
        if (guestItems.length > 0) {
            cartApi.syncCart(guestItems)
                .then(() => guestCart.clear())
                .catch(() => { /* senkronizasyon başarısız olursa guest cart kalır */ });
        }

        return user;
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        await authApi.register(data);
    }, []);

    const logout = useCallback(() => {
        authApi.logout().catch(() => {
            // Backend logout başarısız olsa bile local cleanup devam eder
        });
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const freshUser = await authApi.getProfile();
            setUser(freshUser);
        } catch {
            // Sessiz yakala — mevcut user kalır
        }
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN",
        isLoading,
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
