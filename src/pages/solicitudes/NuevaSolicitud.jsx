import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { solicitudSchema, TIPO_PARAM_TO_ENUM } from '../../schemas/solicitud.js'
import { CONCEPTOS_POR_TIPO, TIPO_SOLICITUD_LABELS, formatCOP } from '../../lib/constants.js'

const emptyItem = { concepto: '', fechaInicio: '', fechaFin: '', numeroEquipos: '', valor: '' }

const emptyValues = {
  fecha: new Date().toISOString().slice(0, 10),
  aFavorDe: '', nitCc: '', direccion: '', telefono: '', porConceptoDe: '', projectId: '',
  cuentaBancariaNo: '', entidadBancaria: '', aNombreDe: '', cedulaNitTitular: '', destinatarios: '',
  items: [emptyItem],
}

export function NuevaSolicitud() {
  const { tipo, id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/catalogo/projects') })
  const existing = useQuery({
    queryKey: ['solicitud', id],
    queryFn: () => api.get(`/solicitudes/${id}`),
    enabled: isEditing,
  })

  const tipoEnum = isEditing ? existing.data?.tipo : TIPO_PARAM_TO_ENUM[tipo]

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(solicitudSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => { if (!isEditing) reset(emptyValues) }, [tipo]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!existing.data) return
    reset({
      fecha: existing.data.fecha.slice(0, 10),
      aFavorDe: existing.data.aFavorDe,
      nitCc: existing.data.nitCc,
      direccion: existing.data.direccion,
      telefono: existing.data.telefono,
      porConceptoDe: existing.data.porConceptoDe,
      projectId: String(existing.data.projectId),
      cuentaBancariaNo: existing.data.cuentaBancariaNo,
      entidadBancaria: existing.data.entidadBancaria,
      aNombreDe: existing.data.aNombreDe,
      cedulaNitTitular: existing.data.cedulaNitTitular,
      destinatarios: existing.data.destinatarios || '',
      items: existing.data.items.map((item) => ({
        concepto: item.concepto,
        fechaInicio: item.fechaInicio.slice(0, 10),
        fechaFin: item.fechaFin.slice(0, 10),
        numeroEquipos: item.numeroEquipos ?? '',
        valor: item.valor,
      })),
    })
  }, [existing.data, reset])

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const total = items?.reduce((sum, i) => sum + (Number(i.valor) || 0), 0) ?? 0
  const showEquipos = tipoEnum === 'OPERACIONAL'

  const create = useMutation({
    mutationFn: (data) => api.post('/solicitudes', { ...data, tipo: tipoEnum }),
    onSuccess: (solicitud) => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      navigate(`/solicitudes/detalle/${solicitud.id}`)
    },
  })

  const update = useMutation({
    mutationFn: (data) => api.put(`/solicitudes/${id}`, data),
    onSuccess: (solicitud) => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      queryClient.invalidateQueries({ queryKey: ['solicitud', id] })
      navigate(`/solicitudes/detalle/${solicitud.id}`)
    },
  })

  if (!tipoEnum) return <p>{isEditing ? 'Cargando…' : 'Tipo de solicitud no reconocido.'}</p>

  const mutation = isEditing ? update : create

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isEditing ? 'Editar Solicitud' : 'Nueva Solicitud'} — {TIPO_SOLICITUD_LABELS[tipoEnum]}
        </h1>
        {!isEditing && (
          <Link to={`/solicitudes/${tipo}/listado`} className="text-sm text-sky-600 hover:underline">Ver listado</Link>
        )}
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Datos generales</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Fecha" error={errors.fecha}>
              <input type="date" {...register('fecha')} className="input" />
            </Field>
            <Field label="A favor de" error={errors.aFavorDe}>
              <input {...register('aFavorDe')} className="input" placeholder="Nombre completo del beneficiario" />
            </Field>
            <Field label="NIT o C.C." error={errors.nitCc}>
              <input {...register('nitCc')} className="input" placeholder="Solo dígitos (6-12)" />
            </Field>
            <Field label="Teléfono" error={errors.telefono}>
              <input {...register('telefono')} className="input" />
            </Field>
            <Field label="Dirección" error={errors.direccion}>
              <input {...register('direccion')} className="input" />
            </Field>
            <Field label="Con cargo a (Unidad de Negocio)" error={errors.projectId}>
              <select {...register('projectId')} className="input">
                <option value="">Selecciona…</option>
                {projects.data?.filter((p) => p.active).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.businessUnit?.code} - {p.businessUnit?.name} ({p.name}) — {p.businessUnit?.donor}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Por concepto de" error={errors.porConceptoDe}>
                <textarea {...register('porConceptoDe')} rows={2} className="input" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Destinatarios (correos separados por coma, opcional)" error={errors.destinatarios}>
                <input {...register('destinatarios')} className="input" placeholder="persona1@correo.com, persona2@correo.com" />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tabla de conceptos</h2>
            <button type="button" onClick={() => append(emptyItem)} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900">
              + Agregar concepto
            </button>
          </div>
          {errors.items?.message && <p className="mb-2 text-sm text-red-600">{errors.items.message}</p>}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-12 dark:border-neutral-800">
                <select {...register(`items.${index}.concepto`)} className="input sm:col-span-3">
                  <option value="">Concepto…</option>
                  {CONCEPTOS_POR_TIPO[tipoEnum].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" {...register(`items.${index}.fechaInicio`)} className="input sm:col-span-2" />
                <input type="date" {...register(`items.${index}.fechaFin`)} className="input sm:col-span-2" />
                {showEquipos && (
                  <input type="number" placeholder="No. equipos" {...register(`items.${index}.numeroEquipos`)} className="input sm:col-span-2" />
                )}
                <input type="number" step="1" placeholder="Valor" {...register(`items.${index}.valor`)} className={`input ${showEquipos ? 'sm:col-span-2' : 'sm:col-span-4'}`} />
                <button type="button" onClick={() => remove(index)} className="text-sm text-red-600 hover:underline sm:col-span-1">
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <p className="mt-4 text-right text-lg font-semibold">Total a girar: {formatCOP(total)}</p>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Información bancaria</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cuenta corriente/ahorro No." error={errors.cuentaBancariaNo}>
              <input {...register('cuentaBancariaNo')} className="input" />
            </Field>
            <Field label="Entidad bancaria" error={errors.entidadBancaria}>
              <input {...register('entidadBancaria')} className="input" />
            </Field>
            <Field label="A nombre de" error={errors.aNombreDe}>
              <input {...register('aNombreDe')} className="input" />
            </Field>
            <Field label="Cédula o NIT titular" error={errors.cedulaNitTitular}>
              <input {...register('cedulaNitTitular')} className="input" />
            </Field>
          </div>
        </section>

        {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}

        <button type="submit" disabled={mutation.isPending} className="self-start rounded-md bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50">
          {mutation.isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Enviar solicitud'}
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
