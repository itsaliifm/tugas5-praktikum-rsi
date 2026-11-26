-- Akun uji untuk login dari frontend.
--
-- Seed di 03-seed.sql memakai password_hash palsu (hash_admin, hash_owner1, ...),
-- sehingga akun seed tidak bisa login karena bcrypt.compare selalu gagal.
-- Script ini hanya mengganti password_hash akun uji dengan hash bcrypt asli.
-- Tidak ada perubahan skema tabel.
--
-- Password semua akun di bawah: Password123

USE review_kantin;
GO

UPDATE dbo.USERS
SET password_hash = N'$2b$10$H1QSwqIRk/vjcdUq5p.kTOfEJC14PuBDvxHd2gVkN9iCtFh8N6mxq'
WHERE email IN (
    N'admin@kantin.test',   -- admin
    N'tini@kantin.test',    -- owner, pemilik warung id 1 (Warung Bu Tini)
    N'slamet@kantin.test',  -- owner, pemilik warung id 3 (Kedai Pak Slamet)
    N'bagas@student.test'   -- customer
);
GO

SELECT id, name, email, role FROM dbo.USERS
WHERE email IN (N'admin@kantin.test', N'tini@kantin.test', N'slamet@kantin.test', N'bagas@student.test');
GO
