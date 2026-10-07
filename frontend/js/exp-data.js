// js/exp-data.js — Datos de los puestos y escala de tiempo (compartidos por Trayectoria, Habilidades y Portada)
export const HOY = new Date();
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const vend = n => n >= 1000 ? `+${(n / 1000).toLocaleString('es-AR')} mil vendidos` : `+${n} vendidos`;

// Escala: 2018–2022 comprimido en el primer 10%, 2023–2026 en el resto
export const T0 = +new Date('2023-01-01'), T1 = +new Date('2027-01-01');
export function pos(fecha) {
  const t = +new Date(fecha);
  if (t < T0) return (t - +new Date('2018-01-01')) / (T0 - +new Date('2018-01-01')) * 14;
  return 16 + (Math.min(t, T1) - T0) / (T1 - T0) * 84;
}
export const meses = (a, b) => Math.max(1, Math.round((+new Date(b) - +new Date(a)) / 2.63e9));
// Meses de práctica sin contar dos veces los períodos que se superponen (ej.: herramientas propias en paralelo a un empleo)
export function mesesUnion(puestos) {
  const iv = puestos.filter(Boolean).map(p => [+new Date(p.desde), +new Date(p.hasta)]).sort((a, b) => a[0] - b[0]);
  let total = 0, ini = null, fin = null;
  for (const [a, b] of iv) {
    if (ini === null || a > fin) { if (ini !== null) total += fin - ini; ini = a; fin = b; }
    else fin = Math.max(fin, b);
  }
  if (ini !== null) total += fin - ini;
  return total ? Math.max(1, Math.round(total / 2.63e9)) : 0;
}
export const dur = m => m >= 12 ? `${Math.round(m / 12 * 10) / 10} ${m >= 18 ? 'años' : 'año'}`.replace('.', ',') : `${m} meses`;

export const PUESTOS = [
  {
    id: 'ministerio', carril: 0, desde: '2018-03-01', hasta: '2021-12-01', slot: [0, 6.8],
    desafio: 'Acompañar grupos de alumnos en el horario extendido de la escuela, con actividades que tenían que ser educativas y recreativas a la vez.', solucion: 'Un rol como el de un preceptor, pero recreativo: organizar las actividades, acompañar a los chicos y coordinar con los docentes.',
    co: 'Ministerio de Educación', corto: 'Ministerio', rol: 'Asistente de Jornada Extendida · Gobierno de la Ciudad', tipo: 'Educación pública',
    alcance: [['3,8', 'años en el programa']],
    hizo: ['Rol de <b>preceptor recreativo</b> dentro del programa Jornada Extendida.', '<b>Organización de actividades</b> y acompañamiento de alumnos.', '<b>Coordinación</b> con docentes y el equipo de la escuela.'],
    aporte: 'Ahí aprendí a comunicar, a tener paciencia y a coordinar equipos.',
    conecta: ['Explicar lo complejo de forma simple: lo hago en cada informe de auditoría y en las Guías.', 'Ver las Guías', '/lab.html'],
    fuente: ['Qué es el programa Jornada Extendida', 'https://buenosaires.gob.ar/gcaba_historico/escuela-abierta-la-comunidad/jornada-extendida-aprende'],
  },
  {
    id: 'taki', carril: 0, desde: '2022-03-01', hasta: '2022-11-30', slot: [7.2, 14],
    desafio: 'Muchas mesas al mismo tiempo y clientes esperando una respuesta rápida.', solucion: 'Orden, velocidad y buen trato: tomar pedidos, servir, preparar tragos y cerrar cuentas.',
    co: 'Esquina Taki', corto: 'Esquina Taki', rol: 'Mesero y barman', tipo: 'Gastronomía',
    alcance: [['9', 'meses']],
    hizo: ['<b>Atención de mesas</b>: pedidos, servicio y cobro.', '<b>Barra</b>: preparación de tragos y bebidas.'],
    aporte: 'Trato directo con clientes, todos los días.',
    conecta: ['La atención al cliente es la base de la postventa y la reputación en Mercado Libre.', 'Ver la guía de reputación', '/reputacion.html'],
  },
  {
    id: 'adamas', carril: 0, desde: '2023-01-01', hasta: '2024-12-31',
    desafio: 'Más de diez cuentas de rubros distintos, al mismo tiempo.', solucion: 'Catálogos orientados a conversión, Product Ads medido por rentabilidad y tiendas propias.',
    co: 'Adamas Agencia', corto: 'Adamas', rol: 'Consultor de Mercado Libre · E-Commerce Manager', tipo: 'Agencia',
    alcance: [['+10', 'cuentas en simultáneo'], ['Multi', 'rubro']],
    hizo: ['<b>Catálogos orientados a conversión</b> en rubros distintos, a la vez.', '<b>Campañas de Product Ads</b> con análisis de rentabilidad.', 'Tiendas en <b>WordPress y Tienda Nube</b>.'],
    tools: ['Mercado Libre', 'Nubimetrics', 'Real Trends', 'Excel', 'Tienda Nube', 'WordPress', 'Google Analytics'],
    aporte: 'Mi escuela: más de diez cuentas en simultáneo y de rubros distintos.',
  },
  {
    id: 'demasled', carril: 0, desde: '2025-01-01', hasta: '2025-06-01',
    desafio: 'Un catálogo grande de productos importados que había que publicar bien y defender en precio.', solucion: '+200 publicaciones con SEO validado y un monitor automático de los precios de la competencia.',
    co: 'DemasLed', corto: 'DemasLed', rol: 'Analista de E-Commerce', tipo: 'Marca importadora',
    alcance: [['+200', 'publicaciones creadas'], ['SEO', 'validado con datos']],
    hizo: ['Análisis técnico y redacción de <b>títulos, descripciones y atributos</b>.', 'Campañas masivas y promociones.', 'Extracción automática de datos de mercado y <b>alertas de precios</b>.'],
    flujo: [['Competencia', 'Precios de los rivales, extraídos automáticamente'], ['Google Sheets', 'Apps Script los compara con los nuestros'], ['Alerta', 'Aviso cuando alguien baja o sube el precio']],
    tools: ['Nubimetrics', 'Real Trends', 'AnswerThePublic', 'Apps Script', 'ChatGPT'],
    aporte: 'Mi primera herramienta propia: el monitor de precios en Apps Script.',
  },
  {
    id: 'veni', carril: 0, desde: '2025-06-01', hasta: '2025-12-01', estrella: true,
    desafio: 'Un negocio de local a la calle arrancando en Mercado Libre: fotos básicas, fichas incompletas, publicidad sin control (ACOS 30%) y stock desfasado.', solucion: 'Rehice fichas e imágenes, ordené Product Ads por rentabilidad y creé +200 publicaciones: ventas +38,9% y ACOS 12%.',
    co: 'Vení a la Cocina', corto: 'Vení a la Cocina', rol: 'E-Commerce Manager · Tiendas Oficiales', tipo: 'Tiendas oficiales · marcas premium',
    alcance: [['4', 'tiendas oficiales'], ['+200', 'publicaciones nuevas'], ['6', 'meses']],
    marcas: ['Borner', 'Lurch', 'Vacu Vin', 'Microplane'], otras: ['Bodum', 'Volturno', 'Buena Cepa', 'Benriner', 'Holar'],
    resultado: [
      { k: 'ACOS', antes: 30, ahora: 12, txt: '30% → 12%', max: 30 },
      { k: 'Ventas', crece: 38.9, txt: '+38,9%' },
      { k: 'Unidades', crece: 32.4, txt: '+32,4%' },
    ],
    hizo: ['Rehice <b>imágenes, infografías y títulos</b> con datos de búsqueda.', 'Reordené <b>Product Ads por rentabilidad</b>, a cargo del ACOS global.', 'Detecté productos con potencial y creé <b>+200 publicaciones</b>.', '<b>Ofertas del día</b> y promociones mensuales.', 'Diseñé la <b>Mi Página</b> de Borner en Mercado Libre y en Tienda Nube.', '<b>Mensajes de postventa</b> automatizados para conseguir reseñas con foto.', 'Operación de despachos <b>Flex y Turbo</b> y coordinación con la consultora de Mercado Libre.'],
    pubs: true,
    pruebas: [
      ['/assets/resultados/metricas-negocio-jun-nov-2025.webp', 'Métricas de negocio, junio a noviembre de 2025: ventas +38,9%, unidades +32,4%'],
      ['/assets/resultados/product-ads-nov-2025.webp', 'Product Ads, noviembre de 2025: ACOS 12,04%'],
      ['/assets/resultados/product-ads-campanias-2025.webp', 'Product Ads por campaña, julio de 2025: ACOS 13,4% (−28%)'],
    ],
    tools: ['Product Ads', 'UpSeller', 'Tienda Nube', 'Tango', 'Excel', 'ChatGPT', 'Canva'],
    cta: [['Ver el caso Borner', '#caso-exito']],
  },
  {
    id: 'propias', carril: 2, desde: '2025-01-01', hasta: HOY, ahora: true,
    desafio: 'Los vendedores pierden ventas sin enterarse: una publicación pierde el catálogo, el stock se agota, la publicidad se come el margen.', solucion: 'Herramientas que lo detectan solas, explican por qué pasa y dicen qué hacer. Varias las podés probar gratis.',
    co: 'Herramientas propias', corto: 'Herramientas propias', rol: 'En paralelo desde DemasLed · consultor freelance desde dic 2025', tipo: 'Proyectos propios',
    alcance: [['1', 'sistema en producción'], ['4', 'webs de punta a punta']],
    hizo: ['<b>ML Tracker</b>: conectado a la API oficial; sigue visitas, ventas y conversión y explica qué se cae y por qué.', '<b>Auditoría automática</b> de cuentas, con informe en PDF.', '<b>4 webs</b> de punta a punta: Odontología Almagro, Tenshi TCG, Lovyme y este portfolio.'],
    tools: ['Node.js', 'MongoDB', 'API de Mercado Libre', 'Vercel', 'Claude Code', 'Python'],
    cta: [['Ver todas las herramientas', 'herramientas.html'], ['Auditar una cuenta', 'sistema.html#auditar']],
    sistemas: [
      ['¿Por qué cayeron tus ventas?', 'ML Tracker', 'Te dice qué publicación se cae, por qué y qué hacer.', 'herramientas.html#tracker'],
      ['¿Dónde se te escapa la plata?', 'Auditoría de cuenta', 'Conectás tu cuenta y en minutos ves la salud por área.', 'herramientas.html#auditoria'],
      ['¿Cuánto gastás de más en publicidad?', 'Calculadora de ACOS', 'Pesos por mes que se van por encima del ACOS objetivo.', 'herramientas.html#perdida'],
      ['¿Tu publicación está bien armada?', 'Chequeo y simulador', 'Pegás el link y ves qué le falta para vender.', 'herramientas.html#chequeo'],
      ['¿Qué odian los compradores de tu rubro?', 'Minero de opiniones', 'Resume críticas y elogios de cualquier publicación.', 'herramientas.html#opiniones'],
      ['¿Cuánto te cuesta importarlo?', 'Calculadora de importación', 'El costo real por unidad puesto en tu depósito.', 'herramientas.html#importacion'],
    ],
    aporte: 'Lo que aprendí en cada puesto, convertido en herramientas que cualquiera puede probar.',
  },
  {
    id: 'comex', carril: 1, desde: '2026-03-01', hasta: '2029-12-01', proximo: true,
    desafio: 'Importar sin saber el costo real puesto en Argentina es la forma más rápida de perder plata.', solucion: 'Me formo para costear, importar y vender en Mercado Libre con margen.',
    co: 'Comercio internacional', corto: 'Comercio internacional · 2026–2029', rol: 'Técnico en Comercio Internacional · Universidad de Belgrano', tipo: 'Formación en curso',
    alcance: [],
    hizo: ['Importación, costos y logística aplicados al e-commerce.', 'Detectar demanda validada, costear el producto puesto en Argentina y venderlo con margen.'],
    aporte: 'Lo que viene: sumar el lado de la importación a lo que ya sé vender.',
  },
];

