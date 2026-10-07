'use client';

/* Portado del Planes.tsx del portal de reservas con los mínimos cambios, para
   poder diffearlo contra el original. El ESLint del portal no tiene estas dos
   reglas del compilador de React; adaptar el archivo a ellas sería reescribir la
   máquina de estados que hoy cobra en producción. */
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ApiError,
  checkout,
  checkoutPlan,
  getCatalogo,
  getClases,
  getHorarios,
  getSedes,
} from '@/lib/reservas/api';
import type {
  CatalogoTipoPlan,
  Clase,
  DiaSemana,
  HorarioFijable,
  Sede,
} from '@/lib/reservas/types';
import { Loading } from '@/components/reservas/Loading';
import { ErrorBanner } from '@/components/reservas/ErrorBanner';
import { GrillaClases } from '@/components/reservas/GrillaClases';
import {
  diaSemanaDe,
  formatDayLong,
  formatDayShort,
  formatPrice,
  formatTime,
  nombreConInicial,
} from '@/lib/reservas/format';
import { trackVenta } from '@/lib/reservas/analytics';
import {
  guardarDatosClienteMeta,
  identificadoresMeta,
  recordarSede,
  trackMetaEvent,
} from '@/lib/reservas/meta';

/**
 * El checkout de una sede: clase de prueba o plan, hasta Mercado Pago. Port del
 * portal de reservas, sin su portada (hero, tarjetas de planes, beneficios):
 * desde el 7-oct esa información vive sólo en la landing del estudio
 * (`/estudios/<slug>`), que es de donde salen los botones de compra.
 *
 * Dos caminos comparten la misma UI de checkout (`mode`):
 *  - 'prueba' → elegís UNA clase real y el pago es REAL vía checkout() → MP.
 *  - 'plan'   → elegís modalidad (horarios fijos o pack flexible) y el pago es
 *               REAL vía checkoutPlan() → MP. En "fijo" elegís tus horarios
 *               recurrentes reales (por id); en "flexible" reservás desde la app.
 *
 * Todo sale de datos reales del catálogo:
 *  - `ingresosPorSemana` viene del plan fijo (`tipo.fijo`).
 *  - la variante flexible es `tipo.flexible` (plan PACK), si existe.
 *  - los horarios fijables (con id, día y cupo aprox) vienen del endpoint
 *    `/sedes/:id/horarios?planId=`.
 */

type Mode = 'plan' | 'prueba';
type Modalidad = 'fijo' | 'flex';
type Medio = 'online' | 'debito';

type FormErrors = Partial<
  Record<'nombre' | 'apellido' | 'email' | 'telefono' | 'dni', string>
>;

type LoadState =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error'; message: string }
  | {
      status: 'ok';
      sede: Sede;
      tipos: CatalogoTipoPlan[];
      clases: Clase[];
      caracteristicas: string[];
    };

type HorariosState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; horarios: HorarioFijable[] };

const DIA_INFO: Record<DiaSemana, { corto: string; orden: number }> = {
  LUNES: { corto: 'Lun', orden: 0 },
  MARTES: { corto: 'Mar', orden: 1 },
  MIERCOLES: { corto: 'Mié', orden: 2 },
  JUEVES: { corto: 'Jue', orden: 3 },
  VIERNES: { corto: 'Vie', orden: 4 },
  SABADO: { corto: 'Sáb', orden: 5 },
  DOMINGO: { corto: 'Dom', orden: 6 },
};

/** "HH:MM:SS" → "HH:MM". */
const hhmm = (s: string): string => s.slice(0, 5);

/**
 * Precio de la venta online: el de "Transferencia MP", que es el que se publica
 * y el que cobra Mercado Pago.
 *
 * El fallback a efectivo es transitorio, hasta que el catálogo mande el campo:
 * los dos coinciden en 188 de los 207 planes de producción.
 */
function precioLista(tipo: CatalogoTipoPlan): number | null {
  return (
    tipo.precios.transferencia ??
    tipo.precios.efectivo ??
    tipo.precios.debito ??
    tipo.precios.tarjeta ??
    null
  );
}

/**
 * `true` si la tarjeta no ofrece horarios fijos y solo se puede comprar como
 * pack.
 *
 * El catálogo llama `fijo` al plan vinculado en `TipoPlan.plan` sin mirar su
 * modalidad. En una sede que solo vende packs, ahí hay un PACK y `flexible`
 * queda vacío: `ingresosPorSemana` en null es la señal de que ese plan no es
 * de horario fijo. Sin esto, la única modalidad ofrecida era "Horarios fijos",
 * que es lo contrario de lo que la sede vende, y el checkout moría pidiendo
 * horarios que el backend nunca iba a devolver.
 */
function esSoloPack(tipo: CatalogoTipoPlan | null): boolean {
  return tipo != null && tipo.fijo.ingresosPorSemana == null;
}

/**
 * Plan y precios que corresponden a la modalidad elegida.
 *
 * En las sedes que solo venden packs no hay variante `flexible`: el pack ES el
 * plan vinculado como `fijo`, así que la modalidad flexible sale de ahí.
 */
function variantePlan(
  tipo: CatalogoTipoPlan,
  flex: boolean,
): { planId: number; precios: CatalogoTipoPlan['precios'] } {
  if (flex && tipo.flexible) {
    return { planId: tipo.flexible.planId, precios: tipo.flexible.precios };
  }
  return { planId: tipo.fijo.planId, precios: tipo.precios };
}

interface DatosResumen {
  eyebrow: string;
  titulo: string;
  sedeNombre?: string;
  /** Etiqueta y valor, como "Fecha / Jueves, 13 de agosto · 19:00". */
  filas: { label: string; value: string }[];
  /** Qué decir mientras no hay filas. */
  pendiente: string;
  totalLabel: string;
  total: number | null;
}

/**
 * Lo que se está por comprar. En mobile aparece solo en el paso de datos, y en
 * desktop vive en la columna derecha, así que tiene que verse bien también a
 * medio completar.
 */
function ResumenCompra({ datos }: { datos: DatosResumen }) {
  return (
    <div className="planes__summary">
      <span className="planes__summary-eyebrow">{datos.eyebrow}</span>
      <p className="planes__summary-plan">{datos.titulo}</p>
      <p className="planes__summary-sede">{datos.sedeNombre}</p>

      <div className="planes__summary-line" />
      <div className="planes__summary-rows">
        {datos.filas.length === 0 ? (
          <p className="planes__summary-pend">{datos.pendiente}</p>
        ) : (
          datos.filas.map((f, i) => (
            <div key={i} className="planes__summary-row">
              <span className="planes__summary-row-lbl">{f.label}</span>
              <span className="planes__summary-row-val">{f.value}</span>
            </div>
          ))
        )}
      </div>

      <div className="planes__summary-line" />
      <div className="planes__summary-total">
        <span className="planes__summary-total-lbl">{datos.totalLabel}</span>
        <span className="planes__summary-total-val">
          {formatPrice(datos.total)}
        </span>
      </div>

      <div className="planes__summary-mp">
        <span className="planes__summary-mp-chip">MP</span>
        Pago seguro vía Mercado Pago
      </div>
    </div>
  );
}

/**
 * Mismo criterio que `normalizarDni` del backend: 7 u 8 dígitos, tolerando
 * puntos y espacios. Si acá pasara algo que allá se descarta, se guardaría el
 * alumno sin DNI y nadie se enteraría.
 */
function validarDni(dni: string): string | undefined {
  const digitos = dni.replace(/\D/g, '');
  if (digitos.length === 0) return 'Ingresá tu DNI';
  if (digitos.length < 7 || digitos.length > 8) return 'DNI inválido';
  return undefined;
}

function validate(form: {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!form.nombre.trim()) errors.nombre = 'Ingresá tu nombre';
  if (!form.apellido.trim()) errors.apellido = 'Ingresá tu apellido';
  if (!form.email.trim()) {
    errors.email = 'Ingresá tu email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Email inválido';
  }
  if (!form.telefono.trim()) {
    errors.telefono = 'Ingresá tu teléfono';
  } else if (form.telefono.replace(/\D/g, '').length < 8) {
    errors.telefono = 'Teléfono demasiado corto';
  }
  const dni = validarDni(form.dni);
  if (dni) errors.dni = dni;
  return errors;
}

/**
 * Lo que el servidor ya resolvió: la sede y su catálogo, con caché. Las clases
 * no vienen acá: cambian cada minuto y se piden desde el navegador.
 */
export interface DatosInicialesPlanes {
  sede: Sede;
  tipos: CatalogoTipoPlan[];
  caracteristicas: string[];
}

export default function Planes({
  slug,
  tipoParam,
  inicial,
}: {
  slug: string;
  /** `?tipo=<CatalogoTipoPlan.id>`: quien llega desde la web ya eligió el plan
   *  mirando su precio, así que no tiene que volver a elegirlo acá. */
  tipoParam: string | null;
  inicial: DatosInicialesPlanes | null;
}) {
  const router = useRouter();

  // Con los datos del servidor la pantalla arranca resuelta: el portal mostraba
  // un spinner de página entera mientras los pedía desde el navegador.
  const [load, setLoad] = useState<LoadState>(() =>
    inicial ? { status: 'ok', ...inicial, clases: [] } : { status: 'loading' },
  );
  const [clasesCargadas, setClasesCargadas] = useState(false);

  // ── Navegación interna ────────────────────────────────────────────────
  // Esto es sólo el checkout: la portada del portal (hero, planes, beneficios)
  // se fue el 7-oct, porque repetía la landing del estudio (/estudios/<slug>),
  // que es de donde sale todo botón de compra. Se arranca directo en el plan de
  // `?tipo=` si existe, y si no en la clase de prueba. Se resuelve desde el
  // primer render para no dibujar un paso y saltar a otro.
  const tipoInicial =
    inicial?.tipos.find((t) => t.id === Number(tipoParam)) ?? null;
  const [mode, setMode] = useState<Mode>(tipoInicial ? 'plan' : 'prueba');
  const [step, setStep] = useState<1 | 2>(1);

  // ── Selección de plan / horarios ──────────────────────────────────────
  const [tipoId, setTipoId] = useState<number | null>(tipoInicial?.id ?? null);
  const [modalidad, setModalidad] = useState<Modalidad | null>(
    tipoInicial && esSoloPack(tipoInicial) ? 'flex' : null,
  );
  const [medio, setMedio] = useState<Medio>('online');
  const [dia, setDia] = useState<string>(''); // diaSemana (plan-fijo) o dayKey (prueba)
  const [sel, setSel] = useState<string[]>([]); // plan: horarioId; prueba: claseId
  // Horarios fijables reales del plan fijo elegido (endpoint /horarios).
  const [horarios, setHorarios] = useState<HorariosState>({ status: 'idle' });

  // ── Formulario ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    dni: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const scrollTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  // Pedir todo desde el navegador, como hacía el portal. Sólo hace falta si el
  // servidor no pudo resolver la sede (backend caído) o al tocar "Reintentar".
  const pedirTodo = () => {
    if (!slug) return;
    Promise.all([getSedes(), getCatalogo(slug)])
      .then(async ([sedes, catalogo]) => {
        const sede = sedes.find((s) => s.slug === slug);
        if (!sede) {
          setLoad({ status: 'notfound' });
          return;
        }
        const cat = catalogo.find((c) => c.sedeSlug === slug) ?? catalogo[0];
        const clases = (await getClases(sede.id).catch(() => [])).sort((a, b) =>
          a.inicio.localeCompare(b.inicio),
        );
        setLoad({
          status: 'ok',
          sede,
          tipos: cat?.tipos ?? [],
          clases,
          caracteristicas: cat?.caracteristicas ?? [],
        });
        setClasesCargadas(true);
      })
      .catch((err) =>
        setLoad({
          status: 'error',
          message:
            err instanceof ApiError
              ? err.message
              : 'No pudimos cargar los planes.',
        }),
      );
  };

  const cargar = () => {
    setLoad({ status: 'loading' });
    pedirTodo();
  };

  // Sin datos del servidor, la pantalla arranca en "cargando" y pide todo.
  const sinInicial = inicial == null;
  useEffect(() => {
    if (sinInicial) pedirTodo();
    // `pedirTodo` se redefine en cada render; esto corre una vez al montar.
  }, [sinInicial]);

  // Las clases se piden desde el navegador de quien mira: cambian cada minuto y,
  // pedidas desde nuestro servidor, todas las visitas compartirían la misma IP
  // contra el rate limit de las rutas públicas.
  const sedeIdInicial = inicial?.sede.id ?? null;
  useEffect(() => {
    if (sedeIdInicial == null) return;
    recordarSede(slug);
    let cancelado = false;
    getClases(sedeIdInicial)
      .catch(() => [])
      .then((lista) => {
        if (cancelado) return;
        const clases = [...lista].sort((a, b) => a.inicio.localeCompare(b.inicio));
        setLoad((l) => (l.status === 'ok' ? { ...l, clases } : l));
        setClasesCargadas(true);
      });
    return () => {
      cancelado = true;
    };
  }, [sedeIdInicial, slug]);

  // ── Derivados ─────────────────────────────────────────────────────────
  const tipos = load.status === 'ok' ? load.tipos : [];
  const clases = load.status === 'ok' ? load.clases : [];
  const sede = load.status === 'ok' ? load.sede : undefined;

  const tipoSel = useMemo(
    () => tipos.find((t) => t.id === tipoId) ?? null,
    [tipos, tipoId],
  );

  const flex = modalidad === 'flex';
  // Horarios fijos que pide el plan elegido. En modo prueba no aplica: la
  // clase se elige tocándola en la grilla.
  const necesarios = flex ? 0 : tipoSel?.fijo.ingresosPorSemana ?? 1;

  const horariosData = horarios.status === 'ok' ? horarios.horarios : [];
  const horarioPorId = useMemo(() => {
    const m = new Map<string, HorarioFijable>();
    for (const h of horariosData) m.set(String(h.id), h);
    return m;
  }, [horariosData]);

  // Días de la semana con horarios fijables (solo plan-fijo).
  const diasChips = useMemo(() => {
    const dias = Array.from(new Set(horariosData.map((h) => h.diaSemana)));
    return dias
      .sort((a, b) => DIA_INFO[a].orden - DIA_INFO[b].orden)
      .map((d) => ({ key: d as string, label: DIA_INFO[d].corto }));
  }, [horariosData]);

  // Fijar el día activo cuando aparece la grilla de horarios fijos.
  useEffect(() => {
    if (step !== 1) return;
    if (mode !== 'plan' || modalidad !== 'fijo') return;
    if (dia && diasChips.some((d) => d.key === dia)) return;
    if (diasChips.length > 0) setDia(diasChips[0].key);
  }, [step, mode, modalidad, dia, diasChips]);

  // Grilla semanal de la sede, como referencia en el pack flexible.
  //
  // Sale de los horarios fijables del plan cuando los hay. En las sedes que
  // solo venden packs no hay plan de horario fijo y ese endpoint responde 404,
  // así que se arma con las clases reales de los próximos días, que ya están
  // cargadas y describen la misma grilla.
  const grillaSemanal = useMemo(() => {
    const map = new Map<DiaSemana, string[]>();
    if (horariosData.length > 0) {
      for (const h of horariosData) {
        const arr = map.get(h.diaSemana) ?? [];
        arr.push(hhmm(h.horaInicio));
        map.set(h.diaSemana, arr);
      }
    } else {
      for (const c of clases) {
        const d = diaSemanaDe(c.inicio) as DiaSemana;
        const arr = map.get(d) ?? [];
        arr.push(formatTime(c.inicio));
        map.set(d, arr);
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => DIA_INFO[a].orden - DIA_INFO[b].orden)
      .map(([diaSemana, horas]) => ({
        diaSemana,
        label: DIA_INFO[diaSemana].corto,
        horas: Array.from(new Set(horas)).sort(),
      }));
  }, [horariosData, clases]);

  // Slots del día activo.
  const slots = useMemo(
    () =>
      horariosData
        .filter((h) => (h.diaSemana as string) === dia)
        .map((h) => ({
          key: String(h.id),
          hora: hhmm(h.horaInicio),
          cupos: h.cuposAprox ?? h.cupo,
        })),
    [dia, horariosData],
  );

  const labelDeSel = (key: string): string => {
    if (mode === 'prueba') {
      const c = clases.find((x) => String(x.id) === key);
      return c ? `${formatDayShort(c.inicio)} ${formatTime(c.inicio)}` : key;
    }
    const h = horarioPorId.get(key);
    return h ? `${DIA_INFO[h.diaSemana].corto} ${hhmm(h.horaInicio)}` : key;
  };

  const toggleSlot = (key: string) => {
    setSel((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key);
      if (cur.length < necesarios) return [...cur, key];
      return [...cur.slice(0, -1), key]; // reemplaza el último
    });
  };

  const completo =
    mode === 'prueba'
      ? sel.length === 1
      : flex
        ? true
        : necesarios > 0 && sel.length === necesarios;

  // ── Acciones ──────────────────────────────────────────────────────────
  const abrirPrueba = () => {
    setMode('prueba');
    setModalidad(null);
    setSel([]);
    setDia('');
    setStep(1);
    trackVenta('begin_checkout', {
      nombre: 'Clase de prueba',
      categoria: 'Trial',
      sede: sede?.nombre,
      sedeSlug: sede?.slug ?? slug,
      precio: sede?.precioPrueba,
    });
    scrollTop();
  };

  // Tocar una clase en la grilla del paso 1 la elige y pasa a los datos. No
  // mide nada: el begin_checkout ya salió al abrir el checkout (`abrirPrueba`),
  // que es el único camino para llegar hasta acá.
  const elegirClasePrueba = (clase: Clase) => {
    setSel([String(clase.id)]);
    setStep(2);
    scrollTop();
  };

  const empezarPlan = (t: CatalogoTipoPlan) => {
    setMode('plan');
    setTipoId(t.id);
    // Si la sede no vende horarios fijos no hay nada que preguntar: la única
    // modalidad posible es el pack.
    setModalidad(esSoloPack(t) ? 'flex' : null);
    setMedio('online');
    setSel([]);
    setDia('');
    setHorarios({ status: 'idle' });
    setStep(1);
    // Misma venta que la prueba a ojos de GA4, pero con `categoria` distinta:
    // es lo único que después separa "cuántas pruebas vendí" de "cuántas
    // suscripciones vendí", tanto en los informes como en las campañas.
    trackVenta('begin_checkout', {
      nombre: t.nombre,
      categoria: 'Subscription',
      sede: sede?.nombre,
      sedeSlug: sede?.slug ?? slug,
      precio: precioLista(t),
    });
    scrollTop();
  };

  // La entrada: abre el plan de `?tipo=` o, sin él (o con un id que ya no
  // existe: plan dado de baja, o de otra sede), la clase de prueba. Es lo que
  // dispara el begin_checkout, una sola vez.
  //
  // Corre una sola vez: si no, cada cambio de `tipos` volvería a arrastrar a la
  // persona al principio mientras completa el checkout.
  const entradaAplicada = useRef(false);
  useEffect(() => {
    if (entradaAplicada.current) return;
    if (load.status !== 'ok') return;
    entradaAplicada.current = true;

    const t = tipos.find((x) => x.id === Number(tipoParam));
    if (t) empezarPlan(t);
    else abrirPrueba();
    // `empezarPlan` y `abrirPrueba` quedan fuera de las dependencias a
    // propósito: se redefinen en cada render. Lo que garantiza que esto pase una
    // sola vez es el guard de arriba, no la lista.
  }, [load.status, tipoParam, tipos]);

  // Cargar los horarios reales de la sede al elegir modalidad. En "fijo" son
  // los que se eligen; en "flexible" se muestran nada más como referencia de
  // la grilla, para saber si los horarios de la sede te sirven.
  useEffect(() => {
    if (mode !== 'plan' || modalidad == null || !tipoSel || !sede) return;
    let cancelado = false;
    setHorarios({ status: 'loading' });
    getHorarios(sede.id, tipoSel.fijo.planId)
      .then((r) => {
        if (!cancelado) setHorarios({ status: 'ok', horarios: r.horarios });
      })
      .catch(() => {
        if (!cancelado) setHorarios({ status: 'error' });
      });
    return () => {
      cancelado = true;
    };
  }, [mode, modalidad, tipoSel, sede]);

  // Precio a cobrar según modalidad + medio. El pago único usa el mismo precio
  // que se publica en la tarjeta (Transferencia MP): antes usaba el de tarjeta
  // de crédito y el checkout terminaba mostrando ~10% más que la landing.
  const preciosPlanSel = tipoSel
    ? variantePlan(tipoSel, flex).precios
    : undefined;
  const precioCheckout = preciosPlanSel
    ? medio === 'online'
      ? preciosPlanSel.transferencia ?? preciosPlanSel.efectivo
      : preciosPlanSel.debito
    : null;

  // Desde el primer paso se vuelve a la página del estudio, que es la que
  // tiene la información y los planes.
  const volver = () => {
    if (step === 1) {
      router.push(`/estudios/${slug}`);
      return;
    } else {
      setStep(1);
    }
    scrollTop();
  };

  const handleChange =
    (field: keyof typeof form) => (e: FormEvent<HTMLInputElement>) => {
      const value = (e.target as HTMLInputElement).value;
      setForm((f) => ({ ...f, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  // Datos y pago viven en la misma pantalla: el submit del formulario es el
  // que dispara el pago, sin un paso intermedio de confirmación.
  const pagar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = validate(form);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    if (mode === 'prueba') pagarPrueba();
    else pagarPlan();
  };

  // Pago del PLAN: real, vía checkoutPlan() → Mercado Pago.
  const pagarPlan = async () => {
    if (!sede || !tipoSel || submitting) return;
    const { planId } = variantePlan(tipoSel, flex);
    if (planId == null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await checkoutPlan({
        sedeId: sede.id,
        planId,
        medio,
        horarioIds: flex ? undefined : sel.map(Number),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        dni: form.dni.trim(),
        ...identificadoresMeta(),
      });
      // `content_category` lleva el TIPO de venta, no la sede: es el campo por
      // el que Meta permite armar conversiones personalizadas, y lo que hay que
      // poder separar es la suscripción de la clase de prueba. La sede va como
      // propiedad propia, que también sirve para filtrar.
      const params: Record<string, unknown> = {
        content_name: tipoSel.nombre,
        content_category: 'Subscription',
        sede: sede.nombre,
        currency: 'ARS',
      };
      if (precioCheckout != null) params.value = precioCheckout;
      trackMetaEvent('InitiateCheckout', params, undefined, sede.slug);
      trackVenta('add_payment_info', {
        nombre: tipoSel.nombre,
        categoria: 'Subscription',
        sede: sede.nombre,
        sedeSlug: sede.slug,
        precio: precioCheckout,
      });
      // Para el advanced matching del Purchase que dispara /gracias al volver.
      await guardarDatosClienteMeta(form);
      window.location.href = res.initPoint;
    } catch (err) {
      setSubmitting(false);
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : 'No pudimos iniciar el pago. Probá de nuevo en un momento.',
      );
    }
  };

  // Pago de la PRUEBA: real, vía checkout() → Mercado Pago.
  const pagarPrueba = async () => {
    if (!sede || submitting) return;
    const claseId = Number(sel[0]);
    if (!Number.isFinite(claseId)) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await checkout({
        claseId,
        sedeId: sede.id,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        dni: form.dni.trim(),
        ...identificadoresMeta(),
      });
      const clase = clases.find((c) => c.id === claseId);
      const params: Record<string, unknown> = {
        content_name: clase?.actividad.nombre ?? 'Clase de prueba',
        content_category: 'Trial',
        sede: sede.nombre,
      };
      if (sede.precioPrueba != null) {
        params.value = sede.precioPrueba;
        params.currency = 'ARS';
      }
      trackMetaEvent('InitiateCheckout', params, undefined, sede.slug);
      trackVenta('add_payment_info', {
        nombre: clase?.actividad.nombre ?? 'Clase de prueba',
        categoria: 'Trial',
        sede: sede.nombre,
        sedeSlug: sede.slug,
        precio: sede.precioPrueba,
      });
      // Para el advanced matching del Purchase que dispara /gracias al volver.
      await guardarDatosClienteMeta(form);
      window.location.href = res.initPoint;
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setSubmitError(
            'Esta clase se llenó mientras completabas el formulario. Volvé a elegir un horario.',
          );
        } else if (err.status === 404) {
          setSubmitError('La clase ya no está disponible. Elegí otro horario.');
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError('No pudimos procesar el pago. Probá de nuevo en un momento.');
      }
    }
  };

  // ── Estados de carga ──────────────────────────────────────────────────
  if (load.status === 'loading') {
    return (
      <div className="planes">
        <Loading label="Cargando planes" />
      </div>
    );
  }
  if (load.status === 'notfound') {
    return (
      <div className="planes planes--msg">
        <p className="t-tag">Sede no encontrada</p>
        <h1 className="planes__msg-title">Esa sede no existe</h1>
        <Link href="/reservar" className="planes__msg-link">
          Ver todas las sedes →
        </Link>
      </div>
    );
  }
  if (load.status === 'error') {
    return (
      <div className="planes">
        <ErrorBanner message={load.message} onRetry={cargar} />
      </div>
    );
  }

  // ══════════════════════════════ CHECKOUT ══════════════════════════════
  const pasosDef = ['1 · Horarios', '2 · Tus datos'];
  const precioSel = tipoSel ? precioLista(tipoSel) : sede?.precioPrueba ?? null;
  const selOrdenado = [...sel].sort((a, b) => a.localeCompare(b));

  // Lo elegido hasta acá. En desktop acompaña los tres pasos desde la columna
  // derecha, así que tiene que aguantar que todavía no haya nada elegido.
  const clasePrueba = clases.find((c) => String(c.id) === sel[0]);
  const resumen: DatosResumen = {
    eyebrow: mode === 'prueba' ? 'Tu clase de prueba' : 'Tu plan',
    titulo:
      mode === 'prueba'
        ? clasePrueba?.actividad.nombre ?? 'Clase de prueba'
        : tipoSel?.etiqueta || tipoSel?.nombre || 'Tu plan',
    sedeNombre: sede?.nombre,
    filas:
      mode === 'prueba'
        ? clasePrueba
          ? [
              {
                label: 'Fecha',
                value: `${formatDayLong(clasePrueba.inicio)} · ${formatTime(clasePrueba.inicio)}`,
              },
              {
                label: 'Instructora',
                value:
                  nombreConInicial(clasePrueba.instructor) ?? 'A confirmar',
              },
            ]
          : []
        : flex
          ? [
              { label: 'Modalidad', value: 'Pack flexible' },
              { label: 'Reservas', value: 'Desde la app' },
            ]
          : selOrdenado.map((k, i) => ({
              label: i === 0 ? 'Todas las semanas' : '',
              value: `${labelDeSel(k)} hs`,
            })),
    pendiente:
      mode === 'prueba'
        ? 'Elegí tu clase para verla acá'
        : modalidad == null
          ? 'Elegí cómo querés usar tus clases'
          : 'Elegí tus horarios para verlos acá',
    totalLabel: 'Total',
    total: mode === 'prueba' ? precioSel : precioCheckout,
  };

  return (
    <div className="planes planes--checkout">
      {/* Header del checkout */}
      <div className="planes__co-head">
        <button
          type="button"
          className="planes__co-back"
          onClick={volver}
          aria-label={step === 1 ? 'Volver al estudio' : 'Volver al paso anterior'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="planes__steps">
          {pasosDef.map((label, i) => {
            const n = i + 1;
            const state = step === n ? 'active' : step > n ? 'done' : 'todo';
            // El paso 1 no siempre es elegir horarios: en prueba se elige una
            // clase, y en una sede que solo vende packs no se elige nada.
            const txt =
              n !== 1
                ? label
                : mode === 'prueba'
                  ? '1 · Clase'
                  : esSoloPack(tipoSel)
                    ? '1 · Plan'
                    : label;
            return (
              <span key={label} className={`planes__step planes__step--${state}`}>
                {txt}
              </span>
            );
          })}
        </div>
      </div>

      <div className="planes__co-layout">
        {/* El resumen va antes que el paso en el DOM porque en mobile tiene que
            quedar arriba del medio de pago. En desktop la grilla lo manda a la
            columna derecha, donde acompaña los tres pasos. */}
        <aside
          className={`planes__co-aside${step === 2 ? '' : ' planes__co-aside--desk'}`}
        >
          <ResumenCompra datos={resumen} />
        </aside>

        <div className="planes__co-main">

      {/* ── Paso 1 ── */}
      {step === 1 && (
        <div className="planes__co-body">
          {/* La pregunta de modalidad no se hace si hay una sola respuesta
              posible: en una sede que solo vende packs, ofrecer "Horarios
              fijos" era ofrecer lo que no existe. */}
          {mode === 'plan' && !esSoloPack(tipoSel) && (
            <>
              <h2 className="planes__co-title">¿Cómo querés usar tus clases?</h2>
              <div className="planes__modes">
                {(
                  [
                    {
                      id: 'fijo' as const,
                      titulo: 'Horarios fijos',
                      desc: 'Tu lugar reservado, mismo grupo y mismo profe cada semana. Si algún día no podés, reprogramás esa clase desde la app.',
                    },
                    {
                      id: 'flex' as const,
                      titulo: 'Pack flexible',
                      desc: 'Reservás tus clases cada semana desde la app, según tu agenda. Sujeto a disponibilidad.',
                    },
                  ]
                )
                  .filter((m) => m.id === 'fijo' || tipoSel?.flexible != null)
                  .map((m) => {
                  const on = modalidad === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`planes__mode${on ? ' planes__mode--on' : ''}`}
                      onClick={() => {
                        setModalidad(m.id);
                        setSel([]);
                      }}
                    >
                      <span className="planes__mode-check">{on ? '✓' : ''}</span>
                      <span className="planes__mode-txt">
                        <span className="planes__mode-title">{m.titulo}</span>
                        <span className="planes__mode-desc">{m.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Prueba: la agenda real de la sede, con sus filtros. Tocar una
              clase la elige y pasa a los datos — no hay paso intermedio. */}
          {mode === 'prueba' && (
            <>
              <h2 className="planes__co-title">Elegí tu clase de prueba</h2>
              <p className="planes__co-sub">
                Recordá que si te querés quedar con nosotros, el valor de la
                clase de prueba se descuenta del plan que elijas.
              </p>
              <div className="planes__co-grilla">
                {clasesCargadas ? (
                  <GrillaClases
                    clases={clases}
                    onElegir={elegirClasePrueba}
                    elegidaId={sel.length > 0 ? Number(sel[0]) : null}
                  />
                ) : (
                  <Loading label="Cargando clases" />
                )}
              </div>
            </>
          )}

          {/* Grilla de horarios recurrentes (plan con horarios fijos) */}
          {mode === 'plan' && modalidad === 'fijo' && (
            <div className="planes__grid-wrap">
              <div className="planes__grid-head">
                <h3 className="planes__grid-title">
                  {necesarios === 1
                    ? 'Elegí tu horario fijo'
                    : `Elegí tus ${necesarios} horarios fijos`}
                </h3>
                <p className="planes__grid-sub">
                  Van a ser tus clases de cada semana. Mismo grupo, mismo profe.
                </p>
              </div>

              {horarios.status === 'loading' ? (
                <Loading label="Cargando horarios" />
              ) : horarios.status === 'error' ? (
                <div className="planes__empty planes__empty--soft">
                  <p>No pudimos cargar los horarios. Probá de nuevo.</p>
                </div>
              ) : diasChips.length === 0 ? (
                <div className="planes__empty planes__empty--soft">
                  <p>No hay horarios disponibles por ahora. Escribinos por WhatsApp y te ayudamos.</p>
                </div>
              ) : (
                <>
                  <div className="planes__days">
                    {diasChips.map((d) => {
                      const active = d.key === dia;
                      const tieneSel = sel.some(
                        (k) => horarioPorId.get(k)?.diaSemana === d.key,
                      );
                      return (
                        <button
                          key={d.key}
                          type="button"
                          className={`planes__day${active ? ' planes__day--active' : ''}`}
                          onClick={() => setDia(d.key)}
                        >
                          {d.label}
                          {tieneSel && <span className="planes__day-dot" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="planes__slots">
                    {slots.map((s) => {
                      const on = sel.includes(s.key);
                      const lleno = s.cupos <= 0;
                      // Sin números: el cupo de un horario recurrente es el de
                      // su próxima clase, no el que se va a encontrar cada
                      // semana. Solo importa si el horario se puede tomar o no.
                      const cuposTxt = lleno ? 'Completo' : null;
                      return (
                        <button
                          key={s.key}
                          type="button"
                          disabled={lleno}
                          className={`planes__slot${on ? ' planes__slot--on' : ''}${lleno ? ' planes__slot--full' : ''}`}
                          onClick={() => toggleSlot(s.key)}
                        >
                          <span className="planes__slot-hora">{s.hora}</span>
                          {cuposTxt && (
                            <span className="planes__slot-cupos">{cuposTxt}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {sel.length > 0 && (
                    <div className="planes__chips">
                      <span className="planes__chips-lbl">Elegiste:</span>
                      {selOrdenado.map((k) => (
                        <button
                          key={k}
                          type="button"
                          className="planes__chip"
                          onClick={() => toggleSlot(k)}
                        >
                          {labelDeSel(k)} <span className="planes__chip-x">✕</span>
                        </button>
                      ))}
                    </div>
                  )}

                </>
              )}

              <button
                type="button"
                disabled={!completo}
                className={`planes__co-cta${completo ? '' : ' planes__co-cta--off'}`}
                onClick={() => {
                  if (!completo) return;
                  setStep(2);
                  scrollTop();
                }}
              >
                {completo
                  ? 'Continuar'
                  : `Elegí ${necesarios - sel.length} horario${necesarios - sel.length === 1 ? '' : 's'} más`}
              </button>
            </div>
          )}

          {/* Pack flexible: no hay horarios que elegir, pero sí una duda que
              resolver antes de pagar — si la grilla de la sede te sirve. */}
          {mode === 'plan' && flex && (
            <div className="planes__grid-wrap">
              {/* Sin la pregunta de modalidad arriba, el paso arrancaba
                  directo en el colapsable y no se entendía qué se compra. */}
              {esSoloPack(tipoSel) && (
                <>
                  <h2 className="planes__co-title">Cómo funciona tu pack</h2>
                  <p className="planes__co-sub">
                    Reservás cada clase desde la app según la disponibilidad del
                    momento. No hay horarios fijos asignados.
                  </p>
                </>
              )}
              <details className="planes__grilla">
                <summary className="planes__grilla-sum">
                  Ver grilla horaria
                </summary>
                <div className="planes__grilla-body">
                  {/* El error del endpoint no alcanza para dar la grilla por
                      perdida: en las sedes sin plan fijo siempre responde 404 y
                      la grilla igual se arma con las clases reales. */}
                  {horarios.status === 'loading' && grillaSemanal.length === 0 ? (
                    <Loading label="Cargando horarios" />
                  ) : grillaSemanal.length === 0 ? (
                    <p className="planes__grilla-nota">
                      No pudimos cargar la grilla. Escribinos por WhatsApp y te
                      la pasamos.
                    </p>
                  ) : (
                    <>
                      {grillaSemanal.map((d) => (
                        <div key={d.diaSemana} className="planes__grilla-dia">
                          <span className="planes__grilla-dia-lbl">
                            {d.label}
                          </span>
                          <div className="planes__grilla-horas">
                            {d.horas.map((h) => (
                              <span key={h} className="planes__grilla-hora">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      <p className="planes__grilla-nota">
                        Es la grilla de la sede, a modo de referencia. Con el
                        pack flexible reservás cada clase desde la app según la
                        disponibilidad del momento.
                      </p>
                    </>
                  )}
                </div>
              </details>
              <button
                type="button"
                className="planes__co-cta"
                onClick={() => {
                  setStep(2);
                  scrollTop();
                }}
              >
                Continuar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Paso 2: datos ── */}
      {/* ── Paso 2: datos y pago en la misma pantalla ── */}
      {step === 2 && (
        <form className="planes__form" onSubmit={pagar} noValidate>
          <h3 className="planes__form-title">Tus datos</h3>
          <p className="planes__form-sub">
            {mode === 'prueba'
              ? 'No creamos cuenta. Solo los usamos para esta reserva.'
              : 'Con esto te creamos la cuenta para reservar desde la app.'}
          </p>

          <div className="planes__fields">
            <div className="planes__field-row">
              <label className="planes__field">
                <span className="planes__field-lbl">Nombre</span>
                <input
                  className="planes__input"
                  autoComplete="given-name"
                  value={form.nombre}
                  onChange={handleChange('nombre')}
                />
                {errors.nombre && (
                  <span className="planes__field-err">{errors.nombre}</span>
                )}
              </label>
              <label className="planes__field">
                <span className="planes__field-lbl">Apellido</span>
                <input
                  className="planes__input"
                  autoComplete="family-name"
                  value={form.apellido}
                  onChange={handleChange('apellido')}
                />
                {errors.apellido && (
                  <span className="planes__field-err">{errors.apellido}</span>
                )}
              </label>
            </div>
            <label className="planes__field">
              <span className="planes__field-lbl">Email</span>
              <input
                className="planes__input"
                placeholder="tu@email.com"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange('email')}
              />
              {errors.email && (
                <span className="planes__field-err">{errors.email}</span>
              )}
            </label>
            <label className="planes__field">
              <span className="planes__field-lbl">Teléfono</span>
              <input
                className="planes__input"
                placeholder="+54 9 11 …"
                type="tel"
                autoComplete="tel"
                value={form.telefono}
                onChange={handleChange('telefono')}
              />
              {errors.telefono && (
                <span className="planes__field-err">{errors.telefono}</span>
              )}
            </label>
            <label className="planes__field">
              <span className="planes__field-lbl">DNI</span>
              <input
                className="planes__input"
                placeholder="12345678"
                inputMode="numeric"
                autoComplete="off"
                value={form.dni}
                onChange={handleChange('dni')}
              />
              {errors.dni && (
                <span className="planes__field-err">{errors.dni}</span>
              )}
            </label>
          </div>

          {mode === 'plan' && (
            <div className="planes__medios">
              <button
                type="button"
                className={`planes__medio${medio === 'online' ? ' planes__medio--on' : ''}`}
                onClick={() => setMedio('online')}
              >
                <span className="planes__medio-title">Pago único</span>
                {/* Lo que la preferencia de MP deja disponible: excluye
                    efectivo, transferencia y cajero, no la tarjeta de débito
                    ni el dinero en cuenta. */}
                <span className="planes__medio-desc">
                  Tarjeta de débito o crédito, o dinero en cuenta
                </span>
              </button>
              <button type="button" className="planes__medio planes__medio--off" disabled>
                <span className="planes__medio-title">Débito automático</span>
                <span className="planes__medio-desc">Próximamente</span>
              </button>
            </div>
          )}

          {submitError && (
            <div className="planes__co-error">
              <ErrorBanner message={submitError} />
            </div>
          )}

          <button type="submit" className="planes__co-cta" disabled={submitting}>
            {submitting ? 'Redirigiendo a Mercado Pago…' : 'Pagar y reservar'}
          </button>
          <p className="planes__co-secure">
            Al continuar aceptás los términos y condiciones de CLIC. El pago se
            procesa de forma segura a través de Mercado Pago.
          </p>
        </form>
      )}

        </div>
      </div>
    </div>
  );
}
