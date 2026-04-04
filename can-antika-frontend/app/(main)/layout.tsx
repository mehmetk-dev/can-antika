
import dynamic from "next/dynamic"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const SitePopup = dynamic(() => import("@/components/home/site-popup").then(m => ({ default: m.SitePopup })), { ssr: false })

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
            <SitePopup />
        </div>
    )
}
