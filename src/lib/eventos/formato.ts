import { hora } from '@/lib/formato';

/** "19:00" o "19:00 a 20:30", en hora de Buenos Aires. */
export function horarioEvento(inicio: string, fin: string | null): string {
  return fin ? `${hora(inicio)} a ${hora(fin)}` : hora(inicio);
}
