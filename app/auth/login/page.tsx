'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel, FieldMessage } from '@/components/ui/field'
import { Shield, Fingerprint, Lock, User, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push(redirectTo)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 bg-[#f8fbff] relative diamond-pattern">
      {/* BPKAD Logo Absolute Overlay */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20 flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-100">
        <Image src="/bpkad-logo.png" alt="BPKAD Logo" width={32} height={32} className="object-contain" />
        <span className="font-heading font-bold text-gray-800 text-sm hidden sm:block tracking-wide">SIVRON — BPKAD</span>
      </div>

      {/* Floating Centered Card */}
      <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden min-h-[650px] relative z-10 border border-gray-100/50">
        
        {/* Left Panel - Dark SIVRON Branding replacing old E-budgeting */}
        <div className="hidden lg:flex flex-col w-1/2 p-12 bg-[#0A0A0F] text-white overflow-hidden relative justify-center items-center">
          <div className="absolute inset-0 bg-[url('/diamond-pattern.svg')] opacity-5 z-0" />
          <div className="absolute inset-x-0 bottom-0 pointer-events-none neon-border opacity-30 h-1/2 z-0" />
          
          <div className="relative z-10 text-center max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-2xl bg-sky-600 mb-8 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-heading text-5xl font-bold tracking-tighter mb-4 text-glow">
              SIVRON<span className="text-sky-500">.</span>
            </h1>
            <p className="font-sans text-base text-white/70 leading-relaxed">
              Sistem Verifikasi RKA Online Daerah yang Transparan dan Akuntabel.
            </p>

            <div className="mt-8 inline-flex items-center justify-center gap-2 bg-sky-500/10 text-sky-400 px-5 py-2.5 rounded-full border border-sky-500/20 text-xs font-mono w-full max-w-[280px]">
               <Lock className="w-4 h-4" /> Sistem Keamanan Terenkripsi
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 md:p-16 bg-white flex flex-col justify-center">
          
          <div className="mb-10 text-left">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-2">Masuk ke Akun</h2>
            <div className="w-12 h-1 bg-sky-500 rounded-full mb-4"></div>
            <p className="text-sm text-gray-500 leading-relaxed">Masukkan email dan password untuk mengakses sistem verifikasi SIVRON.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Field>
              <FieldLabel htmlFor="email" className="font-bold text-sm text-gray-700 mb-2 block">
                Email <span className="text-sky-600">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id="email"
                  type="text"
                  placeholder="nama@instansi.go.id"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-4 h-12 bg-white border-gray-200 rounded-xl focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-all text-sm"
                  disabled={isLoading}
                />
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel htmlFor="password" className="font-bold text-sm text-gray-700 block">
                  Password <span className="text-sky-600">*</span>
                </FieldLabel>
                <Link href="#" className="text-xs text-sky-600 hover:text-sky-700 font-medium">Lupa password?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-4 h-12 bg-white border-gray-200 rounded-xl focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-all text-sm"
                  disabled={isLoading}
                />
              </div>
            </Field>

            {/* Faux reCAPTCHA for visual matching */}
            <div className="flex items-center justify-between p-3 bg-[#f8fbff] border border-gray-200 rounded-xl mt-4">
               <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-sm bg-white cursor-pointer hover:border-sky-500 transition-colors"></div>
                  <span className="text-xs font-medium text-gray-600">I'm not a robot</span>
               </div>
               <div className="flex flex-col items-center">
                  <RefreshCw className="w-5 h-5 text-sky-500 mb-1" />
                  <span className="text-[7px] text-gray-400">reCAPTCHA</span>
               </div>
            </div>

            {error && (
              <FieldMessage className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
                {error}
              </FieldMessage>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold tracking-wide text-sm mt-6 transition-all shadow-lg shadow-sky-600/30" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  MEMPROSES...
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Masuk <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              )}
            </Button>
            
            <div className="mt-8 text-center text-sm">
               <span className="text-gray-500">Belum punya akun? </span>
              <Link
                href="/auth/sign-up"
                className="font-bold text-sky-600 hover:text-sky-700 transition-colors"
               >
                Daftar sekarang
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f8fbff]">
        <Spinner className="h-8 w-8 text-sky-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
