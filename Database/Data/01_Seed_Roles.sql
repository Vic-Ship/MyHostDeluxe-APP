USE myhostdeluxe;
GO

-- Roles
INSERT INTO Roles (NombreRol, Descripcion, Permisos) VALUES 
('administrador', 'Administrador del sistema con acceso completo', '{"read": true, "write": true, "delete": true, "admin": true}'),
('agente', 'Agente con acceso limitado a sus proyectos', '{"read": true, "write": true, "delete": false, "admin": false}');
GO