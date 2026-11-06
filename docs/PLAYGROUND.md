# Playground 3D: "Cebá tu mate"

Juego 3D en `https://www.purosmates.com.ar/playground`. El usuario se sienta a una mesa de día,
frente a una ventana, elige **yerba, bombilla, mate y termo** y ceba el mate paso a paso. El objetivo
es atraer tráfico (es compartible, tiene puntaje) y llevarlo a la tienda y al blog.

## Por qué `/playground` y no `playground.purosmates.com.ar`

- **SEO**: una ruta dentro del dominio principal hereda la autoridad de `www.purosmates.com.ar`. Un
  subdominio Google lo trata casi como un sitio aparte: los links y el tráfico que consiga no suman
  al e-commerce.
- **Cero infraestructura nueva**: se despliega con el mismo proyecto de Vercel, sin DNS, sin otro
  proyecto ni otro dominio en Clerk.
- **Conversión**: desde el resultado final hay links directos a la tienda.

## Cómo se aísla del e-commerce (rendimiento)

- `three` (~136 KB gzip) se descarga **solo** al entrar a `/playground`: `MateGame.tsx` hace
  `import('./engine')` adentro de un `useEffect`. Next.js parte el JS por ruta, así que la home, la
  tienda, el producto y el checkout no cargan nada del juego. Se verificó con `next build`: el chunk
  de Three.js solo lo referencia `playground/page`.
- No se tocó el layout raíz, ni Redux, ni ningún componente compartido (salvo un link de texto en
  el footer y una tarjeta en Rincón Matero).
- No hay modelos 3D, texturas ni sonidos para descargar: todo se dibuja por código (geometrías de
  Three.js y texturas pintadas en `<canvas>`).
- El backend no cambia.

## Archivos

| Archivo                              | Qué hace                                                                |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `app/playground/page.tsx`            | Ruta, metadata SEO, JSON-LD (`VideoGame` + `HowTo`).                    |
| `components/playground/MateGame.tsx` | UI en React: intro, hotspots, panel de opciones, pasos, medidor, final. |
| `components/playground/engine.ts`    | Motor Three.js: escena, cámara, clicks 3D y la lógica de cada paso.     |
| `components/playground/catalog.ts`   | Opciones elegibles (nombre, descripción, colores, link) y los 9 pasos.  |

### Cómo funciona Three.js acá (resumen)

1. **Escena**: un `THREE.Scene` con el cuarto (paredes con un hueco de ventana, piso, mesa), un
   paisaje pintado en un `<canvas>` detrás de la ventana y luces: una `HemisphereLight` (luz de día
   ambiente) y una `DirectionalLight` (el sol) que entra por la ventana y proyecta sombras.
2. **Objetos**: cada mate es una `LatheGeometry` (un perfil 2D que se gira 360°, como en un torno).
   Los termos son cilindros, los paquetes de yerba son cajas con una etiqueta dibujada en un canvas y
   las bombillas son tubos (`TubeGeometry`).
3. **Cámara**: una `PerspectiveCamera` fija a la altura de los ojos de alguien sentado. Arrastrar con
   el mouse/dedo cambia hacia dónde mira (yaw/pitch). En celulares se puede activar el giroscopio
   para mirar moviendo el teléfono.
4. **Clicks en 3D**: un `Raycaster` tira un "rayo" desde el punto tocado y devuelve qué objeto tocó.
5. **Animaciones**: cada objeto tiene una posición/rotación "objetivo"; en cada frame se acerca
   suavemente a ella. Para volcar yerba se mueve el paquete encima del mate, se inclina y se emiten
   partículas; para el agua se inclina el termo y se dibuja un chorrito.
6. **React ↔ motor**: el motor no sabe nada de React. Avisa cambios con `onChange(snapshot)` y React
   llama métodos como `select()`, `startPrepare()`, `setHolding()` o `action()`.

## Pasos del juego

Agarrar el mate → poner la yerba (2/3 a 3/4) → inclinar (30°–50°) → chorrito de agua tibia →
esperar 5 segundos → agua de nuevo → poner la bombilla → cebar con agua caliente → tomar. Cada paso
con medidor tiene una "zona ideal" y suma puntaje; al final se muestra un puntaje sobre 100.

## Analítica

Se empujan eventos a `window.dataLayer` (GTM ya está en el sitio): `playground_start`,
`playground_select`, `playground_prepare_start`, `playground_step`, `playground_complete`,
`playground_share`, `playground_shop_click`, `playground_replay`, `playground_reset`.

## Cómo agregar o cambiar opciones

Editar `components/playground/catalog.ts`. Cada categoría admite hasta 5 opciones: con más de 3, la
mesa las acomoda en dos filas (3 atrás y 2 adelante). `shopHref` define a qué parte de la tienda
lleva el botón "Ver en la tienda".

Los modelos están en `components/playground/models.ts`:

- **Yerbas** (`PACKS`): cada marca define si es bolsa o caja, sus medidas y dos funciones que pintan
  el frente y el costado en un `<canvas>` (colores, textos y dibujos de la etiqueta).
- **Mates** (`MATES`): cada mate define su altura, una función `radius(t)` con el perfil (de la base
  a la boca), la textura del cuerpo y, opcionalmente, una banda de cuero en relieve y una virola de
  alpaca con su perfil y su cincelado.
