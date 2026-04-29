---
name: "Issue 5: Bangun CI/CD Pipeline"
about: "Bangun CI/CD Pipeline via GitHub Actions"
labels: ["devops", "ci-cd", "infrastructure"]
---

**Latar Belakang & Urgensi**
Diperlukan otomasi pengujian dan deployment untuk menjaga kualitas kode dan keamanan sebelum rilis.

**Tugas (Acceptance Criteria):**
- [ ] Setup workflow GitHub Actions untuk *Pull Request*.
- [ ] Implementasikan *lint check* otomatis.
- [ ] Implementasikan *TypeScript build check* otomatis.
- [ ] Integrasikan *security scan* (misal: Snyk atau Dependabot) sebelum setiap deploy.
- [ ] Siapkan *environment staging* yang terpisah dari *production*.
- [ ] Konfigurasikan *branch protection*: Blokir direct push ke `main` dan wajibkan PR review.
