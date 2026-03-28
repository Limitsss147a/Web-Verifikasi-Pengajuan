'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Spinner } from '@/components/ui/spinner'
import SignInCard from '@/components/ui/travel-connect-signin-1'

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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <SignInCard 
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
      />
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
