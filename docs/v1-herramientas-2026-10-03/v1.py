"""Uso: v1.py <antes|despues> <dir_salida>
 - capturas de herramientas.html (3 anchos x 2 temas x estados) + mediciones
 - huella de estilos computados de las páginas NO migradas (para detectar cambios accidentales)"""
import sys, os, json, hashlib
from playwright.sync_api import sync_playwright
TAG, OUT = sys.argv[1], sys.argv[2]
B = 'http://localhost:4173/'
os.makedirs(f'{OUT}/v1/{TAG}', exist_ok=True)
MOCK = {'rapido': True, 'resultadoId': 'x1', 'resumen': {'etiqueta': 'Publicación de catálogo', 'titulo': 'Chequeo de ejemplo', 'veredicto': 'Faltan datos clave', 'puntos': [{'t': 'Fotos', 's': '4 fotos: lo ideal son 7', 'ok': False}, {'t': 'Atributos', 's': '12 cargados', 'ok': True}], 'noVerificado': [{'t': 'Visitas', 's': 'Solo con la cuenta'}]}}
NO_MIGRADAS = ['index', 'rentabilidad', 'importar', 'perdida', 'informe-muestra', 'sistema', 'lab', 'seo', 'anatomia', 'acos', 'web', 'armar', 'programacion', 'contacto', '404']
FP = '''() => {
  const out = [];
  const props = ['fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color','backgroundColor','borderRadius','borderTopWidth','paddingTop','paddingLeft','marginTop','marginBottom','display','boxShadow'];
  document.querySelectorAll('body *').forEach((e, i) => {
    if (e.closest('canvas, script, style')) return;
    const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    out.push([e.tagName, e.id || '', Math.round(r.width), Math.round(r.height), ...props.map(p => s[p])].join('|'));
  });
  return out;
}'''
MEAS = '''() => {
  const q = s => document.querySelector(s), cs = (e, p) => e ? getComputedStyle(e)[p] : null, vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const h1 = q('h1'), main = q('main');
  const texts = [...main.querySelectorAll('*')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2) && vis(e));
  const sizes = {}; texts.forEach(e => { const k = Math.round(parseFloat(cs(e, 'fontSize')) * 10) / 10; sizes[k] = (sizes[k] || 0) + 1; });
  const tap = [...main.querySelectorAll('a, button, input:not([type=range]):not([type=checkbox]), select, textarea, summary')].filter(vis).filter(e => e.getBoundingClientRect().height < 44).map(e => e.tagName + '.' + String(e.className).slice(0, 24) + ' ' + Math.round(e.getBoundingClientRect().height));
  const radii = {}; main.querySelectorAll('*').forEach(e => { if (!vis(e)) return; const r = cs(e, 'borderRadius'); if (r !== '0px') radii[r] = (radii[r] || 0) + 1; });
  const h1r = h1 ? h1.getBoundingClientRect() : null;
  return { h1: h1 ? [cs(h1, 'fontSize'), cs(h1, 'fontWeight'), cs(h1, 'fontFamily').split(',')[0]] : null, h1Top: h1r && Math.round(h1r.top + scrollY),
    nH1: document.querySelectorAll('h1').length, overflow: document.documentElement.scrollWidth - innerWidth, sizes: Object.keys(sizes).length, under12: texts.filter(e => parseFloat(cs(e, 'fontSize')) < 12).length,
    tapUnder44: tap.length, tapList: tap.slice(0, 8), radii: Object.keys(radii).sort(), nRadii: Object.keys(radii).length, docH: document.documentElement.scrollHeight };
}'''
res = {'herramientas': {}, 'huellas': {}}
with sync_playwright() as p:
    br = p.chromium.launch()
    for vw, vh, w in [(1280, 800, 'd'), (768, 1024, 't'), (390, 844, 'm')]:
        for tema in ['dark', 'light']:
            c = br.new_context(viewport={'width': vw, 'height': vh}, color_scheme=tema, reduced_motion='reduce', has_touch=vw < 800, is_mobile=vw < 500)
            c.route('**/api/*', lambda r: r.fulfill(status=404, json={'error': 'x'})); c.route('**/api/audit*', lambda r: r.fulfill(json=MOCK))
            pg = c.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            # estados de Herramientas
            for estado in ['tracker', 'chequeo', 'rentabilidad', 'competencia']:
                pg.goto(B + 'herramientas.html#' + estado); pg.wait_for_timeout(900)
                if estado == 'chequeo':
                    pg.fill('#hd-url', 'https://www.mercadolibre.com.ar/p/MLA1'); pg.click('#hd-chk button'); pg.wait_for_timeout(700)
                pg.screenshot(path=f'{OUT}/v1/{TAG}/herr-{estado}-{w}-{tema}-top.png')
                pg.evaluate("document.getElementById('hr-stage').scrollIntoView({block:'start'})"); pg.wait_for_timeout(300)
                pg.screenshot(path=f'{OUT}/v1/{TAG}/herr-{estado}-{w}-{tema}-stage.png', full_page=False)
                res['herramientas'][f'{estado}|{w}|{tema}'] = pg.evaluate(MEAS)
            res['herramientas'][f'errores|{w}|{tema}'] = errs[:3]
            c.close()
    # huellas de páginas no migradas (1280 y 390, claro y oscuro)
    for vw, vh, w in [(1280, 800, 'd'), (390, 844, 'm')]:
        for tema in ['dark', 'light']:
            c = br.new_context(viewport={'width': vw, 'height': vh}, color_scheme=tema, reduced_motion='reduce', is_mobile=vw < 500)
            c.route('**/api/*', lambda r: r.fulfill(status=404, json={}))
            pg = c.new_page()
            for n in NO_MIGRADAS:
                pg.goto(B + n + '.html'); pg.wait_for_timeout(1100)
                pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'))"); pg.wait_for_timeout(500)
                fp = pg.evaluate(FP)
                res['huellas'][f'{n}|{w}|{tema}'] = fp
            c.close()
    br.close()
json.dump(res, open(f'{OUT}/v1/{TAG}/medidas.json', 'w'), ensure_ascii=False)
print('ok', TAG, len(res['huellas']))
