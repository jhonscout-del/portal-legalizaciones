-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BusinessUnit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "donor" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "businessUnitId" INTEGER NOT NULL,
    "encargado" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Project_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolicitudRecurso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "aFavorDe" TEXT NOT NULL,
    "nitCc" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "porConceptoDe" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "cuentaBancariaNo" TEXT NOT NULL,
    "entidadBancaria" TEXT NOT NULL,
    "aNombreDe" TEXT NOT NULL,
    "cedulaNitTitular" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "solicitanteId" INTEGER NOT NULL,
    "vistoBuenoContableId" INTEGER,
    "vistoBuenoContableAt" DATETIME,
    "vistoBuenoAdminId" INTEGER,
    "vistoBuenoAdminAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SolicitudRecurso_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudRecurso_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudRecurso_vistoBuenoContableId_fkey" FOREIGN KEY ("vistoBuenoContableId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SolicitudRecurso_vistoBuenoAdminId_fkey" FOREIGN KEY ("vistoBuenoAdminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConceptoItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitudId" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME NOT NULL,
    "numeroEquipos" INTEGER,
    "valor" REAL NOT NULL,
    CONSTRAINT "ConceptoItem_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudRecurso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetentionRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "concepto" TEXT NOT NULL,
    "baseGravable" REAL NOT NULL,
    "porcentaje" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Legalizacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "fechaSolicitudAnticipo" DATETIME NOT NULL,
    "valorAnticipo" REAL NOT NULL,
    "nitCc" TEXT NOT NULL,
    "nombreActividad" TEXT NOT NULL,
    "solicitanteId" INTEGER NOT NULL,
    "firmaSolicitanteAt" DATETIME,
    "firmaContableAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Legalizacion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Legalizacion_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudRecurso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Legalizacion_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RubroLegalizacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legalizacionId" INTEGER NOT NULL,
    "seccion" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "nit" TEXT NOT NULL,
    "beneficiario" TEXT NOT NULL,
    "noFactura" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "valorFactura" REAL NOT NULL,
    "valorRetefuente" REAL NOT NULL,
    CONSTRAINT "RubroLegalizacion_legalizacionId_fkey" FOREIGN KEY ("legalizacionId") REFERENCES "Legalizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InformeViaje" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fechaInicioViaje" DATETIME NOT NULL,
    "duracionDias" INTEGER NOT NULL,
    "nombreSolicitante" TEXT NOT NULL,
    "documentoIdentidad" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "tituloReferencia" TEXT NOT NULL,
    "objetoViaje" TEXT NOT NULL,
    "descripcionActividad" TEXT NOT NULL,
    "elaboradoPorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InformeViaje_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InformeViaje_elaboradoPorId_fkey" FOREIGN KEY ("elaboradoPorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUnit_code_key" ON "BusinessUnit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RetentionRate_concepto_key" ON "RetentionRate"("concepto");
