"use client";

import { AuthProvider } from "@/lib/auth/auth-context";
import { SiteSettingsProvider } from "@/lib/site-settings-context";
import type { SiteSettingsResponse } from "@/lib/types";
import { Toaster } from "sonner";

export function Providers({
    children,
    initialSiteSettings,
}: {
    children: React.ReactNode;
    initialSiteSettings?: SiteSettingsResponse | null;
}) {
    return (
        <SiteSettingsProvider initialSettings={initialSiteSettings}>
            <AuthProvider>
                {children}
                <Toaster
                    position="bottom-right"
                    duration={2000}
                    visibleToasts={1}
                    toastOptions={{
                        classNames: {
                            toast: "antique-toast",
                            description: "antique-toast-description",
                            success: "antique-toast-success",
                            error: "antique-toast-error",
                        },
                    }}
                />
            </AuthProvider>
        </SiteSettingsProvider>
    );
}
