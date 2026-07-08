import { useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { legalizacionSchema } from '../../schemas/legalizacion.js'
import { formatCOP } from '../../lib/constants.js'

const emptyRubro = { seccion: 'A_SOPORTE', fecha: '', nit: '', beneficiario: '', noFactura: '', concepto: '', valorFactura: '' }

export function NuevaLegalizacion() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const solicitudes = useQuery({ queryKey: ['solicitudes'], queryFn: () => api.get('/solicitudes') })
  const rates = useQuery({ queryKey: ['retention-rates'], queryFn: () => api.get('/catalogo/retention-rates') })

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(legalizacionSchema),
    defaultValues: {
      solicitudId: '', projectId: '', fechaSolicitudAnticipo: '', valorAnticipo: '',
      nitCc: '', nombreActividad: '', rubros: [emptyRubro],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'rubros' })
  const solicitudId = watch('solicitudId')
  const rubros = watch('rubros')

  useEffect(() => {
    const s = solicitudes.data?.find((x) => String(x.id) === solicitudId)
    if (!s) return
    setValue('projectId', String(s.projectId))
    setValue('fechaSolicitudAnticipo', new Date(s.fecha).toISOString().slice(0, 10))
    setValue('valorAnticipo', s.items.reduce((sum, i) => sum + i.valor, 0))
    setValue('nitCc', s.nitCc)
  }, [solicitudId, solicitudes.data, setValue])

  function retefuentePreview(concepto, valorFactura) {
    const rate = rates.data?.find((r) => r.concepto === concepto)
    if (!rate || !valorFactura) return 0
    if (Number(valorFactura) <= rate.baseGravable) return 0
    return Math.round(Number(valorFactura) * rate.porcentaje)
  }

  const totalFactura = useMemo(() => rubros?.reduce((sum, r) => sum + (Number(r.valorFactura) || 0), 0) ?? 0, [rubros])
  const totalRetefuente = useMemo(
    () => rubros?.reduce((sum, r) => sum + retefuentePreview(r.concepto, r.valorFactura), 0) ?? 0,
    [rubros, rates.data], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const create = useMutation({
    mutationFn: (data) => api.post('/legalizaciones', data),
    onSuccess: (legalizacion) => {
      queryClient.invalidateQueries({ queryKey: ['legalizaciones'] })
      navigate(`/legalizaciones/${legalizacion.id}`)
    },
  })

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nueva Legalización</h1>
        <Link to="/legalizaciones" className="text-sm text-sky-600 hover:underline">Ver listado</Link>
      </div>

      <form onSubmit={handleSubmit((data) => create.mutate(data))} className="flex flex-col gap-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 text-lg font-semibold">Cabecera</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Solicitud / anticipo original" error={errors.solicitudId}>
              <select {...register('solicitudId')} className="input">
                <option value="">Selecciona…</option>
                {solicitudes.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    No. {s.id} — {s.aFavorDe} — {formatCOP(s.items.reduce((sum, i) => sum + i.valor, 0))}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nombre de la actividad" error={errors.nombreActividad}>
              <input {...register('nombreActividad')} className="input" />
            </Field>
            <Field label="Fecha solicitud anticipo" error={errors.fechaSolicitudAnticipo}>
              <input type="date" {...register('fechaSolicitudAnticipo')} className="input" />
            </Field>
            <Field label="Valor anticipo" error={errors.valorAnticipo}>
              <input type="number" {...register('valorAnticipo')} className="input" />
            </Field>
            <Field label="NIT/CC" error={errors.nitCc}>
              <input {...register('nitCc')} className="input" />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Detalle de rubros</h2>
            <button type="button" onClick={() => append(emptyRubro)} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900">
              + Agregar rubro
            </button>
          </div>
          {errors.rubros?.message && <p className="mb-2 text-sm text-red-600">{errors.rubros.message}</p>}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-12 dark:border-neutral-800">
                <select {...register(`rubros.${index}.seccion`)} className="input sm:col-span-2">
                  <option value="A_SOPORTE">A — Soporte (FCT)</option>
                  <option value="B_FACTURA_RETENCION">B — Factura con retención</option>
                </select>
                <input type="date" {...register(`rubros.${index}.fecha`)} className="input sm:col-span-2" />
                <input placeholder="NIT" {...register(`rubros.${index}.nit`)} className="input sm:col-span-1" />
                <input placeholder="Beneficiario" {...register(`rubros.${index}.beneficiario`)} className="input sm:col-span-2" />
                <input placeholder="No. Factura" {...register(`rubros.${index}.noFactura`)} className="input sm:col-span-1" />
                <select {...register(`rubros.${index}.concepto`)} className="input sm:col-span-2">
                  <option value="">Concepto…</option>
                  {rates.data?.map((r) => <option key={r.concepto} value={r.concepto}>{r.concepto}</option>)}
                </select>
                <input type="number" placeholder="Vr. Factura" {...register(`rubros.${index}.valorFactura`)} className="input sm:col-span-1" />
                <div className="flex items-center justify-between text-xs text-neutral-500 sm:col-span-1">
                  <span>Retef.: {formatCOP(retefuentePreview(rubros?.[index]?.concepto, rubros?.[index]?.valorFactura))}</span>
                </div>
                <button type="button" onClick={() => remove(index)} className="text-sm text-red-600 hover:underline">Quitar</button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-8 text-sm">
            <p>Total facturas: <span className="font-semibold">{formatCOP(totalFactura)}</span></p>
            <p>Total retefuente: <span className="font-semibold">{formatCOP(totalRetefuente)}</span></p>
            <p>Legalización actual: <span className="font-semibold">{formatCOP(totalFactura - totalRetefuente)}</span></p>
          </div>
        </section>

        {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}

        <button type="submit" disabled={create.isPending} className="self-start rounded-md bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50">
          {create.isPending ? 'Guardando…' : 'Registrar legalización'}
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
