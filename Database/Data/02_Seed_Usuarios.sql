USE myhostdeluxe;
GO

-- Usuarios
INSERT INTO Usuarios (NombreUsuario, Contraseña, CorreoElectronico, RolID, EstaActivo) VALUES
('jose.ruiz', '123456', 'jose.ruiz@myhostdeluxe.com', 1, 1),
('dsuarez', '123456', 'dsuarez@myhostdeluxe.com', 2, 1);
GO