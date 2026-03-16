import { api } from "../api-client";
import type {
    LoginRequest,
    RegisterRequest,
    ChangePasswordRequest,
    UserResponse,
} from "../types";

export const authApi = {
    login: (data: LoginRequest) =>
        api.post<UserResponse>("/v1/auth/login", { body: data, noAuth: true }),

    register: (data: RegisterRequest) =>
        api.post<Record<string, string>>("/v1/auth/register", { body: data, noAuth: true }),

    refreshToken: () =>
        api.post<UserResponse>("/v1/auth/refresh-token", { noAuth: true }),

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
