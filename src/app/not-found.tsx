import Link from 'next/link'

export default function NotFound () {
  return (
    <section className="section" style={{ paddingTop: 180, textAlign: 'center' }}>
      <div className="container">
        <p className="eyebrow">Error 404</p>
        <h1 className="t-serif" style={{ fontSize: 44, marginTop: 12 }}>Esta página no existe.</h1>
        <p className="muted" style={{ marginTop: 14 }}>
          Puede que la hayamos movido de lugar. Desde el inicio llegás a todo.
        </p>
        <div style={{ marginTop: 30 }}>
          <Link className="btn btn--primary" href="/">Volver al inicio</Link>
        </div>
      </div>
    </section>
  )
}
