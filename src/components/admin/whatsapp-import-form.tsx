"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { guestImportColumns, missingGuestImportColumns, validateGuestImportRows, type GuestImportError } from "@/src/lib/guest-import";

type ImportState = { rows: Record<string, unknown>[]; errors: GuestImportError[]; missing: readonly string[] } | null;

export function WhatsappImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, setState] = useState<ImportState>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const readFile = async (file: File) => {
    setFileName(file.name);
    setMessage(null);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
      const rows = sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }) : [];
      const headers = sheet ? (XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })[0] ?? []) : [];
      const validation = validateGuestImportRows(rows);
      setState({ rows, errors: validation.errors, missing: missingGuestImportColumns(headers) });
    } catch {
      setState(null);
      setMessage("No pudimos leer ese archivo. Sube un .xlsx o .csv válido.");
    }
  };

  const importRows = async () => {
    if (!state || state.errors.length || state.missing.length || !state.rows.length) return;
    setIsImporting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/whatsapp/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: state.rows }) });
      const result = await response.json() as { imported?: number; skipped?: number; message?: string };
      if (!response.ok) throw new Error(result.message || "No fue posible importar el archivo.");
      setMessage(`Se agregaron ${result.imported ?? 0} invitados${result.skipped ? `; ${result.skipped} ya existían y no se duplicaron` : ""}.`);
      setState(null);
      if (inputRef.current) inputRef.current.value = "";
      setFileName(null);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible importar el archivo.");
    } finally {
      setIsImporting(false);
    }
  };

  const valid = state ? state.rows.length - state.errors.length : 0;
  return <section className="admin-section whatsapp-import">
    <div className="admin-section-heading"><div><p className="admin-eyebrow">Lista de invitados</p><h2>Importar y validar</h2></div><a className="admin-button admin-button--secondary" href="/plantilla-invitados.xlsx" download>DESCARGAR PLANTILLA</a></div>
    <p className="admin-note">Primera hoja del archivo. Columnas requeridas: <code>{guestImportColumns.join(", ")}</code>. <code>custom_message</code> es opcional y admite <code>{"{name}"}</code> y <code>{"{link}"}</code>.</p>
    <label className="whatsapp-upload"><input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file); }} /><span>{fileName || "Seleccionar archivo Excel"}</span></label>
    {state && <div className="whatsapp-validation" aria-live="polite">
      {state.missing.length ? <p className="admin-error">Faltan columnas: {state.missing.join(", ")}.</p> : <p className={state.errors.length ? "admin-error" : "admin-success"}>{state.errors.length ? `${state.errors.length} fila(s) necesitan corrección.` : `${valid} invitados listos para importar.`}</p>}
      {state.errors.slice(0, 8).map((error) => <p className="whatsapp-validation__error" key={`${error.row}-${error.message}`}>Fila {error.row}: {error.message}</p>)}
      {state.errors.length > 8 && <p className="admin-note">Y {state.errors.length - 8} error(es) más.</p>}
      {!state.errors.length && !state.missing.length && <button className="admin-button admin-button--primary" type="button" disabled={isImporting || !valid} onClick={() => void importRows()}>{isImporting ? "IMPORTANDO…" : `IMPORTAR ${valid} INVITADOS`}</button>}
    </div>}
    {message && <p className="admin-note whatsapp-import__message" role="status">{message}</p>}
  </section>;
}
