'use server'

import { createClient } from '@/lib/supabase/server'
import { createHmac, randomInt } from 'crypto'
import { headers } from 'next/headers'

// Secret for HMAC-based CAPTCHA token verification
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'sivron-captcha-hmac-secret-2026'
const CAPTCHA_TTL = 5 * 60 * 1000 // 5 minutes validity

// ---------------------------------------------------------------------------
// Rate Limiter (in-memory, effective per serverless instance warm period)
// For production at scale, replace with Redis/Upstash
// ---------------------------------------------------------------------------
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes

function getClientIp(headersList: Headers): string {
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(ip: string): {
  allowed: boolean
  remaining: number
  retryAfterMinutes: number
} {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMinutes: 0 }
  }

  if (record.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((record.resetAt - now) / 60000)
    return { allowed: false, remaining: 0, retryAfterMinutes: minutesLeft }
  }

  record.count++
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - record.count,
    retryAfterMinutes: 0,
  }
}

// Periodically clean up stale entries (prevent memory leak)
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of loginAttempts) {
    if (now > value.resetAt) loginAttempts.delete(key)
  }
}, 60_000) // every minute

// ---------------------------------------------------------------------------
// CAPTCHA Generation (HMAC-signed, server-verifiable)
// ---------------------------------------------------------------------------
export async function generateCaptcha(): Promise<{
  question: string
  token: string
  timestamp: number
}> {
  const a = randomInt(1, 20)
  const b = randomInt(1, 15)
  const useAddition = randomInt(0, 2) === 0

  let answer: number
  let question: string

  if (useAddition) {
    answer = a + b
    question = `${a} + ${b}`
  } else {
    const max = Math.max(a, b)
    const min = Math.min(a, b)
    answer = max - min
    question = `${max} - ${min}`
  }

  const timestamp = Date.now()
  const token = createHmac('sha256', CAPTCHA_SECRET)
    .update(`${answer}:${timestamp}`)
    .digest('hex')

  return { question, token, timestamp }
}

// ---------------------------------------------------------------------------
// Secure Login with CAPTCHA verification + Rate Limiting
// ---------------------------------------------------------------------------
export async function loginWithCaptcha(data: {
  email: string
  password: string
  captchaAnswer: string
  captchaToken: string
  captchaTimestamp: number
}): Promise<{
  success?: boolean
  error?: string
  rateLimited?: boolean
  newCaptcha?: { question: string; token: string; timestamp: number }
}> {
  const { email, password, captchaAnswer, captchaToken, captchaTimestamp } = data

  // 1. Rate limit check
  const headersList = await headers()
  const ip = getClientIp(headersList)
  const rateCheck = checkRateLimit(ip)

  if (!rateCheck.allowed) {
    return {
      error: `Terlalu banyak percobaan login. Coba lagi dalam ${rateCheck.retryAfterMinutes} menit.`,
      rateLimited: true,
    }
  }

  // 2. Validate CAPTCHA expiry
  const now = Date.now()
  if (now - captchaTimestamp > CAPTCHA_TTL) {
    const fresh = await generateCaptcha()
    return {
      error: 'CAPTCHA sudah kedaluwarsa. Silakan jawab soal baru.',
      newCaptcha: fresh,
    }
  }

  // 3. Validate CAPTCHA answer via HMAC comparison
  const expectedToken = createHmac('sha256', CAPTCHA_SECRET)
    .update(`${captchaAnswer.trim()}:${captchaTimestamp}`)
    .digest('hex')

  if (expectedToken !== captchaToken) {
    const fresh = await generateCaptcha()
    return {
      error: 'Jawaban verifikasi salah. Silakan coba lagi.',
      newCaptcha: fresh,
    }
  }

  // 4. Perform Supabase login
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Always generate fresh CAPTCHA after failed login
    const fresh = await generateCaptcha()
    return {
      error:
        error.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : `Gagal login: ${error.message}`,
      newCaptcha: fresh,
    }
  }

  return { success: true }
}
