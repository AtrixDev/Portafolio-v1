import sys, os, json
from playwright.sync_api import sync_playwright
B = 'http://localhost:4173/'; OUT = sys.argv[1]; os.makedirs(OUT + '/v1/final', exist_ok=True)
R = []
def chk(n, ok, d=''):
    R.append((n, bool(ok), d)); print(('PASS ' if ok else 'FAIL ') + n + (f'  [{d}]' if d and not ok else ''))
MOCK = {'rapido': True, 'resultadoId': 'x1', 'resumen': {'etiqueta': 'Publicación de catálogo', 'titulo': 'Chequeo de ejemplo', 'puntos': [{'t': 'Fotos', 's': '4 fotos', 'ok': False}]}}
def mock(r):
    u = r.request.url
    if '/api/audit' in u and r.request.method == 'POST' and 'action=' not in u: return r.fulfill(json=MOCK)
    if 'action=resultado&id=mockrent' in u: return r.fulfill(json={'herramienta': 'rentabilidad', 'id': 'mockrent'})
    if 'action=resultado&id=mockchq' in u: return r.fulfill(json={'herramienta': 'chequeo', 'id': 'mockchq', 'resumen': {'etiqueta': 'Publicación', 'titulo': 'Guardado simulado', 'puntos': []}})
    if '/api/tracker?action=demo' in u: return r.continue_()    # demo real del dev-server (datos simulados, sin base)
    if '/api/' in u: return r.fulfill(status=404, json={'error': 'x'})
    return r.continue_()
with sync_playwright() as p:
    br = p.chromium.launch()
    for vw, vh, w in [(1280, 800, 'd'), (768, 1024, 't'), (390, 844, 'm')]:
        for tema in ['dark', 'light']:
            c = br.new_context(viewport={'width': vw, 'height': vh}, color_scheme=tema, reduced_motion='reduce', has_touch=vw < 800, is_mobile=vw < 500); c.route('**/*', mock)
            pg = c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(B + 'herramientas.html#tracker'); pg.wait_for_timeout(1400)
            tag = f'{w}-{tema}'
            chk(f'[{tag}] sin errores de JS', not errs, errs[:2])
            chk(f'[{tag}] exactamente un h1 «Herramientas»', pg.locator('h1').count() == 1 and pg.inner_text('h1').strip() == 'Herramientas')
            fs = float(pg.evaluate("parseFloat(getComputedStyle(document.querySelector('h1')).fontSize)"))
            chk(f'[{tag}] h1 entre 40 y 72 px ({fs:.0f}px), peso 700', 40 <= fs <= 72 and pg.evaluate("getComputedStyle(document.querySelector('h1')).fontWeight") == '700')
            chk(f'[{tag}] sin overflow horizontal', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
            top = pg.evaluate("Math.round(document.querySelector('.hr-head').getBoundingClientRect().top)"); nav = pg.evaluate("Math.round(document.getElementById('site-nav').getBoundingClientRect().height)")
            chk(f'[{tag}] el hero arranca debajo del header ({top}px vs nav {nav}px)', top >= nav + 16)
            chk(f'[{tag}] ficha de Rentabilidad con ícono dibujado', pg.evaluate("document.querySelector('.hr-item[data-id=rentabilidad] .hr-iico svg').children.length") > 0)
            h = pg.eval_on_selector_all('.hr-item', 'e=>e.map(x=>x.getBoundingClientRect().height)')
            chk(f'[{tag}] ítems del muelle ≥ 44px (mín {min(h):.0f})', min(h) >= 44)
            b = pg.eval_on_selector_all('.hr-sf .btn-primary, .hr-sf .btn-secondary, #hd-chk button', 'e=>e.map(x=>x.getBoundingClientRect().height)')
            chk(f'[{tag}] botones de la ficha ≥ 44px (mín {min(b) if b else 0:.0f})', b and min(b) >= 44)
            chk(f'[{tag}] encabezados: grupos y ficha en H2, sin H3', pg.locator('.hr-grp h2').count() >= 3 and pg.locator('.hr-sh h2').count() == 1 and pg.locator('main h3').count() == 0)
            chk(f'[{tag}] demo del Tracker real cargó', pg.locator('.hd-kpis').count() == 1, pg.inner_text('#hr-demo')[:60])
            pg.screenshot(path=f'{OUT}/v1/final/tracker-{tag}-top.png')
            pg.evaluate("document.getElementById('hr-stage').scrollIntoView({block:'start'})"); pg.wait_for_timeout(300)
            pg.screenshot(path=f'{OUT}/v1/final/tracker-{tag}-stage.png')
            # Chequeo
            pg.goto(B + 'herramientas.html#chequeo'); pg.wait_for_timeout(700)
            chk(f'[{tag}] #chequeo abre el Chequeo', pg.locator('#hd-chk').count() == 1)
            ih = pg.evaluate("document.getElementById('hd-url').getBoundingClientRect().height"); fz = pg.evaluate("parseFloat(getComputedStyle(document.getElementById('hd-url')).fontSize)")
            chk(f'[{tag}] input del Chequeo ≥ 44px y 16px de texto ({ih:.0f}/{fz:.0f})', ih >= 44 and fz >= 16)
            pg.fill('#hd-url', 'https://www.mercadolibre.com.ar/p/MLA1'); pg.click('#hd-chk button'); pg.wait_for_timeout(700)
            chk(f'[{tag}] Chequeo renderiza su resultado', 'Chequeo de ejemplo' in pg.inner_text('#hd-chk-out'))
            mh = pg.evaluate("document.querySelector('.hd-salida input[type=email]').getBoundingClientRect().height")
            chk(f'[{tag}] campo de email del bloque compartir ≥ 44px ({mh:.0f})', mh >= 44)
            pg.screenshot(path=f'{OUT}/v1/final/chequeo-{tag}-top.png'); pg.evaluate("document.getElementById('hr-stage').scrollIntoView({block:'start'})"); pg.wait_for_timeout(250)
            pg.screenshot(path=f'{OUT}/v1/final/chequeo-{tag}-stage.png')
            pg.evaluate("document.querySelector('.hd-salida').scrollIntoView({block:'center'})"); pg.wait_for_timeout(250); pg.screenshot(path=f'{OUT}/v1/final/chequeo-{tag}-share.png')
            if w == 'd':
                # teclado y estados
                pg.goto(B + 'herramientas.html#tracker'); pg.wait_for_timeout(900)
                pg.locator('.hr-item[data-id=auditoria]').focus(); pg.keyboard.press('Shift+Tab'); pg.keyboard.press('Tab')
                ol = pg.evaluate("getComputedStyle(document.activeElement).outlineStyle"); rad = pg.evaluate("getComputedStyle(document.activeElement).borderRadius")
                chk(f'[{tag}] foco visible en ítem del muelle (outline {ol}, radio {rad})', ol != 'none' and rad == '12px')
                pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
                chk(f'[{tag}] Enter abre la ficha (Auditoría)', 'Auditoría de cuenta' in pg.inner_text('.hr-sh h2'))
                bg0 = pg.evaluate("getComputedStyle(document.querySelector('.hr-item[data-id=simulador]')).backgroundColor"); pg.hover('.hr-item[data-id=simulador]'); pg.wait_for_timeout(300)
                bg1 = pg.evaluate("getComputedStyle(document.querySelector('.hr-item[data-id=simulador]')).backgroundColor")
                chk(f'[{tag}] hover cambia el fondo del ítem', bg0 != bg1, (bg0, bg1))
                pg.locator('.hr-sf .btn-primary').focus(); pg.keyboard.press('Tab'); pg.keyboard.press('Shift+Tab')
                chk(f'[{tag}] foco en botón conserva forma de píldora', pg.evaluate("getComputedStyle(document.activeElement).borderRadius") == '999px')
                # tema por botón
                antes = pg.evaluate("getComputedStyle(document.body).color"); pg.click('#theme-toggle'); pg.wait_for_timeout(300)
                chk(f'[{tag}] el botón de tema cambia el tema', antes != pg.evaluate("getComputedStyle(document.body).color"))
            c.close()
    # navegación y contratos
    c = br.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce'); c.route('**/*', mock); pg = c.new_page()
    pg.goto(B + 'herramientas.html?r=mockrent'); pg.wait_for_url('**/rentabilidad.html?r=mockrent', timeout=4000); chk('?r= de Rentabilidad redirige a rentabilidad.html?r=', True)
    pg.goto(B + 'herramientas.html?r=mockchq'); pg.wait_for_timeout(900); chk('?r= de Chequeo se dibuja en Herramientas', 'Guardado simulado' in pg.inner_text('#hd-chk-out'))
    pg.goto(B + 'herramientas.html#tracker'); pg.wait_for_timeout(700); pg.hover('.nav-group[data-grupo=ml]'); pg.click('#nav-sub-ml a:has-text("Chequeo de publicación")'); pg.wait_for_timeout(500)
    chk('menú global → «Chequeo de publicación» abre la ficha estando en Herramientas', pg.locator('#hd-chk').count() == 1)
    pg.goto(B + 'rentabilidad.html'); pg.wait_for_timeout(500); pg.click('button:has-text("Cargar un ejemplo")'); pg.wait_for_timeout(700)
    chk('Rentabilidad sigue calculando', len(pg.inner_text('#resultado')) > 40)
    c.close(); br.close()
f = [r for r in R if not r[1]]
print(f'\nTOTAL {len(R)} · PASS {len(R)-len(f)} · FAIL {len(f)}')
json.dump(R, open(OUT + '/v1/final/qa-v1.json', 'w'), ensure_ascii=False, indent=1)
