import { formatFileSize } from '../lib/constants.js'

// Selector de archivos para formularios de creación: el registro todavía no
// tiene id (los adjuntos se guardan por relatedId), así que los archivos se
// quedan en memoria acá y se suben uno por uno justo después de que el
// registro se crea exitosamente (ver onSuccess en el formulario que lo usa).
export function StagedAttachments({ files, onChange }) {
  function handleAdd(e) {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) onChange([...files, ...selected])
    e.target.value = ''
  }

  function handleRemove(index) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <input type="file" multiple onChange={handleAdd} className="text-sm" />
      <p className="mt-1 text-xs text-neutral-500">Puedes adjuntar imágenes, PDF u otros archivos (se suben al guardar).</p>
      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-1.5 text-sm dark:border-neutral-800">
              <span className="truncate">{f.name}</span>
              <span className="flex items-center gap-2 text-xs text-neutral-500">
                {formatFileSize(f.size)}
                <button type="button" onClick={() => handleRemove(i)} className="text-red-600 hover:underline">Quitar</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
