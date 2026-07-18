"use client";

export function DeleteResponseButton({ id }: { id: string }) {
  const remove = async () => {
    if (!window.confirm("¿Eliminar esta respuesta? Esta acción no se puede deshacer.")) return;
    const result = await fetch(`/api/admin/responses/${id}`, { method: "DELETE" });
    if (result.ok) window.location.href = "/admin/responses?deleted=1";
  };
  return <button className="admin-button admin-button--danger" type="button" onClick={remove}>Eliminar respuesta</button>;
}
