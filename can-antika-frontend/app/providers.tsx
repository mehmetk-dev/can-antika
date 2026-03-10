"use client";

import { AuthProvider } from "@/lib/auth-context";
import { SiteSettingsProvider } from "@/lib/site-settings-context";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SiteSettingsProvider>
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
