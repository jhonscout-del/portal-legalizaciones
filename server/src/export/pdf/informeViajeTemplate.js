import React from 'react'
import { Document, Page, Text, View, renderToStream } from '@react-pdf/renderer'
import { styles, CCCM_FOOTER, formatDate, SignatureBox, AttachmentsSection, resolveSignatures } from './shared.js'

const h = React.createElement

function Field({ label, value }) {
  return h(View, { style: styles.field }, [
    h(Text, { key: 'l', style: styles.fieldLabel }, `${label}:`),
    h(Text, { key: 'v' }, value ?? ''),
  ])
}

function InformeViajeDoc({ informe, signatures }) {
  return h(Document, null,
    h(Page, { size: 'A4', style: styles.page }, [
      h(View, { key: 'header', style: styles.headerRow }, [
        h(View, { key: 'logo', style: styles.logoBox }, h(Text, { style: styles.logoText }, 'LOGO CCCM')),
        h(View, { key: 'title' }, [
          h(Text, { key: 't', style: styles.title }, 'Informe de Viaje'),
          h(Text, { key: 'n', style: styles.orgName }, `No. ${informe.id}`),
        ]),
      ]),

      h(View, { key: 's1', style: styles.section }, [
        h(View, { key: 'r1', style: styles.fieldRow }, [
          h(Field, { key: 'f1', label: 'Fecha inicio de viaje', value: formatDate(informe.fechaInicioViaje) }),
          h(Field, { key: 'f2', label: 'Duración (días)', value: String(informe.duracionDias) }),
        ]),
        h(View, { key: 'r2', style: styles.fieldRow }, [
          h(Field, { key: 'f3', label: 'Solicitante', value: informe.nombreSolicitante }),
          h(Field, { key: 'f4', label: 'Documento de identidad', value: informe.documentoIdentidad }),
        ]),
        h(View, { key: 'r3', style: styles.fieldRow }, [
          h(Field, { key: 'f5', label: 'Dirección', value: informe.direccion }),
          h(Field, { key: 'f6', label: 'Teléfono', value: informe.telefono }),
          h(Field, { key: 'f7', label: 'Ciudad', value: informe.ciudad }),
        ]),
        h(View, { key: 'r4', style: styles.fieldRow }, [
          h(Field, { key: 'f8', label: 'Ruta', value: informe.ruta }),
        ]),
        h(View, { key: 'r5', style: styles.fieldRow }, [
          h(Field, { key: 'f9', label: 'Proyecto', value: informe.project?.name }),
          h(Field, { key: 'f10', label: 'Título/Referencia', value: informe.tituloReferencia }),
        ]),
        h(View, { key: 'r6', style: styles.fieldRow }, [
          h(Field, { key: 'f11', label: 'Objeto del viaje', value: informe.objetoViaje }),
        ]),
      ]),

      h(View, { key: 's2', style: styles.section }, [
        h(Text, { style: styles.sectionTitle }, 'Descripción de la actividad realizada'),
        h(Text, { style: { lineHeight: 1.5 } }, informe.descripcionActividad),
      ]),

      h(AttachmentsSection, { key: 'attachments', attachments: informe.attachments }),

      h(View, { key: 'sig', style: styles.signatures }, [
        h(SignatureBox, { key: 'b1', boxStyle: styles.signatureBox, label: 'Elaborado por', user: informe.elaboradoPor, at: informe.createdAt, signatures }),
      ]),

      h(Text, { key: 'footer', style: styles.footer }, CCCM_FOOTER),
    ]),
  )
}

export async function renderInformeViajePdf(informe) {
  const signatures = await resolveSignatures([informe.elaboradoPor])
  return renderToStream(h(InformeViajeDoc, { informe, signatures }))
}
