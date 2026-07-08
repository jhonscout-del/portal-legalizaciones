import ExcelJS from 'exceljs'

const TITLES = {
  VIATICOS: 'Solicitud de Viáticos',
  OPERACIONAL: 'Solicitud de Recursos Operacionales',
  GENERO_ERM: 'Solicitud de Recursos — Género y ERM',
}

export async function buildSolicitudWorkbook(solicitud) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Solicitud')
  sheet.columns = [{ width: 22 }, { width: 22 }, { width: 22 }, { width: 16 }, { width: 18 }]

  sheet.mergeCells('A1:E1')
  sheet.getCell('A1').value = TITLES[solicitud.tipo] ?? 'Solicitud de Recursos'
  sheet.getCell('A1').font = { size: 16, bold: true }

  const headerFields = [
    ['Fecha', solicitud.fecha.toISOString().slice(0, 10)],
    ['A favor de', solicitud.aFavorDe],
    ['NIT o C.C.', solicitud.nitCc],
    ['Dirección', solicitud.direccion],
    ['Teléfono', solicitud.telefono],
    ['Por concepto de', solicitud.porConceptoDe],
    ['Con cargo a (Unidad de Negocio)', `${solicitud.project?.businessUnit?.code} - ${solicitud.project?.businessUnit?.name} (${solicitud.project?.name})`],
    ['Donante', solicitud.project?.businessUnit?.donor],
  ]

  let row = 3
  for (const [label, value] of headerFields) {
    sheet.getCell(`A${row}`).value = label
    sheet.getCell(`A${row}`).font = { bold: true }
    sheet.mergeCells(`B${row}:E${row}`)
    sheet.getCell(`B${row}`).value = value ?? ''
    row += 1
  }

  row += 1
  const showEquipos = solicitud.tipo === 'OPERACIONAL'
  const headers = showEquipos
    ? ['Concepto', 'Fecha inicio', 'Fecha fin', 'No. Equipos', 'Valor']
    : ['Concepto', 'Fecha inicio', 'Fecha fin', '', 'Valor']
  sheet.getRow(row).values = headers
  sheet.getRow(row).font = { bold: true }
  sheet.getRow(row).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  })
  row += 1

  const firstDataRow = row
  for (const item of solicitud.items) {
    sheet.getRow(row).values = [
      item.concepto,
      item.fechaInicio.toISOString().slice(0, 10),
      item.fechaFin.toISOString().slice(0, 10),
      showEquipos ? item.numeroEquipos : '',
      item.valor,
    ]
    row += 1
  }
  const lastDataRow = row - 1

  sheet.getCell(`A${row}`).value = 'TOTAL'
  sheet.getCell(`A${row}`).font = { bold: true }
  if (lastDataRow >= firstDataRow) {
    sheet.getCell(`E${row}`).value = { formula: `SUM(E${firstDataRow}:E${lastDataRow})` }
  } else {
    sheet.getCell(`E${row}`).value = 0
  }
  sheet.getCell(`E${row}`).font = { bold: true }
  row += 2

  const bankFields = [
    ['Cuenta corriente/ahorro No.', solicitud.cuentaBancariaNo],
    ['Entidad bancaria', solicitud.entidadBancaria],
    ['A nombre de', solicitud.aNombreDe],
    ['Cédula o NIT titular', solicitud.cedulaNitTitular],
  ]
  for (const [label, value] of bankFields) {
    sheet.getCell(`A${row}`).value = label
    sheet.getCell(`A${row}`).font = { bold: true }
    sheet.mergeCells(`B${row}:E${row}`)
    sheet.getCell(`B${row}`).value = value ?? ''
    row += 1
  }

  row += 2
  sheet.getCell(`A${row}`).value = 'Firma solicitante'
  sheet.getCell(`C${row}`).value = 'Visto bueno contable'
  sheet.getCell(`E${row}`).value = 'Visto bueno administrativo'
  row += 1
  sheet.getCell(`A${row}`).value = solicitud.solicitante?.name ?? ''
  sheet.getCell(`C${row}`).value = solicitud.vistoBuenoContable?.name ?? 'Pendiente'
  sheet.getCell(`E${row}`).value = solicitud.vistoBuenoAdmin?.name ?? 'Pendiente'

  return workbook
}
