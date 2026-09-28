// lib/tendencias.js — Buscador de tendencias de Mercado Libre (sistema.html)
//
// Fuente: GET /trends/MLA/{categoria} de la API oficial (con el token de la cuenta principal).
// Mercado Libre devuelve hasta 50 términos ordenados en tres bloques: las 10 búsquedas que más
// crecieron, las 20 más deseadas y las 20 más populares. NO da volumen de búsquedas: la web no lo inventa.
// Solo responde con categorías amplias (primer nivel de /sites/MLA/categories).
//
// Modo público: se ven completos los 3 primeros; del resto solo se manda la posición y el tipo,
// así el término no viaja al navegador y no se puede leer inspeccionando.
// Sin token o sin base: dataset de ejemplo marcado demo:true (nunca se presenta como real).

const API = 'https://api.mercadolibre.com';
export const VISIBLES = 3;
export const TODAS = 'todas';

// Posición → bloque según la documentación de Mercado Libre
export function tipoPorPosicion(i) {
  return i < 10 ? 'crece' : i < 30 ? 'buscada' : 'popular';
}

export const catValida = c => c === TODAS || /^MLA\d{1,9}$/.test(c);

async function getML(path, token) {
  const r = await fetch(API + path, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) { const e = new Error(`ml ${r.status}`); e.status = r.status; throw e; }
  return r.json();
}

// Categorías amplias del sitio (id + nombre), ordenadas por nombre
export async function categoriasML(token) {
  const lista = await getML('/sites/MLA/categories', token);
  return (Array.isArray(lista) ? lista : [])
    .filter(c => c?.id && c?.name)
    .map(c => ({ id: c.id, nombre: c.name }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// Términos en tendencia de una categoría (o del sitio entero)
export async function terminosML(token, cat) {
  const lista = await getML(cat === TODAS ? '/trends/MLA' : `/trends/MLA/${cat}`, token);
  return (Array.isArray(lista) ? lista : [])
    .filter(t => t?.keyword)
    .slice(0, 50)
    .map(t => ({ k: String(t.keyword).slice(0, 120), url: /^https:\/\/[a-z.]*mercadolibre\.com\.ar\//.test(t.url || '') ? t.url : null }));
}

// Arma la respuesta: el admin ve todo; el público, 3 completos y el resto sin el término
export function recortar(terminos, { completo }) {
  const filas = terminos.map((t, i) => ({ pos: i + 1, tipo: tipoPorPosicion(i), termino: t.k, url: t.url }));
  const corte = completo ? filas.length : VISIBLES;
  return {
    total: filas.length,
    completo: corte >= filas.length,
    visibles: filas.slice(0, corte),
    ocultos: filas.slice(corte).map(({ pos, tipo }) => ({ pos, tipo })),
  };
}

// ── Dataset de ejemplo (demo:true) ─────────────────────────────
// Términos plausibles para mostrar cómo funciona la herramienta. NO son datos de Mercado Libre.
const DEMO = {
  [TODAS]: ['freidora de aire', 'zapatillas running hombre', 'zapatillas urbanas mujer', 'aire acondicionado split', 'smartwatch', 'termo stanley', 'auriculares bluetooth', 'colchon 2 plazas', 'bicicleta rodado 29', 'perfume importado mujer', 'notebook i5', 'silla gamer', 'pileta estructural', 'ventilador de pie', 'celular samsung', 'mochila urbana', 'lampara led', 'cafetera express', 'parlante bluetooth', 'reposera playera'],
  MLA1574: ['sillon 3 cuerpos', 'organizador de placard', 'lampara colgante nordica', 'set de sabanas 2 plazas', 'rack tv flotante', 'cortina blackout', 'escritorio en l', 'banqueta alta', 'alfombra living', 'espejo de pie', 'mesa ratona', 'estanteria metalica', 'perchero de pie', 'reposera jardin', 'maceta grande'],
  MLA1051: ['funda iphone 15', 'cargador rapido 25w', 'samsung a55', 'motorola g54', 'vidrio templado', 'auriculares inalambricos', 'soporte celular auto', 'cable usb c', 'power bank 20000', 'aro de luz', 'iphone 13 usado', 'xiaomi redmi note 13', 'smartwatch deportivo', 'tripode celular', 'lapiz optico'],
  MLA1276: ['bicicleta fija', 'mancuernas ajustables', 'banda elastica', 'colchoneta yoga', 'pelota futbol n5', 'guantes gimnasio', 'rueda abdominal', 'creatina', 'soga de saltar', 'paleta padel', 'botella termica', 'medias running', 'barra dominadas', 'bolso deportivo', 'casco bici'],
  MLA1246: ['protector solar', 'serum vitamina c', 'plancha de pelo', 'secador de pelo', 'perfume arabe', 'crema hidratante', 'maquinita afeitar', 'kit maquillaje', 'shampoo sin sal', 'esmalte semipermanente', 'cepillo alisador', 'tinta de pelo', 'depiladora', 'contorno de ojos', 'rizador'],
  MLA407134: ['taladro percutor', 'amoladora angular', 'atornillador inalambrico', 'hidrolavadora', 'set de llaves', 'soldadora inverter', 'caja de herramientas', 'nivel laser', 'sierra circular', 'compresor de aire', 'escalera aluminio', 'pistola de calor', 'lijadora orbital', 'multimetro', 'motosierra'],
  MLA1384: ['cochecito bebe', 'butaca auto bebe', 'cuna colecho', 'pañales', 'mochila portabebe', 'sacaleche electrico', 'monitor bebe', 'bañera bebe', 'mamaderas', 'silla de comer', 'body bebe', 'practicuna', 'humidificador', 'andador', 'chupete'],
};
const DEMO_CATS = [
  { id: 'MLA1384', nombre: 'Bebés' },
  { id: 'MLA1246', nombre: 'Belleza y Cuidado Personal' },
  { id: 'MLA1051', nombre: 'Celulares y Teléfonos' },
  { id: 'MLA1276', nombre: 'Deportes y Fitness' },
  { id: 'MLA407134', nombre: 'Herramientas' },
  { id: 'MLA1574', nombre: 'Hogar, Muebles y Jardín' },
];

export function respuestaDemo(cat, { completo, motivo }) {
  const id = DEMO[cat] ? cat : TODAS;
  return {
    demo: true,
    motivo: motivo || null,
    categoria: id === TODAS ? { id: TODAS, nombre: 'Todo Mercado Libre' } : DEMO_CATS.find(c => c.id === id),
    categorias: DEMO_CATS,
    actualizado: null,
    ...recortar(DEMO[id].map(k => ({ k, url: null })), { completo }),
  };
}
