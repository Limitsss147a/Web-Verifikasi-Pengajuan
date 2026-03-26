import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Building2, CheckCircle2, Mail, ArrowRight } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">E-Budgeting</h1>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Pendaftaran Berhasil!</CardTitle>
            <CardDescription className="text-base">
              Akun Anda telah berhasil dibuat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Verifikasi Email</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kami telah mengirimkan link verifikasi ke email Anda. 
                    Silakan cek inbox dan klik link tersebut untuk mengaktifkan akun.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Langkah selanjutnya:</h4>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                  <span>Buka email dari E-Budgeting</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                  <span>Klik link verifikasi</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
                  <span>Login dan mulai gunakan sistem</span>
                </li>
              </ol>
            </div>

            <div className="pt-2">
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Ke Halaman Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Tidak menerima email? Cek folder spam atau{' '}
              <Link href="/auth/sign-up" className="text-primary hover:underline">
                daftar ulang
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
