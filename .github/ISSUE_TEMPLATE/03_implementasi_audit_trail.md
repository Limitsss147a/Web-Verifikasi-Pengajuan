---
name: "Issue 3: Implementasi Audit Trail"
about: "Implementasi Audit Trail dan Structured Logging"
labels: ["security", "database", "backend", "blocker"]
---

**Latar Belakang & Urgensi**
Sistem yang mengelola data keuangan publik harus memiliki jejak rekam (audit trail) yang tidak bisa diubah. Tanpa ini, sistem tidak layak untuk di-deploy ke production.

**Tugas (Acceptance Criteria):**
- [ ] Buat tabel `audit_log` di database.
- [ ] Implementasikan Supabase Row-Level Security (RLS) triggers untuk mencatat setiap operasi.
- [ ] Pastikan setiap aksi `CREATE`, `UPDATE`, dan `DELETE` pada data anggaran tercatat.
- [ ] Log harus mencakup: `user_id`, `timestamp`, `IP address`, `nilai_lama` (old state), dan `nilai_baru` (new state).
