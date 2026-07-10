import ExcelJS from 'exceljs'

function dateStr(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

function headerRow(sheet, headers) {
  sheet.addRow(headers)
  const row = sheet.lastRow
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } }
  })
}

export function buildSolicitudesReporte(solicitudes) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Solicitudes')
  sheet.columns = [
    { width: 8 }, { width: 14 }, { width: 12 }, { width: 24 }, { width: 24 },
    { width: 14 }, { width: 22 }, { width: 24 }, { width: 12 },
  ]
  headerRow(sheet, ['No.', 'Tipo', 'Fecha', 'A favor de', 'Proyecto', 'Estado', 'Solicitante', 'Por concepto de', 'Total'])

  for (const s of solicitudes) {
    sheet.addRow([
      s.id,
      s.tipo,
      dateStr(s.fecha),
      s.aFavorDe,
      s.project?.name ?? '',
      s.estado,
      s.solicitante?.name ?? '',
      s.porConceptoDe ?? '',
      (s.items ?? []).reduce((sum, i) => sum + Number(i.valor || 0), 0),
    ])
  }

  return workbook
}

export function buildLegalizacionesReporte(legalizaciones) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Legalizaciones')
  sheet.columns = [
    { width: 8 }, { width: 14 }, { width: 24 }, { width: 24 }, { width: 24 },
    { width: 16 }, { width: 16 }, { width: 16 },
  ]
  headerRow(sheet, ['No.', 'Fecha anticipo', 'Proyecto', 'Actividad', 'Solicitante', 'Valor anticipo', 'Legalizado', 'Saldo'])

  for (const l of legalizaciones) {
    sheet.addRow([
      l.id,
      dateStr(l.fechaSolicitudAnticipo),
      l.project?.name ?? '',
      l.nombreActividad,
      l.solicitante?.name ?? '',
      l.resumen?.valorAnticipo ?? l.valorAnticipo,
      l.resumen?.legalizacionActual ?? '',
      l.resumen?.saldo ?? '',
    ])
  }

  return workbook
}

export function buildInformesReporte(informes) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Informes de viaje')
  sheet.columns = [
    { width: 8 }, { width: 14 }, { width: 24 }, { width: 24 }, { width: 24 }, { width: 12 },
  ]
  headerRow(sheet, ['No.', 'Fecha inicio', 'Solicitante', 'Proyecto', 'Ruta', 'Duración (días)'])

  for (const i of informes) {
    sheet.addRow([
      i.id,
      dateStr(i.fechaInicioViaje),
      i.nombreSolicitante,
      i.project?.name ?? '',
      i.ruta ?? '',
      i.duracionDias ?? '',
    ])
  }

  return workbook
}
