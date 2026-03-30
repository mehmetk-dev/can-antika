import { Loader2 } from "lucide-react"

export default function BlogLoading() {
    return (
        <div className="bg-background">
            <div className="flex items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </div>
    )
}
