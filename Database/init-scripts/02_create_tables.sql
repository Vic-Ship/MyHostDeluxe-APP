PRINT '=== EJECUTANDO SCRIPT 02: Crear tablas ===';

-- Roles 
CREATE TABLE Roles (
    RolID INT IDENTITY(1,1) PRIMARY KEY,
    NombreRol NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255),
    Permisos NVARCHAR(MAX),
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- Usuarios 
CREATE TABLE Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario NVARCHAR(100) NOT NULL UNIQUE,
    Contraseña NVARCHAR(255) NOT NULL,
    CorreoElectronico NVARCHAR(255) NOT NULL,
    RolID INT NOT NULL,
    EstaActivo BIT DEFAULT 1,
    UltimoInicioSesion DATETIME2 NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (RolID) REFERENCES Roles(RolID) ON UPDATE NO ACTION
);
CREATE INDEX IX_Usuarios_Email ON Usuarios(CorreoElectronico);
GO

-- Clientes
CREATE TABLE Clientes (
    ClienteID INT IDENTITY(1,1) PRIMARY KEY,
    NombreEmpresa NVARCHAR(255) NOT NULL,
    NombreContacto NVARCHAR(200) NOT NULL,
    CorreoElectronico NVARCHAR(255) NOT NULL,
    Telefono NVARCHAR(20) NULL,
    Direccion NVARCHAR(500) NULL,
    SitioWeb NVARCHAR(255) NULL,
    Sector NVARCHAR(100) NULL,
    ColorPrimario NVARCHAR(7) NULL,
    ColorSecundario NVARCHAR(7) NULL,
    ColorTerciario NVARCHAR(7) NULL,
    URLLogo NVARCHAR(500) NULL,
    Estado NVARCHAR(20) DEFAULT 'activo',
    Notas NVARCHAR(MAX) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME()
);
CREATE INDEX IX_Clientes_Email ON Clientes(CorreoElectronico);
GO

-- Agentes 
CREATE TABLE Agentes (
    AgenteID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL UNIQUE,
    PrimerNombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    FechaNacimiento DATE NULL,
    Genero CHAR(1) NULL,
    NumeroIdentificacion NVARCHAR(50) NULL UNIQUE,
    CorreoPersonal NVARCHAR(255) NULL,
    CorreoInstitucional NVARCHAR(255) NULL,
    Telefono1 NVARCHAR(20) NULL,
    Telefono2 NVARCHAR(20) NULL,
    Direccion NVARCHAR(500) NULL,
    Sucursal NVARCHAR(100) NULL,
    Cargo NVARCHAR(100) NULL,
    FechaContratacion DATE NOT NULL,
    TipoContrato NVARCHAR(50) NULL,
    DuracionContrato NVARCHAR(100) NULL,
    EstadoEmpleo NVARCHAR(20) DEFAULT 'activo',
    Especialidad NVARCHAR(200) NULL,
    NotasInternas NVARCHAR(MAX) NULL,
    URLFotoPerfil NVARCHAR(500) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Agentes_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX IX_Agentes_UsuarioID ON Agentes(UsuarioID);
GO

-- CategoriasServicios 
CREATE TABLE CategoriasServicios (
    CategoriaID INT IDENTITY(1,1) PRIMARY KEY,
    NombreCategoria NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(500) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- Servicios 
CREATE TABLE Servicios (
    ServicioID INT IDENTITY(1,1) PRIMARY KEY,
    NombreServicio NVARCHAR(200) NOT NULL,
    CategoriaID INT NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    PrecioBase DECIMAL(18,2) NOT NULL,
    UnidadPrecio NVARCHAR(50) NULL,
    EstaActivo BIT DEFAULT 1,
    NotasAdicionales NVARCHAR(MAX) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Servicios_Categorias FOREIGN KEY (CategoriaID) REFERENCES CategoriasServicios(CategoriaID) ON UPDATE NO ACTION
);
CREATE INDEX IX_Servicios_CategoriaID ON Servicios(CategoriaID);
GO

-- Proyectos 
CREATE TABLE Proyectos (
    ProyectoID INT IDENTITY(1,1) PRIMARY KEY,
    NombreProyecto NVARCHAR(255) NOT NULL,
    ClienteID INT NOT NULL,
    AgenteID INT NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    MontoTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    Estado NVARCHAR(50) DEFAULT 'pendiente',
    Prioridad NVARCHAR(20) DEFAULT 'media',
    PorcentajeProgreso INT DEFAULT 0,
    FechaInicio DATE NOT NULL,
    FechaEntregaEstimada DATE NOT NULL,
    FechaCompletacionReal DATE NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Proyectos_Clientes FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID) ON UPDATE NO ACTION,
    CONSTRAINT FK_Proyectos_Agentes FOREIGN KEY (AgenteID) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
CREATE INDEX IX_Proyectos_AgenteID ON Proyectos(AgenteID);
CREATE INDEX IX_Proyectos_ClienteID ON Proyectos(ClienteID);
GO

-- ServiciosProyecto 
CREATE TABLE ServiciosProyecto (
    ServicioProyectoID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    ServicioID INT NOT NULL,
    Cantidad INT DEFAULT 1,
    PrecioUnitario DECIMAL(18,2) NOT NULL,
    PrecioTotal DECIMAL(18,2) NOT NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ServiciosProyecto_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_ServiciosProyecto_Servicios FOREIGN KEY (ServicioID) REFERENCES Servicios(ServicioID) ON UPDATE NO ACTION
);
CREATE INDEX IX_ServiciosProyecto_ProyectoID ON ServiciosProyecto(ProyectoID);
CREATE INDEX IX_ServiciosProyecto_ServicioID ON ServiciosProyecto(ServicioID);
GO

-- Tareas
CREATE TABLE Tareas (
    TareaID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    NombreTarea NVARCHAR(255) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    Estado NVARCHAR(50) DEFAULT 'pendiente',
    Prioridad NVARCHAR(20) DEFAULT 'media',
    FechaVencimiento DATE NULL,
    FechaCompletacion DATE NULL,
    AsignadoA INT NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Tareas_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_Tareas_Agentes FOREIGN KEY (AsignadoA) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
CREATE INDEX IX_Tareas_ProyectoID ON Tareas(ProyectoID);
GO

-- ProgresoProyecto 
CREATE TABLE ProgresoProyecto (
    ProgresoID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    TareaID INT NULL,
    AgenteID INT NOT NULL,
    TipoProgreso NVARCHAR(50) NULL,
    Descripcion NVARCHAR(MAX) NULL,
    PorcentajeProgreso INT NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ProgresoProyecto_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_ProgresoProyecto_Tareas FOREIGN KEY (TareaID) REFERENCES Tareas(TareaID) ON UPDATE NO ACTION,
    CONSTRAINT FK_ProgresoProyecto_Agentes FOREIGN KEY (AgenteID) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
CREATE INDEX IX_ProgresoProyecto_ProyectoID ON ProgresoProyecto(ProyectoID);
GO

-- ArchivosProyecto 
CREATE TABLE ArchivosProyecto (
    ArchivoID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    ProgresoID INT NULL,
    NombreArchivo NVARCHAR(255) NOT NULL,
    URLArchivo NVARCHAR(500) NOT NULL,
    TamanoArchivo BIGINT NULL,
    TipoArchivo NVARCHAR(100) NULL,
    SubidoPor INT NOT NULL,
    SubidoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ArchivosProyecto_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_ArchivosProyecto_Progreso FOREIGN KEY (ProgresoID) REFERENCES ProgresoProyecto(ProgresoID) ON UPDATE NO ACTION,
    CONSTRAINT FK_ArchivosProyecto_Agentes FOREIGN KEY (SubidoPor) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
GO

-- HistorialProyecto 
CREATE TABLE HistorialProyecto (
    HistorialID INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoID INT NOT NULL,
    CampoModificado NVARCHAR(100) NOT NULL,
    ValorAnterior NVARCHAR(MAX) NULL,
    ValorNuevo NVARCHAR(MAX) NULL,
    ModificadoPor INT NOT NULL,
    ModificadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_HistorialProyecto_Proyectos FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT FK_HistorialProyecto_Agentes FOREIGN KEY (ModificadoPor) REFERENCES Agentes(AgenteID) ON UPDATE NO ACTION
);
GO

-- BitacoraAuditoria 
CREATE TABLE BitacoraAuditoria (
    RegistroID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL,
    Accion NVARCHAR(100) NOT NULL,
    Modulo NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    DireccionIP NVARCHAR(45) NULL,
    AgenteUsuario NVARCHAR(500) NULL,
    CreadoEn DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Bitacora_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON UPDATE NO ACTION
);
CREATE INDEX IX_Bitacora_UsuarioID ON BitacoraAuditoria(UsuarioID);
GO