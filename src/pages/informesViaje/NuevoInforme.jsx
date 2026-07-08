import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { informeViajeSchema } from '../../schemas/informeViaje.js'

export function NuevoInforme() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/catalogo/projects') })

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(informeViajeSchema),
    defaultValues: {
      fechaInicioViaje: new Date().toISOString().slice(0, 10), duracionDias: '',
      nombreSolicitante: '', documentoIdentidad: '', direccion: '', telefono: '', ciudad: '',
      ruta: '', projectId: '', tituloReferencia: '', objetoViaje: '', descripcionActividad: '',
    },
  })

  const create = useMutation({
    mutationFn: (data) => api.post('/informes-viaje', data),
    onSuccess: (informe) => {
      queryClient.invalidateQueries({ queryKey: ['informes-viaje'] })
      navigate(`/informes-viaje/${informe.id}`)
    },
  })

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nuevo Informe de Viaje</h1>
        <Link to="/informes-viaje" className="text-sm text-sky-600 hover:underline">Ver listado</Link>
      </div>

      <form onSubmit={handleSubmit((data) => create.mutate(data))} className="flex flex-col gap-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Fecha de inicio de viaje" error={errors.fechaInicioViaje}>
              <input type="date" {...register('fechaInicioViaje')} className="input" />
            </Field>
            <Field label="Duración (días)" error={errors.duracionDias}>
              <input type="number" {...register('duracionDias')} className="input" />
            </Field>
            <Field label="Nombre del solicitante" error={errors.nombreSolicitante}>
              <input {...register('nombreSolicitante')} className="input" />
            </Field>
            <Field label="Documento de identidad" error={errors.documentoIdentidad}>
              <input {...register('documentoIdentidad')} className="input" />
            </Field>
            <Field label="Dirección" error={errors.direccion}>
              <input {...register('direccion')} className="input" />
            </Field>
            <Field label="Teléfono" error={errors.telefono}>
              <input {...register('telefono')} className="input" />
            </Field>
            <Field label="Ciudad" error={errors.ciudad}>
              <input {...register('ciudad')} className="input" />
            </Field>
            <Field label="Proyecto" error={errors.projectId}>
              <select {...register('projectId')} className="input">
                <option value="">Selecciona…</option>
                {projects.data?.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Título/Referencia" error={errors.tituloReferencia}>
              <input {...register('tituloReferencia')} className="input" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Ruta (origen, puntos intermedios, destino)" error={errors.ruta}>
                <input placeholder="Ej.: BOGOTÁ-MEDELLÍN-MONTERÍA-BOGOTÁ" {...register('ruta')} className="input" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Objeto del viaje" error={errors.objetoViaje}>
                <textarea rows={2} {...register('objetoViaje')} className="input" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Descripción de la actividad realizada" error={errors.descripcionActividad}>
                <textarea rows={6} {...register('descripcionActividad')} className="input" />
              </Field>
            </div>
          </div>
        </section>

        {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}

        <button type="submit" disabled={create.isPending} className="self-start rounded-md bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50">
          {create.isPending ? 'Guardando…' : 'Guardar informe'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error.message}</span>}
    </label>
  )
}
