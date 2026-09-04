import type { Sede } from '@/lib/api/tipos'

/**
 * El barrio tal como lo busca la gente en Google, que no siempre es el nombre
 * comercial de la sede: "Office Pilates" queda en Manuel Alberti, pero nadie
 * busca eso — busca "pilates en Pilar".
 *
 * Esto es un mapa a mano porque `Sede.zona` todavía no existe en el backend
 * (está en la migración pendiente, ver `tasks/todo.md`). Cuando exista, esta
 * función pasa a leer el campo y el mapa se borra.
 */
const ZONA: Record<string, string> = {
  belgrano: 'Belgrano',
  escobar: 'Escobar',
  hollywood: 'Palermo Hollywood',
  'lomada-hot': 'Pilar',
  nordelta: 'Nordelta',
  nunez: 'Núñez',
  'office-pilates': 'Pilar',
  olivos: 'Olivos',
  pilara: 'Pilará',
  soho: 'Palermo Soho',
}

export function zonaDe (sede: Pick<Sede, 'slug' | 'ciudad' | 'nombre'>): string {
  return ZONA[sede.slug] ?? sede.ciudad ?? sede.nombre
}

/**
 * Las otras sedes de la misma ciudad: enlazado interno entre landings locales,
 * que es de las pocas señales de SEO que dependen sólo de nosotros.
 */
export function sedesCerca (sede: Sede, todas: Sede[], cuantas = 4): Sede[] {
  const otras = todas.filter((s) => s.id !== sede.id)
  const mismaCiudad = otras.filter((s) => s.ciudad === sede.ciudad)
  return (mismaCiudad.length > 0 ? mismaCiudad : otras).slice(0, cuantas)
}

/** Sin acentos, sin mayúsculas y sin dobles espacios: para comparar, no para mostrar. */
const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * Cómo nombrar una sede en una lista: qué mostrar y qué no repetir.
 *
 * El nombre de la sede y su zona muchas veces dicen lo mismo con distintas
 * letras — "Nuñez" y "Núñez", "Pilara" y "Pilará", "Belgrano C" y "Belgrano"—,
 * y ponerlos uno al lado del otro se lee como un error. Comparar los strings
 * crudos no alcanza justamente por los acentos.
 *
 * La regla, en orden:
 *   1. Si dicen lo mismo, gana la zona: es la que tiene los acentos bien.
 *   2. Si uno contiene al otro, gana el más largo, que es el que informa más
 *      ("Palermo Hollywood" en vez de "Hollywood").
 *   3. Si son cosas distintas, van las dos: "Office Pilates · Pilar" es
 *      exactamente lo que alguien necesita para elegir.
 */
export function etiquetaDeSede (sede: Pick<Sede, 'slug' | 'ciudad' | 'nombre'>): {
  principal: string
  secundaria?: string
} {
  const zona = zonaDe(sede)
  const n = normalizar(sede.nombre)
  const z = normalizar(zona)

  if (n === z) return { principal: zona }
  if (n.includes(z)) return { principal: sede.nombre }
  if (z.includes(n)) return { principal: zona }
  return { principal: sede.nombre, secundaria: zona }
}
