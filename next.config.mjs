/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Re-enable type checking during build for safety
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ktsmqpzifzjsjgfowvph.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://ktsmqpzifzjsjgfowvph.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://ktsmqpzifzjsjgfowvph.supabase.co; font-src 'self'; connect-src 'self' https://ktsmqpzifzjsjgfowvph.supabase.co wss://ktsmqpzifzjsjgfowvph.supabase.co; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default nextConfig
