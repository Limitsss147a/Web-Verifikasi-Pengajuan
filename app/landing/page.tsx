'use client'

import { DottedSurface } from "@/components/ui/dotted-surface"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight, LogIn } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  return (
    <main className="dark relative min-h-screen w-full overflow-hidden bg-[#020617] flex flex-col items-center justify-center p-4">
      {/* Background Image (Blurred) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/landing-assets/bg-logo.png"
          alt="Background"
          fill
          className="object-cover opacity-30 blur-2xl"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 via-[#020617]/40 to-[#020617]" />
      </div>

      {/* Three.js Dotted Surface */}
      <DottedSurface className="opacity-40" forceDark />

      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        {/* Logo Container */}
        <div className="relative w-32 h-32 mb-4 group">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl group-hover:bg-primary/30 transition-all duration-500" />
          <div className="relative w-full h-full rounded-full border-2 border-primary/20 backdrop-blur-sm p-2 overflow-hidden bg-black/5 shadow-2xl">
            <Image
              src="/landing-assets/bg-logo.png"
              alt="Logo"
              fill
              className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Hero Text */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
            Sistem Informasi Anggaran
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Pengelolaan Anggaran Daerah yang Transparan, Akuntabel, dan Terintegrasi.
          </p>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
          {["Penyusunan RKA", "Review Bapperida", "Validasi Setda", "Penganggaran Digital"].map((tag) => (
            <span
              key={tag}
              className="px-4 py-1.5 rounded-full border border-primary/10 bg-primary/5 backdrop-blur-md text-xs font-semibold text-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
          <Button asChild size="lg" className="h-12 px-8 text-base font-semibold group w-full sm:w-auto">
            <Link href="/auth/login">
              Mulai Sekarang
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-semibold backdrop-blur-sm w-full sm:w-auto">
            <Link href="/auth/login" className="group">
              <LogIn className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              Masuk ke Dashboard
            </Link>
          </Button>
        </div>

        {/* Decoration */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 blur-[120px] rounded-full -z-1" />
      </div>

      {/* Footer / Info */}
      <footer className="absolute bottom-8 z-10 text-xs text-muted-foreground/60 font-medium">
        &copy; {new Date().getFullYear()} Pemerintah Daerah - Sistem Informasi Anggaran v2.0
      </footer>
    </main>
  )
}
