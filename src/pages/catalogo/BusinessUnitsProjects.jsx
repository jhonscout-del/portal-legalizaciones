import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api.js'

const emptyUnit = { code: '', name: '', donor: '', active: true }
const emptyProject = { name: '', businessUnitId: '', encargado: '', active: true, responsableEmail: '' }

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
    />
  )
}

export function BusinessUnitsProjects() {
  const queryClient = useQueryClient()
  const units = useQuery({ queryKey: ['business-units'], queryFn: () => api.get('/catalogo/business-units') })
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/catalogo/projects') })

  const [unitForm, setUnitForm] = useState(emptyUnit)
  const [projectForm, setProjectForm] = useState(emptyProject)

  const createUnit = useMutation({
    mutationFn: (data) => api.post('/catalogo/business-units', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-units'] })
      setUnitForm(emptyUnit)
    },
  })

  const toggleUnitActive = useMutation({
    mutationFn: (unit) => api.put(`/catalogo/business-units/${unit.id}`, { ...unit, active: !unit.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-units'] }),
  })

  const createProject = useMutation({
    mutationFn: (data) => api.post('/catalogo/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setProjectForm(emptyProject)
    },
  })

  const toggleProjectActive = useMutation({
    mutationFn: (project) =>
      api.put(`/catalogo/projects/${project.id}`, { ...project, businessUnitId: project.businessUnitId, active: !project.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const updateProjectResponsable = useMutation({
    mutationFn: ({ project, responsableEmail }) =>
      api.put(`/catalogo/projects/${project.id}`, { ...project, businessUnitId: project.businessUnitId, responsableEmail }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Proyectos y Unidades de Negocio</h1>

      <Section title="Unidades de negocio">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createUnit.mutate(unitForm)
          }}
          className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4"
        >
          <TextInput placeholder="Código (009)" required value={unitForm.code} onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })} />
          <TextInput placeholder="Nombre" required value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} />
          <TextInput placeholder="Donante" required value={unitForm.donor} onChange={(e) => setUnitForm({ ...unitForm, donor: e.target.value })} />
          <button type="submit" disabled={createUnit.isPending} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900">
            Agregar unidad
          </button>
        </form>
        {createUnit.isError && <p className="mb-2 text-sm text-red-600">{createUnit.error.message}</p>}

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="py-2">Código</th>
              <th>Nombre</th>
              <th>Donante</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {units.data?.map((u) => (
              <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="py-2">{u.code}</td>
                <td>{u.name}</td>
                <td>{u.donor}</td>
                <td>{u.active ? 'Vigente' : 'Histórico'}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => toggleUnitActive.mutate(u)}
                    className="text-xs text-sky-600 hover:underline"
                  >
                    {u.active ? 'Marcar histórico' : 'Marcar vigente'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Proyectos">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createProject.mutate(projectForm)
          }}
          className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4"
        >
          <TextInput placeholder="Nombre del proyecto" required value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
          <select
            required
            value={projectForm.businessUnitId}
            onChange={(e) => setProjectForm({ ...projectForm, businessUnitId: e.target.value })}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="">Unidad de negocio…</option>
            {units.data?.map((u) => (
              <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
            ))}
          </select>
          <TextInput placeholder="Encargado" required value={projectForm.encargado} onChange={(e) => setProjectForm({ ...projectForm, encargado: e.target.value })} />
          <TextInput
            type="email"
            placeholder="Correo del responsable (contable, opcional)"
            value={projectForm.responsableEmail}
            onChange={(e) => setProjectForm({ ...projectForm, responsableEmail: e.target.value })}
          />
          <button type="submit" disabled={createProject.isPending} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 sm:col-span-4">
            Agregar proyecto
          </button>
        </form>
        {createProject.isError && <p className="mb-2 text-sm text-red-600">{createProject.error.message}</p>}
        <p className="mb-3 text-xs text-neutral-500">
          El correo del responsable recibe la notificación de "solicitud lista para revisión contable" cuando se
          elige este proyecto. Si se deja vacío, la notificación se envía a todos los usuarios con rol Contabilidad.
        </p>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="py-2">Proyecto</th>
              <th>Unidad de negocio</th>
              <th>Donante</th>
              <th>Encargado</th>
              <th>Responsable (contable)</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.data?.map((p) => (
              <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="py-2">{p.name}</td>
                <td>{p.businessUnit?.code} - {p.businessUnit?.name}</td>
                <td>{p.businessUnit?.donor}</td>
                <td>{p.encargado}</td>
                <td>
                  <ResponsableEmailCell
                    project={p}
                    onSave={(responsableEmail) => updateProjectResponsable.mutate({ project: p, responsableEmail })}
                  />
                </td>
                <td>{p.active ? 'Vigente' : 'Histórico'}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => toggleProjectActive.mutate(p)}
                    className="text-xs text-sky-600 hover:underline"
                  >
                    {p.active ? 'Marcar histórico' : 'Marcar vigente'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  )
}

function ResponsableEmailCell({ project, onSave }) {
  const [value, setValue] = useState(project.responsableEmail || '')
  const dirty = value !== (project.responsableEmail || '')

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="email"
        placeholder="correo@cccm.org"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-44 rounded border border-neutral-300 px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
      />
      {dirty && (
        <button
          type="button"
          onClick={() => onSave(value.trim() || null)}
          className="text-xs text-sky-600 hover:underline"
        >
          Guardar
        </button>
      )}
    </div>
  )
}
