/* eslint-disable @next/next/no-img-element -- isotipo decorativo de pocos KB; el optimizador no aporta nada */

/**
 * El isotipo de CLIC. Portado tal cual del portal de reservas; los PNG viven en
 * `public/reservas/` en vez de importarse, porque en Next un import de imagen
 * devuelve un objeto y no una URL.
 */

type Variant = 'black' | 'taupe' | 'white';

const srcMap: Record<Variant, string> = {
  black: '/reservas/clic_iso_black.png',
  taupe: '/reservas/clic_iso_taupe.png',
  white: '/reservas/clic_iso_white.png',
};

export function Iso({
  variant = 'taupe',
  size = 32,
  style,
  className,
}: {
  variant?: Variant;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <img
      src={srcMap[variant]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', ...style }}
    />
  );
}
