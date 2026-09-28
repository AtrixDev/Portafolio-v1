# Revisión de errores del sitio

Registro de errores detectados para revisar y corregir juntos. Cada uno con dónde está, qué pasa y cómo arreglarlo.
Estado: `abierto` · `en curso` · `resuelto`.

## 1. Vista previa de rubros y paletas con texto de Mercado Libre — abierto
- **Dónde:** Programación (`programacion.html`) → fichas de "Rubros" (192) y "Paletas de color". Código: `frontend/js/programacion-ejemplos.js`, función `paletaMock()`.
- **Qué pasa:** todas las fichas muestran la misma interfaz de ejemplo: "Resumen del mes · Ventas +18% y ACOS en 12,4%. Tres publicaciones necesitan fotos." Reportado por Darío en ONG / beneficencia: una ONG no tiene ventas ni ACOS.
- **Por qué es grave:** la vista previa debería vender lo que se puede hacer para ese rubro; hoy muestra un contenido que no le corresponde y resta credibilidad.
- **Cómo arreglarlo:** que cada rubro muestre un ejemplo real de su web (ONG: campaña de donación con meta y botón "Donar"; veterinaria: turnos; estudio jurídico: consulta; etc.), con contenido propio por rubro o por familia de rubros, en vez de un texto fijo.
- **Revisar también:** el resto de las fichas de Programación y Armá tu web (781 fichas) por el mismo tipo de error: contenido genérico o que no corresponde al rubro.
