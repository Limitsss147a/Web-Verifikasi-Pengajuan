-- Menambahkan kolom review per dokumen untuk mendukung verifikasi di level dokumen
ALTER TABLE budget_documents 
ADD COLUMN IF NOT EXISTS review_bapperida VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS review_setda VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS review_anggaran VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS review_aset VARCHAR(50) DEFAULT 'pending';

-- Menambahkan referensi dokumen ke tabel revisi agar kita bisa mentrack komentar per dokumen
ALTER TABLE revisions
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES budget_documents(id) ON DELETE CASCADE;
