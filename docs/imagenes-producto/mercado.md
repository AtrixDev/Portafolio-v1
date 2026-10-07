# Imágenes de producto: mapa del mercado (01/10/2026)

Estado: investigación inicial, sin gastar. Los precios y límites salen de búsquedas web del 01/10/2026 y hay que
verificarlos en cada sitio antes de decidir. Lo marcado "medido" lo probamos nosotros.

## Recorte de fondo
| Opción | Costo | Calidad | Notas |
|---|---|---|---|
| **BiRefNet-lite con rembg en nuestra máquina** | Gratis | **Medido: profesional** en termo, cuchillos y vaso de vidrio con espuma. Falla en detalles finos (perilla de madera de una tapa de vidrio) y en fotos con personas | CPU, 13–30 s por foto. No corre en el navegador (WASM sin memoria). Licencia MIT |
| ISNet (rembg) | Gratis | Medido: peor que BiRefNet en superficies semitransparentes (termo con partes borradas) | 2 s por foto. Licencia AGPL |
| BRIA RMBG 2.0 | Gratis para pruebas; uso comercial con acuerdo | Dice superar a BiRefNet (90 % vs 85 % en su propia medición) | Verificar licencia comercial |
| Photoroom API | Sandbox con 1.000 imágenes gratis; luego USD 0,02 por recorte | Referente del rubro | Requiere cuenta |
| remove.bg API | 50 gratis por mes en baja resolución; ~USD 0,20 por imagen en alta | Muy buena | Requiere cuenta |
| Clipdrop API | Ya no publica precios (migró a Jasper) | — | Descartado por ahora |

## Edición que conserva el producto (escenas de uso, fondos)
| Opción | Costo | Notas |
|---|---|---|
| **Gemini "Nano Banana" (AI Studio)** | Gratis: hasta ~500 solicitudes por día por API y cientos de imágenes por día en la web de AI Studio (varía por carga) | Requiere cuenta de Google y clave, sin tarjeta. Pendiente medir si respeta forma, logo y texto del producto |
| FLUX Kontext (BFL, fal, Replicate) | Pago por imagen | Pensado para cambiar escenas conservando el producto. Los pesos "dev" no son para uso comercial |
| gpt-image (OpenAI) | Pago por imagen | Fuerte en fotorrealismo y composición |
| Qwen-Image-Edit | Gratis (Apache 2.0) | 20 B de parámetros: necesita GPU potente; nuestra máquina no tiene GPU |
| Photoroom (fondos con IA y sombras) | USD 0,10 por imagen en el plan Plus | Diseñado para e-commerce |
| Claid, Pebblely, Flair, Nightjar | Planes desde ~USD 15–25 por mes | Herramientas completas para catálogo |

## Textos, infografías y carruseles
Ningún modelo generativo escribe el texto de forma confiable. Plan: **plantillas dibujadas por código** (tipografía real,
medidas exactas) sobre el producto recortado. La IA, si se usa, solo pone la escena de fondo.

## Conclusión provisoria
- El recorte profesional **ya está resuelto gratis**, pero en servidor propio o local, no en el navegador.
- Falta medir las escenas de uso: la candidata gratuita es Gemini (AI Studio).
- Una herramienta pública gratuita no puede correr BiRefNet en Vercel (modelo de 224 MB y 13–30 s de CPU por foto).
  Opciones: herramienta como servicio tuyo (lo corrés vos), o API paga si el volumen lo justifica.

Fuentes: claid.ai/blog/article/ai-product-photo-tools · blog.bria.ai (RMBG 2.0) · photoroom.com/api/pricing ·
costbench.com (remove.bg y Clipdrop) · blog.laozhang.ai (límites de Gemini imagen) · Hugging Face (BiRefNet, licencias).
