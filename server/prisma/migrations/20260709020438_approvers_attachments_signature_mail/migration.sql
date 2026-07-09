-- AlterTable
ALTER TABLE "InformeViaje" ADD COLUMN "destinatarios" TEXT;

-- AlterTable
ALTER TABLE "Legalizacion" ADD COLUMN "destinatarios" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "signatureImagePath" TEXT;

-- CreateTable
CREATE TABLE "Attachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "relatedType" TEXT NOT NULL,
    "relatedId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SolicitudRecurso" (
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
    "destinatarios" TEXT,
    "solicitanteId" INTEGER NOT NULL,
    "vistoBuenoAprobadorId" INTEGER,
    "vistoBuenoAprobadorAt" DATETIME,
    "vistoBuenoContableId" INTEGER,
    "vistoBuenoContableAt" DATETIME,
    "vistoBuenoAdminId" INTEGER,
    "vistoBuenoAdminAt" DATETIME,
    "rechazadoPorId" INTEGER,
    "rechazadoAt" DATETIME,
    "comentarioRechazo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SolicitudRecurso_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudRecurso_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudRecurso_vistoBuenoAprobadorId_fkey" FOREIGN KEY ("vistoBuenoAprobadorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SolicitudRecurso_vistoBuenoContableId_fkey" FOREIGN KEY ("vistoBuenoContableId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SolicitudRecurso_vistoBuenoAdminId_fkey" FOREIGN KEY ("vistoBuenoAdminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SolicitudRecurso_rechazadoPorId_fkey" FOREIGN KEY ("rechazadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SolicitudRecurso" ("aFavorDe", "aNombreDe", "cedulaNitTitular", "createdAt", "cuentaBancariaNo", "direccion", "entidadBancaria", "estado", "fecha", "id", "nitCc", "porConceptoDe", "projectId", "solicitanteId", "telefono", "tipo", "vistoBuenoAdminAt", "vistoBuenoAdminId", "vistoBuenoContableAt", "vistoBuenoContableId") SELECT "aFavorDe", "aNombreDe", "cedulaNitTitular", "createdAt", "cuentaBancariaNo", "direccion", "entidadBancaria", "estado", "fecha", "id", "nitCc", "porConceptoDe", "projectId", "solicitanteId", "telefono", "tipo", "vistoBuenoAdminAt", "vistoBuenoAdminId", "vistoBuenoContableAt", "vistoBuenoContableId" FROM "SolicitudRecurso";
DROP TABLE "SolicitudRecurso";
ALTER TABLE "new_SolicitudRecurso" RENAME TO "SolicitudRecurso";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Attachment_relatedType_relatedId_idx" ON "Attachment"("relatedType", "relatedId");
