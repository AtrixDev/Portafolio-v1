// tools/limpiar-prueba.mjs — limpieza de las pruebas de navegador que guardan en la base REAL (backend/.env).
// Borra SOLO lo que la corrida creó: los resultados por id, las claves de límite de la IP local y lo que la corrida sumó a las métricas
// (comparando con una foto tomada antes). Nunca hace un borrado global.
//
//   node tools/limpiar-prueba.mjs foto <archivo.json>                 guarda la foto de métricas antes de la corrida
//   node tools/limpiar-prueba.mjs limpiar <archivo.json> <id> [<id>…]  borra esos resultados y restaura las métricas
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const { MongoClient } = createRequire(join(RAIZ, 'backend/package.json'))('mongodb');
const uri = readFileSync(join(RAIZ, 'backend/.env'), 'utf8').match(/^MONGODB_URI=(.*)$/m)[1].replace(/^["']|["']$/g, '');
const HERRAMIENTAS = ['rentabilidad', 'chequeo'];
const [modo, archivo, ...ids] = process.argv.slice(2);
if (!['foto', 'limpiar'].includes(modo) || !archivo) { console.error('uso: foto <archivo> | limpiar <archivo> <ids…>'); process.exit(2); }

const cliente = await new MongoClient(uri).connect(), db = cliente.db('portafolio');
try {
  if (modo === 'foto') {
    writeFileSync(archivo, JSON.stringify(await db.collection('metricas').find({ herramienta: { $in: HERRAMIENTAS } }).toArray()));
    console.log('foto de métricas guardada');
  } else {
    if (ids.some(id => !/^[\w-]{6,64}$/.test(id))) throw new Error('id con forma inesperada: no borro nada');
    const foto = Object.fromEntries(JSON.parse(readFileSync(archivo, 'utf8')).map(d => [d._id, d]));
    const borrados = {
      resultados: ids.length ? (await db.collection('resultados').deleteMany({ _id: { $in: ids } })).deletedCount : 0,
      ratelimits: (await db.collection('ratelimits').deleteMany({ _id: /^(calc|res|lead|evento):(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/ })).deletedCount,
    };
    let metricas = 0;
    for (const d of await db.collection('metricas').find({ herramienta: { $in: HERRAMIENTAS } }).toArray()) {
      const antes = foto[d._id];
      if (!antes) { await db.collection('metricas').deleteOne({ _id: d._id }); metricas++; continue; }
      const inc = Object.fromEntries(['resultado', 'compartir', 'lead'].map(k => [k, (antes[k] || 0) - (d[k] || 0)]).filter(([, v]) => v));
      if (Object.keys(inc).length) { await db.collection('metricas').updateOne({ _id: d._id }, { $inc: inc }); metricas++; }
    }
    console.log('limpieza (solo lo creado en esta corrida):', JSON.stringify({ ...borrados, metricasRestauradas: metricas }));
  }
} finally { await cliente.close(); }
