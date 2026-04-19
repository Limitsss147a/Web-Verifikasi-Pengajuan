'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel, FieldMessage } from '@/components/ui/field'
import { Shield, Lock } from 'lucide-react'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
     // Validate that user is in an active recovery session
     const checkSession = async () => {
         const supabase = createClient()
         const { data: { session } } = await supabase.auth.getSession()
         if (!session) {
             setError("Link tautan sudah tidak berlaku atau Anda tidak login dalam mode recovery. Silakan ajukan ulang lupa password.")
         }
     }
     checkSession()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== repeatPassword) {
        setError('Password tidak cocok')
        return
    }

    if (password.length < 6) {
        setError('Password minimal 6 karakter')
        return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess('Password berhasil diubah. Mengarahkan ke halaman login...')
      setTimeout(() => {
          router.push('/auth/login')
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat menyimpan password baru.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 bg-[#f8fbff] relative diamond-pattern">
      {/* BKAD Logo Absolute Overlay */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20 flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-100">
        <Image src="/bpkad-logo.png" alt="BKAD Logo" width={32} height={32} className="object-contain" />
        <span className="font-heading font-bold text-gray-800 text-sm hidden sm:block tracking-wide">SIVRON — BKAD</span>
      </div>

      <div className="w-full max-w-md mt-16 md:mt-0 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-6 sm:p-12 border border-gray-100/50">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.2)] p-1.5">
            <Image src="/logo-anggaran-2.jpeg" alt="SIVRON Logo" width={50} height={50} className="object-contain rounded-xl" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Buat Password Baru</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Sistem merespon permintaan Anda. Masukkan konfigurasi sandi terbaru.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <Field>
            <FieldLabel htmlFor="password" className="font-bold text-sm text-gray-700 mb-2 block">
              Password Baru <span className="text-sky-600">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-4 h-12 bg-white border-gray-200 rounded-xl focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-all text-sm"
                disabled={isLoading || !!success}
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="repeatPassword" className="font-bold text-sm text-gray-700 mb-2 block">
              Konfirmasi Password <span className="text-sky-600">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                id="repeatPassword"
                type="password"
                placeholder="Salinan password baru"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="pl-4 h-12 bg-white border-gray-200 rounded-xl focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-all text-sm"
                disabled={isLoading || !!success}
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </Field>

          {error && (
            <FieldMessage className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
              {error}
            </FieldMessage>
          )}

          {success && (
            <FieldMessage className="text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 text-sm">
              {success}
            </FieldMessage>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold tracking-wide text-sm mt-6 transition-all shadow-lg shadow-sky-600/30 disabled:opacity-50" 
            disabled={isLoading || !!success || error?.includes('tidak berlaku')}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                MEMPROSES...
              </>
            ) : (
              "SIMPAN PASSWORD"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
