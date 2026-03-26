'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { FieldGroup, Field, FieldLabel, FieldMessage } from '@/components/ui/field'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Building2, Lock, Mail, ShieldCheck } from 'lucide-react'

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
    <div className="flex min-h-screen w-full">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">E-Budgeting</h1>
              <p className="text-sm opacity-80">Sistem Penganggaran Elektronik</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight text-balance">
              Kelola Anggaran dengan Transparan dan Akuntabel
            </h2>
            <p className="mt-4 text-lg opacity-80">
              Platform digital untuk pengajuan, review, dan persetujuan anggaran pemerintah daerah.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm opacity-80">Digital & Paperless</div>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4">
              <div className="text-2xl font-bold">Real-time</div>
              <div className="text-sm opacity-80">Tracking Status</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm opacity-60">
          <ShieldCheck className="h-4 w-4" />
          <span>Sistem dilindungi dengan enkripsi end-to-end</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">E-Budgeting</h1>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Masuk ke Akun</CardTitle>
              <CardDescription>
                Masukkan email dan password untuk mengakses sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nama@instansi.go.id"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </Field>
                  
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Masukkan password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </Field>

                  {error && (
                    <FieldMessage className="text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </FieldMessage>
                  )}

                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2" />
                        Memproses...
                      </>
                    ) : (
                      'Masuk'
                    )}
                  </Button>
                </FieldGroup>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Belum punya akun?{' '}
                  <Link
                    href="/auth/sign-up"
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    Daftar disini
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dengan masuk, Anda menyetujui{' '}
            <Link href="#" className="underline underline-offset-4 hover:text-foreground">
              Syarat & Ketentuan
            </Link>{' '}
            dan{' '}
            <Link href="#" className="underline underline-offset-4 hover:text-foreground">
              Kebijakan Privasi
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
