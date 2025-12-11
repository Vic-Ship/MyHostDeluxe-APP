USE myhostdeluxe;
GO

CREATE TRIGGER trg_Usuarios_Update_To_Agentes
ON Usuarios
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Prevenir recursión
    IF TRIGGER_NESTLEVEL() > 1
        RETURN;
        
    UPDATE A
    SET A.CorreoPersonal = i.CorreoElectronico,
        A.ActualizadoEn = SYSDATETIME()
    FROM Agentes A
    INNER JOIN inserted i ON A.UsuarioID = i.UsuarioID
    INNER JOIN deleted d ON i.UsuarioID = d.UsuarioID
    WHERE ISNULL(i.CorreoElectronico,'') <> ISNULL(d.CorreoElectronico,'');
END;
GO