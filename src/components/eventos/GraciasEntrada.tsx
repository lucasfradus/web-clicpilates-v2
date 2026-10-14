'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { getEntrada, type Entrada } from '@/lib/eventos/api';
import { pesos } from '@/lib/formato';
import { formatDayLong, formatTime } from '@/lib/reservas/format';

/**
 * La vuelta de Mercado Pago después de comprar una entrada.
 *
 * A diferencia de `Gracias.tsx`, no confía en lo que viene en la URL: consulta la
 * entrada en el backend (que, si sigue pendiente, le pregunta a MP). Mientras siga
 * pendiente reintenta unos segundos, porque el webhook suele tardar un poco.
 */

const REINTENTOS = 8;
const ESPERA_MS = 2500;

type Vista =
  | { tipo: 'cargando' }
  | { tipo: 'entrada'; entrada: Entrada }
  | { tipo: 'sin-dato' };

export default function GraciasEntrada({ slug }: { slug: string }) {
  const params = useSearchParams();
  const token = params.get('entrada');
  const rechazado = params.get('collection_status') === 'rejected';
  const [vista, setVista] = useState<Vista>({ tipo: 'cargando' });

  useEffect(() => {
    if (!token || rechazado) return;
    let vivo = true;
    let intento = 0;
    const consultar = async () => {
      try {
        const entrada = await getEntrada(token);
        if (!vivo) return;
        if (entrada.estado === 'PENDIENTE' && ++intento < REINTENTOS) {
          setVista({ tipo: 'entrada', entrada });
          setTimeout(consultar, ESPERA_MS);
          return;
        }
        setVista({ tipo: 'entrada', entrada });
      } catch {
        if (vivo) setVista({ tipo: 'sin-dato' });
      }
    };
    consultar();
    return () => {
      vivo = false;
    };
  }, [token, rechazado]);

  const volver = (
    <Link href={`/eventos/${slug}`} className="gracias__btn">
      Volver al evento
    </Link>
  );

  if (rechazado || !token) {
    return (
      <Tarjeta icono="error" titulo="El pago no fue procesado">
        <p className="gracias__sub">Hubo un problema con el pago. Podés intentarlo de nuevo.</p>
        {volver}
      </Tarjeta>
    );
  }

  if (vista.tipo === 'cargando') {
    return (
      <Tarjeta icono="pendiente" titulo="Confirmando tu entrada…">
        <p className="gracias__sub">Estamos verificando el pago con Mercado Pago.</p>
      </Tarjeta>
    );
  }

  if (vista.tipo === 'sin-dato') {
    return (
      <Tarjeta icono="pendiente" titulo="Pago en proceso">
        <p className="gracias__sub">
          No pudimos confirmar el estado ahora. Cuando se acredite el pago te llega un email con tu
          entrada.
        </p>
      </Tarjeta>
    );
  }

  const { entrada } = vista;
  const detalle = (
    <div className="gracias__detail">
      <p className="gracias__actividad t-display">{entrada.evento.nombre}</p>
      <p className="gracias__fecha">
        {formatDayLong(entrada.evento.inicio)} · {formatTime(entrada.evento.inicio)}
      </p>
      <p className="gracias__fecha">{entrada.evento.ubicacion}</p>
      <p className="gracias__fecha">
        A nombre de {entrada.nombre} {entrada.apellido}
      </p>
      <p className="gracias__total">{pesos(entrada.monto)}</p>
    </div>
  );

  switch (entrada.estado) {
    case 'PAGADA':
      return (
        <Tarjeta icono="ok" titulo="¡Entrada confirmada!">
          <p className="gracias__sub">Te enviamos un email con los detalles. ¡Te esperamos!</p>
          {detalle}
        </Tarjeta>
      );
    case 'PENDIENTE':
      return (
        <Tarjeta icono="pendiente" titulo="Pago pendiente">
          <p className="gracias__sub">
            Tu pago está siendo procesado. Cuando se confirme, te llega un email con tu entrada.
          </p>
          {detalle}
        </Tarjeta>
      );
    case 'SIN_LUGAR':
      return (
        <Tarjeta icono="error" titulo="No quedaban lugares">
          <p className="gracias__sub">
            Tu pago se acreditó, pero cuando entró ya no quedaban lugares. Te vamos a contactar
            para devolverte el dinero.
          </p>
        </Tarjeta>
      );
    default:
      return (
        <Tarjeta icono="error" titulo="No registramos el pago">
          <p className="gracias__sub">
            La reserva de tu lugar venció sin que se acredite el pago. Podés intentarlo de nuevo.
          </p>
          {volver}
        </Tarjeta>
      );
  }
}

function Tarjeta({
  icono,
  titulo,
  children,
}: {
  icono: 'ok' | 'pendiente' | 'error';
  titulo: string;
  children: React.ReactNode;
}) {
  const clase = icono === 'ok' ? 'ok' : icono === 'error' ? 'error' : 'pending';
  return (
    <div className="container gracias">
      <div className="gracias__card">
        <div className={`gracias__icon gracias__icon--${clase}`} aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {icono === 'ok' && <path d="M5 12.5l4.5 4.5L19 7.5" />}
            {icono === 'error' && <path d="M6 6l12 12M18 6L6 18" />}
            {icono === 'pendiente' && (
              <>
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7.5V12l3 2" />
              </>
            )}
          </svg>
        </div>
        <h1 className="gracias__title t-display">{titulo}</h1>
        {children}
      </div>
    </div>
  );
}
