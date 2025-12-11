USE myhostdeluxe;
GO

-- Tareas
INSERT INTO Tareas (ProyectoID, NombreTarea, Descripcion, Estado, Prioridad, FechaVencimiento, AsignadoA, CreadoEn, ActualizadoEn)
VALUES
(1, 'Diseño de Wireframes', 'Crear wireframes para la estructura del sitio web', 'completado', 'alta', '2025-01-25', 1, SYSDATETIME(), SYSDATETIME()),
(1, 'Desarrollo Frontend', 'Implementar interfaz de usuario responsive', 'en-proceso', 'alta', '2025-02-10', 1, SYSDATETIME(), SYSDATETIME()),
(1, 'Integración Backend', 'Conectar frontend con servicios backend', 'pendiente', 'media', '2025-02-20', 1, SYSDATETIME(), SYSDATETIME()),
(2, 'Análisis de Competencia', 'Estudio de competencia en el mercado digital', 'pendiente', 'baja', '2025-02-05', 1, SYSDATETIME(), SYSDATETIME()),
(3, 'Diseño de Logo', 'Crear propuestas de logo para el restaurante', 'completado', 'alta', '2024-12-10', 1, SYSDATETIME(), SYSDATETIME()),
(3, 'Manual de Marca', 'Desarrollar manual de identidad corporativa', 'completado', 'media', '2024-12-20', 1, SYSDATETIME(), SYSDATETIME()),
(4, 'Análisis de Requerimientos', 'Reunión con cliente para definir requerimientos', 'completado', 'alta', '2025-01-12', 1, SYSDATETIME(), SYSDATETIME()),
(4, 'Diseño UI/UX', 'Diseñar interfaz de usuario y experiencia', 'en-proceso', 'alta', '2025-01-30', 1, SYSDATETIME(), SYSDATETIME());
GO