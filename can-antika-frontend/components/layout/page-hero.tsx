import Image from "next/image"

interface PageHeroProps {
  imageSrc: string
  imageAlt: string
  eyebrow: string
  title: string
  description: string
  priority?: boolean
}

export function PageHero({ imageSrc, imageAlt, eyebrow, title, description, priority = false }: PageHeroProps) {
  return (
    <section className="relative flex min-h-[450px] flex-col items-center justify-center overflow-hidden py-32">
      <div className="absolute inset-0">
        <Image src={imageSrc} alt={imageAlt} fill priority={priority} sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/90 to-primary/95" />
      </div>

      <div className="pointer-events-none absolute bottom-8 left-8 right-8 top-8 border border-accent/20" />
      <div className="pointer-events-none absolute bottom-12 left-12 right-12 top-12 border border-accent/10" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-accent/50" />
          <div className="h-2 w-2 rotate-45 border border-accent/50" />
          <div className="h-px w-16 bg-accent/50" />
        </div>

        <span className="mb-4 inline-block font-serif text-lg uppercase tracking-widest text-accent">{eyebrow}</span>

        <h1 className="font-serif text-5xl font-bold leading-tight text-primary-foreground md:text-6xl">
          {title}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-primary-foreground/80">
          {description}
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="h-px w-24 bg-accent/50" />
          <div className="h-3 w-3 rotate-45 bg-accent/30" />
          <div className="h-px w-24 bg-accent/50" />
        </div>
      </div>
    </section>
  )
}
