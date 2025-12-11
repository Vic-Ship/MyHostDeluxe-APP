USE myhostdeluxe;
GO

-- Agentes
INSERT INTO Agentes (UsuarioID, PrimerNombre, Apellido, CorreoPersonal, Telefono1, Sucursal, Cargo, FechaContratacion, TipoContrato, EstadoEmpleo, CorreoInstitucional, NumeroIdentificacion)
VALUES
(1, 'José', 'Ruiz', 'jose.ruiz@myhostdeluxe.com', '8888-8888', 'Managua', 'Administrador', CAST(SYSDATETIME() AS DATE), 'Tiempo completo', 'activo', 'jose.ruiz@myhostdeluxe.com', 'ID001'),
(2, 'Diego', 'Suárez', 'dsuarez@myhostdeluxe.com', '7777-7777', 'Managua', 'Agente', CAST(SYSDATETIME() AS DATE), 'Tiempo completo', 'activo', 'dsuarez@myhostdeluxe.com', 'ID002');
GO