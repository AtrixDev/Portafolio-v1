# Cambios en `Pedidos.jsx`

## Bugs que había que arreglar sí o sí

### 1. Bucle infinito de pedidos a la API
El `useEffect` no tenía array de dependencias, así que corría **después de cada render**. Como adentro se hacían `setCliente`, `setPedidos` y `setStock`, cada respuesta provocaba un render nuevo, que volvía a disparar el efecto… y así para siempre. Encima, cada tecla en el buscador también relanzaba las tres llamadas.

**Ahora:** el efecto depende solo de `[clienteId]`. Se ejecuta al montar y cada vez que cambia el cliente, nada más.

### 2. Condición de carrera al cambiar de cliente
Si `clienteId` cambiaba mientras había pedidos en vuelo, la respuesta vieja podía llegar después que la nueva y pisarla, mostrando datos del cliente equivocado.

**Ahora:** se usa un `AbortController`. La función de limpieza del efecto cancela los `fetch` pendientes, así que solo se guardan los datos del `clienteId` actual (y tampoco se hace `setState` sobre un componente desmontado).

### 3. Errores de red ignorados
`fetch` no tira error con un 404 o un 500: devolvía el cuerpo de error como si fueran datos válidos, y después `pedidos.filter` o `p.producto.toLowerCase()` podían romper todo el componente.

**Ahora:** la función `obtenerJson` chequea `respuesta.ok` y lanza un error si falla. El error se guarda en estado y se muestra un mensaje (con `role="alert"` para lectores de pantalla). Los `AbortError` se ignoran porque son cancelaciones a propósito.

## Rendimiento

### 4. Pedidos en paralelo en vez de en cascada
Las tres llamadas se hacían una atrás de la otra (cada `await` esperaba a la anterior), aunque ninguna depende de otra. El tiempo total era la suma de las tres.

**Ahora:** se lanzan juntas con `Promise.all`, así que se tarda lo que tarde la más lenta. Además se hace un solo `setState` por dato al final, sin renders intermedios con datos a medias.

### 5. Búsqueda de stock O(n·m) → O(1)
Por cada pedido se hacía `stock.find(...)`, recorriendo todo el array de stock. Con muchos pedidos y muchos productos eso escala mal.

**Ahora:** se arma un `Map` (`stockPorProducto`) una sola vez con `useMemo` cada vez que cambia `stock`, y cada consulta es un `.get()` directo. Si un producto no está en el stock se muestra `—` en lugar de quedar vacío.

### 6. Filtro memorizado
El filtrado se recalculaba en cada render y hacía `filtro.toLowerCase()` una vez por pedido.

**Ahora:** se calcula con `useMemo` según `[pedidos, filtro]`, se normaliza el texto una sola vez (con `trim()` para ignorar espacios sueltos) y si el buscador está vacío se devuelve la lista tal cual, sin filtrar.

## Buenas prácticas de React

### 7. `key` estable
Se usaba el índice (`key={i}`) como key. Al filtrar, los índices cambian y React puede reutilizar mal los elementos. **Ahora** se usa `p.id`, que identifica cada pedido de forma única.

### 8. Estados de carga y vacío
Antes, mientras cargaba, se veía un título vacío y un total de `$0`, que confunde. **Ahora** hay un estado `cargando` con su mensaje, y si el filtro no encuentra nada se muestra "No hay pedidos para mostrar.".

## Accesibilidad y UX

### 9. Elementos clickeables accesibles
Los pedidos eran `<div>` con `onClick`: no se podían enfocar con el teclado ni los anunciaban como interactivos los lectores de pantalla. **Ahora** son `<button type="button">` dentro de una lista (`<ul>`/`<li>`), que es la estructura semántica correcta.

### 10. Input con etiqueta
El buscador solo tenía `placeholder`, que no sirve como etiqueta accesible. Se agregó `aria-label` y `type="search"`.

### 11. Formato de moneda
El total se mostraba como `$1234.5`. **Ahora** se usa `Intl.NumberFormat('es-AR', { currency: 'ARS' })`, que da `$ 1.234,50`. El formateador se crea una sola vez fuera del componente.

### 12. Parámetros de URL escapados
`clienteId` se mete en la URL con `encodeURIComponent`, por si llega con caracteres especiales.

## Lo que quedó igual (a propósito)

- El `alert(p.id)` al hacer clic se mantuvo para no cambiar el comportamiento. Lo ideal sería reemplazarlo por una prop tipo `onSeleccionarPedido(pedido)` para que el componente padre decida qué hacer.
- Los estilos inline se dejaron como estaban. Si el proyecto usa CSS Modules o algún otro sistema, convendría pasarlos ahí.
- Si el proyecto ya usa algo como React Query o SWR, conviene mover la carga de datos ahí: resuelve caché, reintentos y cancelación sin tener que escribirlo a mano.
