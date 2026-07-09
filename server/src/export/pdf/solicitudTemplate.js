import React from 'react'
import { Document, Page, Text, View, renderToStream } from '@react-pdf/renderer'
import { styles, CCCM_FOOTER, formatCOP, formatDate, SignatureBox, AttachmentsSection } from './shared.js'

const h = React.createElement

const TITLES = {
  VIATICOS: 'Solicitud de Viáticos',
  OPERACIONAL: 'Solicitud de Recursos Operacionales',
  GENERO_ERM: 'Solicitud de Recursos — Género y ERM',
}

function Field({ label, value }) {
  return h(View, { style: styles.field }, [
    h(Text, { key: 'l', style: styles.fieldLabel }, `${label}:`),
    h(Text, { key: 'v' }, value ?? ''),
  ])
}

function SolicitudDoc({ solicitud }) {
  const total = solicitud.items.reduce((s, i) => s + i.valor, 0)
  const showEquipos = solicitud.tipo === 'OPERACIONAL'

  return h(Document, null,
    h(Page, { size: 'A4', style: styles.page }, [
      h(View, { key: 'header', style: styles.headerRow }, [
        h(View, { key: 'logo', style: styles.logoBox }, h(Text, { style: styles.logoText }, 'LOGO CCCM')),
        h(View, { key: 'title' }, [
          h(Text, { key: 't', style: styles.title }, TITLES[solicitud.tipo] ?? 'Solicitud de Recursos'),
          h(Text, { key: 'n', style: styles.orgName }, `No. ${solicitud.id}`),
        ]),
      ]),

      h(View, { key: 's1', style: styles.section }, [
        h(View, { key: 'r1', style: styles.fieldRow }, [
          h(Field, { key: 'f1', label: 'Fecha', value: formatDate(solicitud.fecha) }),
          h(Field, { key: 'f2', label: 'Valor a girar', value: formatCOP(total) }),
        ]),
        h(View, { key: 'r2', style: styles.fieldRow }, [
          h(Field, { key: 'f3', label: 'A favor de', value: solicitud.aFavorDe }),
          h(Field, { key: 'f4', label: 'NIT o C.C.', value: solicitud.nitCc }),
        ]),
        h(View, { key: 'r3', style: styles.fieldRow }, [
          h(Field, { key: 'f5', label: 'Dirección y Teléfono', value: `${solicitud.direccion} / ${solicitud.telefono}` }),
        ]),
        h(View, { key: 'r4', style: styles.fieldRow }, [
          h(Field, { key: 'f6', label: 'Por concepto de', value: solicitud.porConceptoDe }),
        ]),
        h(View, { key: 'r5', style: styles.fieldRow }, [
          h(Field, { key: 'f7', label: 'Con cargo a', value: `${solicitud.project?.businessUnit?.code} - ${solicitud.project?.businessUnit?.name} (${solicitud.project?.name})` }),
          h(Field, { key: 'f8', label: 'Donante', value: solicitud.project?.businessUnit?.donor }),
        ]),
      ]),

      h(View, { key: 's2', style: styles.section }, [
        h(Text, { style: styles.sectionTitle }, 'Tabla de conceptos'),
        h(View, { style: styles.table }, [
          h(View, { key: 'th', style: styles.tableHeaderRow }, [
            h(Text, { key: 'c1', style: styles.th }, 'Concepto'),
            h(Text, { key: 'c2', style: styles.th }, 'Fecha inicio'),
            h(Text, { key: 'c3', style: styles.th }, 'Fecha fin'),
            ...(showEquipos ? [h(Text, { key: 'c4', style: styles.th }, 'No. Equipos')] : []),
            h(Text, { key: 'c5', style: styles.th }, 'Valor'),
          ]),
          ...solicitud.items.map((item, idx) =>
            h(View, { key: `row-${idx}`, style: styles.tableRow }, [
              h(Text, { key: 'c1', style: styles.td }, item.concepto),
              h(Text, { key: 'c2', style: styles.td }, formatDate(item.fechaInicio)),
              h(Text, { key: 'c3', style: styles.td }, formatDate(item.fechaFin)),
              ...(showEquipos ? [h(Text, { key: 'c4', style: styles.td }, String(item.numeroEquipos ?? ''))] : []),
              h(Text, { key: 'c5', style: styles.td }, formatCOP(item.valor)),
            ]),
          ),
          h(View, { key: 'total', style: styles.totalRow }, [
            h(Text, { key: 'c1', style: styles.td }, 'TOTAL'),
            h(Text, { key: 'c2', style: styles.td }, ''),
            h(Text, { key: 'c3', style: styles.td }, ''),
            ...(showEquipos ? [h(Text, { key: 'c4', style: styles.td }, '')] : []),
            h(Text, { key: 'c5', style: styles.td }, formatCOP(total)),
          ]),
        ]),
      ]),

      h(View, { key: 's3', style: styles.section }, [
        h(Text, { style: styles.sectionTitle }, 'Información bancaria'),
        h(View, { key: 'r1', style: styles.fieldRow }, [
          h(Field, { key: 'f1', label: 'Cuenta corriente/ahorro No.', value: solicitud.cuentaBancariaNo }),
          h(Field, { key: 'f2', label: 'Entidad bancaria', value: solicitud.entidadBancaria }),
        ]),
        h(View, { key: 'r2', style: styles.fieldRow }, [
          h(Field, { key: 'f3', label: 'A nombre de', value: solicitud.aNombreDe }),
          h(Field, { key: 'f4', label: 'Cédula o NIT titular', value: solicitud.cedulaNitTitular }),
        ]),
      ]),

      h(AttachmentsSection, { key: 'attachments', attachments: solicitud.attachments }),

      h(View, { key: 'sig', style: styles.signatures }, [
        h(SignatureBox, { key: 'b1', boxStyle: styles.signatureBoxQuarter, label: 'Firma solicitante', user: solicitud.solicitante }),
        h(SignatureBox, { key: 'b2', boxStyle: styles.signatureBoxQuarter, label: 'Visto bueno aprobador', user: solicitud.vistoBuenoAprobador, at: solicitud.vistoBuenoAprobadorAt }),
        h(SignatureBox, { key: 'b3', boxStyle: styles.signatureBoxQuarter, label: 'Visto bueno contable', user: solicitud.vistoBuenoContable, at: solicitud.vistoBuenoContableAt }),
        h(SignatureBox, { key: 'b4', boxStyle: styles.signatureBoxQuarter, label: 'Visto bueno administrativo', user: solicitud.vistoBuenoAdmin, at: solicitud.vistoBuenoAdminAt }),
      ]),

      h(Text, { key: 'footer', style: styles.footer }, CCCM_FOOTER),
    ]),
  )
}

export async function renderSolicitudPdf(solicitud) {
  return renderToStream(h(SolicitudDoc, { solicitud }))
}
