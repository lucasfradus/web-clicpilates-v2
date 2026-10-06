import type { Sede } from '@/lib/reservas/types';
import { SedeCard } from '@/components/reservas/SedeCard';
import { ErrorBanner } from '@/components/reservas/ErrorBanner';

/**
 * Elegir la sede para reservar. Portado del `Landing.tsx` del portal, con el
 * mismo markup y los mismos textos.
 *
 * La única diferencia: las sedes llegan resueltas desde el servidor (con
 * caché) en vez de pedirse desde el navegador, así que no hay spinner. `null`
 * quiere decir que el backend no contestó.
 */
export default function Landing({ sedes }: { sedes: Sede[] | null }) {
  return (
    <div className="container landing">
      <section className="landing__hero">
        <p className="t-tag">Welcome to your pilates era</p>
        <h1 className="landing__title t-display">
          Reservá tu primera clase
        </h1>
        <p className="landing__subtitle">
          Elegí la sede más cercana y empezá a sentir el cambio desde la primera clase.
        </p>
      </section>

      <section className="landing__studios">
        {sedes === null && (
          <ErrorBanner message="No pudimos cargar las sedes. Probá recargar la página en un minuto." />
        )}

        {sedes !== null && sedes.length === 0 && (
          <div className="landing__empty">
            <p className="t-display" style={{ fontSize: 28 }}>
              Por ahora no hay sedes disponibles
            </p>
            <p className="t-muted" style={{ marginTop: 10 }}>
              Estamos trabajando para habilitar la reserva online en breve.
            </p>
          </div>
        )}

        {sedes !== null && sedes.length > 0 && (
          <div className="landing__grid">
            {sedes.map((sede) => (
              <SedeCard key={sede.id} sede={sede} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
