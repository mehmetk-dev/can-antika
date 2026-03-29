export default function ProductLoading() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Image skeleton */}
                <div className="space-y-4">
                    <div className="aspect-[3/4] w-full animate-pulse rounded-lg bg-muted" />
                    <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-square w-20 animate-pulse rounded-md bg-muted" />
                        ))}
                    </div>
                </div>

                {/* Info skeleton */}
                <div className="space-y-4 py-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                    <div className="space-y-2 pt-2">
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="pt-4 space-y-3">
                        <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
                        <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
                    </div>
                </div>
            </div>
        </div>
    )
}
