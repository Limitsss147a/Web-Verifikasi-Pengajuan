import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
})

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: 'SIVRON - Sistem Informasi Anggaran',
    template: '%s | SIVRON',
  },
  description: 'Sistem penganggaran elektronik SIVRON untuk pengelolaan dan pengajuan anggaran pemerintah daerah secara digital dan akuntabel.',
  keywords: ['sivron', 'e-budgeting', 'penganggaran', 'anggaran', 'pemerintah', 'APBD', 'RAB', 'digital'],
  authors: [{ name: 'SIVRON Team' }],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b5998' },
    { media: '(prefers-color-scheme: dark)', color: '#1a365d' },
  ],
  width: 'device-width',
  initialScale: 1,
}

import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} font-sans antialiased min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors closeButton />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
