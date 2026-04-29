---
name: "Issue 7: Bersihkan Dependencies"
about: "Bersihkan Dependencies: Hapus Three.js dan Audit Dependensi Lain"
labels: ["optimization", "performance", "tech-debt"]
---

**Latar Belakang & Urgensi**
*Bundle size* yang membengkak karena dependensi tak terpakai memperlambat *cold start* dan memperluas *attack surface*.

**Tugas (Acceptance Criteria):**
- [ ] Hapus `three.js` (dan dependensi terkaitnya) dari *production dependencies*.
- [ ] Identifikasi library lain yang di-include oleh template v0 namun tidak digunakan.
- [ ] Jalankan `npx depcheck` untuk mengaudit seluruh dependensi.
- [ ] Hapus library *orphan* dan optimalkan ukuran *bundle*.
