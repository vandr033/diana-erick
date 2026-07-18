"use client";

export function LogoutButton() {
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };
  return <button className="admin-logout" type="button" onClick={logout}>Cerrar sesión</button>;
}
