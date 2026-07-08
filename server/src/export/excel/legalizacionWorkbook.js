import ExcelJS from 'exceljs'

export async function buildLegalizacionWorkbook(legalizacion) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Legalización')
  sheet.columns = [{ width: 14 }, { width: 14 }, { width: 24 }, { width: 14 }, { width: 20 }, { width: 16 }, { width: 16 }]

  sheet.mergeCells('A1:G1')
  sheet.getCell('A1').value = 'Legalización de Recursos'
  sheet.getCell('A1').font = { size: 16, bold: true }

  const headerFields = [
    ['Nombre del proyecto', legalizacion.project?.name],
    ['Fecha solicitud anticipo', legalizacion.fechaSolicitudAnticipo.toISOString().slice(0, 10)],
    ['Valor anticipo', legalizacion.valorAnticipo],
    ['Solicitante', legalizacion.solicitante?.name],
    ['NIT/CC', legalizacion.nitCc],
    ['Nombre de la actividad', legalizacion.nombreActividad],
  ]
  let row = 3
  for (const [label, value] of headerFields) {
    sheet.getCell(`A${row}`).value = label
    sheet.getCell(`A${row}`).font = { bold: true }
    sheet.mergeCells(`C${row}:G${row}`)
    sheet.getCell(`C${row}`).value = value ?? ''
    row += 1
  }

  row += 1
  const headers = ['Fecha', 'NIT', 'Beneficiario', 'No. Factura', 'Concepto', 'Vr. Retefuente', 'Vr. Factura']
  sheet.getRow(row).values = headers
  sheet.getRow(row).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  })
  row += 1

  const firstDataRow = row
  for (const r of legalizacion.rubros) {
    sheet.getRow(row).values = [
      r.fecha.toISOString().slice(0, 10),
      r.nit,
      r.beneficiario,
      r.noFactura,
      r.concepto,
      r.valorRetefuente,
      r.valorFactura,
    ]
    row += 1
  }
  const lastDataRow = row - 1

  sheet.getCell(`E${row}`).value = 'TOTALES'
  sheet.getCell(`E${row}`).font = { bold: true }
  if (lastDataRow >= firstDataRow) {
    sheet.getCell(`F${row}`).value = { formula: `SUM(F${firstDataRow}:F${lastDataRow})` }
    sheet.getCell(`G${row}`).value = { formula: `SUM(G${firstDataRow}:G${lastDataRow})` }
  }
  row += 2

  const { resumen } = legalizacion
  const liquidacion = [
    ['Valor anticipo', resumen.valorAnticipo],
    ['(-) Legalizaciones anteriores', resumen.legalizacionesAnteriores],
    ['(-) Legalización actual', resumen.legalizacionActual],
    [resumen.aReembolsar ? 'A reembolsar' : 'Saldo', Math.abs(resumen.saldo)],
  ]
  for (const [label, value] of liquidacion) {
    sheet.getCell(`A${row}`).value = label
    sheet.getCell(`A${row}`).font = { bold: true }
    sheet.getCell(`C${row}`).value = value
    row += 1
  }

  row += 2
  sheet.getCell(`A${row}`).value = 'Firma solicitante'
  sheet.getCell(`D${row}`).value = 'Firma contabilidad'
  row += 1
  sheet.getCell(`A${row}`).value = legalizacion.firmaSolicitanteAt ? 'Firmado' : 'Pendiente'
  sheet.getCell(`D${row}`).value = legalizacion.firmaContableAt ? 'Firmado' : 'Pendiente'

  return workbook
}
