USE myhostdeluxe;
GO

-- ServiciosProyecto
INSERT INTO ServiciosProyecto (ProyectoID, ServicioID, Cantidad, PrecioUnitario, PrecioTotal, CreadoEn)
VALUES
(1, 1, 1, 1200.00, 1200.00, SYSDATETIME()),
(1, 3, 2, 200.00, 400.00, SYSDATETIME()),
(2, 6, 1, 100.00, 100.00, SYSDATETIME()),
(3, 2, 1, 2000.00, 2000.00, SYSDATETIME());
GO