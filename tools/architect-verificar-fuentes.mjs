#!/usr/bin/env node
// Verifica que cada fuente de data/architect/sources.json responda. Uso: node tools/architect-verificar-fuentes.mjs [--escribir]
// Con --escribir actualiza `checked` (hoy) y `verification` ('ok' | 'blocked' | 'unverified') en el JSON. Sin red, no hace nada.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const FILE = join(dirname(fileURLToPath(import.meta.url)), '../frontend/data/architect/sources.json');
const sources = JSON.parse(readFileSync(FILE, 'utf8'));
const hoy = new Date().toISOString().slice(0, 10), escribir = process.argv.includes('--escribir');
let mal = 0;
for (const s of sources) {
  let estado = 'unverified', cod = '—';
  try {
    const r = await fetch(s.url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'Mozilla/5.0 (verificador de fuentes)' } });
    cod = r.status; estado = r.ok ? 'ok' : (r.status === 401 || r.status === 403 ? 'blocked' : 'unverified');
  } catch { estado = 'unverified'; }
  if (estado !== 'ok') mal++;
  console.log(`${estado.padEnd(10)} ${String(cod).padEnd(4)} ${s.id}`);
  if (escribir) { s.verification = estado; if (estado === 'ok') s.checked = hoy; else delete s.checked; }
}
if (escribir) writeFileSync(FILE, JSON.stringify(sources, null, 1) + '\n');
console.log(`\n${sources.length - mal} de ${sources.length} verificadas${escribir ? ' (archivo actualizado)' : ''}.`);
process.exit(mal ? 1 : 0);
