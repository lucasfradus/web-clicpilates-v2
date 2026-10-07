'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Sede } from '@/lib/reservas/types';
import { formatPrice } from '@/lib/reservas/format';
import { trackEvent } from '@/lib/reservas/analytics';
import { Iso } from '@/components/reservas/Iso';

export function SedeCard({ sede }: { sede: Sede }) {
  const [imgBroken, setImgBroken] = useState(false);
  const showImg = sede.imagenUrl && !imgBroken;

  return (
    <Link
      href={`/estudios/${sede.slug}`}
      className="sede-card"
      onClick={() =>
        trackEvent('select_sede', {
          sede: sede.nombre,
          sede_slug: sede.slug,
        })
      }
    >
      <div className="sede-card__media">
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element -- igual que en el portal: cae al isotipo si la foto falla
          <img
            src={sede.imagenUrl!}
            alt={sede.nombre}
            onError={() => setImgBroken(true)}
          />
        ) : (
          <div className="sede-card__fallback">
            <Iso variant="taupe" size={56} />
          </div>
        )}
      </div>
      <div className="sede-card__body">
        <p className="t-tag">{sede.ciudad}</p>
        <h2 className="sede-card__name t-display">{sede.nombre}</h2>
        <p className="sede-card__addr">{sede.direccion}</p>
        {/* Una sede que no cobra online no ofrece la prueba en su página: la
            tarjeta no la puede prometer. */}
        <div className="sede-card__foot">
          {sede.reservaOnline ? (
            <div>
              <p className="sede-card__price-label">Clase de prueba</p>
              <p className="sede-card__price">{formatPrice(sede.precioPrueba)}</p>
            </div>
          ) : (
            <div>
              <p className="sede-card__price-label">Reservas</p>
              <p className="sede-card__addr">Consultá por WhatsApp</p>
            </div>
          )}
          <span className="sede-card__cta">
            {sede.reservaOnline ? 'Ver clases' : 'Ver estudio'} <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
