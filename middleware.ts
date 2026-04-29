import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
// import { kv } from '@vercel/kv' // Uncomment after npm install finishes

export async function middleware(request: NextRequest) {
  // 1. Session Management
  const response = await updateSession(request)

  // 2. Rate Limiting (10 requests per 10 seconds per IP)
  // Only apply to critical routes (e.g., /api/auth, /api/submissions)
  /* 
  if (request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/auth/')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    const limit = 10
    const window = 10 // 10 seconds

    try {
      const currentRequests = await kv.incr(ip)
      if (currentRequests === 1) {
        await kv.expire(ip, window)
      }
      if (currentRequests > limit) {
        return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
      }
    } catch (e) {
      // If KV is not configured locally, fail open to avoid breaking dev
      console.warn('Rate limiting failed or KV is not configured:', e)
    }
  }
  */

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|icon-.*|apple-icon.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
