---
name: "Issue 1: Perbaiki CSP"
about: "Hapus unsafe-eval dan unsafe-inline"
labels: ["security", "high-priority", "frontend"]
---

**Latar Belakang & Urgensi**
Aplikasi SIVRON menangani data keuangan publik yang sangat sensitif. Penggunaan `unsafe-eval` dan `unsafe-inline` pada Content Security Policy (CSP) membuka celah serangan Cross-Site Scripting (XSS). Jika terjadi XSS, data anggaran publik dapat dicuri atau dimanipulasi. Ini adalah pekerjaan teknis kritis yang tidak bisa ditunda.

**Tugas (Acceptance Criteria):**
- [ ] Hapus `unsafe-eval` dan `unsafe-inline` dari konfigurasi CSP.
- [ ] Implementasikan *nonce-based* atau *hash-based* CSP.
- [ ] Refactor semua *inline scripts* ke dalam *external modules* yang aman.

**Estimasi Waktu:** 2–3 hari engineering
