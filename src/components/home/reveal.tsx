'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Aparición al scrollear.
 *
 * Tres cuidados, porque un reveal mal hecho esconde contenido:
 *
 * - Sin JavaScript no se ve nada, así que el `<noscript>` del layout apaga la
 *   regla y todo queda visible.
 * - Con `prefers-reduced-motion` el CSS también lo deja visible y quieto.
 * - El observer se desconecta al primer cruce: no hay razón para seguir
 *   escuchando el scroll el resto de la visita.
 */
export function Reveal ({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el == null) return

    const io = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('rv--visible')
            io.unobserve(entrada.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={['rv', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
