// Fuente única de verdad de las tablas del libro Excel: nombre de tabla,
// nombre de hoja, columnas en orden fijo (SOLO SE AGREGA AL FINAL — nunca
// insertar una columna en medio, rompe el mapeo fila-array <-> objeto para
// filas ya existentes) y cuáles columnas son de fecha (se guardan/leen
// siempre como texto ISO-8601).
//
// Usado tanto por scripts/init-workbook.js (crear el libro) como por
// excelDb.js (mapear filas de Graph a objetos JS).

export const TABLES = {
  Users: {
    sheet: 'Users',
    idColumn: 'id',
    columns: ['id', 'name', 'email', 'microsoftOid', 'role', 'signatureFileId', 'signatureMimeType', 'createdAt'],
    dateColumns: ['createdAt'],
  },
  BusinessUnits: {
    sheet: 'BusinessUnits',
    idColumn: 'id',
    columns: ['id', 'code', 'name', 'donor', 'active'],
    dateColumns: [],
  },
  Projects: {
    sheet: 'Projects',
    idColumn: 'id',
    columns: ['id', 'name', 'businessUnitId', 'encargado', 'active'],
    dateColumns: [],
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
  },
  ConceptoItems: {
    sheet: 'ConceptoItems',
    idColumn: 'id',
    columns: ['id', 'solicitudId', 'concepto', 'fechaInicio', 'fechaFin', 'numeroEquipos', 'valor'],
    dateColumns: ['fechaInicio', 'fechaFin'],
  },
  RetentionRates: {
    sheet: 'RetentionRates',
    idColumn: 'id',
    columns: ['id', 'concepto', 'baseGravable', 'porcentaje'],
    dateColumns: [],
  },
  Legalizaciones: {
    sheet: 'Legalizaciones',
    idColumn: 'id',
    columns: [
      'id', 'projectId', 'solicitudId', 'fechaSolicitudAnticipo', 'valorAnticipo', 'nitCc',
      'nombreActividad', 'destinatarios', 'solicitanteId',
      'firmaSolicitanteAt', 'firmaContablePorId', 'firmaContableAt', 'createdAt',
    ],
    dateColumns: ['fechaSolicitudAnticipo', 'firmaSolicitanteAt', 'firmaContableAt', 'createdAt'],
  },
  RubrosLegalizacion: {
    sheet: 'RubrosLegalizacion',
    idColumn: 'id',
    columns: ['id', 'legalizacionId', 'seccion', 'fecha', 'nit', 'beneficiario', 'noFactura', 'concepto', 'valorFactura', 'valorRetefuente'],
    dateColumns: ['fecha'],
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
  },
  Attachments: {
    sheet: 'Attachments',
    idColumn: 'id',
    columns: ['id', 'relatedType', 'relatedId', 'filename', 'mimeType', 'size', 'driveItemId', 'uploadedById', 'createdAt'],
    dateColumns: ['createdAt'],
  },
  Counters: {
    sheet: 'Counters',
    idColumn: 'tableName',
    columns: ['tableName', 'nextId'],
    dateColumns: [],
  },
}

export const TABLE_NAMES = Object.keys(TABLES).filter((name) => name !== 'Counters')
