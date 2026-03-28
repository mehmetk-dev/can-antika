"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { RegisterForm } from "@/components/auth/register-form"
import { useAuth } from "@/lib/auth/auth-context"

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/hesap")
    }
  }, [isLoading, isAuthenticated, router])

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/antique-dealer-examining-vintage-clock-with-magnif.jpg"
          alt="Antika degerlendirme"
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <Link href="/" className="absolute top-8 left-8">
            <span className="font-serif text-3xl font-semibold text-primary-foreground">Can Antika</span>
          </Link>
          <blockquote className="max-w-md">
            <p className="font-serif text-2xl font-medium text-primary-foreground leading-relaxed">
              &ldquo;Her antika, zamanda yolculuk yapmaniza izin veren bir penceredir.&rdquo;
            </p>
            <footer className="mt-4 text-primary-foreground/70">&mdash; Koleksiyoner, Mehmet Kaya</footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-12 xl:px-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="lg:hidden inline-block mb-8">
            <span className="font-serif text-2xl font-semibold text-primary">Can Antika</span>
          </Link>

          <RegisterForm onSwitchToLogin={() => router.push("/giris")} />
        </div>
      </div>
    </div>
  )
}