---
name: "Issue 4: Tambahkan Rate Limiting"
about: "Tambahkan Rate Limiting pada Semua API Routes"
labels: ["security", "performance", "api"]
---

**Latar Belakang & Urgensi**
Untuk mencegah serangan *brute force* dan penyalahgunaan API, kita perlu membatasi jumlah request (rate limiting) pada level edge.

**Tugas (Acceptance Criteria):**
- [ ] Implementasikan Vercel Edge Middleware.
- [ ] Integrasikan `@vercel/kv` atau Upstash Redis untuk implementasi *sliding window rate limiting*.
- [ ] Set target maksimal 10 request per detik per IP untuk operasi *write*.
- [ ] Prioritaskan rate limiting pada endpoint: `auth` (login/register), `data submission`, dan `report generation`.
