"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "./logout-button";

const links = [
  ["Resumen", "/admin"],
  ["Respuestas", "/admin/responses"],
  ["Contenido", "/admin/content"],
  ["Eventos", "/admin/events"],
  ["Configuración", "/admin/settings"],
] as const;

export function AdminMobileMenu({ email }: { email?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) toggleRef.current?.focus();
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        ref={toggleRef}
        className="admin-menu-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="admin-mobile-navigation"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true" className="admin-menu-toggle__icon">
          <span />
          <span />
          <span />
        </span>
        <span>Menú</span>
      </button>

      <div className={`admin-mobile-menu${isOpen ? " is-open" : ""}`} aria-hidden={!isOpen}>
        <button
          className="admin-mobile-menu__backdrop"
          type="button"
          aria-label="Cerrar menú"
          tabIndex={isOpen ? 0 : -1}
          onClick={closeMenu}
        />
        <aside
          id="admin-mobile-navigation"
          className="admin-mobile-menu__drawer"
          aria-label="Navegación de administración"
          inert={!isOpen}
        >
          <div className="admin-mobile-menu__heading">
            <div>
              <p className="admin-eyebrow">Panel privado</p>
              <h2>Navegación</h2>
            </div>
            <button ref={closeRef} className="admin-mobile-menu__close" type="button" onClick={closeMenu}>
              Cerrar
            </button>
          </div>
          <nav>
            {links.map(([label, href]) => (
              <Link key={href} href={href as never} onClick={closeMenu}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="admin-mobile-menu__footer">
            <span>{email}</span>
            <LogoutButton />
          </div>
        </aside>
      </div>
    </>
  );
}
