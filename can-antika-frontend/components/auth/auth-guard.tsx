"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

interface AuthGuardProps {
    children: React.ReactNode;
    adminOnly?: boolean;
}

export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            // Admin sayfalarından admin girişine, diğerlerinden normal girişe yönlendir
            router.replace(adminOnly ? "/admin/giris" : "/giris");
            return;
        }
        if (adminOnly && !isAdmin) {
            router.replace("/admin/giris");
        }
    }, [isAuthenticated, isAdmin, isLoading, adminOnly, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!isAuthenticated) return null;
    if (adminOnly && !isAdmin) return null;

    return <>{children}</>;
}
