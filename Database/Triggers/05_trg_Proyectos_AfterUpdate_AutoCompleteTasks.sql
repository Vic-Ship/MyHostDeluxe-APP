USE myhostdeluxe;
GO

CREATE TRIGGER trg_Proyectos_AfterUpdate_AutoCompleteTasks
ON Proyectos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    -- Si proyecto pasa a 'completado', completar sus tareas pendientes
    UPDATE t
    SET t.Estado = 'completado',
        t.FechaCompletacion = SYSDATETIME(),
        t.ActualizadoEn = SYSDATETIME()
    FROM Tareas t
    INNER JOIN inserted i ON t.ProyectoID = i.ProyectoID
    INNER JOIN deleted d ON i.ProyectoID = d.ProyectoID
    WHERE ISNULL(i.Estado,'') = 'completado'
      AND ISNULL(d.Estado,'') <> 'completado'
      AND t.Estado <> 'completado';
END;
GO