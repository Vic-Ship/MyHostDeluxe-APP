USE myhostdeluxe;
GO

-- Proyectos
INSERT INTO Proyectos (NombreProyecto, ClienteID, AgenteID, Descripcion, MontoTotal, Estado, Prioridad, PorcentajeProgreso, FechaInicio, FechaEntregaEstimada, CreadoEn, ActualizadoEn)
VALUES
('Sitio Web Corporativo Tech Solutions', 1, 1, 'Desarrollo de sitio web corporativo moderno para empresa de tecnología', 1200.00, 'en-proceso', 'alta', 30, '2025-01-15', '2025-02-28', SYSDATETIME(), SYSDATETIME()),
('Campaña Marketing Digital', 2, 1, 'Campaña integral de marketing digital', 800.00, 'pendiente', 'media', 0, '2025-01-20', '2025-03-15', SYSDATETIME(), SYSDATETIME()),
('Branding Restaurante La Tradición', 4, 1, 'Identidad corporativa completa para restaurante', 800.00, 'completado', 'alta', 100, '2024-12-01', '2024-12-30', SYSDATETIME(), SYSDATETIME()),
('Sitio Web Consultoría Empresarial', 5, 1, 'Portal web corporativo para consultoría', 2500.00, 'en-proceso', 'media', 20, '2025-01-10', '2025-03-01', SYSDATETIME(), SYSDATETIME());
GO