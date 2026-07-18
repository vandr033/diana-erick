import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><p className="eyebrow">Diana & Erick · 2027</p><h1>No encontramos esa página</h1><p>Puede que el enlace haya cambiado o ya no esté disponible.</p><Link className="button button--olive" href={"/" as never}>Volver a la invitación</Link></main>;
}
