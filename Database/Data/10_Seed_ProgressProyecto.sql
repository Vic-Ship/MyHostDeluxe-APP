USE myhostdeluxe;
GO

-- ProgressProyecto
INSERT INTO ProgressProyecto (ProyectoID, TareaID, AgenteID, TipoProgreso, Descripcion, PorcentajeProgreso, CreadoEn)
VALUES
(1, 1, 1, 'avance', 'Wireframes completados y aprobados por el cliente', 30, SYSDATETIME()),
(3, NULL, 1, 'avance', 'Proyecto de branding completado exitosamente', 100, SYSDATETIME()),
(4, NULL, 1, 'avance', 'Requerimientos definidos y aprobados por el cliente', 20, SYSDATETIME());
GO