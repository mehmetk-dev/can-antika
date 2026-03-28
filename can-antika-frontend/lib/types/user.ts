import type { Role } from "./common";
import type { AddressResponse } from "./address";

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: Role;
    accountNonLocked?: boolean;
    addresses?: AddressResponse[];
    createdAt?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: UserResponse;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role?: Role;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export interface TokenRefreshRequest {
    refreshToken: string;
}
