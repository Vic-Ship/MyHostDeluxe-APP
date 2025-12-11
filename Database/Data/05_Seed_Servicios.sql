USE myhostdeluxe;
GO

-- Servicios
INSERT INTO Servicios (NombreServicio, CategoriaID, Descripcion, PrecioBase, UnidadPrecio, EstaActivo, NotasAdicionales) VALUES 
('Web Básico Anual', 1, 'Landing page, SSL, GMB, integraciones básicas', 1200.00, 'anual', 1, 'Soporte 3 meses'),
('Web Ecommerce', 1, 'Tienda online, catálogo, pasarela pagos', 2000.00, 'proyecto', 1, 'Soporte 3 meses'),
('Diseño Corporativo', 2, 'Logotipo y mini manual de marca', 200.00, 'unidad', 1, NULL),
('Video Básico', 3, 'Video hasta 59s', 150.00, 'unidad', 1, NULL),
('Administración Google Ads', 4, 'Administración de campañas', 200.00, 'mensual', 1, NULL),
('Marketing en Redes Sociales', 5, 'Manejo de cuentas', 100.00, 'mensual', 1, 'Si se manejan 2 redes $400'),
('Inscripción en Directorios USA', 6, 'Inscripción en 25 directorios', 400.00, 'proyecto', 1, NULL),
('Renovación Web Básica/Ecommerce', 7, 'Dominio+hosting+SSL+soporte', 600.00, 'anual', 1, NULL);
GO