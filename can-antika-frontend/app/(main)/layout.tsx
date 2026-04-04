
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SitePopupWrapper } from "@/components/home/site-popup-wrapper"

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
            <SitePopupWrapper />
        </div>
    )
}
