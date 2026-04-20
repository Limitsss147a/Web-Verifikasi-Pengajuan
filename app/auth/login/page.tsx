'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense, useTransition } from 'react'
import { generateCaptcha, loginWithCaptcha } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel, FieldMessage } from '@/components/ui/field'
import { Lock, ShieldCheck, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  // CAPTCHA state
  const [captcha, setCaptcha] = useState<{
    question: string
    token: string
    timestamp: number
  } | null>(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(true)

  // Load CAPTCHA on mount
  useEffect(() => {
    loadCaptcha()
  }, [])

  async function loadCaptcha() {
    setCaptchaLoading(true)
    setCaptchaAnswer('')
    try {
      const data = await generateCaptcha()
      setCaptcha(data)
    } catch {
      setError('Gagal memuat verifikasi. Silakan muat ulang halaman.')
    } finally {
      setCaptchaLoading(false)
    }
  }

  // Sanitize redirect — only allow internal paths starting with /dashboard
  function getSafeRedirect(): string {
    const raw = searchParams.get('redirect')
    if (!raw) return '/dashboard'
    // Only allow paths that start with / and don't contain protocol or double slashes
    if (
      raw.startsWith('/dashboard') &&
      !raw.includes('//') &&
      !raw.includes(':')
    ) {
      return raw
    }
    return '/dashboard'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captcha) {
      setError('Verifikasi belum dimuat. Silakan muat ulang halaman.')
      return
    }

    if (!captchaAnswer.trim()) {
      setError('Harap jawab soal verifikasi.')
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await loginWithCaptcha({
        email,
        password,
        captchaAnswer,
        captchaToken: captcha.token,
        captchaTimestamp: captcha.timestamp,
      })

      if (result.newCaptcha) {
        setCaptcha(result.newCaptcha)
        setCaptchaAnswer('')
      }

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.success) {
        const redirectTo = getSafeRedirect()
        router.push(redirectTo)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 pt-24 md:p-8 bg-[#f8fbff] relative diamond-pattern overflow-x-hidden">
      {/* BKAD Logo Absolute Overlay */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20 flex items-center gap-2 md:gap-3 bg-white/80 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm border border-gray-100">
        <Image src="/bkad-logo.jpeg" alt="BKAD Logo" width={24} height={24} className="object-contain md:w-[32px] md:h-[32px]" />
        <span className="font-heading font-bold text-gray-800 text-xs md:text-sm tracking-wide">SIVRON</span>
        <span className="font-heading font-bold text-gray-800 text-xs md:text-sm hidden sm:block tracking-wide">— BKAD</span>
      </div>

      {/* Floating Centered Card */}
      <div className="flex w-full max-w-5xl bg-white rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden min-h-[500px] md:min-h-[650px] relative z-10 border border-gray-100/50">

        {/* Left Panel - Dark SIVRON Branding */}
        <div className="hidden lg:flex flex-col w-1/2 p-12 bg-[#0A0A0F] text-white overflow-hidden relative justify-center items-center">
          <div className="absolute inset-0 bg-[url('/diamond-pattern.svg')] opacity-5 z-0" />
          <div className="absolute inset-x-0 bottom-0 pointer-events-none neon-border opacity-30 h-1/2 z-0" />

          <div className="relative z-10 text-center max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-8 shadow-[0_0_30px_rgba(255,255,255,0.2)] p-2">
              <Image src="/logo-anggaran-2.jpeg" alt="SIVRON Logo" width={64} height={64} className="object-contain rounded-xl" />
            </div>
            <h1 className="font-heading text-5xl font-bold tracking-tighter mb-4 text-glow">
              SIVRON<span className="text-sky-500">.</span>
            </h1>
            <p className="font-sans text-base text-white/70 leading-relaxed">
              Sistem Verifikasi RKA Online.
            </p>

            <div className="mt-8 inline-flex items-center justify-center gap-2 bg-sky-500/10 text-sky-400 px-5 py-2.5 rounded-full border border-sky-500/20 text-xs font-mono w-full max-w-[280px]">
              <Lock className="w-4 h-4" /> Sistem Keamanan Terenkripsi
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 p-6 md:p-12 lg:p-16 bg-white flex flex-col justify-center">

          <div className="mb-10 text-left">
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-2">Masuk ke Akun</h2>
            <div className="w-12 h-1 bg-sky-500 rounded-full mb-4"></div>
            <p className="text-sm text-gray-500 leading-relaxed">Masukkan email dan password untuk mengakses sistem verifikasi SIVRON.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Field>
              <FieldLabel htmlFor="email" className="font-bold text-sm text-gray-700 mb-2 block">
                Email <span className="text-sky-600">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@instansi.go.id"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-4 h-12 bg-white border-gray-200 rounded-xl focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-all text-sm"
                  disabled={isPending}
                />
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel htmlFor="password" className="font-bold text-sm text-gray-700 block">
                  Password <span className="text-sky-600">*</span>
                </FieldLabel>
                <Link href="/auth/forgot-password" className="text-xs text-sky-600 hover:text-sky-700 font-medium">Lupa password?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-4 h-12 bg-white border-gray-200 rounded-xl focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-all text-sm"
                  disabled={isPending}
                />
              </div>
            </Field>

            {/* Server-verified Math CAPTCHA */}
            <div className="p-4 bg-[#f8fbff] border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Verifikasi Keamanan</span>
                </div>
                <button
                  type="button"
                  onClick={loadCaptcha}
                  disabled={captchaLoading || isPending}
                  className="text-sky-500 hover:text-sky-600 transition-colors disabled:opacity-50"
                  title="Muat ulang soal"
                >
                  <RefreshCw className={`w-4 h-4 ${captchaLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {captchaLoading ? (
                <div className="flex items-center justify-center py-3">
                  <Spinner className="w-5 h-5 text-sky-500" />
                </div>
              ) : captcha ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-lg font-bold text-gray-800 select-none tracking-wider shadow-sm">
                    {captcha.question} =
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="?"
                    autoComplete="off"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value.replace(/[^0-9-]/g, ''))}
                    className="h-11 w-20 text-center font-mono text-lg font-bold border-gray-200 rounded-lg focus-visible:ring-sky-500"
                    disabled={isPending}
                    maxLength={4}
                  />
                </div>
              ) : (
                <p className="text-xs text-red-500">Gagal memuat verifikasi. Klik refresh.</p>
              )}
            </div>

            {error && (
              <FieldMessage className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
                {error}
              </FieldMessage>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold tracking-wide text-sm mt-4 transition-all shadow-lg shadow-sky-600/30 disabled:opacity-50"
              disabled={isPending || !captcha}
            >
              {isPending ? (
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

function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
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
