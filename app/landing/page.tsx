'use client'

import { DottedSurface } from "@/components/ui/dotted-surface"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  return (
    <main className="dark relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Three.js Dotted Surface */}
      <DottedSurface className="size-full" forceDark />

      {/* Background Image (Very subtle blur for texture) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 transition-opacity duration-1000">
        <Image
          src="/landing-assets/bg-logo.png"
          alt="Background Texture"
          fill
          className="object-cover blur-3xl scale-110"
        />
      </div>

      {/* Radial Gradient Glow like template */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-1/2 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full',
          'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]',
          'blur-[60px]',
          'z-[1]'
        )}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Minimalist Logo */}
        <div className="mb-12 animate-in fade-in zoom-in duration-1000">
          <div className="relative w-20 h-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md p-4 shadow-2xl">
            <Image
              src="/landing-assets/bg-logo.png"
              alt="Logo"
              fill
              className="object-contain p-3"
            />
          </div>
        </div>

        {/* Scaled Title like Template */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <h1 className="font-mono text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-2">
            E-BUDGETING
          </h1>
          <p className="font-mono text-sm md:text-base text-white/40 tracking-[0.3em] uppercase">
            Sistem Informasi Anggaran Daerah
          </p>
        </div>

        {/* Clean CTA */}
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500">
          <Button asChild size="lg" className="h-12 px-10 rounded-full bg-white text-black hover:bg-white/90 font-mono text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Link href="/auth/login" className="flex items-center">
              GET STARTED
              <ArrowRight className="ml-3 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center z-10 pointer-events-none animate-in fade-in duration-1000 delay-1000">
        <p className="font-mono text-[10px] text-white/20 tracking-widest uppercase">
          &copy; {new Date().getFullYear()} PEMDA - v2.0.4.8
        </p>
      </div>
    </main>
  )
}

