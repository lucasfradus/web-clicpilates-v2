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
