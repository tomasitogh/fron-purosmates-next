'use client';

import dynamic from 'next/dynamic';

/**
 * react-konva usa `window` y `<canvas>`: NO puede renderizarse en el servidor.
 * `dynamic(..., { ssr: false })` solo está permitido dentro de Client Components,
 * por eso este wrapper existe (la página sigue siendo un Server Component con metadata).
 */
const CustomizerShell = dynamic(() => import('./CustomizerShell'), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square w-full max-w-[520px] items-center justify-center rounded-full bg-stone-100">
      <p className="text-sm text-stone-500">Cargando editor…</p>
    </div>
  ),
});

export default function CustomizerLoader() {
  return <CustomizerShell />;
}
