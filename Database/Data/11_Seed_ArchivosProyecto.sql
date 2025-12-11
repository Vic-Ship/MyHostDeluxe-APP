USE myhostdeluxe;
GO

-- ArchivosProyecto
INSERT INTO ArchivosProyecto (ProyectoID, ProgressID, NombreArchivo, URLArchivo, TamanoArchivo, TipoArchivo, SubidoPor, SubidoEn)
VALUES
(1, 1, 'wireframes.pdf', '/uploads/projects/1/wireframes.pdf', 2048576, 'application/pdf', 1, SYSDATETIME()),
(3, 2, 'manual-marca.pdf', '/uploads/projects/3/manual-marca.pdf', 3097152, 'application/pdf', 1, SYSDATETIME()),
(4, 3, 'requerimientos.docx', '/uploads/projects/4/requerimientos.docx', 153600, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1, SYSDATETIME());
GO