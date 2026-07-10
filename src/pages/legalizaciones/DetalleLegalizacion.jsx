import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { AttachmentsPanel } from '../../components/AttachmentsPanel.jsx'
import { Historial } from '../../components/Historial.jsx'
import { formatCOP, formatDate, formatDateTime } from '../../lib/constants.js'

export function DetalleLegalizacion() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: l, isLoading } = useQuery({ queryKey: ['legalizacion', id], queryFn: () => api.get(`/legalizaciones/${id}`) })

  const firmaSolicitante = useMutation({
    mutationFn: () => api.post(`/legalizaciones/${id}/firma-solicitante`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legalizacion', id] }),
  })
  const vistoBuenoAprobador = useMutation({
    mutationFn: () => api.post(`/legalizaciones/${id}/visto-bueno-aprobador`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legalizacion', id] }),
  })
  const firmaContable = useMutation({
    mutationFn: () => api.post(`/legalizaciones/${id}/firma-contable`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legalizacion', id] }),
  })

  if (isLoading || !l) return <p>Cargando…</p>

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Legalización — No. {l.id}</h1>
        <div className="flex gap-2">
          <a href={`/api/legalizaciones/${l.id}/export.pdf`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Exportar PDF</a>
          <a href={`/api/legalizaciones/${l.id}/export.xlsx`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">Exportar Excel</a>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Cabecera</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Detail label="Proyecto" value={l.project?.name} />
            <Detail label="Actividad" value={l.nombreActividad} />
            <Detail label="Fecha solicitud anticipo" value={formatDate(l.fechaSolicitudAnticipo)} />
            <Detail label="Solicitante" value={l.solicitante?.name} />
            <Detail label="NIT/CC" value={l.nitCc} />
            {l.destinatarios && <Detail label="Destinatarios notificados" value={l.destinatarios} />}
          </dl>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Detalle de rubros</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
                <th className="py-2">Fecha</th>
                <th>NIT</th>
                <th>Beneficiario</th>
                <th>No. Factura</th>
                <th>Concepto</th>
                <th>Vr. Retefuente</th>
                <th>Vr. Factura</th>
              </tr>
            </thead>
            <tbody>
              {l.rubros.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                  <td className="py-2">{formatDate(r.fecha)}</td>
                  <td>{r.nit}</td>
                  <td>{r.beneficiario}</td>
                  <td>{r.noFactura}</td>
                  <td>{r.concepto}</td>
                  <td>{formatCOP(r.valorRetefuente)}</td>
                  <td>{formatCOP(r.valorFactura)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Liquidación</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Detail label="Valor anticipo" value={formatCOP(l.resumen.valorAnticipo)} />
            <Detail label="(-) Legalizaciones anteriores" value={formatCOP(l.resumen.legalizacionesAnteriores)} />
            <Detail label="(-) Legalización actual" value={formatCOP(l.resumen.legalizacionActual)} />
            <Detail
              label={l.resumen.aReembolsar ? 'A reembolsar' : 'Saldo'}
              value={formatCOP(Math.abs(l.resumen.saldo))}
            />
          </dl>
        </section>

        <AttachmentsPanel
          relatedType="LEGALIZACION"
          relatedId={l.id}
          attachments={l.attachments}
          queryKey={['legalizacion', id]}
        />

        <Historial
          eventos={[
            { label: 'Legalización creada', name: l.solicitante?.name, at: l.createdAt },
            { label: 'Firma del solicitante', name: l.solicitante?.name, at: l.firmaSolicitanteAt },
            { label: 'Visto bueno del aprobador', name: l.vistoBuenoAprobador?.name, at: l.vistoBuenoAprobadorAt },
            { label: 'Firma contable', name: l.firmaContablePor?.name, at: l.firmaContableAt },
          ]}
        />

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Firmas y vistos buenos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-neutral-500">Firma solicitante</p>
              <p className="font-medium">{l.firmaSolicitanteAt ? formatDateTime(l.firmaSolicitanteAt) : 'Pendiente'}</p>
              {!l.firmaSolicitanteAt && user?.id === l.solicitanteId && (
                <button onClick={() => firmaSolicitante.mutate()} className="mt-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700">Firmar</button>
              )}
            </div>
            <div>
              <p className="text-sm text-neutral-500">Visto bueno aprobador</p>
              <p className="font-medium">{l.vistoBuenoAprobadorAt ? formatDateTime(l.vistoBuenoAprobadorAt) : 'Pendiente'}</p>
              {!l.vistoBuenoAprobadorAt && user?.roles?.includes('APROBADOR') && (
                <button onClick={() => vistoBuenoAprobador.mutate()} className="mt-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700">Dar visto bueno</button>
              )}
            </div>
            <div>
              <p className="text-sm text-neutral-500">Firma contabilidad</p>
              <p className="font-medium">{l.firmaContableAt ? formatDateTime(l.firmaContableAt) : 'Pendiente'}</p>
              {!l.firmaContableAt && user?.roles?.includes('CONTABLE') && (
                l.vistoBuenoAprobadorAt ? (
                  <button onClick={() => firmaContable.mutate()} className="mt-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700">Firmar</button>
                ) : (
                  <p className="mt-2 text-xs text-neutral-500">Falta el visto bueno del aprobador</p>
                )
              )}
            </div>
          </div>
        </section>
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
