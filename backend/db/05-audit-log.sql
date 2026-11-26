-- Audit Log (append-only)
--
-- Jalankan setelah 01-04 dengan akun admin.

USE review_kantin;
GO

SET XACT_ABORT ON;
GO

-- ------------------------------------------------------------ 1. Identity
DECLARE @maxId INT = (SELECT ISNULL(MAX(id), 0) FROM dbo.AUDIT_LOGS);
DBCC CHECKIDENT ('dbo.AUDIT_LOGS', RESEED, @maxId) WITH NO_INFOMSGS;
GO

-- ------------------------------------------------- 2. Default waktu UTC
IF EXISTS (
    SELECT 1 FROM sys.default_constraints
    WHERE name = N'DF_AUDIT_LOGS_created_at'
      AND parent_object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
)
BEGIN
    ALTER TABLE dbo.AUDIT_LOGS DROP CONSTRAINT DF_AUDIT_LOGS_created_at;
END
GO

ALTER TABLE dbo.AUDIT_LOGS
    ADD CONSTRAINT DF_AUDIT_LOGS_created_at
    DEFAULT SYSUTCDATETIME() FOR created_at;
GO

-- -------------------------------------------------------------- 3. Index
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AUDIT_LOGS_created_at'
      AND object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
)
BEGIN
    CREATE INDEX IX_AUDIT_LOGS_created_at
        ON dbo.AUDIT_LOGS (created_at DESC, id DESC);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AUDIT_LOGS_user_created'
      AND object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
)
BEGIN
    CREATE INDEX IX_AUDIT_LOGS_user_created
        ON dbo.AUDIT_LOGS (user_id, created_at DESC);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AUDIT_LOGS_action_target_created'
      AND object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
)
BEGIN
    CREATE INDEX IX_AUDIT_LOGS_action_target_created
        ON dbo.AUDIT_LOGS (action, target_table, created_at DESC);
END
GO

-- Filter targetId
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_AUDIT_LOGS_target'
      AND object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
)
BEGIN
    CREATE INDEX IX_AUDIT_LOGS_target
        ON dbo.AUDIT_LOGS (target_table, target_id);
END
GO

-- ---------------------------------------------- 4. Trigger append-only
CREATE OR ALTER TRIGGER dbo.TR_AUDIT_LOGS_AppendOnly
ON dbo.AUDIT_LOGS
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    THROW 50010, 'AUDIT_LOGS bersifat append-only.', 1;
END;
GO

-- --------------------------------------------------------- 5. Permission
-- db_datawriter memberi UPDATE/DELETE ke semua tabel, jadi khusus
-- AUDIT_LOGS kita tolak secara eksplisit (DENY selalu menang atas GRANT).
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'aliifah_user')
BEGIN
    GRANT SELECT, INSERT ON dbo.AUDIT_LOGS TO aliifah_user;
    DENY UPDATE, DELETE ON dbo.AUDIT_LOGS TO aliifah_user;
END
GO

-- ---------------------------------------------------------- Pemeriksaan
SELECT name AS index_name
FROM sys.indexes
WHERE object_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
  AND name LIKE N'IX_AUDIT_LOGS%'
ORDER BY name;

SELECT name AS trigger_name, is_instead_of_trigger
FROM sys.triggers
WHERE parent_id = OBJECT_ID(N'dbo.AUDIT_LOGS');

SELECT pr.name AS principal, pe.permission_name, pe.state_desc
FROM sys.database_permissions pe
JOIN sys.database_principals pr ON pr.principal_id = pe.grantee_principal_id
WHERE pe.major_id = OBJECT_ID(N'dbo.AUDIT_LOGS')
ORDER BY pe.permission_name;
GO

PRINT 'Audit log siap: append-only (trigger + permission).';
GO
