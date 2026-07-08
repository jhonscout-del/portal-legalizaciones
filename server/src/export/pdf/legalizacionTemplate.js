import React from 'react'
import { Document, Page, Text, View, renderToStream } from '@react-pdf/renderer'
import { styles, CCCM_FOOTER, formatCOP, formatDate, formatDateTime } from './shared.js'

const h = React.createElement

function Field({ label, value }) {
  return h(View, { style: styles.field }, [
    h(Text, { key: 'l', style: styles.fieldLabel }, `${label}:`),
    h(Text, { key: 'v' }, value ?? ''),
  ])
}

function LegalizacionDoc({ legalizacion }) {
  const { resumen } = legalizacion

  return h(Document, null,
    h(Page, { size: 'A4', style: styles.page }, [
      h(View, { key: 'header', style: styles.headerRow }, [
        h(View, { key: 'logo', style: styles.logoBox }, h(Text, { style: styles.logoText }, 'LOGO CCCM')),
        h(View, { key: 'title' }, [
          h(Text, { key: 't', style: styles.title }, 'Legalización de Recursos'),
          h(Text, { key: 'n', style: styles.orgName }, `No. ${legalizacion.id}`),
        ]),
      ]),

      h(View, { key: 's1', style: styles.section }, [
        h(View, { key: 'r1', style: styles.fieldRow }, [
          h(Field, { key: 'f1', label: 'Nombre del proyecto', value: legalizacion.project?.name }),
          h(Field, { key: 'f2', label: 'Actividad', value: legalizacion.nombreActividad }),
        ]),
        h(View, { key: 'r2', style: styles.fieldRow }, [
          h(Field, { key: 'f3', label: 'Fecha solicitud anticipo', value: formatDate(legalizacion.fechaSolicitudAnticipo) }),
          h(Field, { key: 'f4', label: 'Valor anticipo', value: formatCOP(legalizacion.valorAnticipo) }),
        ]),
        h(View, { key: 'r3', style: styles.fieldRow }, [
          h(Field, { key: 'f5', label: 'Solicitante', value: legalizacion.solicitante?.name }),
          h(Field, { key: 'f6', label: 'NIT/CC', value: legalizacion.nitCc }),
        ]),
      ]),

      h(View, { key: 's2', style: styles.section }, [
        h(Text, { style: styles.sectionTitle }, 'Detalle de rubros'),
        h(View, { style: styles.table }, [
          h(View, { key: 'th', style: styles.tableHeaderRow }, [
            h(Text, { key: 'c1', style: styles.th }, 'Fecha'),
            h(Text, { key: 'c2', style: styles.th }, 'NIT'),
            h(Text, { key: 'c3', style: styles.th }, 'Beneficiario'),
            h(Text, { key: 'c4', style: styles.th }, 'No. Factura'),
            h(Text, { key: 'c5', style: styles.th }, 'Concepto'),
            h(Text, { key: 'c6', style: styles.th }, 'Vr. Retefuente'),
            h(Text, { key: 'c7', style: styles.th }, 'Vr. Factura'),
          ]),
          ...legalizacion.rubros.map((r, idx) =>
            h(View, { key: `row-${idx}`, style: styles.tableRow }, [
              h(Text, { key: 'c1', style: styles.td }, formatDate(r.fecha)),
              h(Text, { key: 'c2', style: styles.td }, r.nit),
              h(Text, { key: 'c3', style: styles.td }, r.beneficiario),
              h(Text, { key: 'c4', style: styles.td }, r.noFactura),
              h(Text, { key: 'c5', style: styles.td }, r.concepto),
              h(Text, { key: 'c6', style: styles.td }, formatCOP(r.valorRetefuente)),
              h(Text, { key: 'c7', style: styles.td }, formatCOP(r.valorFactura)),
            ]),
          ),
        ]),
      ]),

      h(View, { key: 's3', style: styles.section }, [
        h(Text, { style: styles.sectionTitle }, 'Liquidación'),
        h(View, { key: 'r1', style: styles.fieldRow }, [
          h(Field, { key: 'f1', label: 'Valor anticipo', value: formatCOP(resumen.valorAnticipo) }),
          h(Field, { key: 'f2', label: '(-) Legalizaciones anteriores', value: formatCOP(resumen.legalizacionesAnteriores) }),
        ]),
        h(View, { key: 'r2', style: styles.fieldRow }, [
          h(Field, { key: 'f3', label: '(-) Legalización actual', value: formatCOP(resumen.legalizacionActual) }),
          h(Field, { key: 'f4', label: resumen.aReembolsar ? 'A reembolsar' : 'Saldo', value: formatCOP(Math.abs(resumen.saldo)) }),
        ]),
      ]),

      h(View, { key: 'sig', style: styles.signatures }, [
        h(View, { key: 'b1', style: styles.signatureBox }, [
          h(View, { style: styles.signatureLine }, h(Text, null, 'Firma solicitante')),
          h(Text, null, legalizacion.firmaSolicitanteAt ? formatDateTime(legalizacion.firmaSolicitanteAt) : 'Pendiente'),
        ]),
        h(View, { key: 'b2', style: styles.signatureBox }, [
          h(View, { style: styles.signatureLine }, h(Text, null, 'Firma contabilidad')),
          h(Text, null, legalizacion.firmaContableAt ? formatDateTime(legalizacion.firmaContableAt) : 'Pendiente'),
        ]),
      ]),

      h(Text, { key: 'footer', style: styles.footer }, CCCM_FOOTER),
    ]),
  )
}

export async function renderLegalizacionPdf(legalizacion) {
  return renderToStream(h(LegalizacionDoc, { legalizacion }))
}
