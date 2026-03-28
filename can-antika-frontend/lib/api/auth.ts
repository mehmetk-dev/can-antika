import { api } from "../api-client";
import type {
    LoginResponse,
    LoginRequest,
    RegisterRequest,
    ChangePasswordRequest,
    UserResponse,
} from "../types";

function normalizeAuthUser(payload: UserResponse | LoginResponse): UserResponse {
    if ("user" in payload && payload.user) {
        return payload.user;
    }
    return payload as UserResponse;
}

export const authApi = {
    login: async (data: LoginRequest) => {
        const payload = await api.post<UserResponse | LoginResponse>("/v1/auth/login", {
            body: data,
            noAuth: true,
            headers: {
                "X-RateLimit-Subject": data.email?.trim().toLowerCase() || "anonymous",
            },
        });
        return normalizeAuthUser(payload);
    },

    register: (data: RegisterRequest) =>
        api.post<Record<string, string>>("/v1/auth/register", { body: data, noAuth: true }),

    refreshToken: async () => {
        const payload = await api.post<UserResponse | LoginResponse>("/v1/auth/refresh-token", { noAuth: true });
        return normalizeAuthUser(payload);
    },

    forgotPassword: (email: string) =>
        api.post<string>("/v1/auth/forgot-password", { params: { email }, noAuth: true }),

    resetPassword: (data: { token: string; newPassword: string }) =>
        api.post<string>("/v1/auth/reset-password", { body: data, noAuth: true }),

    changePassword: (data: ChangePasswordRequest) =>
        api.post<string>("/v1/auth/change-password", { body: data }),

    updateProfile: (data: { name: string }) =>
        api.put<UserResponse>("/v1/auth/profile", { body: data }),

    getProfile: () =>
        api.get<UserResponse>("/v1/auth/me"),

    logout: () =>
        api.post<string>("/v1/auth/logout"),

    deactivateMyAccount: () =>
        api.delete<string>("/v1/user/me"),
};

