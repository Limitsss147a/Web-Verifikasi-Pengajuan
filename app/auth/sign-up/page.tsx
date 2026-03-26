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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Building2, Lock, Mail, User, ShieldCheck, Briefcase } from 'lucide-react'
import type { Institution } from '@/lib/types/database'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [position, setPosition] = useState('')
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchInstitutions() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name')
      
      if (!error && data) {
        setInstitutions(data)
      }
      setIsLoadingInstitutions(false)
    }
    fetchInstitutions()
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Password tidak cocok')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      setIsLoading(false)
      return
    }

    if (!institutionId) {
      setError('Silakan pilih instansi')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            institution_id: institutionId,
            position: position,
            role: 'user',
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mendaftar')
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
              Bergabung dengan Sistem E-Budgeting
            </h2>
            <p className="mt-4 text-lg opacity-80">
              Daftar untuk mulai mengajukan dan mengelola anggaran instansi Anda secara digital.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                <span className="text-sm font-bold">1</span>
              </div>
              <span>Lengkapi data pendaftaran</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                <span className="text-sm font-bold">2</span>
              </div>
              <span>Verifikasi email</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                <span className="text-sm font-bold">3</span>
              </div>
              <span>Mulai ajukan anggaran</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm opacity-60">
          <ShieldCheck className="h-4 w-4" />
          <span>Data Anda aman dan terenkripsi</span>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
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
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Daftar Akun Baru</CardTitle>
              <CardDescription>
                Lengkapi data berikut untuk membuat akun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="fullName">Nama Lengkap</FieldLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Masukkan nama lengkap"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </Field>

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
                    <FieldLabel htmlFor="institution">Instansi</FieldLabel>
                    <Select value={institutionId} onValueChange={setInstitutionId} disabled={isLoading || isLoadingInstitutions}>
                      <SelectTrigger id="institution" className="w-full">
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder={isLoadingInstitutions ? "Memuat..." : "Pilih instansi"} />
                      </SelectTrigger>
                      <SelectContent>
                        {institutions.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.name} ({inst.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="position">Jabatan</FieldLabel>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="position"
                        type="text"
                        placeholder="Contoh: Kepala Bagian Keuangan"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Min. 6 karakter"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="repeatPassword">Ulangi Password</FieldLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="repeatPassword"
                          type="password"
                          placeholder="Ulangi password"
                          required
                          value={repeatPassword}
                          onChange={(e) => setRepeatPassword(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </Field>
                  </div>

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
                      'Daftar Sekarang'
                    )}
                  </Button>
                </FieldGroup>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Sudah punya akun?{' '}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    Masuk disini
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
