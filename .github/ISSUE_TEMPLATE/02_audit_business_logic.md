---
name: "Issue 2: Audit Business Logic"
about: "Audit Menyeluruh Business Logic yang Di-generate AI"
labels: ["audit", "business-logic", "compliance"]
---

**Latar Belakang & Urgensi**
Logika aplikasi yang di-generate oleh AI (seperti kalkulasi anggaran, aturan approval, dan permission) tidak boleh diasumsikan 100% akurat atau sesuai dengan Permendagri / aturan RKA lokal.

**Tugas (Acceptance Criteria):**
- [ ] Lakukan verifikasi manual untuk setiap fungsi kalkulasi anggaran oleh *domain expert* (bukan programmer).
- [ ] Lakukan verifikasi manual untuk aturan *approval* dan logika *permission* oleh *domain expert*.
- [ ] Buat *test cases* komprehensif yang bersumber langsung dari regulasi keuangan yang berlaku.
- [ ] Pastikan tidak ada *hardcoded assumptions* yang menyalahi aturan RKA lokal.

**Catatan:** Tiket ini membutuhkan kolaborasi lintas divisi (Engineering & Domain Expert/Finance).
