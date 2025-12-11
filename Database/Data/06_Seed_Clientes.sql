USE myhostdeluxe;
GO

-- Clientes
INSERT INTO Clientes (NombreEmpresa, NombreContacto, CorreoElectronico, Telefono, Sector, Estado)
VALUES
('Tech Solutions Inc.', 'Juan Pérez', 'juan@techsolutions.com', '1234-5678', 'Tecnología', 'activo'),
('Marketing Digital SA', 'María García', 'maria@marketingdigital.com', '2345-6789', 'Marketing', 'activo'),
('Construcciones Modernas', 'Carlos López', 'carlos@construcciones.com', '3456-7890', 'Construcción', 'activo'),
('Restaurante La Tradición', 'Ana Martínez', 'ana@latradicion.com', '4567-8901', 'Restaurantes', 'activo'),
('Consultoría Empresarial', 'Roberto Silva', 'roberto@consultoria.com', '5678-9012', 'Consultoría', 'activo');
GO