import ExcelJS from 'exceljs'

export async function buildInformeViajeWorkbook(informe) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Informe de Viaje')
  sheet.columns = [{ width: 24 }, { width: 40 }]

  sheet.mergeCells('A1:B1')
  sheet.getCell('A1').value = 'Informe de Viaje'
  sheet.getCell('A1').font = { size: 16, bold: true }

  const fields = [
    ['Fecha inicio de viaje', informe.fechaInicioViaje.toISOString().slice(0, 10)],
    ['Duración (días)', informe.duracionDias],
    ['Solicitante', informe.nombreSolicitante],
    ['Documento de identidad', informe.documentoIdentidad],
    ['Dirección', informe.direccion],
    ['Teléfono', informe.telefono],
    ['Ciudad', informe.ciudad],
    ['Ruta', informe.ruta],
    ['Proyecto', informe.project?.name],
    ['Título/Referencia', informe.tituloReferencia],
    ['Objeto del viaje', informe.objetoViaje],
  ]

  let row = 3
  for (const [label, value] of fields) {
    sheet.getCell(`A${row}`).value = label
    sheet.getCell(`A${row}`).font = { bold: true }
    sheet.getCell(`B${row}`).value = value ?? ''
    row += 1
  }

  row += 1
  sheet.getCell(`A${row}`).value = 'Descripción de la actividad realizada'
  sheet.getCell(`A${row}`).font = { bold: true }
  row += 1
  sheet.mergeCells(`A${row}:B${row + 4}`)
  sheet.getCell(`A${row}`).value = informe.descripcionActividad
  sheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' }
  row += 6

  sheet.getCell(`A${row}`).value = 'Elaborado por'
  sheet.getCell(`A${row}`).font = { bold: true }
  row += 1
  sheet.getCell(`A${row}`).value = informe.elaboradoPor?.name ?? ''

  return workbook
}
