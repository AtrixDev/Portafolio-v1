# Estado de las herramientas

Última revisión: **02/10/2026** (vitrina `herramientas.html`; el resto de la tabla es del 30/09/2026), probadas en producción (Playwright + llamadas a la API con la cuenta VJ999).
Actualizar esta tabla cada vez que se pruebe o cambie una herramienta, y el estado en `frontend/js/herr.js`.

| Herramienta | Estado en la web | Qué se probó | Resultado |
|---|---|---|---|
| ML Tracker | Funcionando | Demo pública, detalle por publicación, cron diario | Anda. El cron sincronizó VJ999 el 30/09 a las 10:47 UTC. |
| Auditoría de cuenta | Funcionando | Pedido de prueba con VJ999 → sincronización → resumen en `sistema.html?auditoria=…`; link de conexión a Mercado Libre | Anda. Falta que Darío haga una vez el login real de Mercado Libre de punta a punta. Corregido: plural ("1 publicación") y barra en 0 invisible. |
| Chequeo de publicación | Funcionando | Link de catálogo (Borner /p/) y link de publicación común | Con catálogo: completo (fotos, atributos, etc.). Con publicación común: solo largo de la descripción y cantidad de preguntas, porque `/items` de otros vendedores da 403. La vitrina ahora dice "Completo con links de catálogo". |
| Simulador de puntaje | Funcionando | Controles y puntaje | Anda (todo en el navegador). |
| Catálogo de diagnóstico | Funcionando | 10 problemas, detalle y "Verlo en la demo" | Anda. |
| Minero de opiniones | Funcionando | 02/10: la demo de la vitrina analiza opiniones que pegás (también de la competencia), por tema y tono, en el navegador | Anda. Con cuenta conectada trae hasta 200 solo; de otras cuentas Mercado Libre da 403, por eso se pegan a mano. |
| Buscador de tendencias | **En pausa** | `/trends/MLA` y por categoría, con token válido | Mercado Libre responde 404 "Not found public trends" en todas. La web muestra la última copia real guardada (si hay) o el ejemplo rotulado, con aviso. Se reintenta cada una hora. |
| Calculadora de importación | Funcionando | Mini demo y `importar.html` | Anda (en el navegador). |
| Informe de muestra | Funcionando | `informe-muestra.html` | Anda. | 02/10: la vista previa de la vitrina sale de la demo del tracker (antes eran bloques tapados).
| ¿Cuánta plata estás perdiendo? | Funcionando | Mini demo y `perdida.html` | Anda (en el navegador). |
| Alertas de competencia | Idea | 02/10: sin maqueta ni números inventados; la vitrina explica qué haría, qué falta y cómo se destraba | Solo viable con catálogo (`/products/{id}/items`): historial propio de precios y ventas con rango. |
| Radar de demanda | Idea | 02/10: igual que arriba | Falta una fuente de demanda que reemplace las tendencias cortadas. |
| Desarmes de publicaciones | En idea | — | Se puede hacer a mano, no depende de la API. |
| Radar semanal por mail | En idea | — | Dependía de tendencias de Mercado Libre. |

## Qué deja leer hoy la API de Mercado Libre (con token de una cuenta)

- **Sí:** `/users/me`, tus propias publicaciones, visitas y órdenes; `/products/{id}` y `/products/{id}/items` (catálogo); `/items/{id}/description` de cualquier publicación; `/questions/search?item=` de cualquier publicación; tus propias opiniones.
- **No:** `/items/{id}` de otros vendedores (403), `/reviews/item/{id}` de otros (403), `/trends/MLA` (404), `/sites/MLA/search` (403), `/highlights` (403).
