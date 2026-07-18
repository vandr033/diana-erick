"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="not-found"><p className="eyebrow">Diana & Erick · 2027</p><h1>Algo no salió como esperábamos</h1><p>Intenta cargar la página nuevamente.</p><button className="button button--olive" type="button" onClick={() => reset()}>Intentar de nuevo</button></main>;
}
