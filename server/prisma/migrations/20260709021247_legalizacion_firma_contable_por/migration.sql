-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Legalizacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "fechaSolicitudAnticipo" DATETIME NOT NULL,
    "valorAnticipo" REAL NOT NULL,
    "nitCc" TEXT NOT NULL,
    "nombreActividad" TEXT NOT NULL,
    "destinatarios" TEXT,
    "solicitanteId" INTEGER NOT NULL,
    "firmaSolicitanteAt" DATETIME,
    "firmaContablePorId" INTEGER,
    "firmaContableAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Legalizacion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Legalizacion_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudRecurso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Legalizacion_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Legalizacion_firmaContablePorId_fkey" FOREIGN KEY ("firmaContablePorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Legalizacion" ("createdAt", "destinatarios", "fechaSolicitudAnticipo", "firmaContableAt", "firmaSolicitanteAt", "id", "nitCc", "nombreActividad", "projectId", "solicitanteId", "solicitudId", "valorAnticipo") SELECT "createdAt", "destinatarios", "fechaSolicitudAnticipo", "firmaContableAt", "firmaSolicitanteAt", "id", "nitCc", "nombreActividad", "projectId", "solicitanteId", "solicitudId", "valorAnticipo" FROM "Legalizacion";
DROP TABLE "Legalizacion";
ALTER TABLE "new_Legalizacion" RENAME TO "Legalizacion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
