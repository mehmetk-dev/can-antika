
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SitePopup } from "@/components/home/site-popup"

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
