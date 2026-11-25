"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WeddingImportPreview } from "@/src/lib/wedding-import";

type PreviewRow = WeddingImportPreview["rows"][number];
type DraftRow = Omit<PreviewRow, "phoneNumber" | "saturdayOnly" | "companions"> & {
  phoneNumber: string;
  scope: "" | "saturday" | "weekend-no-bus" | "weekend-bus";
  companionsText: string;
  selected: boolean;
};

const endpoint = "/api/admin/invitaciones/import";

export function WeddingImport() {
  const router = useRouter();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [revision, setRevision] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selected = rows.filter((row) => row.selected);
  const pending = selected.filter((row) => !row.scope).length;
  const update = (key: string, changes: Partial<DraftRow>) =>
    setRows((current) => current.map((row) => row.key === key ? { ...row, ...changes } : row));

  const load = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await fetch(endpoint);
      if (!result.ok) throw new Error("No se pudo cargar la lista del Save the Date.");
      const preview: WeddingImportPreview = await result.json();
      setRows(preview.rows.map((row) => ({
        ...row,
        phoneNumber: row.phoneNumber ?? "",
        scope: row.saturdayOnly === null ? "" : row.saturdayOnly ? "saturday" : "weekend-bus",
        companionsText: row.companions.join("\n"),
        selected: !row.alreadyInvited,
      })));
      setRevision(preview.revision);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo cargar la vista previa.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected.length || pending) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision, rows: selected.map((row) => ({
          key: row.key,
          name: row.name,
          phoneNumber: row.phoneNumber.trim(),
          companions: row.companionsText.split("\n").map((line) => line.trim()).filter(Boolean),
          saturdayOnly: row.scope === "saturday",
          transportIncluded: row.scope === "weekend-bus",
        })) }),
      });
      const result = await response.json() as { count?: number; message?: string };
      if (!response.ok || result.count === undefined) throw new Error(result.message || "No se pudo importar la lista.");
      setMessage(`Se importaron ${result.count} invitaciones.`);
      setRevision("");
      setRows([]);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo importar la lista.");
    } finally {
      setSaving(false);
    }
  };

  const busy = loading || saving;
  return <section className="admin-section wedding-import">
    <div className="admin-section-heading">
      <div>
        <h2>Importar desde el Save the Date</h2>
        <p className="admin-note">Revisa los contactos y las respuestas antes de crear las invitaciones de boda.</p>
      </div>
      <button type="button" className="admin-button admin-button--secondary" disabled={busy} onClick={() => void load()}>
        {loading ? "Cargando…" : revision ? "Recargar vista previa" : "Ver vista previa"}
      </button>
    </div>
    {message && <p className="admin-success" role="status">{message}</p>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    {revision && (rows.length ? <form className="wedding-import__form" onSubmit={submit}>
      <p className="admin-note">{rows.length} registros · {selected.length} para importar · {rows.filter((row) => row.alreadyInvited).length} ya en la lista de boda</p>
      <div className="admin-actions">
        <button type="button" className="admin-button admin-button--secondary" disabled={busy} onClick={() => setRows((current) => current.map((row) => ({ ...row, selected: !row.alreadyInvited })))}>
          Seleccionar todos
        </button>
        <button type="button" className="admin-button admin-button--secondary" disabled={busy} onClick={() => setRows((current) => current.map((row) => ({ ...row, selected: false })))}>
          Quitar selección
        </button>
      </div>
      {pending > 0 && <div className="wedding-import__pending">
        <p className="admin-note">Hay {pending} invitaciones seleccionadas sin tipo asignado. Elige una opción por fila o aplícala a las pendientes.</p>
        <div className="admin-actions">
          {(["saturday", "weekend-no-bus", "weekend-bus"] as const).map((scope) => <button type="button" key={scope} disabled={busy} className="admin-button admin-button--secondary"
            onClick={() => setRows((current) => current.map((row) => row.selected && !row.scope ? { ...row, scope } : row))}>
            {scope === "saturday" ? "Pendientes: sábado sin bus" : scope === "weekend-bus" ? "Pendientes: fin de semana con bus" : "Pendientes: fin de semana sin bus"}
          </button>)}
        </div>
      </div>}
      <div className="responses-table-wrap">
        <table className="responses-table wedding-import__table">
          <thead><tr><th scope="col">Importar</th><th scope="col">Save the Date</th><th scope="col">Invitado principal</th><th scope="col">Acompañantes (uno por línea)</th><th scope="col">Teléfono</th><th scope="col">Tipo de invitación</th></tr></thead>
          <tbody>{rows.map((row) => {
            const disabled = busy || !row.selected;
            return <tr key={row.key}>
              <td data-label="Importar"><input type="checkbox" aria-label={`Importar a ${row.original}`} checked={row.selected} disabled={busy || row.alreadyInvited} onChange={(event) => update(row.key, { selected: event.target.checked })} /></td>
              <td data-label="Save the Date"><div><strong>{row.original}</strong>
                {row.contactName && <small>Contacto: {row.contactName}</small>}
                {row.alreadyInvited && <small>Ya está en la lista de boda</small>}
                {row.ambiguous && <small>Hay contactos con un nombre similar. Revisa esta fila.</small>}
              </div></td>
              <td data-label="Invitado principal"><div className="admin-field"><input aria-label={`Invitado principal de ${row.original}`} value={row.name} required maxLength={150} disabled={disabled} onChange={(event) => update(row.key, { name: event.target.value })} /></div></td>
              <td data-label="Acompañantes"><div className="admin-field"><textarea aria-label={`Acompañantes de ${row.original}, uno por línea`} value={row.companionsText} rows={2} disabled={disabled} onChange={(event) => update(row.key, { companionsText: event.target.value })} /></div></td>
              <td data-label="Teléfono"><div className="admin-field"><input type="tel" aria-label={`Teléfono de ${row.original}`} value={row.phoneNumber} placeholder="Sin teléfono" pattern={"\\+\\d{8,15}"} disabled={disabled} onChange={(event) => update(row.key, { phoneNumber: event.target.value })} /></div></td>
              <td data-label="Tipo de invitación"><div className="admin-field"><select aria-label={`Tipo de invitación para ${row.original}`} value={row.scope} required disabled={disabled} onChange={(event) => update(row.key, { scope: event.target.value as DraftRow["scope"] })}>
                <option value="">Por asignar</option><option value="saturday">Solo sábado · sin bus</option><option value="weekend-no-bus">Fin de semana · sin bus</option><option value="weekend-bus">Fin de semana · con bus</option>
              </select></div></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <button type="submit" className="admin-button admin-button--primary" disabled={busy || !selected.length || pending > 0}>
        {saving ? "Importando…" : `Confirmar e importar (${selected.length})`}
      </button>
    </form> : <p className="admin-note">No hay contactos ni respuestas del Save the Date.</p>)}
  </section>;
}
