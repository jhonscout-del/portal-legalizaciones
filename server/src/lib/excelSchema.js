// Fuente única de verdad de las tablas del libro Excel: nombre de tabla,
// nombre de hoja, columnas en orden fijo (SOLO SE AGREGA AL FINAL — nunca
// insertar una columna en medio, rompe el mapeo fila-array <-> objeto para
// filas ya existentes), cuáles columnas son de fecha (se guardan/leen
// siempre como texto ISO-8601), y cuáles son texto que "parece número"
// (códigos con ceros a la izquierda, teléfonos, cédulas, No. de cuenta,
// No. de factura...) — sin marcarlas, Excel las auto-convierte a número y
// se pierden los ceros a la izquierda (confirmado con pruebas reales).
//
// Usado tanto por scripts/init-workbook.js (crear el libro, formatea estas
// columnas como Texto) como por excelDb.js (mapear filas de Graph a objetos JS).

export const TABLES = {
  Users: {
    sheet: 'Users',
    idColumn: 'id',
    // 'role' guarda una lista de roles separada por comas (p. ej. "SOLICITANTE,APROBADOR") —
    // ver parseRoles/serializeRoles en lib/repos/users.js. 'aprobadorEmail' es el correo que
    // el propio usuario declaró como su aprobador (auto-asigna el rol APROBADOR a ese correo).
    columns: ['id', 'name', 'email', 'microsoftOid', 'role', 'signatureFileId', 'signatureMimeType', 'createdAt', 'aprobadorEmail'],
    dateColumns: ['createdAt'],
    textColumns: [],
  },
  BusinessUnits: {
    sheet: 'BusinessUnits',
    idColumn: 'id',
    columns: ['id', 'code', 'name', 'donor', 'active'],
    dateColumns: [],
    textColumns: ['code'],
  },
  Projects: {
    sheet: 'Projects',
    idColumn: 'id',
    // 'responsableEmail' es el correo del responsable del proyecto para el
    // área contable: al elegir el proyecto en una solicitud/legalización, la
    // notificación de "lista para revisión contable" se dirige a este correo.
    columns: ['id', 'name', 'businessUnitId', 'encargado', 'active', 'responsableEmail'],
    dateColumns: [],
    textColumns: [],
  },
  SolicitudesRecurso: {
    sheet: 'SolicitudesRecurso',
    idColumn: 'id',
    columns: [
      'id', 'tipo', 'fecha', 'aFavorDe', 'nitCc', 'direccion', 'telefono', 'porConceptoDe',
      'projectId', 'cuentaBancariaNo', 'entidadBancaria', 'aNombreDe', 'cedulaNitTitular',
      'estado', 'destinatarios', 'solicitanteId',
      'vistoBuenoAprobadorId', 'vistoBuenoAprobadorAt',
      'vistoBuenoContableId', 'vistoBuenoContableAt',
      'vistoBuenoAdminId', 'vistoBuenoAdminAt',
      'rechazadoPorId', 'rechazadoAt', 'comentarioRechazo',
      'createdAt',
    ],
    dateColumns: ['fecha', 'vistoBuenoAprobadorAt', 'vistoBuenoContableAt', 'vistoBuenoAdminAt', 'rechazadoAt', 'createdAt'],
    textColumns: ['nitCc', 'telefono', 'cuentaBancariaNo', 'cedulaNitTitular'],
  },
  ConceptoItems: {
    sheet: 'ConceptoItems',
    idColumn: 'id',
    columns: ['id', 'solicitudId', 'concepto', 'fechaInicio', 'fechaFin', 'numeroEquipos', 'valor'],
    dateColumns: ['fechaInicio', 'fechaFin'],
    textColumns: [],
  },
  RetentionRates: {
    sheet: 'RetentionRates',
    idColumn: 'id',
    columns: ['id', 'concepto', 'baseGravable', 'porcentaje'],
    dateColumns: [],
    textColumns: [],
  },
  Legalizaciones: {
    sheet: 'Legalizaciones',
    idColumn: 'id',
    columns: [
      'id', 'projectId', 'solicitudId', 'fechaSolicitudAnticipo', 'valorAnticipo', 'nitCc',
      'nombreActividad', 'destinatarios', 'solicitanteId',
      'firmaSolicitanteAt', 'firmaContablePorId', 'firmaContableAt', 'createdAt',
      'vistoBuenoAprobadorId', 'vistoBuenoAprobadorAt',
    ],
    dateColumns: ['fechaSolicitudAnticipo', 'firmaSolicitanteAt', 'firmaContableAt', 'createdAt', 'vistoBuenoAprobadorAt'],
    textColumns: ['nitCc'],
  },
  RubrosLegalizacion: {
    sheet: 'RubrosLegalizacion',
    idColumn: 'id',
    columns: ['id', 'legalizacionId', 'seccion', 'fecha', 'nit', 'beneficiario', 'noFactura', 'concepto', 'valorFactura', 'valorRetefuente'],
    dateColumns: ['fecha'],
    textColumns: ['nit', 'noFactura'],
  },
  InformesViaje: {
    sheet: 'InformesViaje',
    idColumn: 'id',
    columns: [
      'id', 'fechaInicioViaje', 'duracionDias', 'nombreSolicitante', 'documentoIdentidad',
      'direccion', 'telefono', 'ciudad', 'ruta', 'projectId', 'tituloReferencia', 'objetoViaje',
      'descripcionActividad', 'destinatarios', 'elaboradoPorId', 'createdAt',
    ],
    dateColumns: ['fechaInicioViaje', 'createdAt'],
    textColumns: ['documentoIdentidad', 'telefono'],
  },
  Attachments: {
    sheet: 'Attachments',
    idColumn: 'id',
    columns: ['id', 'relatedType', 'relatedId', 'filename', 'mimeType', 'size', 'driveItemId', 'uploadedById', 'createdAt'],
    dateColumns: ['createdAt'],
    textColumns: [],
  },
  Counters: {
    sheet: 'Counters',
    idColumn: 'tableName',
    columns: ['tableName', 'nextId'],
    dateColumns: [],
    textColumns: [],
  },
}

export const TABLE_NAMES = Object.keys(TABLES).filter((name) => name !== 'Counters')
