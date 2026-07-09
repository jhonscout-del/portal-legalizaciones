import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { AttachmentsPanel } from '../../components/AttachmentsPanel.jsx'
import { formatDate } from '../../lib/constants.js'

export function DetalleInforme() {
  const { id } = useParams()
  const { data: i, isLoading } = useQuery({ queryKey: ['informe-viaje', id], queryFn: () => api.get(`/informes-viaje/${id}`) })

  if (isLoading || !i) return <p>Cargando…</p>

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Informe de Viaje — No. {i.id}</h1>
        <div className="flex gap-2">
          <a href={`/api/informes-viaje/${i.id}/export.pdf`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Exportar PDF</a>
          <a href={`/api/informes-viaje/${i.id}/export.xlsx`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Exportar Excel</a>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Detail label="Fecha inicio de viaje" value={formatDate(i.fechaInicioViaje)} />
            <Detail label="Duración (días)" value={i.duracionDias} />
            <Detail label="Solicitante" value={i.nombreSolicitante} />
            <Detail label="Documento de identidad" value={i.documentoIdentidad} />
            <Detail label="Dirección" value={i.direccion} />
            <Detail label="Teléfono" value={i.telefono} />
            <Detail label="Ciudad" value={i.ciudad} />
            <Detail label="Ruta" value={i.ruta} />
            <Detail label="Proyecto" value={i.project?.name} />
            <Detail label="Título/Referencia" value={i.tituloReferencia} />
            {i.destinatarios && <Detail label="Destinatarios notificados" value={i.destinatarios} />}
          </dl>

          <div className="mt-4">
            <p className="text-neutral-500">Objeto del viaje</p>
            <p className="mt-1">{i.objetoViaje}</p>
          </div>
          <div className="mt-4">
            <p className="text-neutral-500">Descripción de la actividad realizada</p>
            <p className="mt-1 whitespace-pre-wrap">{i.descripcionActividad}</p>
          </div>
          <div className="mt-6 text-sm">
            <p className="text-neutral-500">Elaborado por</p>
            <p className="font-medium">{i.elaboradoPor?.name}</p>
          </div>
        </section>

        <AttachmentsPanel
          relatedType="INFORME_VIAJE"
          relatedId={i.id}
          attachments={i.attachments}
          queryKey={['informe-viaje', id]}
        />
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}
