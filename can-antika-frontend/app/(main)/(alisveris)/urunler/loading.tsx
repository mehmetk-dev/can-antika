import { CatalogClient } from "./catalog-client"

function CatalogSkeleton() {
  return (
    <div className="bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-px w-8 bg-primary/40 hidden lg:block" />
            <span className="text-xs uppercase tracking-[0.2em] text-primary">Koleksiyonumuz</span>
            <span className="h-px w-8 bg-primary/40 hidden lg:block" />
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Antika Hazineler
          </h1>
          <p className="mt-2 text-muted-foreground">Koleksiyon yükleniyor…</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-primary/10 bg-card">
              <div className="aspect-[3/4] animate-pulse bg-muted/60" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted/70" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default CatalogSkeleton
