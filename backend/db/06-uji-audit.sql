USE review_kantin;
GO

-- 1. Riwayat terbaru
SELECT TOP (20)
    a.id, a.user_id, u.name AS user_name, u.email AS user_email,
    a.action, a.target_table, a.target_id, a.metadata, a.created_at
FROM dbo.AUDIT_LOGS a
LEFT JOIN dbo.USERS u ON u.id = a.user_id
ORDER BY a.created_at DESC, a.id DESC;
GO

-- 2. Catatan LOGIN / LOGOUT beserta ip_address, user_agent, result
SELECT TOP (10)
    a.id, a.action, a.user_id,
    JSON_VALUE(a.metadata, '$.role')       AS role,
    JSON_VALUE(a.metadata, '$.ip_address') AS ip_address,
    JSON_VALUE(a.metadata, '$.user_agent') AS user_agent,
    JSON_VALUE(a.metadata, '$.result')     AS result,
    a.created_at
FROM dbo.AUDIT_LOGS a
WHERE a.action IN (N'LOGIN', N'LOGOUT')
ORDER BY a.created_at DESC, a.id DESC;
GO

-- 3. Uji trigger: UPDATE harus ditolak (error 50010)
UPDATE dbo.AUDIT_LOGS SET action = N'DIUBAH' WHERE id = 1;
GO

-- 4. Uji trigger: DELETE harus ditolak (error 50010)
DELETE FROM dbo.AUDIT_LOGS WHERE id = 1;
GO

-- 5. Uji permission sebagai user aplikasi: harus ditolak
EXECUTE AS USER = 'aliifah_user';
UPDATE dbo.AUDIT_LOGS SET action = N'DIUBAH' WHERE id = 1;
REVERT;
GO

-- 6. Simulasi audit LOGOUT gagal (logout harus tetap berhasil).
DENY INSERT ON dbo.AUDIT_LOGS TO aliifah_user;

GRANT INSERT ON dbo.AUDIT_LOGS TO aliifah_user;
