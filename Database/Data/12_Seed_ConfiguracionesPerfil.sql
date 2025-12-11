USE myhostdeluxe;
GO

-- ConfiguracionesPerfil (crear registros iniciales)
INSERT INTO ConfiguracionesPerfil (UsuarioID)
SELECT UsuarioID FROM Usuarios;
GO