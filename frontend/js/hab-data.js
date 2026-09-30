// js/hab-data.js — Habilidades por defecto (se pueden editar desde el admin: /api/content → habilidades)
// usos: { puesto: [texto, dato opcional] } — todo sale del CV
export const AREAS = [
  { area: 'Vender en Mercado Libre', skills: [
    { id: 'ads', lab: ['ACOS y Product Ads', '/acos.html'], n: 'Product Ads y ACOS', usos: {
      adamas: ['Campañas con análisis de rentabilidad'],
      veni: ['Reordené las campañas por rentabilidad', 'ACOS 30% → 12%'],
      propias: ['El Tracker calcula el ACOS máximo por publicación'] },
      tools: ['Product Ads', 'Excel', 'ML Tracker'], prueba: ['Captura de Product Ads', '/assets/resultados/product-ads-nov-2025.webp'] },
    { id: 'seo', lab: ['SEO de títulos', '/seo.html'], n: 'SEO de títulos y fichas', usos: {
      adamas: ['Catálogos orientados a conversión'],
      demasled: ['SEO validado con datos de búsqueda', '+200 publicaciones'],
      veni: ['Títulos con palabras de alto volumen, validadas'] },
      tools: ['Nubimetrics', 'UpSeller', 'AnswerThePublic'], prueba: ['Caso Borner: antes y después', '/#caso-exito'] },
    { id: 'catalogo', lab: ['Anatomía de una publicación', '/anatomia.html'], n: 'Catálogo y publicaciones', usos: {
      adamas: ['Catálogos de +10 cuentas a la vez', '+10 cuentas'],
      demasled: ['Publicaciones de iluminación importada', '+200'],
      veni: ['Publicaciones nuevas en 4 tiendas oficiales', '+200'] },
      tools: ['Mercado Libre', 'Tienda Nube'], prueba: ['15 publicaciones reales en la Trayectoria', '/#experiencia'] },
    { id: 'imagenes', lab: ['Imágenes con IA', '/imagenes.html'], n: 'Imágenes e infografías', usos: {
      veni: ['Rehice fotos e infografías de las publicaciones'],
      propias: ['MELI Visual Listing Agent: imágenes con IA y puntaje propio'] },
      tools: ['Canva', 'ComfyUI', 'FLUX'], prueba: ['Caso Borner: antes y después', '/#caso-exito'] },
    { id: 'promos', lab: ['Precios y competencia', '/pricing.html'], n: 'Promociones y campañas masivas', usos: {
      demasled: ['Planificación e implementación de campañas masivas'] },
      tools: ['Mercado Libre'] },
  ]},
  { area: 'Analizar', skills: [
    { id: 'datos', lab: ['Dashboard de métricas', '/metricas.html'], n: 'Análisis de datos', usos: {
      adamas: ['Rentabilidad de campañas por cuenta'],
      demasled: ['Extracción automática de datos de mercado'],
      veni: ['Métricas de negocio y Product Ads, medidas en el panel', '+38,9% ventas'],
      propias: ['El Tracker separa si falta exposición u oferta'] },
      tools: ['Excel', 'Google Sheets', 'MongoDB', 'Google Analytics'], prueba: ['Captura de Métricas', '/assets/resultados/metricas-negocio-jun-nov-2025.webp'] },
    { id: 'precios', lab: ['Precios y competencia', '/pricing.html'], n: 'Precios y competencia', usos: {
      demasled: ['Monitor de precios de la competencia'],
      propias: ['Motor de precios: cuándo subir o bajar'] },
      tools: ['Apps Script', 'API de Mercado Libre'], prueba: ['Probar la demo del Tracker', '/sistema.html#demo'] },
  ]},
  { area: 'Construir', skills: [
    { id: 'auto', lab: ['Excels automatizados', '/excels.html'], n: 'Automatización', usos: {
      demasled: ['Monitor y alertas en Apps Script'],
      propias: ['Sincronización diaria de cuentas y auditoría automática'] },
      tools: ['Apps Script', 'Node.js', 'Python'], prueba: ['Auditar una cuenta', '/sistema.html#auditar'] },
    { id: 'webs', lab: ['Cómo se arma una web', '/programacion.html'], n: 'Tiendas y webs', usos: {
      adamas: ['Tiendas en WordPress y Tienda Nube'],
      veni: ['"Mi Página" de Borner en Mercado Libre y Tienda Nube'],
      propias: ['Webs para negocios, de punta a punta', '4 webs'] },
      tools: ['WordPress', 'Tienda Nube', 'HTML/CSS/JS', 'Vercel'], prueba: ['Ver "Armá tu web"', '/armar.html'] },
    { id: 'ia', lab: ['IA aplicada a Mercado Libre', '/sistema.html#metodo'], n: 'IA aplicada', usos: {
      demasled: ['ChatGPT en el trabajo diario'],
      propias: ['Claude Code y Claude API para construir y analizar'] },
      tools: ['Claude Code', 'ChatGPT', 'Claude API'], prueba: ['Ver el Sistema', '/sistema.html'] },
  ]},
  { area: 'Trabajar con otros', skills: [
    { id: 'coord', n: 'Comunicación y coordinación', usos: {
      ministerio: ['Actividades y equipos'],
      taki: ['Atención al público en salón y barra'],
      adamas: ['Varios clientes a la vez'],
      veni: ['Canal online coordinado con el local: stock y sistemas'] },
      tools: [] },
  ]},
];
export const APRENDIENDO = ['Comercio internacional (UB, 2026–2029)', 'Google Analytics 4', 'VTEX', 'Producteca', 'Amazon Seller'];


// Normaliza lo que viene del admin; si falta algo, usa los valores por defecto
export function habilidades(guardado) {
  const g = guardado && Array.isArray(guardado.areas) && guardado.areas.length ? guardado : null;
  return { areas: g ? g.areas : AREAS, aprendiendo: g && Array.isArray(g.aprendiendo) ? g.aprendiendo : APRENDIENDO };
}
