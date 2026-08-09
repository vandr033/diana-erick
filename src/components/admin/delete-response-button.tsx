"use client";

export function DeleteResponseButton({ id, reloadAfterDelete = false }: { id: string; reloadAfterDelete?: boolean }) {
  const remove = async () => {
    if (!window.confirm("¿Eliminar esta respuesta? Esta acción no se puede deshacer.")) return;
    const result = await fetch(`/api/admin/responses/${id}`, { method: "DELETE" });
    if (result.ok) {
      if (reloadAfterDelete) window.location.reload();
      else window.location.href = "/admin/responses?deleted=1";
    }
  };
  return <button className="admin-button admin-button--danger" type="button" onClick={remove}>{reloadAfterDelete ? "Eliminar" : "Eliminar respuesta"}</button>;
}
