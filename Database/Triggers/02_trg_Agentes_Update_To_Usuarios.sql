USE myhostdeluxe;
GO

CREATE TRIGGER trg_Agentes_Update_To_Usuarios
ON Agentes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Prevenir recursión
    IF TRIGGER_NESTLEVEL() > 1
        RETURN;
        
    UPDATE U
    SET U.CorreoElectronico = i.CorreoPersonal,
        U.ActualizadoEn = SYSDATETIME()
    FROM Usuarios U
    INNER JOIN inserted i ON U.UsuarioID = i.UsuarioID
    INNER JOIN deleted d ON i.UsuarioID = d.UsuarioID
    WHERE ISNULL(i.CorreoPersonal,'') <> ISNULL(d.CorreoPersonal,'');
END;
GO