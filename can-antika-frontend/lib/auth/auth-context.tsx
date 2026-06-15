"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import type { UserResponse, LoginRequest, RegisterRequest, ChangePasswordRequest } from "../types";
import { authApi, cartApi } from "../api";
import { guestCart } from "../commerce/guest-cart";
import { clearAuthSessionFlag, hasAuthSessionFlag, markAuthSessionActive } from "./auth-session";
import { toast } from "sonner";

interface AuthContextType {
    user: UserResponse | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<UserResponse>;
    register: (data: RegisterRequest) => Promise<void>;
    changePassword: (data: ChangePasswordRequest) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<UserResponse | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    // Always start as loading so server and client render the same initial state
    // (hasAuthSessionFlag uses localStorage which is unavailable on the server)
    const [isLoading, setIsLoading] = useState(true);

    // Sayfa yüklendiğinde cookie ile backend'e doğrulat
    // HttpOnly cookie olduğu için JS'den kontrol edemiyoruz, sessizce deneriz
    useEffect(() => {
        if (!hasAuthSessionFlag()) {
            queueMicrotask(() => setIsLoading(false));
            return;
        }

        const fetchProfile = () => {
            authApi.getProfile()
                .then((profile) => {
                    setUser(profile ?? null);
                    if (profile) {
                        markAuthSessionActive();
                    } else {
                        clearAuthSessionFlag();
                    }
                })
                .catch(() => {
                    setUser(null);
                    clearAuthSessionFlag();
                })
                .finally(() => setIsLoading(false));
        };

        // Hidrasyon sırasında ağ bant genişliğini tüketmemek için geciktir
        if (typeof requestIdleCallback === "function") {
            const id = requestIdleCallback(fetchProfile, { timeout: 2000 });
            return () => cancelIdleCallback(id);
        }
        const timer = setTimeout(fetchProfile, 100);
        return () => clearTimeout(timer);
    }, []);

    const login = useCallback(async (data: LoginRequest) => {
        // Backend cookie set eder, response body sadece user döner
        const user = await authApi.login(data);
        markAuthSessionActive();

        // Guest sepetindeki ürünleri backend'e senkronize et
        const guestItems = guestCart.toSyncPayload();
        if (guestItems.length > 0) {
            try {
                await cartApi.syncCart(guestItems);
                guestCart.clear();
            } catch {
                toast.error("Sepetiniz hesaba aktarılırken hata oluştu. Misafir sepetiniz korunuyor.");
            }
        }

        setUser(user);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));

        return user;
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        await authApi.register(data);
    }, []);

    const clearLocalSession = useCallback(() => {
        clearAuthSessionFlag();
        setUser(null);
        guestCart.clear();
    }, []);

    const logout = useCallback(() => {
        void authApi.logout().catch(() => {
            // Backend logout başarısız olsa bile local cleanup devam eder
        });
        clearLocalSession();
    }, [clearLocalSession]);

    const changePassword = useCallback(async (data: ChangePasswordRequest) => {
        await authApi.changePassword(data);
        clearLocalSession();
    }, [clearLocalSession]);

    const refreshUser = useCallback(async () => {
        try {
            const freshUser = await authApi.getProfile();
            const guestItems = guestCart.toSyncPayload();
            if (guestItems.length > 0) {
                try {
                    await cartApi.syncCart(guestItems);
                    guestCart.clear();
                } catch {
                    toast.error("Sepetiniz hesaba aktarÄ±lÄ±rken hata oluÅŸtu. Misafir sepetiniz korunuyor.");
                }
            }
            setUser(freshUser);
            markAuthSessionActive();
            return freshUser;
        } catch {
            setUser(null);
            clearAuthSessionFlag();
            // Sessiz yakala — çağıran ekran gerekli yönlendirmeyi yapar
            return null;
        }
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN",
        isLoading,
        login,
        register,
        changePassword,
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
