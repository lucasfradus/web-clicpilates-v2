'use client';

import { useState } from 'react';

import { ErrorBanner } from '@/components/reservas/ErrorBanner';
import { checkoutEvento, type DatosAsistente } from '@/lib/eventos/api';
import { ApiError } from '@/lib/reservas/api';

/**
 * Formulario de compra de una entrada. Una entrada por compra: los datos son los
 * de quien va a ir, aunque pague otra persona. El precio (socio o no) lo decide el
 * backend por el DNI; acá solo se muestran los dos.
 *
 * Mismos campos, clases y validación que el checkout de planes (`Planes.tsx`).
 */

type Errores = Partial<Record<keyof DatosAsistente, string>>;

const VACIO: DatosAsistente = { nombre: '', apellido: '', email: '', telefono: '', dni: '' };

/** Mismo criterio que `normalizarDni` del backend: 7 u 8 dígitos. */
function validar(d: DatosAsistente): Errores {
  const e: Errores = {};
  if (!d.nombre.trim()) e.nombre = 'Ingresá el nombre';
  if (!d.apellido.trim()) e.apellido = 'Ingresá el apellido';
  if (!d.email.trim()) e.email = 'Ingresá el email';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = 'Email inválido';
  if (!d.telefono.trim()) e.telefono = 'Ingresá el teléfono';
  else if (d.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Teléfono demasiado corto';
  const dni = d.dni.replace(/\D/g, '');
  if (dni.length === 0) e.dni = 'Ingresá el DNI';
  else if (dni.length < 7 || dni.length > 8) e.dni = 'DNI inválido';
  return e;
}

export default function CompraEntrada({ slug, soloSocios }: { slug: string; soloSocios: boolean }) {
  const [datos, setDatos] = useState<DatosAsistente>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (campo: keyof DatosAsistente) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    setDatos((d) => ({ ...d, [campo]: ev.target.value }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const pagar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (enviando) return;
    const e = validar(datos);
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await checkoutEvento(slug, {
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        email: datos.email.trim(),
        telefono: datos.telefono.trim(),
        dni: datos.dni.trim(),
      });
      window.location.href = res.initPoint;
    } catch (err) {
      setEnviando(false);
      setError(
        err instanceof ApiError
          ? err.message
          : 'No pudimos iniciar el pago. Probá de nuevo en un momento.',
      );
    }
  };

  const campo = (
    nombre: keyof DatosAsistente,
    etiqueta: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="planes__field">
      <span className="planes__field-lbl">{etiqueta}</span>
      <input className="planes__input" value={datos[nombre]} onChange={cambiar(nombre)} {...props} />
      {errores[nombre] && <span className="planes__field-err">{errores[nombre]}</span>}
    </label>
  );

  return (
    <form className="planes__form" onSubmit={pagar} noValidate>
      <h2 className="planes__form-title">Tu entrada</h2>
      <p className="planes__form-sub">
        Cargá los datos de quien va a ir. Si comprás para otra persona, poné los suyos.
        {soloSocios
          ? ' Este evento es exclusivo para socios de CLIC: lo validamos con el DNI.'
          : ' Si es socia o socio de CLIC, con el DNI le aplicamos el precio de socio.'}
      </p>

      <div className="planes__fields">
        <div className="planes__field-row">
          {campo('nombre', 'Nombre', { autoComplete: 'given-name' })}
          {campo('apellido', 'Apellido', { autoComplete: 'family-name' })}
        </div>
        {campo('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'tu@email.com' })}
        {campo('telefono', 'Teléfono', { type: 'tel', autoComplete: 'tel', placeholder: '+54 9 11 …' })}
        {campo('dni', 'DNI', { inputMode: 'numeric', autoComplete: 'off', placeholder: '12345678' })}
      </div>

      {error && (
        <div className="planes__co-error">
          <ErrorBanner message={error} />
        </div>
      )}

      <button type="submit" className="planes__co-cta" disabled={enviando}>
        {enviando ? 'Redirigiendo a Mercado Pago…' : 'Pagar entrada'}
      </button>
      <p className="planes__co-secure">
        Te guardamos el lugar 15 minutos mientras pagás. El pago se procesa de forma segura a
        través de Mercado Pago.
      </p>
    </form>
  );
}
