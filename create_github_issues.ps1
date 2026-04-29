$issues = @(
    @{
        title = "Perbaiki CSP: Hapus unsafe-eval dan unsafe-inline"
        body = @"
**Latar Belakang & Urgensi**
Aplikasi SIVRON menangani data keuangan publik yang sangat sensitif. Penggunaan `unsafe-eval` dan `unsafe-inline` pada Content Security Policy (CSP) membuka celah serangan Cross-Site Scripting (XSS). Jika terjadi XSS, data anggaran publik dapat dicuri atau dimanipulasi. Ini adalah pekerjaan teknis kritis yang tidak bisa ditunda.

**Tugas (Acceptance Criteria):**
- [ ] Hapus `unsafe-eval` dan `unsafe-inline` dari konfigurasi CSP.
- [ ] Implementasikan *nonce-based* atau *hash-based* CSP.
- [ ] Refactor semua *inline scripts* ke dalam *external modules* yang aman.

**Estimasi Waktu:** 2–3 hari engineering
**Label:** `security`, `high-priority`, `frontend`
"@
    },
    @{
        title = "Audit Menyeluruh Business Logic yang Di-generate AI"
        body = @"
**Latar Belakang & Urgensi**
Logika aplikasi yang di-generate oleh AI (seperti kalkulasi anggaran, aturan approval, dan permission) tidak boleh diasumsikan 100% akurat atau sesuai dengan Permendagri / aturan RKA lokal.

**Tugas (Acceptance Criteria):**
- [ ] Lakukan verifikasi manual untuk setiap fungsi kalkulasi anggaran oleh *domain expert* (bukan programmer).
- [ ] Lakukan verifikasi manual untuk aturan *approval* dan logika *permission* oleh *domain expert*.
- [ ] Buat *test cases* komprehensif yang bersumber langsung dari regulasi keuangan yang berlaku.
- [ ] Pastikan tidak ada *hardcoded assumptions* yang menyalahi aturan RKA lokal.

**Catatan:** Tiket ini membutuhkan kolaborasi lintas divisi (Engineering & Domain Expert/Finance).
**Label:** `audit`, `business-logic`, `compliance`
"@
    },
    @{
        title = "Implementasi Audit Trail dan Structured Logging"
        body = @"
**Latar Belakang & Urgensi**
Sistem yang mengelola data keuangan publik harus memiliki jejak rekam (audit trail) yang tidak bisa diubah. Tanpa ini, sistem tidak layak untuk di-deploy ke production.

**Tugas (Acceptance Criteria):**
- [ ] Buat tabel `audit_log` di database.
- [ ] Implementasikan Supabase Row-Level Security (RLS) triggers untuk mencatat setiap operasi.
- [ ] Pastikan setiap aksi `CREATE`, `UPDATE`, dan `DELETE` pada data anggaran tercatat.
- [ ] Log harus mencakup: `user_id`, `timestamp`, `IP address`, `nilai_lama` (old state), dan `nilai_baru` (new state).

**Label:** `security`, `database`, `backend`, `blocker`
"@
    },
    @{
        title = "Tambahkan Rate Limiting pada Semua API Routes"
        body = @"
**Latar Belakang & Urgensi**
Untuk mencegah serangan *brute force* dan penyalahgunaan API, kita perlu membatasi jumlah request (rate limiting) pada level edge.

**Tugas (Acceptance Criteria):**
- [ ] Implementasikan Vercel Edge Middleware.
- [ ] Integrasikan `@vercel/kv` atau Upstash Redis untuk implementasi *sliding window rate limiting*.
- [ ] Set target maksimal 10 request per detik per IP untuk operasi *write*.
- [ ] Prioritaskan rate limiting pada endpoint: `auth` (login/register), `data submission`, dan `report generation`.

**Label:** `security`, `performance`, `api`
"@
    },
    @{
        title = "Bangun CI/CD Pipeline via GitHub Actions"
        body = @"
**Latar Belakang & Urgensi**
Diperlukan otomasi pengujian dan deployment untuk menjaga kualitas kode dan keamanan sebelum rilis.

**Tugas (Acceptance Criteria):**
- [ ] Setup workflow GitHub Actions untuk *Pull Request*.
- [ ] Implementasikan *lint check* otomatis.
- [ ] Implementasikan *TypeScript build check* otomatis.
- [ ] Integrasikan *security scan* (misal: Snyk atau Dependabot) sebelum setiap deploy.
- [ ] Siapkan *environment staging* yang terpisah dari *production*.
- [ ] Konfigurasikan *branch protection*: Blokir direct push ke `main` dan wajibkan PR review.

**Label:** `devops`, `ci-cd`, `infrastructure`
"@
    },
    @{
        title = "Tulis Test Coverage untuk Critical Paths"
        body = @"
**Latar Belakang & Urgensi**
Pengujian otomatis mencegah regresi pada fitur-fitur kritis aplikasi. Fokus pada *business logic*, bukan sekadar komponen UI.

**Tugas (Acceptance Criteria):**
- [ ] Tulis *Unit Tests* untuk semua fungsi kalkulasi anggaran.
- [ ] Tulis *Integration Tests* untuk semua API routes yang berinteraksi dengan database.
- [ ] Buat *E2E Smoke Tests* untuk flow utama: `Login` → `Input Anggaran` → `Approval`.
- [ ] Capai dan pertahankan target minimum test coverage sebesar **60%** untuk *business logic*.

**Label:** `testing`, `qa`, `quality`
"@
    },
    @{
        title = "Bersihkan Dependencies: Hapus Three.js dan Audit Dependensi Lain"
        body = @"
**Latar Belakang & Urgensi**
*Bundle size* yang membengkak karena dependensi tak terpakai memperlambat *cold start* dan memperluas *attack surface*.

**Tugas (Acceptance Criteria):**
- [ ] Hapus `three.js` (dan dependensi terkaitnya) dari *production dependencies*.
- [ ] Identifikasi library lain yang di-include oleh template v0 namun tidak digunakan.
- [ ] Jalankan `npx depcheck` untuk mengaudit seluruh dependensi.
- [ ] Hapus library *orphan* dan optimalkan ukuran *bundle*.

**Label:** `optimization`, `performance`, `tech-debt`
"@
    }
)

Write-Host "Membuat 7 GitHub Issues untuk project SIVRON..."

foreach ($issue in $issues) {
    # Menyimpan body ke temporary file karena gh cli lebih stabil membaca body dari file
    $tempFile = New-TemporaryFile
    Set-Content -Path $tempFile.FullName -Value $issue.body -Encoding UTF8

    Write-Host "Creating issue: $($issue.title)"
    
    # Menjalankan gh issue create
    gh issue create --title $issue.title --body-file $tempFile.FullName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Berhasil membuat issue: $($issue.title)" -ForegroundColor Green
    } else {
        Write-Host "❌ Gagal membuat issue: $($issue.title)" -ForegroundColor Red
    }

    # Hapus temporary file
    Remove-Item $tempFile.FullName
}

Write-Host "Selesai!"
