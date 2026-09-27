#!/usr/bin/env python3
"""
extraer-ml.py — Lee publicaciones de Mercado Libre con un Chrome real y guarda los datos
en el portfolio (colección pf_fuente), para que "Extraer datos" del admin los encuentre.

Hace falta porque ML bloquea las páginas cuando las pide un servidor: los vendidos y la
galería de las publicaciones /up/ sólo se pueden leer desde un navegador con sesión.

Uso:
  python3 tools/extraer-ml.py LINK [LINK ...]
  python3 tools/extraer-ml.py --archivo links.txt          (un link por línea)
  python3 tools/extraer-ml.py --tienda veni-a-la-cocina     (toda una tienda oficial)
  opciones: --api https://portafolio-v1-dun-ten.vercel.app  (por defecto)  ·  --api http://localhost:3000
            --solo-json salida.json                        (no manda nada, sólo guarda el archivo)

La primera vez se abre Chrome: iniciá sesión en Mercado Libre y el script sigue solo.
Si aparece un captcha, resolvelo en esa ventana: el script espera.
Requiere: pip install playwright  (usa el Chrome instalado, no descarga otro navegador)
"""
import argparse, json, os, random, re, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PERFIL = ROOT / 'tools' / '.ml-perfil'          # sesión de ML guardada (no se publica)
API_DEFAULT = 'https://portafolio-v1-dun-ten.vercel.app'

JS = r"""()=>{
 const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
 const txt=e=>e?e.innerText.trim():null;
 const gal=[...new Set(qa('figure.ui-pdp-gallery__figure img, .ui-pdp-gallery__figure img').map(i=>i.getAttribute('data-zoom')||i.src).filter(s=>s&&s.includes('http2')))];
 const body=document.body.innerText;
 const rv=body.match(/Calificación ([\d.]+) de 5\. (\d+) opiniones/);
 const html=document.documentElement.innerHTML;
 return {url:location.href, titulo:txt(q('h1.ui-pdp-title')), sub:txt(q('.ui-pdp-subtitle')), galeria:gal,
  marca:(body.match(/Ver más productos marca ([^\n]+)/)||[])[1]||'',
  tienda:(html.match(/official_store_id["':=\s]+(\d+)/)||[])[1]||null,
  item:(html.match(/"item_id":"(MLA\d+)"/)||[])[1]||null,
  rating:rv?+rv[1]:null, opiniones:rv?+rv[2]:null}
}"""


def vendidos(sub):
    m = re.search(r'\+?\s*([\d.]+)\s*(mil)?\s*vendid', sub or '', re.I)
    return int(m.group(1).replace('.', '')) * (1000 if m.group(2) else 1) if m else None


def env_admin():
    env = {}
    f = ROOT / 'backend' / '.env'
    if f.exists():
        for line in f.read_text().splitlines():
            m = re.match(r'^([A-Z_]+)=(.*)$', line)
            if m: env[m.group(1)] = m.group(2).strip('"\'')
    return os.environ.get('ADMIN_USER', env.get('ADMIN_USER')), os.environ.get('ADMIN_PASS', env.get('ADMIN_PASS'))


def post(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method='POST',
                                 headers={'Content-Type': 'application/json', **({'Authorization': 'Bearer ' + token} if token else {})})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def bloqueado(pg):
    return ('captcha' in pg.url or 'account-verification' in pg.url) and not pg.query_selector('h1.ui-pdp-title')


def links_de_tienda(pg, tienda):
    links, desde = [], 1
    while True:
        url = f'https://listado.mercadolibre.com.ar/tienda/{tienda}/' + ('' if desde == 1 else f'_Desde_{desde}_NoIndex_True')
        pg.goto(url, wait_until='domcontentloaded', timeout=45000); pg.wait_for_timeout(1500)
        nuevos = pg.eval_on_selector_all('a.poly-component__title', 'as=>as.map(a=>a.href)')
        nuevos = [u for u in nuevos if u not in links]
        if not nuevos: break
        links += nuevos; desde += len(nuevos)
        print(f'  listado: {len(links)} publicaciones', flush=True)
        time.sleep(random.uniform(2, 4))
    return links


def main():
    ap = argparse.ArgumentParser(description='Extrae publicaciones de ML con Chrome y las guarda en el portfolio')
    ap.add_argument('links', nargs='*')
    ap.add_argument('--archivo')
    ap.add_argument('--tienda', help='slug de la tienda oficial, ej: veni-a-la-cocina')
    ap.add_argument('--api', default=API_DEFAULT)
    ap.add_argument('--solo-json')
    a = ap.parse_args()

    links = list(a.links)
    if a.archivo: links += [l.strip() for l in Path(a.archivo).read_text().splitlines() if l.strip().startswith('http')]
    if not links and not a.tienda: ap.error('pasá al menos un link, --archivo o --tienda')

    from playwright.sync_api import sync_playwright
    registros = []
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(str(PERFIL), channel='chrome', headless=False,
                                                   args=['--disable-blink-features=AutomationControlled'])
        pg = ctx.pages[0] if ctx.pages else ctx.new_page()
        pg.goto('https://www.mercadolibre.com.ar/')
        if not any(c['name'] in ('ssid', 'orguseridp') for c in ctx.cookies()):
            print('Iniciá sesión en Mercado Libre en la ventana de Chrome…', flush=True)
            while not any(c['name'] in ('ssid', 'orguseridp') for c in ctx.cookies()): time.sleep(2)
        if a.tienda: links += links_de_tienda(pg, a.tienda)

        for n, link in enumerate(links, 1):
            try:
                pg.goto(link, wait_until='domcontentloaded', timeout=45000)
                if bloqueado(pg):
                    pg.bring_to_front(); print('  Captcha: resolvelo en la ventana de Chrome…', flush=True)
                    while bloqueado(pg): time.sleep(2)
                    pg.goto(link, wait_until='domcontentloaded', timeout=45000)
                pg.wait_for_timeout(1500)
                d = pg.evaluate(JS)
            except Exception as e:
                print(f'{n}/{len(links)} ERROR {link[:70]}: {e}', flush=True); continue
            if not d.get('titulo'):
                print(f'{n}/{len(links)} sin datos: {link[:70]}', flush=True); continue
            ids = re.search(r'/p/(MLA\d+)', d['url']), re.search(r'/up/(MLAU\d+)', d['url'])
            item = d.get('item') or (re.search(r'(?:wid|item_id)[=:](MLA\d+)', link + d['url']) or [None, None])[1]
            reg = {'item': item, 'catalogo': ids[0] and ids[0].group(1), 'up': ids[1] and ids[1].group(1),
                   'url': d['url'].split('?')[0].split('#')[0], 'titulo': d['titulo'], 'marca': d['marca'],
                   'vendidos': vendidos(d['sub']), 'opiniones': d['opiniones'], 'rating': d['rating'],
                   'galeria': [re.sub(r'D_NQ_NP_2X_', 'D_NQ_NP_', u) for u in d['galeria']], 'tienda': d['tienda']}
            registros.append(reg)
            print(f"{n}/{len(links)} {reg['titulo'][:55]} · {d['sub'] or ''} · {len(reg['galeria'])} fotos", flush=True)
            time.sleep(random.uniform(4, 8))
        ctx.close()

    sin_item = [r for r in registros if not r['item']]
    if sin_item: print(f'Aviso: {len(sin_item)} sin ID de publicación (no se pueden guardar en el portfolio).')
    if a.solo_json:
        Path(a.solo_json).write_text(json.dumps(registros, ensure_ascii=False, indent=1)); print('Guardado en', a.solo_json); return

    user, pw = env_admin()
    if not user or not pw: sys.exit('Faltan ADMIN_USER / ADMIN_PASS (backend/.env)')
    token = post(a.api + '/api/login', {'user': user, 'pass': pw})['token']
    guardadas = 0
    for k in range(0, len(registros), 200):
        guardadas += post(a.api + '/api/portfolio?fuente=1', {'registros': registros[k:k + 200]}, token).get('guardadas', 0)
    print(f'Listo: {guardadas} publicaciones guardadas. En el admin, "Extraer datos" ya las encuentra.')


if __name__ == '__main__':
    main()
