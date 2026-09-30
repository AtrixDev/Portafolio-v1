# Cambios en `Pedidos.jsx`

Revisé el componente siguiendo las reglas de *Vercel React Best Practices*. Abajo tenés cada cambio, ordenado de lo más grave a lo más cosmético, con la regla que lo respalda.

## 1. Bucle infinito de pedidos a la API (bug crítico)

**Antes:** el `useEffect` no tenía array de dependencias, así que corría después de *cada* render. Como adentro se hacían tres `setState`, cada uno disparaba otro render → otro efecto → otras tres consultas… y así para siempre. La API recibía pedidos sin parar.

**Ahora:** el efecto depende sólo de `[clienteId]`. Se ejecuta al montar el componente y cada vez que cambia el cliente, nada más.

## 2. Consultas en cascada → en paralelo (`async-parallel`)

**Antes:** se esperaba al cliente, después a los pedidos, después al stock. Las tres consultas no dependen entre sí, pero el tiempo total era la suma de las tres.

**Ahora:** van juntas con `Promise.all`, así que el tiempo total es el de la más lenta. Además, los datos se guardan con un único `setDatos`, en vez de tres renders intermedios con la pantalla a medio llenar.

## 3. Condición de carrera al cambiar de cliente

**Antes:** si `clienteId` cambiaba mientras había consultas en vuelo, la respuesta vieja podía llegar después de la nueva y pisarla: veías los pedidos de otro cliente.

**Ahora:** cada ejecución del efecto crea un `AbortController`. La función de limpieza cancela las consultas pendientes y, antes de guardar el resultado, se verifica `signal.aborted`, así que las respuestas viejas se descartan.

## 4. Manejo de errores y estado de carga

**Antes:** si una consulta fallaba (404, 500, red caída), la promesa se rechazaba sin que nadie la atrapara y el usuario no se enteraba de nada. Además, `fetch` no rechaza con errores HTTP, así que se intentaba parsear como JSON una página de error.

**Ahora:**
- La función `obtenerJSON` revisa `res.ok` y tira un error con el código HTTP.
- Hay un estado `estado` (`'cargando' | 'listo' | 'error'`) que muestra "Cargando pedidos…" o el mensaje de error, con `role="status"` y `role="alert"` para que los lectores de pantalla lo anuncien.
- También aparece un mensaje cuando el filtro no encuentra ningún pedido.

## 5. `key` estable (`key={p.id}` en vez del índice)

**Antes:** se usaba el índice como `key`. Al filtrar, los índices se corren y React reutiliza nodos que no corresponden, con el riesgo de mezclar estado del DOM entre filas.

**Ahora:** se usa `p.id`, que identifica al pedido de verdad.

## 6. Búsqueda de stock con `Map` (`js-index-maps`, `js-set-map-lookups`)

**Antes:** por cada pedido se hacía `stock.find(...)`, que recorre todo el array: O(pedidos × stock) en cada render, incluso con cada tecla del buscador.

**Ahora:** se arma una vez un `Map` de `productoId → cantidad` con `useMemo` (sólo se recalcula cuando cambia `stock`) y cada consulta es O(1). Si un producto no figura en el stock, se muestra "—" en lugar de quedar vacío.

## 7. Filtro más eficiente (`js-cache-function-results`, `js-early-exit`)

**Antes:** `filtro.toLowerCase()` se recalculaba para cada pedido.

**Ahora:** el término se calcula una sola vez (con `trim()` además, para ignorar espacios sueltos) y, si está vacío, directamente se usa la lista completa sin filtrar.

El filtrado y el total se siguen derivando durante el render (`rerender-derived-state-no-effect`): no hace falta guardarlos en estado ni memoizarlos, son cálculos baratos.

## 8. Accesibilidad: `button` en vez de `div` clickeable

**Antes:** cada fila era un `<div onClick>`. No se puede enfocar con Tab ni activar con Enter/Espacio, y los lectores de pantalla no lo anuncian como interactivo.

**Ahora:**
- Cada pedido es un `<button type="button">` dentro de un `<li>`, en una lista `<ul>` (semántica correcta de lista).
- El input tiene `type="search"` y `aria-label`, porque el `placeholder` solo no sirve como etiqueta.
- El contenedor pasó de `<div>` a `<section>`.

## 9. Formato de moneda

**Antes:** `$${total}` mostraba cosas como `$1234.5` o, por errores de coma flotante, `$10.200000000000001`.

**Ahora:** se usa `Intl.NumberFormat('es-AR', { currency: 'ARS' })`, que muestra `$ 1.234,50`. El formateador se crea una sola vez a nivel de módulo en lugar de en cada render.

## 10. Detalles menores

- `clienteId` se pasa por `encodeURIComponent` antes de meterlo en la URL.
- El objeto de estilo `{ padding: 8 }` se sacó afuera del componente (`estiloItem`) para no crear uno nuevo por fila en cada render (`rendering-hoist-jsx`).

## Cosas que dejé como estaban (y posibles mejoras a futuro)

- **`alert(p.id)`**: mantuve el comportamiento original, pero lo ideal sería reemplazarlo por algo real (navegar al detalle, abrir un modal, etc.).
- **SWR / React Query** (`client-swr-dedup`): si el proyecto ya usa (o puede sumar) alguna de estas librerías, conviene pasar las consultas ahí. Te dan caché, deduplicación y revalidación, y te ahorran todo el manejo manual del `AbortController` y los estados. Por ejemplo, `/api/stock` no depende del cliente y se podría compartir entre componentes. No lo agregué para no meter una dependencia nueva sin saber qué usa el proyecto.
- **Listas muy largas**: si los pedidos llegan a ser cientos o miles, se puede sumar `useDeferredValue` sobre el filtro (`rerender-use-deferred-value`) o virtualizar la lista.
